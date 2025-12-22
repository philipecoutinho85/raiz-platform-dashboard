import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LedgerEntry {
  id: string;
  contribution_id: string | null;
  project_id: string | null;
  creator_id: string;
  supporter_id: string;
  withdrawal_id: string | null;
  token_amount: number;
  gross_amount: number;
  payment_method: string;
  stripe_fee_percentage: number;
  stripe_fee_fixed: number;
  stripe_fee_total: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  net_amount_creator: number;
  net_amount_platform: number;
  financial_status: string;
  grace_period_ends_at: string | null;
  released_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  // Joined data
  project_title?: string;
  creator_name?: string;
  supporter_name?: string;
}

export interface LedgerMovement {
  id: string;
  ledger_id: string | null;
  movement_type: string;
  from_entity: string | null;
  to_entity: string | null;
  amount: number;
  balance_after: number | null;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  metadata: unknown;
  created_at: string;
}

export interface ProjectFinancialSummary {
  project_id: string;
  project_title: string;
  creator_id: string;
  creator_name: string;
  goal: number;
  raised_amount: number;
  goal_reached: boolean;
  total_gross: number;
  total_stripe_fees: number;
  total_platform_fees: number;
  total_net_creator: number;
  in_grace_period: number;
  released: number;
  withdrawal_pending: number;
  transfer_completed: number;
  amount_in_grace: number;
  amount_released: number;
  amount_pending_transfer: number;
  amount_transferred: number;
  next_release_date: string | null;
}

export interface StripeFeeConfig {
  id: string;
  payment_method: string;
  percentage_fee: number;
  fixed_fee: number;
  additional_percentage: number;
  is_enabled: boolean;
  disabled_reason: string | null;
  description: string | null;
  updated_at: string;
}

export interface BankReconciliation {
  id: string;
  reconciliation_date: string;
  stripe_expected_amount: number;
  stripe_transaction_count: number;
  bank_received_amount: number | null;
  bank_transaction_count: number | null;
  status: string;
  divergence_amount: number | null;
  divergence_reason: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface TransferReceipt {
  id: string;
  withdrawal_id: string;
  ledger_id: string | null;
  receipt_url: string;
  receipt_filename: string | null;
  transfer_date: string;
  transfer_amount: number;
  bank_name: string | null;
  account_info: string | null;
  uploaded_by: string;
  uploaded_at: string;
  validated_at: string | null;
  validated_by: string | null;
  notes: string | null;
}

export interface LedgerFilters {
  projectId?: string;
  creatorId?: string;
  supporterId?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  showDeleted?: boolean;
}

export interface LedgerSummary {
  totalGross: number;
  totalStripeFees: number;
  totalPlatformFees: number;
  totalNetCreator: number;
  totalInGrace: number;
  totalReleased: number;
  totalPendingTransfer: number;
  totalTransferred: number;
  entryCount: number;
}

export function useFinancialLedger(initialFilters: LedgerFilters = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [movements, setMovements] = useState<LedgerMovement[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<ProjectFinancialSummary[]>([]);
  const [stripeFeeConfigs, setStripeFeeConfigs] = useState<StripeFeeConfig[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({
    totalGross: 0,
    totalStripeFees: 0,
    totalPlatformFees: 0,
    totalNetCreator: 0,
    totalInGrace: 0,
    totalReleased: 0,
    totalPendingTransfer: 0,
    totalTransferred: 0,
    entryCount: 0
  });

  // Memoize filters to prevent unnecessary re-renders
  const filters = initialFilters;

  const fetchLedgerEntries = useCallback(async () => {
    try {
      let query = supabase
        .from('financial_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (!filters.showDeleted) {
        query = query.eq('is_deleted', false);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.creatorId) {
        query = query.eq('creator_id', filters.creatorId);
      }

      if (filters.supporterId) {
        query = query.eq('supporter_id', filters.supporterId);
      }

      if (filters.status) {
        query = query.eq('financial_status', filters.status);
      }

      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLedgerEntries(data || []);

      // Calculate summary
      const entries = data || [];
      const newSummary: LedgerSummary = {
        totalGross: entries.reduce((sum, e) => sum + Number(e.gross_amount), 0),
        totalStripeFees: entries.reduce((sum, e) => sum + Number(e.stripe_fee_total), 0),
        totalPlatformFees: entries.reduce((sum, e) => sum + Number(e.platform_fee_amount), 0),
        totalNetCreator: entries.reduce((sum, e) => sum + Number(e.net_amount_creator), 0),
        totalInGrace: entries.filter(e => e.financial_status === 'grace_period').reduce((sum, e) => sum + Number(e.net_amount_creator), 0),
        totalReleased: entries.filter(e => e.financial_status === 'released').reduce((sum, e) => sum + Number(e.net_amount_creator), 0),
        totalPendingTransfer: entries.filter(e => ['withdrawal_pending', 'transfer_pending'].includes(e.financial_status)).reduce((sum, e) => sum + Number(e.net_amount_creator), 0),
        totalTransferred: entries.filter(e => e.financial_status === 'transfer_completed').reduce((sum, e) => sum + Number(e.net_amount_creator), 0),
        entryCount: entries.length
      };
      setSummary(newSummary);

    } catch (error: unknown) {
      console.error('Error fetching ledger entries:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar registros do ledger',
        variant: 'destructive'
      });
    }
  }, [filters, toast]);

  const fetchMovements = useCallback(async (ledgerId?: string) => {
    try {
      let query = supabase
        .from('ledger_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (ledgerId) {
        query = query.eq('ledger_id', ledgerId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      setMovements(data || []);
    } catch (error: unknown) {
      console.error('Error fetching movements:', error);
    }
  }, [filters]);

  const fetchProjectSummaries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_financial_summary')
        .select('*')
        .order('raised_amount', { ascending: false });

      if (error) throw error;
      setProjectSummaries((data || []) as ProjectFinancialSummary[]);
    } catch (error: unknown) {
      console.error('Error fetching project summaries:', error);
    }
  }, []);

  const fetchStripeFeeConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_fee_config')
        .select('*')
        .order('payment_method');

      if (error) throw error;
      setStripeFeeConfigs(data || []);
    } catch (error: unknown) {
      console.error('Error fetching stripe fee configs:', error);
    }
  }, []);

  const fetchReconciliations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bank_reconciliation')
        .select('*')
        .order('reconciliation_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setReconciliations(data || []);
    } catch (error: unknown) {
      console.error('Error fetching reconciliations:', error);
    }
  }, []);

  const releaseGracePeriodFunds = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('release_grace_period_funds');
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: `${data} registros liberados do período de carência`
      });
      
      await fetchLedgerEntries();
      return data;
    } catch (error: unknown) {
      console.error('Error releasing funds:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao liberar fundos',
        variant: 'destructive'
      });
      return 0;
    }
  }, [fetchLedgerEntries, toast]);

  const createReconciliation = useCallback(async (data: Partial<BankReconciliation>) => {
    try {
      const { error } = await supabase
        .from('bank_reconciliation')
        .insert({
          reconciliation_date: data.reconciliation_date,
          stripe_expected_amount: data.stripe_expected_amount || 0,
          stripe_transaction_count: data.stripe_transaction_count || 0,
          bank_received_amount: data.bank_received_amount,
          bank_transaction_count: data.bank_transaction_count,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Registro de conciliação criado'
      });

      await fetchReconciliations();
    } catch (error: unknown) {
      console.error('Error creating reconciliation:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar registro de conciliação',
        variant: 'destructive'
      });
    }
  }, [fetchReconciliations, toast]);

  const updateReconciliation = useCallback(async (id: string, data: Partial<BankReconciliation>) => {
    try {
      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString()
      };

      if (data.status === 'reconciled' || data.status === 'divergent') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
      }

      const { error } = await supabase
        .from('bank_reconciliation')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Conciliação atualizada'
      });

      await fetchReconciliations();
    } catch (error: unknown) {
      console.error('Error updating reconciliation:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar conciliação',
        variant: 'destructive'
      });
    }
  }, [fetchReconciliations, toast, user?.id]);

  const generateStatement = useCallback(async (type: 'period' | 'project' | 'creator' | 'supporter', params: Record<string, string>) => {
    try {
      let query = supabase
        .from('ledger_movements')
        .select('*')
        .order('created_at', { ascending: true });

      if (type === 'period' && params.startDate && params.endDate) {
        query = query
          .gte('created_at', params.startDate)
          .lte('created_at', params.endDate);
      }

      if (type === 'project' && params.projectId) {
        const ledgerIds = ledgerEntries
          .filter(e => e.project_id === params.projectId)
          .map(e => e.id);
        query = query.in('ledger_id', ledgerIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('Error generating statement:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar declaração',
        variant: 'destructive'
      });
      return [];
    }
  }, [ledgerEntries, toast]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLedgerEntries(),
        fetchMovements(),
        fetchProjectSummaries(),
        fetchStripeFeeConfigs(),
        fetchReconciliations()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchLedgerEntries, fetchMovements, fetchProjectSummaries, fetchStripeFeeConfigs, fetchReconciliations]);

  // Initial load - only run once when user is available
  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      refreshAll();
    }
  }, [user, hasInitialized, refreshAll]);

  // Re-fetch when filters change (after initial load)
  useEffect(() => {
    if (hasInitialized && user) {
      fetchLedgerEntries();
    }
  }, [filters.status, filters.paymentMethod, filters.startDate, filters.endDate, filters.showDeleted]);

  return {
    loading,
    ledgerEntries,
    movements,
    projectSummaries,
    stripeFeeConfigs,
    reconciliations,
    summary,
    fetchLedgerEntries,
    fetchMovements,
    fetchProjectSummaries,
    fetchStripeFeeConfigs,
    fetchReconciliations,
    releaseGracePeriodFunds,
    createReconciliation,
    updateReconciliation,
    generateStatement,
    refreshAll
  };
}
