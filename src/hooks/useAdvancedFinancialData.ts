import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialFilters {
  startDate: string;
  endDate: string;
  month: number;
  year: number;
  category: string;
  status: string;
  state: string;
  city: string;
}

export interface MonthlyMetrics {
  totalMovement: number;
  totalMovementReais: number;
  platformRevenue: number;
  netProfit: number;
  projectsCreated: number;
  projectsCompleted: number;
  custodyBalance: number;
  refundsCount: number;
  refundsAmount: number;
  tokensInCirculation: number;
  totalPaidToCreators: number;
}

export interface TokenMetrics {
  purchased: number;
  used: number;
  refunded: number;
  inactive: number;
}

export interface WithdrawalMetrics {
  requested: number;
  approved: number;
  rejected: number;
  avgProcessingTime: number;
}

export interface ProjectMetrics {
  completed: number;
  notFunded: number;
  cancelled: number;
  active: number;
}

export interface CategoryMetrics {
  category: string;
  revenue: number;
  projectsCount: number;
  successRate: number;
  totalRaised: number;
}

export interface YearlyMetrics {
  year: number;
  totalRaised: number;
  platformRevenue: number;
  refunds: number;
  newUsers: number;
  projectsCreated: number;
  projectsCompleted: number;
  growthRate: number;
}

export interface InactiveToken {
  userId: string;
  userName: string;
  email: string;
  balance: number;
  lastActivity: string;
  daysInactive: number;
}

export interface MonthlyForecast {
  projectsEndingThisMonth: {
    id: string;
    title: string;
    raised: number;
    goal: number;
    deadline: string;
    progress: number;
  }[];
  minimumRevenue: number;
  maximumRevenue: number;
  expectedCustodyRelease: number;
  pendingWithdrawals: number;
  riskAlerts: string[];
}

export interface ChartData {
  month: string;
  tokens: number;
  revenue: number;
  refunds: number;
}

export const useAdvancedFinancialData = (filters: FinancialFilters) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics>({
    totalMovement: 0,
    totalMovementReais: 0,
    platformRevenue: 0,
    netProfit: 0,
    projectsCreated: 0,
    projectsCompleted: 0,
    custodyBalance: 0,
    refundsCount: 0,
    refundsAmount: 0,
    tokensInCirculation: 0,
    totalPaidToCreators: 0,
  });
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics>({
    purchased: 0,
    used: 0,
    refunded: 0,
    inactive: 0,
  });
  const [withdrawalMetrics, setWithdrawalMetrics] = useState<WithdrawalMetrics>({
    requested: 0,
    approved: 0,
    rejected: 0,
    avgProcessingTime: 0,
  });
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics>({
    completed: 0,
    notFunded: 0,
    cancelled: 0,
    active: 0,
  });
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics[]>([]);
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetrics[]>([]);
  const [inactiveTokens, setInactiveTokens] = useState<InactiveToken[]>([]);
  const [monthlyForecast, setMonthlyForecast] = useState<MonthlyForecast>({
    projectsEndingThisMonth: [],
    minimumRevenue: 0,
    maximumRevenue: 0,
    expectedCustodyRelease: 0,
    pendingWithdrawals: 0,
    riskAlerts: [],
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [manualCosts, setManualCosts] = useState(0);

  const buildDateFilter = useCallback(() => {
    if (filters.startDate && filters.endDate) {
      return { start: filters.startDate, end: filters.endDate };
    }
    
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || new Date().getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }, [filters]);

  const fetchMonthlyMetrics = async () => {
    const { start, end } = buildDateFilter();
    
    try {
      // Token purchases
      const { data: purchases } = await supabase
        .from('token_purchases')
        .select('amount, price, status, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      const paidPurchases = purchases?.filter(p => p.status === 'paid') || [];
      const totalMovement = paidPurchases.reduce((sum, p) => sum + p.amount, 0);
      const totalMovementReais = paidPurchases.reduce((sum, p) => sum + p.price, 0);

      // Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('admin_fee, net_amount, status, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      const approvedWithdrawals = withdrawals?.filter(w => w.status === 'approved') || [];
      const platformRevenue = approvedWithdrawals.reduce((sum, w) => sum + Number(w.admin_fee), 0);
      const totalPaidToCreators = approvedWithdrawals.reduce((sum, w) => sum + Number(w.net_amount), 0);

      // Refunds
      const { data: refunds } = await supabase
        .from('refunds')
        .select('amount, status, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      const completedRefunds = refunds?.filter(r => r.status === 'completed') || [];
      const refundsCount = completedRefunds.length;
      const refundsAmount = completedRefunds.reduce((sum, r) => sum + r.amount, 0);

      // Projects created
      const { data: projectsCreated } = await supabase
        .from('projects')
        .select('id')
        .gte('created_at', start)
        .lte('created_at', end);

      // Projects completed (reached goal)
      const { data: projectsCompleted } = await supabase
        .from('projects')
        .select('id, raised_amount, goal, custom_goal')
        .eq('status', 'approved')
        .gte('created_at', start)
        .lte('created_at', end);

      const completedCount = projectsCompleted?.filter(p => {
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        return Number(p.raised_amount) >= effectiveGoal;
      }).length || 0;

      // Tokens in circulation
      const { data: tokensData } = await supabase
        .from('user_tokens')
        .select('balance');

      const tokensInCirculation = tokensData?.reduce((sum, t) => sum + t.balance, 0) || 0;

      // Custody balance
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, raised_amount, goal, custom_goal, status');

      const completedProjects = allProjects?.filter(p => {
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        return p.status === 'approved' && Number(p.raised_amount) >= effectiveGoal;
      }) || [];

      const projectIds = completedProjects.map(p => p.id);
      
      let custodyBalance = 0;
      if (projectIds.length > 0) {
        const { data: withdrawnProjects } = await supabase
          .from('withdrawals')
          .select('project_id, net_amount, status')
          .in('project_id', projectIds)
          .eq('status', 'approved');

        const withdrawnAmounts = new Map();
        withdrawnProjects?.forEach(w => {
          withdrawnAmounts.set(w.project_id, (withdrawnAmounts.get(w.project_id) || 0) + Number(w.net_amount));
        });

        completedProjects.forEach(p => {
          const withdrawn = withdrawnAmounts.get(p.id) || 0;
          custodyBalance += Number(p.raised_amount) - withdrawn;
        });
      }

      setMonthlyMetrics({
        totalMovement,
        totalMovementReais,
        platformRevenue,
        netProfit: platformRevenue - manualCosts,
        projectsCreated: projectsCreated?.length || 0,
        projectsCompleted: completedCount,
        custodyBalance,
        refundsCount,
        refundsAmount,
        tokensInCirculation,
        totalPaidToCreators,
      });
    } catch (error) {
      console.error('Error fetching monthly metrics:', error);
    }
  };

  const fetchTokenMetrics = async () => {
    const { start, end } = buildDateFilter();
    
    try {
      // Purchased tokens
      const { data: purchases } = await supabase
        .from('token_purchases')
        .select('amount, status')
        .eq('status', 'paid')
        .gte('created_at', start)
        .lte('created_at', end);

      const purchased = purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Used tokens (contributions)
      const { data: contributions } = await supabase
        .from('project_contributions')
        .select('amount, status')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);

      const used = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Refunded tokens
      const { data: refunds } = await supabase
        .from('refunds')
        .select('amount, status')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);

      const refunded = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;

      // Inactive tokens (tokens not used in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: inactiveUsers } = await supabase
        .from('user_tokens')
        .select('balance, user_id');

      let inactive = 0;
      if (inactiveUsers) {
        for (const ut of inactiveUsers) {
          if (ut.balance > 0) {
            const { data: recentActivity } = await supabase
              .from('project_contributions')
              .select('id')
              .eq('user_id', ut.user_id)
              .gte('created_at', ninetyDaysAgo.toISOString())
              .limit(1);

            if (!recentActivity || recentActivity.length === 0) {
              inactive += ut.balance;
            }
          }
        }
      }

      setTokenMetrics({ purchased, used, refunded, inactive });
    } catch (error) {
      console.error('Error fetching token metrics:', error);
    }
  };

  const fetchWithdrawalMetrics = async () => {
    const { start, end } = buildDateFilter();
    
    try {
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('status, created_at, reviewed_at')
        .gte('created_at', start)
        .lte('created_at', end);

      const requested = withdrawals?.length || 0;
      const approved = withdrawals?.filter(w => w.status === 'approved').length || 0;
      const rejected = withdrawals?.filter(w => w.status === 'rejected').length || 0;

      // Calculate average processing time for approved withdrawals
      let totalProcessingTime = 0;
      let processedCount = 0;
      withdrawals?.forEach(w => {
        if (w.status === 'approved' && w.reviewed_at) {
          const created = new Date(w.created_at).getTime();
          const reviewed = new Date(w.reviewed_at).getTime();
          totalProcessingTime += (reviewed - created) / (1000 * 60 * 60 * 24); // days
          processedCount++;
        }
      });

      const avgProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

      setWithdrawalMetrics({ requested, approved, rejected, avgProcessingTime });
    } catch (error) {
      console.error('Error fetching withdrawal metrics:', error);
    }
  };

  const fetchProjectMetrics = async () => {
    const { start, end } = buildDateFilter();
    
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('status, raised_amount, goal, custom_goal, deadline')
        .gte('created_at', start)
        .lte('created_at', end);

      let completed = 0;
      let notFunded = 0;
      let cancelled = 0;
      let active = 0;

      projects?.forEach(p => {
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        const raised = Number(p.raised_amount);
        
        if (p.status === 'cancelled') {
          cancelled++;
        } else if (p.status === 'approved' && raised >= effectiveGoal) {
          completed++;
        } else if (p.status === 'approved' && p.deadline && new Date(p.deadline) < new Date()) {
          notFunded++;
        } else if (p.status === 'approved') {
          active++;
        }
      });

      setProjectMetrics({ completed, notFunded, cancelled, active });
    } catch (error) {
      console.error('Error fetching project metrics:', error);
    }
  };

  const fetchCategoryMetrics = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('category, raised_amount, goal, custom_goal, status');

      const categoryMap = new Map<string, { revenue: number; count: number; completed: number; totalRaised: number }>();

      projects?.forEach(p => {
        if (!categoryMap.has(p.category)) {
          categoryMap.set(p.category, { revenue: 0, count: 0, completed: 0, totalRaised: 0 });
        }
        
        const cat = categoryMap.get(p.category)!;
        cat.count++;
        cat.totalRaised += Number(p.raised_amount);
        
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        if (p.status === 'approved' && Number(p.raised_amount) >= effectiveGoal) {
          cat.completed++;
          cat.revenue += Number(p.raised_amount) * 0.1; // 10% platform fee
        }
      });

      const metrics: CategoryMetrics[] = [];
      categoryMap.forEach((value, key) => {
        metrics.push({
          category: key,
          revenue: value.revenue,
          projectsCount: value.count,
          successRate: value.count > 0 ? (value.completed / value.count) * 100 : 0,
          totalRaised: value.totalRaised,
        });
      });

      // Sort by revenue descending
      metrics.sort((a, b) => b.revenue - a.revenue);
      setCategoryMetrics(metrics);
    } catch (error) {
      console.error('Error fetching category metrics:', error);
    }
  };

  const fetchYearlyMetrics = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years: YearlyMetrics[] = [];

      for (let year = currentYear - 2; year <= currentYear; year++) {
        const startDate = new Date(year, 0, 1).toISOString();
        const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        // Projects and revenue
        const { data: projects } = await supabase
          .from('projects')
          .select('raised_amount, goal, custom_goal, status, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const totalRaised = projects?.reduce((sum, p) => sum + Number(p.raised_amount), 0) || 0;
        const projectsCreated = projects?.length || 0;
        const projectsCompleted = projects?.filter(p => {
          const effectiveGoal = Number(p.custom_goal ?? p.goal);
          return p.status === 'approved' && Number(p.raised_amount) >= effectiveGoal;
        }).length || 0;

        // Withdrawals for revenue
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('admin_fee, status')
          .eq('status', 'approved')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const platformRevenue = withdrawals?.reduce((sum, w) => sum + Number(w.admin_fee), 0) || 0;

        // Refunds
        const { data: refunds } = await supabase
          .from('refunds')
          .select('amount, status')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const refundsTotal = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;

        // New users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        years.push({
          year,
          totalRaised,
          platformRevenue,
          refunds: refundsTotal,
          newUsers: profiles?.length || 0,
          projectsCreated,
          projectsCompleted,
          growthRate: 0,
        });
      }

      // Calculate growth rates
      for (let i = 1; i < years.length; i++) {
        const prev = years[i - 1].platformRevenue;
        const curr = years[i].platformRevenue;
        years[i].growthRate = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      }

      setYearlyMetrics(years);
    } catch (error) {
      console.error('Error fetching yearly metrics:', error);
    }
  };

  const fetchInactiveTokens = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: tokensData } = await supabase
        .from('user_tokens')
        .select(`
          balance,
          user_id,
          updated_at,
          profiles:user_id (nome, sobrenome, email)
        `)
        .gt('balance', 0);

      const inactiveList: InactiveToken[] = [];

      for (const token of tokensData || []) {
        const { data: recentActivity } = await supabase
          .from('project_contributions')
          .select('created_at')
          .eq('user_id', token.user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastActivity = recentActivity?.[0]?.created_at || token.updated_at;
        const lastActivityDate = new Date(lastActivity);
        const daysInactive = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysInactive >= 30) {
          const profile = token.profiles as any;
          inactiveList.push({
            userId: token.user_id,
            userName: profile ? `${profile.nome} ${profile.sobrenome}` : 'N/A',
            email: profile?.email || 'N/A',
            balance: token.balance,
            lastActivity,
            daysInactive,
          });
        }
      }

      // Sort by balance descending
      inactiveList.sort((a, b) => b.balance - a.balance);
      setInactiveTokens(inactiveList.slice(0, 50)); // Top 50
    } catch (error) {
      console.error('Error fetching inactive tokens:', error);
    }
  };

  const fetchMonthlyForecast = async () => {
    try {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Projects ending this month
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, raised_amount, goal, custom_goal, deadline, admin_fee_percentage')
        .eq('status', 'approved')
        .gte('deadline', now.toISOString().split('T')[0])
        .lte('deadline', endOfMonth.toISOString().split('T')[0]);

      const projectsEndingThisMonth = projects?.map(p => {
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        return {
          id: p.id,
          title: p.title,
          raised: Number(p.raised_amount),
          goal: effectiveGoal,
          deadline: p.deadline || '',
          progress: effectiveGoal > 0 ? (Number(p.raised_amount) / effectiveGoal) * 100 : 0,
        };
      }) || [];

      // Calculate revenue projections
      let minimumRevenue = 0;
      let maximumRevenue = 0;
      
      projectsEndingThisMonth.forEach(p => {
        if (p.progress >= 100) {
          // Already completed, revenue is certain
          minimumRevenue += p.raised * 0.1;
          maximumRevenue += p.raised * 0.1;
        } else if (p.progress >= 70) {
          // Likely to complete
          minimumRevenue += p.raised * 0.1;
          maximumRevenue += p.goal * 0.1;
        } else {
          // May not complete
          maximumRevenue += p.goal * 0.1;
        }
      });

      // Pending withdrawals
      const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('net_amount')
        .in('status', ['pending', 'verification_pending', 'pending_correction']);

      const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + Number(w.net_amount), 0) || 0;

      // Risk alerts
      const riskAlerts: string[] = [];
      
      const highRiskProjects = projectsEndingThisMonth.filter(p => p.progress < 50);
      if (highRiskProjects.length > 0) {
        riskAlerts.push(`${highRiskProjects.length} projeto(s) com menos de 50% da meta`);
      }

      const { data: recentRefunds } = await supabase
        .from('refunds')
        .select('amount')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

      const refundsThisMonth = recentRefunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
      if (refundsThisMonth > 1000) {
        riskAlerts.push(`Volume alto de extornos: ${refundsThisMonth} tokens`);
      }

      setMonthlyForecast({
        projectsEndingThisMonth,
        minimumRevenue,
        maximumRevenue,
        expectedCustodyRelease: pendingAmount,
        pendingWithdrawals: pendingAmount,
        riskAlerts,
      });
    } catch (error) {
      console.error('Error fetching monthly forecast:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const currentYear = filters.year || new Date().getFullYear();
      const data: ChartData[] = [];

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(currentYear, month - 1, 1).toISOString();
        const endDate = new Date(currentYear, month, 0, 23, 59, 59).toISOString();

        // Purchases
        const { data: purchases } = await supabase
          .from('token_purchases')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const tokens = purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Revenue
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('admin_fee')
          .eq('status', 'approved')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const revenue = withdrawals?.reduce((sum, w) => sum + Number(w.admin_fee), 0) || 0;

        // Refunds
        const { data: refunds } = await supabase
          .from('refunds')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const refundsAmount = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        data.push({
          month: monthNames[month - 1],
          tokens,
          revenue,
          refunds: refundsAmount,
        });
      }

      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchMonthlyMetrics(),
      fetchTokenMetrics(),
      fetchWithdrawalMetrics(),
      fetchProjectMetrics(),
      fetchCategoryMetrics(),
      fetchYearlyMetrics(),
      fetchInactiveTokens(),
      fetchMonthlyForecast(),
      fetchChartData(),
    ]);
    setLoading(false);
  }, [filters, manualCosts]);

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user, filters.month, filters.year, filters.startDate, filters.endDate, filters.category, filters.status]);

  return {
    loading,
    monthlyMetrics,
    tokenMetrics,
    withdrawalMetrics,
    projectMetrics,
    categoryMetrics,
    yearlyMetrics,
    inactiveTokens,
    monthlyForecast,
    chartData,
    manualCosts,
    setManualCosts,
    refreshData: refreshAllData,
  };
};
