import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialData } from '@/hooks/useFinancialData';
import { FinancialSummary } from './financial/FinancialSummary';
import { PurchasesTable } from './financial/PurchasesTable';
import { WithdrawalsTable } from './financial/WithdrawalsTable';
import { RefundsTable } from './financial/RefundsTable';
import { FinancialAlerts } from './financial/FinancialAlerts';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FinanceTab = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');

  const {
    loading,
    summary,
    purchases,
    withdrawals,
    refunds,
    alerts,
    markAlertAsRead,
    refreshData,
  } = useFinancialData(startDate, endDate);

  const handlePeriodChange = (value: string) => {
    setPeriodFilter(value);
    const now = new Date();
    let start = '';
    
    switch (value) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      default:
        start = '';
    }

    setStartDate(start);
    setEndDate('');
  };

  const handleExport = (type: string) => {
    toast({
      title: 'Exportando dados',
      description: `Preparando exportação de ${type}...`,
    });
    // Implementar lógica de exportação
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodFilter} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodFilter === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={refreshData} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <FinancialSummary summary={summary} />

      {/* Alertas */}
      <FinancialAlerts />

      {/* Tabelas */}
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchases">
            Compras ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Resgates ({withdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="refunds">
            Reembolsos ({refunds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compras de Tokens</h3>
            <Button variant="outline" onClick={() => handleExport('compras')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <PurchasesTable purchases={purchases} />
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Resgates de Projetos</h3>
            <Button variant="outline" onClick={() => handleExport('resgates')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <WithdrawalsTable withdrawals={withdrawals} />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reembolsos</h3>
            <Button variant="outline" onClick={() => handleExport('reembolsos')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <RefundsTable refunds={refunds} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
