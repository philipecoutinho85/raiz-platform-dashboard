
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokens = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    if (!user) {
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
  };

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

  useEffect(() => {
    fetchTokens();
  }, [user]);

  return {
    tokens,
    loading,
    fetchTokens,
    updateTokens,
    supportProject
  };
};
