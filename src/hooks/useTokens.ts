import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeChannel } from './useRealtimeChannel';

export const useTokens = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    if (!user?.id) {
      setTokens(0);
      setLoading(false);
      return;
    }

    try {
      // Buscar saldo de tokens do usuário
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

  // Handler para atualizações de tokens via realtime
  const handleTokenUpdate = useCallback((payload: any) => {
    console.log('[Tokens] Balance updated:', payload);
    setTokens(payload.new.balance);
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Configurar realtime
  useRealtimeChannel({
    channelName: `user-tokens-${user?.id || 'none'}`,
    enabled: !!user?.id,
    table: 'user_tokens',
    schema: 'public',
    event: 'UPDATE',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onEvent: handleTokenUpdate,
  });

  return {
    tokens,
    loading,
    fetchTokens,
    updateTokens,
    supportProject
  };
};
