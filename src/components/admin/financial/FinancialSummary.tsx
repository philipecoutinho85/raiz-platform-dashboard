import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Coins, Lock, RefreshCw } from 'lucide-react';
import { FinancialSummary as SummaryType } from '@/hooks/useFinancialData';

interface FinancialSummaryProps {
  summary: SummaryType;
}

export const FinancialSummary = ({ summary }: FinancialSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const cards = [
    {
      title: 'Volume Total (Tokens)',
      value: formatNumber(summary.totalTokensVolume),
      icon: Coins,
      color: 'text-raiz-primary',
    },
    {
      title: 'Volume Total (R$)',
      value: formatCurrency(summary.totalReaisVolume),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Receita da Plataforma',
      value: formatCurrency(summary.platformRevenue),
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Total Pago aos Criadores',
      value: formatCurrency(summary.totalPaidToCreators),
      icon: TrendingDown,
      color: 'text-purple-600',
    },
    {
      title: 'Tokens em Circulação',
      value: formatNumber(summary.tokensInCirculation),
      icon: Coins,
      color: 'text-orange-600',
    },
    {
      title: 'Total de Extornos (Tokens)',
      value: formatNumber(summary.totalRefunds),
      icon: RefreshCw,
      color: 'text-red-600',
    },
    {
      title: 'Total de Extornos (R$)',
      value: formatCurrency(summary.totalRefundsReais),
      icon: DollarSign,
      color: 'text-red-600',
    },
    {
      title: 'Saldo em Custódia',
      value: formatCurrency(summary.custodyBalance),
      icon: Lock,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
