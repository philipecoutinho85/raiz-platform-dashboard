import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FinancialAlert } from '@/hooks/useFinancialData';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialAlertsProps {
  alerts: FinancialAlert[];
  onMarkAsRead: (alertId: string) => void;
}

export const FinancialAlerts = ({ alerts, onMarkAsRead }: FinancialAlertsProps) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };

    return (
      <Badge variant={variants[severity] || 'secondary'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum alerta pendente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Alertas Financeiros</span>
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="pt-1">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                {getSeverityBadge(alert.severity)}
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onMarkAsRead(alert.id)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
