import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { RefreshCw, TrendingDown, Percent, Hash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RefundsChartsProps {
  filters: FinancialFilters;
}

export const RefundsCharts = ({ filters }: RefundsChartsProps) => {
  const { monthlyMetrics, tokenMetrics, loading } = useAdvancedFinancialData(filters);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate refund percentage
  const refundPercentage = monthlyMetrics.totalMovement > 0 
    ? (monthlyMetrics.refundsAmount / monthlyMetrics.totalMovement) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-destructive" />
          <CardTitle>Extornos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Quantidade</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatNumber(monthlyMetrics.refundsCount)}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(monthlyMetrics.refundsAmount)}
            </p>
          </div>
        </div>

        {/* Percentage of Movement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">% sobre movimento</span>
            </div>
            <span className="text-sm font-medium">
              {refundPercentage.toFixed(2)}%
            </span>
          </div>
          <Progress 
            value={refundPercentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {formatNumber(monthlyMetrics.refundsAmount)} de {formatNumber(monthlyMetrics.totalMovement)} tokens
          </p>
        </div>

        {/* Health Indicator */}
        <div className={`p-4 rounded-lg ${
          refundPercentage < 5 
            ? 'bg-emerald-500/10 border border-emerald-500/20' 
            : refundPercentage < 10 
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-destructive/10 border border-destructive/20'
        }`}>
          <p className={`text-sm font-medium ${
            refundPercentage < 5 
              ? 'text-emerald-600' 
              : refundPercentage < 10 
                ? 'text-amber-600'
                : 'text-destructive'
          }`}>
            {refundPercentage < 5 
              ? '✓ Taxa saudável de extornos' 
              : refundPercentage < 10 
                ? '⚠ Taxa moderada de extornos'
                : '✗ Taxa alta de extornos'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {refundPercentage < 5 
              ? 'Abaixo de 5% é considerado ideal' 
              : refundPercentage < 10 
                ? 'Entre 5% e 10% - monitorar'
                : 'Acima de 10% - ação necessária'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
