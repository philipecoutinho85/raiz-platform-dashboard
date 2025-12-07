import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface RevenueChartsProps {
  filters: FinancialFilters;
}

export const RevenueCharts = ({ filters }: RevenueChartsProps) => {
  const { chartData, monthlyMetrics, loading } = useAdvancedFinancialData(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate ticket médio
  const ticketMedio = monthlyMetrics.projectsCompleted > 0 
    ? monthlyMetrics.totalMovementReais / monthlyMetrics.projectsCompleted 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Area Chart - Revenue */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <CardTitle>Receita da Plataforma por Mês</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Receita"
                  stroke="hsl(142, 76%, 36%)" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total de Taxas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(monthlyMetrics.platformRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Taxas de projetos concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(ticketMedio)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Por projeto concluído
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Pago aos Criadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(monthlyMetrics.totalPaidToCreators)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Resgates aprovados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
