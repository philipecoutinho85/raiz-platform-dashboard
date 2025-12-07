import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  FolderCheck, 
  FolderPlus,
  Lock,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialOverviewProps {
  filters: FinancialFilters;
}

export const FinancialOverview = ({ filters }: FinancialOverviewProps) => {
  const { loading, monthlyMetrics, tokenMetrics, projectMetrics } = useAdvancedFinancialData(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getMonthName = (month: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1] || '';
  };

  const cards = [
    {
      title: 'Total Movimentado',
      value: formatNumber(monthlyMetrics.totalMovement),
      subtitle: formatCurrency(monthlyMetrics.totalMovementReais),
      icon: Coins,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Receita da Plataforma',
      value: formatCurrency(monthlyMetrics.platformRevenue),
      subtitle: 'Taxas de projetos',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(monthlyMetrics.netProfit),
      subtitle: 'Receita - Custos',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Projetos Criados',
      value: formatNumber(monthlyMetrics.projectsCreated),
      subtitle: 'Novos projetos',
      icon: FolderPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Projetos Concluídos',
      value: formatNumber(monthlyMetrics.projectsCompleted),
      subtitle: 'Meta atingida',
      icon: FolderCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Saldo em Custódia',
      value: formatCurrency(monthlyMetrics.custodyBalance),
      subtitle: 'Aguardando resgate',
      icon: Lock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Extornos',
      value: formatNumber(monthlyMetrics.refundsCount),
      subtitle: formatCurrency(monthlyMetrics.refundsAmount),
      icon: RefreshCw,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'Tokens em Circulação',
      value: formatNumber(monthlyMetrics.tokensInCirculation),
      subtitle: 'Total na plataforma',
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Resumo de {filters.month ? getMonthName(filters.month) : ''} {filters.year}
          </h2>
          <p className="text-muted-foreground">Visão geral do período selecionado</p>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index} 
              className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                
                {card.trend && (
                  <div className="mt-4 flex items-center gap-1">
                    {card.trendUp ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-sm font-medium ${
                      card.trendUp ? 'text-emerald-500' : 'text-destructive'
                    }`}>
                      {card.trend}
                    </span>
                    <span className="text-xs text-muted-foreground">vs mês anterior</span>
                  </div>
                )}
              </CardContent>
              
              {/* Decorative gradient */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.bgColor.replace('/10', '')}`} />
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tokens Comprados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatNumber(tokenMetrics.purchased)}</p>
            <p className="text-sm text-muted-foreground mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tokens Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{formatNumber(tokenMetrics.used)}</p>
            <p className="text-sm text-muted-foreground mt-1">Em apoios a projetos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tokens Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{formatNumber(tokenMetrics.inactive)}</p>
            <p className="text-sm text-muted-foreground mt-1">Sem uso há 90+ dias</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
