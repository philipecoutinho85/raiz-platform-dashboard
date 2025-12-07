import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { Calendar, AlertTriangle, TrendingUp, Clock, Wallet, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyForecastViewProps {
  filters: FinancialFilters;
}

export const MonthlyForecastView = ({ filters }: MonthlyForecastViewProps) => {
  const { monthlyForecast, loading } = useAdvancedFinancialData(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold capitalize">Previsão de {currentMonth}</h2>
          <p className="text-muted-foreground">Visão atual do mês em andamento</p>
        </div>
      </div>

      {/* Risk Alerts */}
      {monthlyForecast.riskAlerts.length > 0 && (
        <div className="space-y-2">
          {monthlyForecast.riskAlerts.map((alert, index) => (
            <Alert key={index} variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Alerta de Risco</AlertTitle>
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Receita Mínima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(monthlyForecast.minimumRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Garantida (projetos já concluídos)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Receita Máxima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(monthlyForecast.maximumRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Se todos projetos atingirem meta
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-600" />
              Custódia Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(monthlyForecast.expectedCustodyRelease)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando liberação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Resgates Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(monthlyForecast.pendingWithdrawals)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Em análise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Ending This Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Projetos que Encerram Este Mês ({monthlyForecast.projectsEndingThisMonth.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyForecast.projectsEndingThisMonth.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum projeto encerra este mês
            </p>
          ) : (
            <div className="space-y-4">
              {monthlyForecast.projectsEndingThisMonth.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Encerra em {project.deadline ? format(new Date(project.deadline), "dd 'de' MMMM", { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                    <Badge 
                      className={
                        project.progress >= 100 
                          ? 'bg-emerald-500' 
                          : project.progress >= 70 
                            ? 'bg-amber-500' 
                            : 'bg-destructive'
                      }
                    >
                      {project.progress.toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={Math.min(project.progress, 100)} 
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(project.raised)} arrecadado
                    </span>
                    <span className="font-medium">
                      Meta: {formatCurrency(project.goal)}
                    </span>
                  </div>

                  {project.progress < 100 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Faltam {formatCurrency(project.goal - project.raised)} para atingir a meta
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
