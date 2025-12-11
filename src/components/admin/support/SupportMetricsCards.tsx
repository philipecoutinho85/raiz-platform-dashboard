import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Timer,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { SupportMetrics } from './SupportDashboard';

interface SupportMetricsCardsProps {
  metrics: SupportMetrics;
  loading: boolean;
}

const SupportMetricsCards = ({ metrics, loading }: SupportMetricsCardsProps) => {
  const formatTime = (ms: number) => {
    if (ms === 0) return '-';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const cards = [
    {
      title: 'Novos',
      value: metrics.totalNovo,
      icon: MessageCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Em Andamento',
      value: metrics.totalEmAndamento,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aguardando',
      value: metrics.totalAguardandoUsuario,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Resolvidos',
      value: metrics.totalResolvido,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tempo Médio 1ª Resposta',
      value: formatTime(metrics.avgFirstResponseTime),
      icon: Timer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isTime: true
    },
    {
      title: 'Tempo Médio Resolução',
      value: formatTime(metrics.avgResolutionTime),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      isTime: true
    },
    {
      title: 'Resolução 1º Contato',
      value: `${metrics.firstContactResolutionRate.toFixed(0)}%`,
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isPercentage: true
    },
    {
      title: 'SLA Cumprido',
      value: `${((metrics.slaMetFirstResponse + metrics.slaMetResolution) / 2).toFixed(0)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isPercentage: true
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${card.bgColor} mb-3`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs text-muted-foreground font-medium truncate">
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${card.color} mt-1`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SupportMetricsCards;
