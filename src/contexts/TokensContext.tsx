import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TokensContextType {
  tokens: number;
  loading: boolean;
  syncing: boolean;
  fetchTokens: () => Promise<void>;
  syncWalletOnLogin: () => Promise<boolean>;
  updateTokens: (amount: number, type: 'add' | 'subtract') => Promise<boolean>;
  supportProject: (projectId: string, amount: number, description: string) => Promise<boolean>;
}

const TokensContext = createContext<TokensContextType | undefined>(undefined);

export const useTokens = () => {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokensProvider');
  }
  return context;
};

interface TokensProviderProps {
  children: ReactNode;
}

export const TokensProvider = ({ children }: TokensProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncedSessionRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!user?.id) {
      setTokens(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar tokens:', error);
        setTokens(0);
      } else {
        setTokens(data?.balance || 0);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar tokens:', error);
      setTokens(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Sync wallet on login - runs once per session with feedback
  const syncWalletOnLogin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    // Debounce: só executa uma vez por sessão (user.id + timestamp de login)
    const sessionKey = `${user.id}-${user.last_sign_in_at || 'initial'}`;
    if (syncedSessionRef.current === sessionKey) {
      console.log('[TokensContext] Wallet already synced for this session');
      return true;
    }

    console.log('[TokensContext] Starting wallet sync on login...');
    setSyncing(true);

    // Timeout máximo de 5 segundos
    const timeoutPromise = new Promise<boolean>((resolve) => {
      syncTimeoutRef.current = setTimeout(() => {
        console.log('[TokensContext] Sync timeout reached');
        resolve(false);
      }, 5000);
    });

    const fetchPromise = (async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('[TokensContext] Error syncing wallet:', error);
          return false;
        }

        const newBalance = data?.balance || 0;
        setTokens(newBalance);
        syncedSessionRef.current = sessionKey;
        console.log('[TokensContext] Wallet synced successfully:', newBalance);
        return true;
      } catch (error) {
        console.error('[TokensContext] Unexpected error syncing wallet:', error);
        return false;
      }
    })();

    const success = await Promise.race([fetchPromise, timeoutPromise]);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    setSyncing(false);

    if (!success) {
      toast({
        title: "Aviso",
        description: "Não foi possível sincronizar sua carteira. Os valores podem estar desatualizados.",
        variant: "destructive",
        action: (
          <button
            onClick={() => syncWalletOnLogin()}
            className="text-xs underline hover:no-underline"
          >
            Tentar novamente
          </button>
        ),
      });
    }

    return success;
  }, [user?.id, user?.last_sign_in_at, toast]);

  const updateTokens = async (amount: number, type: 'add' | 'subtract') => {
    if (!user) return false;

    try {
      const newBalance = type === 'add' ? tokens + amount : Math.max(0, tokens - amount);
      
      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          updated_at: new Date().toISOString()
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar tokens. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }

      setTokens(newBalance);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tokens:', error);
      return false;
    }
  };

  const supportProject = async (projectId: string, amount: number, description: string) => {
    if (!user) return false;

    if (amount > tokens) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem tokens suficientes para este apoio.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Verificar se o projeto é do próprio usuário
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project && project.user_id === user.id) {
        // Verificar se é admin
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!adminRole) {
          toast({
            title: "Ação não permitida",
            description: "Você não pode investir em seu próprio projeto. Apenas administradores podem fazer isso para fins de teste.",
            variant: "destructive"
          });
          return false;
        }
      }

      const newBalance = tokens - amount;

      // Criar contribuição
      const { error: contributionError } = await supabase
        .from('project_contributions')
        .insert({
          project_id: projectId,
          user_id: user.id,
          amount,
          status: 'completed'
        });

      if (contributionError) throw contributionError;

      // Atualizar saldo
      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Criar transação
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          transaction_type: 'support',
          reference_id: projectId,
          description,
          balance_after: newBalance
        });

      if (transactionError) throw transactionError;

      setTokens(newBalance);
      
      toast({
        title: "Apoio realizado!",
        description: `Você apoiou este projeto com ${amount} tokens.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao apoiar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar apoio. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Realtime subscription - único para toda a aplicação
  useEffect(() => {
    if (!user?.id) return;

    console.log('[TokensContext] Setting up realtime for user:', user.id);

    const channel = supabase
      .channel(`global-tokens-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'user_tokens',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[TokensContext] Realtime event received:', payload);
          const newBalance = (payload.new as any)?.balance;
          if (typeof newBalance === 'number') {
            console.log('[TokensContext] Updating tokens to:', newBalance);
            setTokens(newBalance);
          }
        }
      )
      .subscribe((status) => {
        console.log('[TokensContext] Realtime status:', status);
      });

    return () => {
      console.log('[TokensContext] Cleaning up realtime channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TokensContext.Provider value={{ tokens, loading, syncing, fetchTokens, syncWalletOnLogin, updateTokens, supportProject }}>
      {children}
      {/* Feedback discreto de sincronização */}
      {syncing && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border text-sm animate-in slide-in-from-bottom-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-muted-foreground">Sincronizando carteira…</span>
        </div>
      )}
    </TokensContext.Provider>
  );
};
