// TokensContext - Gerenciamento global de tokens do usuário
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
  const lastUserIdRef = useRef<string | null>(null);

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

  // Verifica pagamentos pendentes e credita tokens se confirmados
  const verifyPendingPayments = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Buscar compras pendentes com ID de transação Stripe
      const { data: pendingPurchases } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .not('pagarme_transaction_id', 'is', null);

      if (!pendingPurchases || pendingPurchases.length === 0) {
        return false;
      }

      console.log(`[TokensContext] Verifying ${pendingPurchases.length} pending payments...`);

      let anyUpdated = false;

      for (const purchase of pendingPurchases) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-token-payment', {
            body: { purchaseId: purchase.id }
          });

          if (error) {
            console.warn('[TokensContext] Error verifying payment:', error);
            continue;
          }

          if (data?.status === 'paid' && !data?.alreadyProcessed) {
            anyUpdated = true;
            console.log(`[TokensContext] Payment confirmed! ${purchase.amount} tokens credited.`);
            toast({
              title: "Pagamento confirmado! 🎉",
              description: `${purchase.amount} tokens foram creditados na sua carteira.`,
            });
          }
        } catch (err) {
          console.warn('[TokensContext] Error verifying purchase:', purchase.id, err);
        }
      }

      return anyUpdated;
    } catch (error) {
      console.error('[TokensContext] Error verifying pending payments:', error);
      return false;
    }
  }, [user?.id, toast]);

  // Sync wallet on login - verifica pagamentos pendentes e atualiza saldo
  const syncWalletOnLogin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    console.log('[TokensContext] Starting wallet sync on login...');
    setSyncing(true);

    try {
      // 1. Primeiro verifica pagamentos pendentes
      const hadPendingPayments = await verifyPendingPayments();
      
      // 2. Depois busca o saldo atualizado
      const { data, error } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[TokensContext] Error syncing wallet:', error);
        setSyncing(false);
        return false;
      }

      const newBalance = data?.balance || 0;
      setTokens(newBalance);
      console.log('[TokensContext] Wallet synced successfully:', newBalance);
      
      setSyncing(false);
      return true;
    } catch (error) {
      console.error('[TokensContext] Unexpected error syncing wallet:', error);
      setSyncing(false);
      return false;
    }
  }, [user?.id, verifyPendingPayments]);

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

      type SupportProjectResult = { contribution_id: string; new_balance: number };
      const { data, error } = await supabase.rpc(
        'support_project_with_tokens' as never,
        {
          p_project_id: projectId,
          p_amount: amount,
          p_description: description
        } as never
      ) as { data: SupportProjectResult[] | null; error: { message: string } | null };

      if (error) throw error;

      const newBalance = data?.[0]?.new_balance;
      if (typeof newBalance === 'number') {
        setTokens(newBalance);
      } else {
        await fetchTokens();
      }
      
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

  // Fetch inicial e sync automático ao detectar mudança de usuário (login)
  useEffect(() => {
    if (!user?.id) {
      setTokens(0);
      setLoading(false);
      lastUserIdRef.current = null;
      return;
    }

    // Se o user.id mudou (novo login), força sync
    if (lastUserIdRef.current !== user.id) {
      console.log('[TokensContext] User changed, syncing wallet automatically');
      lastUserIdRef.current = user.id;
      syncWalletOnLogin();
    } else {
      fetchTokens();
    }
  }, [user?.id, fetchTokens, syncWalletOnLogin]);

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
