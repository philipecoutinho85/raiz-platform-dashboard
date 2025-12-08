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
  Legend
} from 'recharts';
import { SupportConversation, SupportMessage } from './SupportDashboard';
import { format, subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportChartsProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
}

const COLORS = ['hsl(125, 65%, 35%)', 'hsl(125, 45%, 55%)', 'hsl(45, 80%, 55%)', 'hsl(0, 70%, 55%)', 'hsl(220, 70%, 55%)'];

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

  // Status distribution
  const statusDistribution = useMemo(() => {
    const openCount = conversations.filter(c => c.status === 'open').length;
    const closedCount = conversations.filter(c => c.status === 'closed').length;

    return [
      { name: 'Abertos', value: openCount, color: 'hsl(125, 65%, 35%)' },
      { name: 'Fechados', value: closedCount, color: 'hsl(220, 20%, 60%)' }
    ];
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

  // Top categories (based on keywords in subject)
  const topCategories = useMemo(() => {
    const categories: Record<string, number> = {
      'Pagamento': 0,
      'Projeto': 0,
      'Conta': 0,
      'Token': 0,
      'Resgate': 0,
      'Outros': 0
    };

    conversations.forEach(conv => {
      const subject = conv.subject.toLowerCase();
      if (subject.includes('pagamento') || subject.includes('pagar') || subject.includes('pix')) {
        categories['Pagamento']++;
      } else if (subject.includes('projeto') || subject.includes('campanha')) {
        categories['Projeto']++;
      } else if (subject.includes('conta') || subject.includes('login') || subject.includes('senha')) {
        categories['Conta']++;
      } else if (subject.includes('token') || subject.includes('saldo')) {
        categories['Token']++;
      } else if (subject.includes('resgate') || subject.includes('saque') || subject.includes('ted')) {
        categories['Resgate']++;
      } else {
        categories['Outros']++;
      }
    });

    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [conversations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Volume by Day */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Volume de Chamados por Dia</CardTitle>
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
                fill="hsl(125, 65%, 35%)" 
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
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias de Dúvidas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={topCategories}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {topCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                stroke="hsl(125, 65%, 35%)" 
                strokeWidth={2}
                name="Admin"
              />
              <Line 
                type="monotone" 
                dataKey="usuario" 
                stroke="hsl(220, 70%, 55%)" 
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
                  backgroundColor: `hsla(125, 65%, 35%, ${0.1 + item.intensity * 0.9})`,
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
