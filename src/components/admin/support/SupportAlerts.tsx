import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  TrendingDown, 
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

const SupportAlerts = () => {
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_alerts')
        .select('*')
        .like('alert_type', 'support_%')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAlertsNow = async () => {
    setChecking(true);
    try {
      await supabase.functions.invoke('check-support-alerts');
      await fetchAlerts();
    } catch (err) {
      console.error('Error checking alerts:', err);
    } finally {
      setChecking(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('financial_alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', alertId);
    
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes('nps')) return TrendingDown;
    if (type.includes('unanswered')) return Clock;
    if (type.includes('reopened')) return RefreshCw;
    return AlertTriangle;
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle className="text-lg">Alertas de Suporte</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} novo(s)</Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkAlertsNow}
          disabled={checking}
        >
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Verificar Agora
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>Nenhum alerta ativo</p>
            <p className="text-sm">Tudo está funcionando normalmente!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.alert_type);
              return (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'high' ? 'destructive' : 'default'}
                  className={`${alert.is_read ? 'opacity-60' : ''} transition-opacity`}
                >
                  <Icon className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity === 'high' ? 'Alta' : 'Média'}
                      </Badge>
                      {!alert.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Dispensar
                        </Button>
                      )}
                    </div>
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    <p>{alert.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(alert.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {/* Alert Thresholds Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Configuração de Alertas</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• NPS abaixo de 3.0/5.0 → Alerta de alta prioridade</li>
            <li>• 5+ chamados sem resposta há 2+ horas → Alerta de alta prioridade</li>
            <li>• Chamados reabertos por insatisfação → Alerta de média prioridade</li>
            <li>• Chamados abertos há 24+ horas → Alerta de SLA</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportAlerts;
