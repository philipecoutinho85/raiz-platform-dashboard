import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialSummary {
  totalTokensVolume: number;
  totalReaisVolume: number;
  platformRevenue: number;
  totalPaidToCreators: number;
  tokensInCirculation: number;
  totalRefunds: number;
  totalRefundsReais: number;
  custodyBalance: number;
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  amount: number;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
  pagarme_transaction_id: string | null;
  user_name?: string;
  user_email?: string;
}

export interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  requested_amount: number;
  admin_fee: number;
  net_amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  project_title?: string;
  creator_name?: string;
}

export interface Refund {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  user_name?: string;
  project_title?: string;
}

export interface FinancialAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

export const useFinancialData = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalTokensVolume: 0,
    totalReaisVolume: 0,
    platformRevenue: 0,
    totalPaidToCreators: 0,
    tokensInCirculation: 0,
    totalRefunds: 0,
    totalRefundsReais: 0,
    custodyBalance: 0,
  });
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);

  const fetchSummary = async () => {
    try {
      // Total de compras de tokens
      let purchasesQuery = supabase
        .from('token_purchases')
        .select('amount, price, status');

      if (startDate) purchasesQuery = purchasesQuery.gte('created_at', startDate);
      if (endDate) purchasesQuery = purchasesQuery.lte('created_at', endDate);

      const { data: purchasesData } = await purchasesQuery;

      const completedPurchases = purchasesData?.filter(p => p.status === 'paid') || [];
      const totalTokensVolume = completedPurchases.reduce((sum, p) => sum + p.amount, 0);
      const totalReaisVolume = completedPurchases.reduce((sum, p) => sum + p.price, 0);

      // Total de resgates aprovados
      let withdrawalsQuery = supabase
        .from('withdrawals')
        .select('admin_fee, net_amount, status');

      if (startDate) withdrawalsQuery = withdrawalsQuery.gte('created_at', startDate);
      if (endDate) withdrawalsQuery = withdrawalsQuery.lte('created_at', endDate);

      const { data: withdrawalsData } = await withdrawalsQuery;

      const approvedWithdrawals = withdrawalsData?.filter(w => w.status === 'approved') || [];
      const platformRevenue = approvedWithdrawals.reduce((sum, w) => sum + w.admin_fee, 0);
      const totalPaidToCreators = approvedWithdrawals.reduce((sum, w) => sum + w.net_amount, 0);

      // Total de tokens em circulação
      const { data: tokensData } = await supabase
        .from('user_tokens')
        .select('balance');

      const tokensInCirculation = tokensData?.reduce((sum, t) => sum + t.balance, 0) || 0;

      // Total de reembolsos - buscar de ambas as tabelas
      let oldRefundsQuery = supabase
        .from('refunds')
        .select('amount, status');

      if (startDate) oldRefundsQuery = oldRefundsQuery.gte('created_at', startDate);
      if (endDate) oldRefundsQuery = oldRefundsQuery.lte('created_at', endDate);

      const { data: oldRefundsData } = await oldRefundsQuery;

      let newRefundsQuery = supabase
        .from('refund_requests')
        .select('amount, status');

      if (startDate) newRefundsQuery = newRefundsQuery.gte('created_at', startDate);
      if (endDate) newRefundsQuery = newRefundsQuery.lte('created_at', endDate);

      const { data: newRefundsData } = await newRefundsQuery;

      const completedOldRefunds = oldRefundsData?.filter(r => r.status === 'completed') || [];
      const completedNewRefunds = newRefundsData?.filter(r => r.status === 'realizado') || [];
      const totalRefunds = completedOldRefunds.reduce((sum, r) => sum + r.amount, 0) + 
                          completedNewRefunds.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalRefundsReais = totalRefunds; // Aproximação: 1 token = 1 real

      // Saldo em custódia (projetos concluídos sem resgate)
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, raised_amount, goal, status');

      const completedProjects = projectsData?.filter(
        p => p.status === 'approved' && p.raised_amount >= p.goal
      ) || [];

      // Buscar resgates desses projetos
      const projectIds = completedProjects.map(p => p.id);
      const { data: withdrawnProjects } = await supabase
        .from('withdrawals')
        .select('project_id, net_amount, status')
        .in('project_id', projectIds)
        .eq('status', 'approved');

      const withdrawnAmounts = new Map();
      withdrawnProjects?.forEach(w => {
        withdrawnAmounts.set(w.project_id, (withdrawnAmounts.get(w.project_id) || 0) + w.net_amount);
      });

      let custodyBalance = 0;
      completedProjects.forEach(p => {
        const withdrawn = withdrawnAmounts.get(p.id) || 0;
        custodyBalance += p.raised_amount - withdrawn;
      });

      setSummary({
        totalTokensVolume,
        totalReaisVolume,
        platformRevenue,
        totalPaidToCreators,
        tokensInCirculation,
        totalRefunds,
        totalRefundsReais,
        custodyBalance,
      });
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      let query = supabase
        .from('token_purchases')
        .select(`
          *,
          profiles:user_id (nome, sobrenome, email)
        `)
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data } = await query;

      setPurchases(
        data?.map((p: any) => ({
          ...p,
          user_name: p.profiles ? `${p.profiles.nome} ${p.profiles.sobrenome}` : 'N/A',
          user_email: p.profiles?.email || 'N/A',
        })) || []
      );
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          projects:project_id (title, raised_amount, goal),
          profiles:user_id (nome, sobrenome)
        `)
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data } = await query;

      setWithdrawals(
        data?.map((w: any) => ({
          ...w,
          project_title: w.projects?.title || 'N/A',
          creator_name: w.profiles ? `${w.profiles.nome} ${w.profiles.sobrenome}` : 'N/A',
        })) || []
      );
    } catch (error) {
      console.error('Erro ao buscar resgates:', error);
    }
  };

  const fetchRefunds = async () => {
    try {
      // Buscar de refunds (antiga)
      let oldQuery = supabase
        .from('refunds')
        .select(`
          *,
          profiles:user_id (nome, sobrenome),
          projects:project_id (title)
        `)
        .order('created_at', { ascending: false });

      if (startDate) oldQuery = oldQuery.gte('created_at', startDate);
      if (endDate) oldQuery = oldQuery.lte('created_at', endDate);

      const { data: oldData } = await oldQuery;

      // Buscar de refund_requests (nova)
      let newQuery = supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) newQuery = newQuery.gte('created_at', startDate);
      if (endDate) newQuery = newQuery.lte('created_at', endDate);

      const { data: newData } = await newQuery;

      // Buscar profiles para refund_requests
      const userIds = [...new Set(newData?.map(r => r.user_id) || [])];
      
      interface ProfileData {
        id: string;
        nome: string;
        sobrenome: string;
      }
      
      const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, nome, sobrenome').in('id', userIds)
        : { data: [] as ProfileData[] };
      
      const profilesMap = new Map<string, ProfileData>(
        (profilesData || []).map((p: ProfileData) => [p.id, p])
      );

      const oldRefunds = oldData?.map((r: any) => ({
        ...r,
        user_name: r.profiles ? `${r.profiles.nome} ${r.profiles.sobrenome}` : 'N/A',
        project_title: r.projects?.title || 'N/A',
        source: 'refunds'
      })) || [];

      const newRefunds = newData?.map((r: any) => {
        const profile = profilesMap.get(r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          project_id: null,
          amount: Number(r.amount),
          reason: r.reason,
          status: r.status === 'solicitado' ? 'pending' : r.status === 'realizado' ? 'completed' : r.status,
          created_at: r.created_at,
          processed_at: r.completed_at,
          processed_by: r.completed_by,
          user_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'N/A',
          project_title: 'Compra de Tokens',
          source: 'refund_requests'
        };
      }) || [];

      // Combinar e ordenar por data
      const allRefunds = [...oldRefunds, ...newRefunds]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRefunds(allRefunds);
    } catch (error) {
      console.error('Erro ao buscar reembolsos:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('financial_alerts')
        .update({
          is_read: true,
          read_by: user.id,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
    }
  };

  const logAccess = async (route: string) => {
    if (!user) return;

    try {
      await supabase.rpc('log_admin_access', {
        p_admin_id: user.id,
        p_accessed_route: route,
        p_user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Erro ao registrar acesso:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchPurchases(),
      fetchWithdrawals(),
      fetchRefunds(),
      fetchAlerts(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
      logAccess('financial_panel');
    }
  }, [user, startDate, endDate]);

  return {
    loading,
    summary,
    purchases,
    withdrawals,
    refunds,
    alerts,
    markAlertAsRead,
    refreshData: fetchAllData,
  };
};
