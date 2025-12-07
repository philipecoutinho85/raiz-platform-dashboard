import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FolderCheck, Folder, FolderX, FolderOpen } from 'lucide-react';

interface ProjectSuccessChartsProps {
  filters: FinancialFilters;
}

const COLORS = {
  completed: 'hsl(142, 76%, 36%)',
  active: 'hsl(217, 91%, 60%)',
  notFunded: 'hsl(45, 93%, 47%)',
  cancelled: 'hsl(0, 84%, 60%)',
};

export const ProjectSuccessCharts = ({ filters }: ProjectSuccessChartsProps) => {
  const { projectMetrics, loading } = useAdvancedFinancialData(filters);

  const pieData = [
    { name: 'Concluídos', value: projectMetrics.completed, color: COLORS.completed, icon: FolderCheck },
    { name: 'Ativos', value: projectMetrics.active, color: COLORS.active, icon: FolderOpen },
    { name: 'Não Financiados', value: projectMetrics.notFunded, color: COLORS.notFunded, icon: Folder },
    { name: 'Cancelados', value: projectMetrics.cancelled, color: COLORS.cancelled, icon: FolderX },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Concluídos', value: projectMetrics.completed, fill: COLORS.completed },
    { name: 'Ativos', value: projectMetrics.active, fill: COLORS.active },
    { name: 'Não Financ.', value: projectMetrics.notFunded, fill: COLORS.notFunded },
    { name: 'Cancelados', value: projectMetrics.cancelled, fill: COLORS.cancelled },
  ];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const total = projectMetrics.completed + projectMetrics.active + projectMetrics.notFunded + projectMetrics.cancelled;
  const successRate = total > 0 ? (projectMetrics.completed / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderCheck className="h-5 w-5 text-primary" />
            <CardTitle>Sucesso dos Projetos</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{successRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
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

          {/* Bar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {pieData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="p-3 rounded-lg border"
                style={{ borderColor: item.color, backgroundColor: `${item.color}10` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: item.color }}>
                  {formatNumber(item.value)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
