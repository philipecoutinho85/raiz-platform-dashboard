import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';

interface LedgerSummary {
  totalGross: number;
  totalStripeFees: number;
  totalPlatformFees: number;
  totalNetCreator: number;
  totalInGrace: number;
  totalReleased: number;
  totalPendingTransfer: number;
  totalTransferred: number;
  entryCount: number;
}

interface LedgerSummaryCardsProps {
  summary: LedgerSummary;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function LedgerSummaryCards({ summary }: LedgerSummaryCardsProps) {
  const cards = [
    {
      title: 'Volume Bruto Total',
      value: formatCurrency(summary.totalGross),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Taxas Stripe',
      value: formatCurrency(summary.totalStripeFees),
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: `${summary.entryCount} transações`
    },
    {
      title: 'Comissão Plataforma',
      value: formatCurrency(summary.totalPlatformFees),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Líquido Criadores',
      value: formatCurrency(summary.totalNetCreator),
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Em Carência (30 dias)',
      value: formatCurrency(summary.totalInGrace),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Liberado para Saque',
      value: formatCurrency(summary.totalReleased),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Pendente Transferência',
      value: formatCurrency(summary.totalPendingTransfer),
      icon: ArrowUpFromLine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Transferido',
      value: formatCurrency(summary.totalTransferred),
      icon: ArrowDownToLine,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
