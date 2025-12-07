import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Calendar, GitCompare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PeriodComparisonChartsProps {
  filters: FinancialFilters;
}

export const PeriodComparisonCharts = ({ filters }: PeriodComparisonChartsProps) => {
  const { loading, yearlyMetrics, monthlyMetrics, chartData } = useAdvancedFinancialData(filters);
  const [comparisonType, setComparisonType] = useState<'month' | 'quarter' | 'year'>('month');

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[month - 1] || '';
  };

  // Generate comparison data between current and previous period
  const generateComparisonData = () => {
    const currentYear = filters.year || new Date().getFullYear();
    const currentMonth = filters.month || new Date().getMonth() + 1;

    // Find yearly metrics for comparison
    const currentYearData = yearlyMetrics.find(y => y.year === currentYear);
    const previousYearData = yearlyMetrics.find(y => y.year === currentYear - 1);

    if (!currentYearData && !previousYearData) {
      return [];
    }

    const metrics = [
      {
        name: 'Arrecadação',
        atual: currentYearData?.totalRaised || 0,
        anterior: previousYearData?.totalRaised || 0,
      },
      {
        name: 'Receita',
        atual: currentYearData?.platformRevenue || 0,
        anterior: previousYearData?.platformRevenue || 0,
      },
      {
        name: 'Extornos',
        atual: currentYearData?.refunds || 0,
        anterior: previousYearData?.refunds || 0,
      },
      {
        name: 'Usuários',
        atual: currentYearData?.newUsers || 0,
        anterior: previousYearData?.newUsers || 0,
      },
      {
        name: 'Projetos',
        atual: currentYearData?.projectsCreated || 0,
        anterior: previousYearData?.projectsCreated || 0,
      },
    ];

    return metrics.map(m => ({
      ...m,
      variacao: m.anterior > 0 ? ((m.atual - m.anterior) / m.anterior * 100) : 0,
    }));
  };

  const comparisonData = generateComparisonData();

  // Generate monthly trend data for current year
  const generateMonthlyTrendData = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push({
        month: getMonthName(i),
        tokens: Math.floor(Math.random() * 5000) + 1000, // Simulated data
        receita: Math.floor(Math.random() * 2000) + 500,
        extornos: Math.floor(Math.random() * 500),
      });
    }
    return chartData.length > 0 ? chartData : months;
  };

  const monthlyTrendData = generateMonthlyTrendData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVariationIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getVariationColor = (value: number, isNegativeGood: boolean = false) => {
    if (value === 0) return 'text-muted-foreground';
    if (isNegativeGood) {
      return value < 0 ? 'text-emerald-500' : 'text-destructive';
    }
    return value > 0 ? 'text-emerald-500' : 'text-destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Comparação de Períodos</h2>
        </div>
        <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as 'month' | 'quarter' | 'year')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de comparação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês a Mês</SelectItem>
            <SelectItem value="quarter">Trimestral</SelectItem>
            <SelectItem value="year">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year over Year Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {comparisonData.map((item, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold">
                  {item.name === 'Usuários' || item.name === 'Projetos' 
                    ? item.atual.toLocaleString('pt-BR')
                    : formatCurrency(item.atual)
                  }
                </p>
                <div className="flex items-center gap-1">
                  {getVariationIcon(item.variacao)}
                  <span className={`text-sm font-medium ${getVariationColor(item.variacao, item.name === 'Extornos')}`}>
                    {item.variacao > 0 ? '+' : ''}{item.variacao.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs ano anterior</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendência Mensal
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <GitCompare className="h-4 w-4" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="cumulative" className="gap-2">
            <Calendar className="h-4 w-4" />
            Acumulado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendência Mensal - {filters.year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'tokens' ? value.toLocaleString('pt-BR') : formatCurrency(value),
                        name === 'tokens' ? 'Tokens' : name === 'receita' ? 'Receita' : 'Extornos'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="tokens"
                      fill="hsl(var(--primary) / 0.2)"
                      stroke="hsl(var(--primary))"
                      name="Tokens"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="receita"
                      stroke="hsl(142.1 76.2% 36.3%)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Receita"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="extornos"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Extornos"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparativo Ano a Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="anterior" name={`${(filters.year || new Date().getFullYear()) - 1}`} fill="hsl(var(--muted-foreground) / 0.5)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="atual" name={`${filters.year || new Date().getFullYear()}`} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receita Acumulada - {filters.year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Acumulado']}
                    />
                    <Line
                      type="monotone"
                      dataKey="receita"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yearly Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Anual Histórica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyMetrics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'totalRaised' ? 'Arrecadação' : 
                    name === 'platformRevenue' ? 'Receita' : 'Extornos'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'totalRaised' ? 'Arrecadação' : 
                    value === 'platformRevenue' ? 'Receita' : 'Extornos'
                  }
                />
                <Bar dataKey="totalRaised" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="platformRevenue" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="refunds" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
