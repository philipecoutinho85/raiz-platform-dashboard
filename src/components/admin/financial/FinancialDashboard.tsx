import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FinancialFilters, useAdvancedFinancialData } from '@/hooks/useAdvancedFinancialData';
import { FinancialOverview } from './dashboard/FinancialOverview';
import { FinancialFiltersBar } from './dashboard/FinancialFiltersBar';
import { TokensCharts } from './dashboard/TokensCharts';
import { RevenueCharts } from './dashboard/RevenueCharts';
import { WithdrawalsCharts } from './dashboard/WithdrawalsCharts';
import { RefundsCharts } from './dashboard/RefundsCharts';
import { ProjectSuccessCharts } from './dashboard/ProjectSuccessCharts';
import { YearlyGrowth } from './dashboard/YearlyGrowth';
import { MonthlyForecastView } from './dashboard/MonthlyForecastView';
import { CategoryPerformance } from './dashboard/CategoryPerformance';
import { InactiveTokensView } from './dashboard/InactiveTokensView';
import { ProfitCalculator } from './dashboard/ProfitCalculator';
import { FinancialTables } from './dashboard/FinancialTables';
import { PeriodComparisonCharts } from './dashboard/PeriodComparisonCharts';
import { FinancialAlerts } from './FinancialAlerts';
import { LedgerTab } from './ledger/LedgerTab';
import { ResetFinancialData } from './ResetFinancialData';
import { generateFinancialReportPDF } from '@/lib/pdfExport';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calendar, 
  PieChart, 
  Users,
  Calculator,
  Table,
  FileDown,
  Bell,
  GitCompare,
  BookOpen
} from 'lucide-react';

export const FinancialDashboard = () => {
  const currentDate = new Date();
  const [filters, setFilters] = useState<FinancialFilters>({
    startDate: '',
    endDate: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    category: '',
    status: '',
    state: '',
    city: '',
  });

  const {
    loading,
    monthlyMetrics,
    tokenMetrics,
    withdrawalMetrics,
    projectMetrics,
    categoryMetrics,
    yearlyMetrics,
  } = useAdvancedFinancialData(filters);

  const handleExportPDF = () => {
    try {
      generateFinancialReportPDF({
        period: {
          month: filters.month,
          year: filters.year,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        monthlyMetrics,
        tokenMetrics,
        withdrawalMetrics,
        projectMetrics,
        categoryMetrics,
        yearlyMetrics,
      });
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão completa da operação financeira da plataforma Raiz Token
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={loading} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Alerts */}
      <FinancialAlerts />

      {/* Filters */}
      <FinancialFiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-10 h-auto gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-2 py-3">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2 py-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2 py-3">
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Comparação</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 py-3">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Previsão</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 py-3">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Inativos</span>
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2 py-3">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Lucro</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2 py-3">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2 py-3">
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">Tabelas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinancialOverview filters={filters} />
          <YearlyGrowth filters={filters} />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <LedgerTab />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6">
            <TokensCharts filters={filters} />
            <RevenueCharts filters={filters} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WithdrawalsCharts filters={filters} />
              <RefundsCharts filters={filters} />
            </div>
            <ProjectSuccessCharts filters={filters} />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <PeriodComparisonCharts filters={filters} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <MonthlyForecastView filters={filters} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoryPerformance filters={filters} />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-6">
          <InactiveTokensView filters={filters} />
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <ProfitCalculator filters={filters} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <FinancialAlerts />
          <ResetFinancialData />
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <FinancialTables filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
