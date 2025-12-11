import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { SupportConversation, SupportMessage } from './SupportDashboard';
import { format, subDays, startOfDay, eachDayOfInterval, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportChartsProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
}

const CATEGORY_LABELS: Record<string, string> = {
  pagamentos: 'Pagamentos',
  projeto: 'Projeto',
  conta: 'Conta',
  reembolso: 'Reembolso',
  saque: 'Saque',
  erro: 'Erro',
  outro: 'Outro',
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#94a3b8'];
const STATUS_COLORS = {
  novo: '#ef4444',
  em_andamento: '#3b82f6',
  aguardando_usuario: '#f59e0b',
  resolvido: '#22c55e',
  fechado: '#6b7280'
};

const SupportCharts = ({ conversations, messages }: SupportChartsProps) => {
  // Volume by day (last 30 days)
  const volumeByDay = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(addHours(day, 24));
      
      const count = conversations.filter(c => {
        const created = new Date(c.created_at);
        return created >= dayStart && created < dayEnd;
      }).length;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        chamados: count
      };
    });
  }, [conversations]);

  // Status distribution - updated to new status values
  const statusDistribution = useMemo(() => {
    const novoCount = conversations.filter(c => c.status === 'novo').length;
    const emAndamentoCount = conversations.filter(c => c.status === 'em_andamento').length;
    const aguardandoCount = conversations.filter(c => c.status === 'aguardando_usuario').length;
    const resolvidoCount = conversations.filter(c => c.status === 'resolvido').length;
    const fechadoCount = conversations.filter(c => c.status === 'fechado').length;

    return [
      { name: 'Novos', value: novoCount, color: STATUS_COLORS.novo },
      { name: 'Em Andamento', value: emAndamentoCount, color: STATUS_COLORS.em_andamento },
      { name: 'Aguardando', value: aguardandoCount, color: STATUS_COLORS.aguardando_usuario },
      { name: 'Resolvidos', value: resolvidoCount, color: STATUS_COLORS.resolvido },
      { name: 'Fechados', value: fechadoCount, color: STATUS_COLORS.fechado }
    ].filter(s => s.value > 0);
  }, [conversations]);

  // Category distribution - use database category field
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    
    conversations.forEach(c => {
      const cat = c.category || 'outro';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [conversations]);

  // Response time trend (last 14 days)
  const responseTimeTrend = useMemo(() => {
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return last14Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(addHours(day, 24));
      
      const dayConvs = conversations.filter(c => {
        const created = new Date(c.created_at);
        return created >= dayStart && created < dayEnd && c.first_response_at;
      });

      let avgTime = 0;
      if (dayConvs.length > 0) {
        const totalTime = dayConvs.reduce((sum, c) => {
          const responseTime = new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime();
          return sum + responseTime;
        }, 0);
        avgTime = Math.round(totalTime / dayConvs.length / (1000 * 60)); // in minutes
      }

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        minutos: avgTime
      };
    });
  }, [conversations]);

  // Responses per week
  const responsesPerWeek = useMemo(() => {
    const weeks: Record<string, { admin: number; user: number }> = {};
    
    messages.forEach(msg => {
      const weekKey = format(new Date(msg.created_at), "'Sem' w", { locale: ptBR });
      if (!weeks[weekKey]) {
        weeks[weekKey] = { admin: 0, user: 0 };
      }
      if (msg.sender_type === 'admin') {
        weeks[weekKey].admin++;
      } else {
        weeks[weekKey].user++;
      }
    });

    return Object.entries(weeks)
      .slice(-8)
      .map(([week, counts]) => ({
        week,
        admin: counts.admin,
        usuario: counts.user
      }));
  }, [messages]);

  // Heatmap by hour
  const heatmapData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    conversations.forEach(conv => {
      const hour = new Date(conv.created_at).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...Object.values(hourCounts), 1);

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}h`,
      chamados: count,
      intensity: count / maxCount
    }));
  }, [conversations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Volume by Day */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Volume de Chamados por Dia (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="chamados" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum chamado encontrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum chamado encontrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Response Time Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Tempo Médio de Primeira Resposta (minutos) - últimos 14 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={responseTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} min`, 'Tempo médio']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="minutos" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Responses per Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens por Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={responsesPerWeek}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="admin" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Admin"
              />
              <Line 
                type="monotone" 
                dataKey="usuario" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Usuário"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heatmap by Hour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários de Maior Demanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {heatmapData.map((item, index) => (
              <div
                key={index}
                className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: `hsla(var(--primary) / ${0.1 + item.intensity * 0.9})`,
                  color: item.intensity > 0.5 ? 'white' : 'inherit'
                }}
                title={`${item.hour}: ${item.chamados} chamados`}
              >
                {item.chamados > 0 ? item.chamados : ''}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>00h</span>
            <span>06h</span>
            <span>12h</span>
            <span>18h</span>
            <span>23h</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportCharts;