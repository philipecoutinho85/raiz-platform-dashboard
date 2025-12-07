import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WithdrawalsChartsProps {
  filters: FinancialFilters;
}

const COLORS = {
  approved: 'hsl(142, 76%, 36%)',
  pending: 'hsl(45, 93%, 47%)',
  rejected: 'hsl(0, 84%, 60%)',
};

export const WithdrawalsCharts = ({ filters }: WithdrawalsChartsProps) => {
  const { withdrawalMetrics, loading } = useAdvancedFinancialData(filters);

  const pieData = [
    { name: 'Aprovados', value: withdrawalMetrics.approved, color: COLORS.approved },
    { name: 'Pendentes', value: withdrawalMetrics.requested - withdrawalMetrics.approved - withdrawalMetrics.rejected, color: COLORS.pending },
    { name: 'Rejeitados', value: withdrawalMetrics.rejected, color: COLORS.rejected },
  ].filter(d => d.value > 0);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Resgates</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Pie Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
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

        {/* Stats */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Solicitados</span>
            </div>
            <Badge variant="secondary">{formatNumber(withdrawalMetrics.requested)}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">Aprovados</span>
            </div>
            <Badge className="bg-emerald-500">{formatNumber(withdrawalMetrics.approved)}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Rejeitados</span>
            </div>
            <Badge variant="destructive">{formatNumber(withdrawalMetrics.rejected)}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Tempo Médio</span>
            </div>
            <Badge className="bg-blue-500">
              {withdrawalMetrics.avgProcessingTime.toFixed(1)} dias
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
