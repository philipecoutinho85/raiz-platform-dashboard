import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryPerformanceProps {
  filters: FinancialFilters;
}

export const CategoryPerformance = ({ filters }: CategoryPerformanceProps) => {
  const { categoryMetrics } = useAdvancedFinancialData(filters);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <CardTitle>Desempenho por Categoria</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="Receita" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryMetrics.slice(0, 6).map((cat, i) => (
            <div key={cat.category} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                {i === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                <span className="font-medium capitalize">{cat.category}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Projetos</span><span>{cat.projectsCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Receita</span><span className="text-emerald-600">{formatCurrency(cat.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxa de Sucesso</span><Badge variant={cat.successRate >= 50 ? 'default' : 'secondary'}>{cat.successRate.toFixed(0)}%</Badge></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
