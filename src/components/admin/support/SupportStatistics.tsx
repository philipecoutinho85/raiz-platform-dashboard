import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Star, Clock, Timer, TrendingUp } from 'lucide-react';
import { SupportConversation, SupportMessage, SupportMetrics } from './SupportDashboard';

interface SupportStatisticsProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
  metrics: SupportMetrics;
}

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const SupportStatistics = ({ conversations, messages, metrics }: SupportStatisticsProps) => {
  const formatTime = (ms: number) => {
    if (ms === 0) return '-';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1-5 stars
    conversations.forEach(c => {
      if (c.rating) {
        counts[c.rating - 1]++;
      }
    });
    return counts.map((count, index) => ({
      rating: `${index + 1} estrela${index > 0 ? 's' : ''}`,
      count,
      stars: index + 1
    }));
  }, [conversations]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const CATEGORY_LABELS: Record<string, string> = {
      pagamentos: 'Pagamentos',
      projeto: 'Projeto',
      conta: 'Conta',
      reembolso: 'Reembolso',
      saque: 'Saque',
      erro: 'Erro',
      outro: 'Outro',
    };
    
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

  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#94a3b8'];

  // Response time trends (by day of week)
  const responseTrends = useMemo(() => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayData: Record<number, { total: number; count: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      dayData[i] = { total: 0, count: 0 };
    }
    
    conversations.forEach(c => {
      if (c.first_response_at) {
        const day = new Date(c.created_at).getDay();
        const responseTime = new Date(c.first_response_at).getTime() - new Date(c.created_at).getTime();
        dayData[day].total += responseTime;
        dayData[day].count++;
      }
    });
    
    return dayNames.map((name, index) => ({
      name,
      avgTime: dayData[index].count > 0 
        ? Math.round(dayData[index].total / dayData[index].count / (1000 * 60)) // in minutes
        : 0
    }));
  }, [conversations]);

  const totalRated = conversations.filter(c => c.rating !== null).length;

  return (
    <div className="space-y-6">
      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio 1ª Resposta</p>
                <p className="text-2xl font-bold">{formatTime(metrics.avgFirstResponseTime)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Meta: 2 horas</p>
            <Progress 
              value={Math.min(100, (2 * 60 * 60 * 1000 / Math.max(metrics.avgFirstResponseTime, 1)) * 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio Resolução</p>
                <p className="text-2xl font-bold">{formatTime(metrics.avgResolutionTime)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Meta: 24 horas</p>
            <Progress 
              value={Math.min(100, (24 * 60 * 60 * 1000 / Math.max(metrics.avgResolutionTime, 1)) * 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolução 1º Contato</p>
                <p className="text-2xl font-bold">{metrics.firstContactResolutionRate.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">% resolvidos na primeira resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Satisfação Média</p>
                <p className="text-2xl font-bold">
                  {metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : '-'}/5
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{totalRated} avaliações</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRated === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma avaliação recebida
              </div>
            ) : (
              <div className="space-y-3">
                {ratingDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-24">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < item.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={totalRated > 0 ? (item.count / totalRated) * 100 : 0} 
                        className="h-3"
                        style={{ backgroundColor: RATING_COLORS[index] + '20' }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamados por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum chamado encontrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Response Time by Day */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tempo Médio de Resposta por Dia da Semana (minutos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`${value} min`, 'Tempo médio']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="avgTime" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportStatistics;