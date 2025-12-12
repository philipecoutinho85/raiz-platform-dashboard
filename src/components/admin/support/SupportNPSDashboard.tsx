import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Star, ThumbsUp, ThumbsDown, Minus, TrendingUp, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { SupportConversation, SupportMessage, SupportMetrics } from './SupportDashboard';
import { format, subDays, eachDayOfInterval, startOfDay, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SupportAlerts from './SupportAlerts';

interface SupportNPSDashboardProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
  metrics: SupportMetrics;
}

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const NPS_COLORS = {
  promoters: '#22c55e',
  passives: '#f59e0b',
  detractors: '#ef4444'
};

const SupportNPSDashboard = ({ conversations, messages, metrics }: SupportNPSDashboardProps) => {
  // NPS calculation: Promoters (4-5) - Detractors (1-2) / Total * 100
  const npsData = useMemo(() => {
    const ratedConvs = conversations.filter(c => c.rating !== null);
    
    const promoters = ratedConvs.filter(c => c.rating! >= 4).length;
    const passives = ratedConvs.filter(c => c.rating === 3).length;
    const detractors = ratedConvs.filter(c => c.rating! <= 2).length;
    
    const total = ratedConvs.length;
    const npsScore = total > 0 
      ? Math.round(((promoters - detractors) / total) * 100) 
      : 0;

    return {
      npsScore,
      promoters,
      passives,
      detractors,
      total,
      promotersPct: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivesPct: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorsPct: total > 0 ? Math.round((detractors / total) * 100) : 0
    };
  }, [conversations]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1-5 stars
    conversations.forEach(c => {
      if (c.rating) {
        counts[c.rating - 1]++;
      }
    });
    return counts.map((count, index) => ({
      rating: index + 1,
      label: `${index + 1}★`,
      count,
      color: RATING_COLORS[index]
    }));
  }, [conversations]);

  // NPS trend over last 7 days
  const npsTrend = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(addHours(day, 24));
      
      const dayConvs = conversations.filter(c => {
        if (!c.rated_at) return false;
        const ratedAt = new Date(c.rated_at);
        return ratedAt >= dayStart && ratedAt < dayEnd;
      });

      const promoters = dayConvs.filter(c => c.rating! >= 4).length;
      const detractors = dayConvs.filter(c => c.rating! <= 2).length;
      const total = dayConvs.length;
      
      const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        nps,
        avaliacoes: total
      };
    });
  }, [conversations]);

  // Status summary
  const statusSummary = useMemo(() => {
    return [
      { 
        label: 'Novos', 
        value: metrics.totalNovo, 
        color: 'bg-red-500',
        icon: MessageSquare
      },
      { 
        label: 'Em Andamento', 
        value: metrics.totalEmAndamento, 
        color: 'bg-blue-500',
        icon: Clock
      },
      { 
        label: 'Aguardando', 
        value: metrics.totalAguardandoUsuario, 
        color: 'bg-amber-500',
        icon: Clock
      },
      { 
        label: 'Resolvidos', 
        value: metrics.totalResolvido, 
        color: 'bg-green-500',
        icon: CheckCircle
      },
      { 
        label: 'Fechados', 
        value: metrics.totalFechado, 
        color: 'bg-gray-500',
        icon: CheckCircle
      }
    ];
  }, [metrics]);

  const getNPSLabel = (score: number) => {
    if (score >= 50) return { label: 'Excelente', color: 'text-green-600' };
    if (score >= 0) return { label: 'Bom', color: 'text-amber-600' };
    return { label: 'Precisa Melhorar', color: 'text-red-600' };
  };

  const npsLabel = getNPSLabel(npsData.npsScore);

  return (
    <div className="space-y-6">
      {/* NPS Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              NPS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className={`text-5xl font-bold ${npsLabel.color}`}>
                {npsData.npsScore}
              </p>
              <p className={`text-sm mt-1 ${npsLabel.color}`}>
                {npsLabel.label}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {npsData.total} avaliações
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição NPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">Promotores</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{npsData.promotersPct}%</p>
                <p className="text-xs text-muted-foreground">{npsData.promoters} usuários</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Minus className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-700">Neutros</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{npsData.passivesPct}%</p>
                <p className="text-xs text-muted-foreground">{npsData.passives} usuários</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700">Detratores</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{npsData.detractorsPct}%</p>
                <p className="text-xs text-muted-foreground">{npsData.detractors} usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo de Chamados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statusSummary.map((status, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-lg ${status.color} bg-opacity-20`}>
                  <status.icon className={`h-5 w-5 ${status.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{status.value}</p>
                  <p className="text-xs text-muted-foreground">{status.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {npsData.total === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma avaliação recebida
              </div>
            ) : (
              <div className="space-y-3">
                {ratingDistribution.map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={npsData.total > 0 ? (item.count / npsData.total) * 100 : 0} 
                        className="h-3"
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NPS Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência NPS (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={npsTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number | null) => [value !== null ? value : '-', 'NPS']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="nps" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de Satisfação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg border">
              <p className="text-3xl font-bold text-primary">
                {metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Nota Média</p>
              <div className="flex justify-center mt-2">
                {Array(5).fill(0).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.round(metrics.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center p-4 rounded-lg border">
              <p className="text-3xl font-bold text-primary">
                {metrics.firstContactResolutionRate.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">Resolução 1º Contato</p>
            </div>

            <div className="text-center p-4 rounded-lg border">
              <p className="text-3xl font-bold text-primary">
                {metrics.slaMetFirstResponse.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">SLA 1ª Resposta</p>
              <p className="text-xs text-muted-foreground mt-1">Meta: 2h</p>
            </div>

            <div className="text-center p-4 rounded-lg border">
              <p className="text-3xl font-bold text-primary">
                {metrics.slaMetResolution.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">SLA Resolução</p>
              <p className="text-xs text-muted-foreground mt-1">Meta: 24h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Alerts */}
      <div className="lg:col-span-2">
        <SupportAlerts />
      </div>
    </div>
  );
};

export default SupportNPSDashboard;