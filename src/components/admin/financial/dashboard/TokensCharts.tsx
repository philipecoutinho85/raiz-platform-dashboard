import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Coins, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

interface TokensChartsProps {
  filters: FinancialFilters;
}

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(0, 84%, 60%)'];

export const TokensCharts = ({ filters }: TokensChartsProps) => {
  const { chartData, tokenMetrics, loading } = useAdvancedFinancialData(filters);

  const pieData = [
    { name: 'Comprados', value: tokenMetrics.purchased, color: COLORS[0] },
    { name: 'Utilizados', value: tokenMetrics.used, color: COLORS[1] },
    { name: 'Devolvidos', value: tokenMetrics.refunded, color: COLORS[2] },
  ];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart - Monthly Token Movement */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle>Movimento de Tokens por Mês</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatNumber(value), '']}
                />
                <Legend />
                <Bar 
                  dataKey="tokens" 
                  name="Tokens Comprados" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="refunds" 
                  name="Tokens Devolvidos" 
                  fill="hsl(0, 84%, 60%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Token Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Distribuição de Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Comprados</span>
              </div>
              <span className="font-medium">{formatNumber(tokenMetrics.purchased)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Utilizados</span>
              </div>
              <span className="font-medium">{formatNumber(tokenMetrics.used)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Devolvidos</span>
              </div>
              <span className="font-medium">{formatNumber(tokenMetrics.refunded)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
