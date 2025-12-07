import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';

interface FinancialAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
  metadata?: Json;
}

export const FinancialAlerts = () => {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('financial_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!showRead) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [showRead]);

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('financial_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      toast.success('Alerta marcado como lido');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Erro ao marcar alerta');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('financial_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

      if (error) throw error;
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('Todos os alertas marcados como lidos');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast.error('Erro ao marcar alertas');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const checkAndGenerateAlerts = useCallback(async () => {
    try {
      // Check for pending withdrawals > 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('id, requested_amount, created_at')
        .in('status', ['verification_pending', 'pending'])
        .lt('created_at', threeDaysAgo.toISOString());

      if (pendingWithdrawals && pendingWithdrawals.length > 0) {
        const totalPending = pendingWithdrawals.reduce((sum, w) => sum + Number(w.requested_amount), 0);
        await createAlertIfNotExists(
          'pending_withdrawals',
          'Resgates Pendentes há Mais de 3 Dias',
          `Existem ${pendingWithdrawals.length} resgates pendentes há mais de 3 dias, totalizando R$ ${totalPending.toFixed(2)}`,
          'high',
          { count: pendingWithdrawals.length, total: totalPending }
        );
      }

      // Check for high refund rate
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentPurchases } = await supabase
        .from('token_purchases')
        .select('price')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: recentRefunds } = await supabase
        .from('refunds')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalPurchases = recentPurchases?.reduce((sum, p) => sum + p.price, 0) || 0;
      const totalRefunds = recentRefunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const refundRate = totalPurchases > 0 ? (totalRefunds / totalPurchases) * 100 : 0;

      if (refundRate > 10) {
        await createAlertIfNotExists(
          'high_refund_rate',
          'Taxa de Extornos Acima do Normal',
          `A taxa de extornos está em ${refundRate.toFixed(1)}% nos últimos 30 dias, acima do limite de 10%`,
          'critical',
          { refundRate, totalRefunds, totalPurchases }
        );
      }

      // Check for projects ending soon without reaching goal
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: endingProjects } = await supabase
        .from('projects')
        .select('id, title, raised_amount, goal, custom_goal, deadline')
        .eq('status', 'approved')
        .lte('deadline', sevenDaysFromNow.toISOString())
        .gte('deadline', new Date().toISOString());

      const atRiskProjects = endingProjects?.filter(p => {
        const effectiveGoal = Number(p.custom_goal ?? p.goal);
        const progress = (Number(p.raised_amount) / effectiveGoal) * 100;
        return progress < 70;
      });

      if (atRiskProjects && atRiskProjects.length > 0) {
        await createAlertIfNotExists(
          'projects_at_risk',
          'Projetos em Risco de Não Conclusão',
          `${atRiskProjects.length} projetos encerram em até 7 dias com menos de 70% da meta`,
          'medium',
          { count: atRiskProjects.length, projects: atRiskProjects.map(p => p.title) }
        );
      }

      // Check for large purchases
      const { data: largePurchases } = await supabase
        .from('token_purchases')
        .select('id, amount, price, user_id, created_at')
        .eq('status', 'paid')
        .gte('price', 1000)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (largePurchases && largePurchases.length > 0) {
        for (const purchase of largePurchases) {
          await createAlertIfNotExists(
            `large_purchase_${purchase.id}`,
            'Compra de Alto Valor Detectada',
            `Compra de R$ ${purchase.price.toFixed(2)} (${purchase.amount} tokens) em ${format(new Date(purchase.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
            'low',
            { purchaseId: purchase.id, amount: purchase.amount, price: purchase.price }
          );
        }
      }

      fetchAlerts();
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }, [fetchAlerts]);

  useEffect(() => {
    checkAndGenerateAlerts();
  }, [checkAndGenerateAlerts]);

  const createAlertIfNotExists = async (
    alertType: string,
    title: string,
    message: string,
    severity: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data: existing } = await supabase
        .from('financial_alerts')
        .select('id')
        .eq('alert_type', alertType)
        .eq('is_read', false)
        .limit(1);

      if (existing && existing.length > 0) return;

      await supabase.from('financial_alerts').insert([{
        alert_type: alertType,
        title,
        message,
        severity,
        metadata: metadata as Json,
      }]);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { 
          icon: XCircle, 
          color: 'text-destructive', 
          bg: 'bg-destructive/10',
          badge: 'destructive' as const 
        };
      case 'high':
        return { 
          icon: AlertTriangle, 
          color: 'text-orange-600', 
          bg: 'bg-orange-500/10',
          badge: 'default' as const 
        };
      case 'medium':
        return { 
          icon: Clock, 
          color: 'text-amber-600', 
          bg: 'bg-amber-500/10',
          badge: 'secondary' as const 
        };
      default:
        return { 
          icon: Bell, 
          color: 'text-blue-600', 
          bg: 'bg-blue-500/10',
          badge: 'outline' as const 
        };
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Alertas Financeiros</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRead(!showRead)}
          >
            {showRead ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showRead ? 'Ocultar Lidos' : 'Mostrar Lidos'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500" />
              <p className="font-medium">Nenhum alerta pendente</p>
              <p className="text-sm">Todas as métricas estão dentro do esperado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = getSeverityConfig(alert.severity);
                const Icon = config.icon;
                
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border transition-all ${
                      alert.is_read ? 'opacity-60 bg-muted/30' : config.bg
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <Badge variant={config.badge} className="text-xs">
                                {alert.severity === 'critical' ? 'Crítico' : 
                                 alert.severity === 'high' ? 'Alto' : 
                                 alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {!alert.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
