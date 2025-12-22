import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinancialLedger } from '@/hooks/useFinancialLedger';
import { LedgerSummaryCards } from './LedgerSummaryCards';
import { LedgerEntriesTable } from './LedgerEntriesTable';
import { ProjectFinancialTable } from './ProjectFinancialTable';
import { StripeFeeConfigTable } from './StripeFeeConfigTable';
import { BankReconciliationPanel } from './BankReconciliationPanel';
import { TransferReceiptsPanel } from './TransferReceiptsPanel';
import { 
  RefreshCw, 
  Download, 
  Filter, 
  BookOpen, 
  Building2, 
  CreditCard, 
  FileCheck,
  Clock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function LedgerTab() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    showDeleted: false
  });

  const {
    loading,
    ledgerEntries,
    projectSummaries,
    stripeFeeConfigs,
    reconciliations,
    summary,
    releaseGracePeriodFunds,
    createReconciliation,
    updateReconciliation,
    refreshAll
  } = useFinancialLedger(filters);

  const [withdrawals, setWithdrawals] = useState<unknown[]>([]);

  // Fetch withdrawals for receipts panel
  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .in('status', ['approved', 'processing'])
      .order('created_at', { ascending: false });
    setWithdrawals(data || []);
  };

  const handleReleaseGracePeriod = async () => {
    const count = await releaseGracePeriodFunds();
    if (count > 0) {
      toast({
        title: 'Fundos Liberados',
        description: `${count} registro(s) saíram do período de carência`
      });
    } else {
      toast({
        title: 'Nenhum fundo para liberar',
        description: 'Não há registros com período de carência vencido'
      });
    }
  };

  const handleExportLedger = () => {
    // Export ledger entries as CSV
    const headers = [
      'Data', 'ID Contribuição', 'Método', 'Valor Bruto', 
      'Taxa Stripe', 'Comissão Plataforma', 'Líquido Criador', 'Status'
    ];
    
    const rows = ledgerEntries.map(entry => [
      entry.created_at,
      entry.contribution_id || '',
      entry.payment_method,
      entry.gross_amount,
      entry.stripe_fee_total,
      entry.platform_fee_amount,
      entry.net_amount_creator,
      entry.financial_status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV gerado com sucesso'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Ledger Financeiro
          </h2>
          <p className="text-muted-foreground">
            Sistema central de contabilidade e rastreabilidade financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReleaseGracePeriod}>
            <Unlock className="h-4 w-4 mr-2" />
            Liberar Carências
          </Button>
          <Button variant="outline" onClick={handleExportLedger}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={refreshAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <LedgerSummaryCards summary={summary} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="grace_period">Em Carência</SelectItem>
                  <SelectItem value="released">Liberado</SelectItem>
                  <SelectItem value="withdrawal_pending">Saque Solicitado</SelectItem>
                  <SelectItem value="transfer_pending">Transferindo</SelectItem>
                  <SelectItem value="transfer_completed">Transferido</SelectItem>
                  <SelectItem value="refunded">Estornado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de Pagamento</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="card_national">Cartão Nacional</SelectItem>
                  <SelectItem value="card_international">Cartão Internacional</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilters({
                  status: '',
                  paymentMethod: '',
                  startDate: '',
                  endDate: '',
                  showDeleted: false
                })}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Registros ({ledgerEntries.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Projetos
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Taxas Stripe
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Conciliação
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2" onClick={fetchWithdrawals}>
            <Clock className="h-4 w-4" />
            Comprovantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Registros do Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <LedgerEntriesTable entries={ledgerEntries} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro por Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectFinancialTable projects={projectSummaries} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Taxas do Stripe</CardTitle>
            </CardHeader>
            <CardContent>
              <StripeFeeConfigTable configs={stripeFeeConfigs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation">
          <BankReconciliationPanel
            reconciliations={reconciliations}
            onCreateReconciliation={createReconciliation}
            onUpdateReconciliation={updateReconciliation}
          />
        </TabsContent>

        <TabsContent value="receipts">
          <TransferReceiptsPanel
            withdrawals={withdrawals as Withdrawal[]}
            onRefresh={() => {
              fetchWithdrawals();
              refreshAll();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  net_amount: number;
  status: string;
  bank_account: {
    bank?: string;
    agency?: string;
    account?: string;
    holder_name?: string;
    cpf?: string;
  };
  created_at: string;
}
