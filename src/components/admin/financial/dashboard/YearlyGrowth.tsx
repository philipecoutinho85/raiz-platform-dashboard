import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FolderPlus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface YearlyGrowthProps {
  filters: FinancialFilters;
}

export const YearlyGrowth = ({ filters }: YearlyGrowthProps) => {
  const { yearlyMetrics, loading } = useAdvancedFinancialData(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Crescimento Anual</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Arrecadação e Receita por Ano</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
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
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'totalRaised' ? 'Arrecadação' : 'Receita'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalRaised" 
                    name="Arrecadação" 
                    fill="hsl(217, 91%, 60%)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="platformRevenue" 
                    name="Receita" 
                    fill="hsl(142, 76%, 36%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Line Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Crescimento de Usuários e Projetos</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="newUsers" 
                    name="Novos Usuários"
                    stroke="hsl(262, 83%, 58%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(262, 83%, 58%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectsCreated" 
                    name="Projetos Criados"
                    stroke="hsl(217, 91%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217, 91%, 60%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectsCompleted" 
                    name="Projetos Concluídos"
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 76%, 36%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Year Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {yearlyMetrics.map((year, index) => (
            <Card key={year.year} className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-bold">{year.year}</h5>
                  {year.growthRate !== 0 && (
                    <Badge className={year.growthRate > 0 ? 'bg-emerald-500' : 'bg-destructive'}>
                      {year.growthRate > 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {year.growthRate.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arrecadação</span>
                    <span className="font-medium">{formatCurrency(year.totalRaised)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(year.platformRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extornos</span>
                    <span className="font-medium text-destructive">{formatNumber(year.refunds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novos Usuários</span>
                    <span className="font-medium">{formatNumber(year.newUsers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projetos</span>
                    <span className="font-medium">
                      {formatNumber(year.projectsCreated)} / {formatNumber(year.projectsCompleted)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
