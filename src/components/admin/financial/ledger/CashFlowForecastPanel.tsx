import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, addDays, differenceInDays, isFuture, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Wallet, 
  CreditCard, 
  Receipt, 
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Banknote,
  ArrowRightCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TokenPurchase {
  id: string;
  user_id: string;
  amount: number;
  price: number;
  payment_method: string;
  payment_type: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
}

interface CashFlowEntry {
  date: string;
  source: 'boleto' | 'card';
  grossAmount: number;
  stripeFeeBoleto: number;
  stripeFeeCard: number;
  netAmount: number;
  purchaseIds: string[];
  status: 'pending' | 'available' | 'past';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Stripe fees
const BOLETO_FEE = 3.45; // R$ por boleto
const CARD_PERCENTAGE = 3.99; // %
const CARD_FIXED = 0.39; // R$

export function CashFlowForecastPanel() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [cashFlowByDate, setCashFlowByDate] = useState<CashFlowEntry[]>([]);
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalAvailableNow: 0,
    totalToReceive: 0,
    pendingBoleto: 0,
    pendingCard: 0,
    boletoFees: 0,
    cardFees: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch completed token purchases
      const { data, error } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
      calculateCashFlow(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCashFlow = (purchaseData: TokenPurchase[]) => {
    const today = new Date();
    const flowMap = new Map<string, CashFlowEntry>();

    let totalPending = 0;
    let totalAvailableNow = 0;
    let pendingBoleto = 0;
    let pendingCard = 0;
    let boletoFees = 0;
    let cardFees = 0;

    purchaseData.forEach(purchase => {
      const purchaseDate = new Date(purchase.created_at);
      const isBoleto = purchase.payment_type === 'boleto';
      
      // Boleto: 2 dias úteis, Cartão: 20 dias
      const daysToSettle = isBoleto ? 2 : 20;
      const settleDate = addDays(purchaseDate, daysToSettle);
      const dateKey = format(settleDate, 'yyyy-MM-dd');
      
      const grossAmount = purchase.price;
      let stripeFee = 0;
      
      if (isBoleto) {
        stripeFee = BOLETO_FEE;
        boletoFees += stripeFee;
        pendingBoleto += grossAmount;
      } else {
        stripeFee = (grossAmount * CARD_PERCENTAGE / 100) + CARD_FIXED;
        cardFees += stripeFee;
        pendingCard += grossAmount;
      }
      
      const netAmount = grossAmount - stripeFee;
      
      // Check if already settled
      const isSettled = isPast(settleDate) && !isToday(settleDate);
      
      if (isSettled) {
        totalAvailableNow += netAmount;
      } else {
        totalPending += netAmount;
      }

      const existing = flowMap.get(dateKey);
      if (existing) {
        existing.grossAmount += grossAmount;
        if (isBoleto) {
          existing.stripeFeeBoleto += stripeFee;
        } else {
          existing.stripeFeeCard += stripeFee;
        }
        existing.netAmount += netAmount;
        existing.purchaseIds.push(purchase.id);
      } else {
        flowMap.set(dateKey, {
          date: dateKey,
          source: isBoleto ? 'boleto' : 'card',
          grossAmount,
          stripeFeeBoleto: isBoleto ? stripeFee : 0,
          stripeFeeCard: isBoleto ? 0 : stripeFee,
          netAmount,
          purchaseIds: [purchase.id],
          status: isSettled ? 'past' : (isToday(settleDate) ? 'available' : 'pending')
        });
      }
    });

    // Sort by date
    const sortedFlow = Array.from(flowMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setCashFlowByDate(sortedFlow);
    setSummary({
      totalPending,
      totalAvailableNow,
      totalToReceive: totalPending + totalAvailableNow,
      pendingBoleto,
      pendingCard,
      boletoFees,
      cardFees
    });
  };

  const getStatusBadge = (entry: CashFlowEntry) => {
    const entryDate = new Date(entry.date);
    if (isPast(entryDate) && !isToday(entryDate)) {
      return <Badge className="bg-green-100 text-green-800">Disponível</Badge>;
    } else if (isToday(entryDate)) {
      return <Badge className="bg-blue-100 text-blue-800">Hoje</Badge>;
    } else {
      const daysLeft = differenceInDays(entryDate, new Date());
      return <Badge className="bg-yellow-100 text-yellow-800">Em {daysLeft} dias</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700">Disponível Agora</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(summary.totalAvailableNow)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">A Receber (Pendente)</p>
                <p className="text-2xl font-bold text-yellow-800">{formatCurrency(summary.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Boletos (2 dias)</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(summary.pendingBoleto)}</p>
                <p className="text-xs text-purple-600">Taxa: {formatCurrency(summary.boletoFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Cartões (20 dias)</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(summary.pendingCard)}</p>
                <p className="text-xs text-blue-600">Taxa: {formatCurrency(summary.cardFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for required balance */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Saldo Mínimo Necessário na Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-2">
            Para honrar todos os pagamentos aos criadores, sua conta precisa ter no mínimo:
          </p>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-red-800">
              {formatCurrency(summary.totalPending)}
            </div>
            <ArrowRightCircle className="h-6 w-6 text-red-600" />
            <div className="text-sm text-red-700">
              Este valor será creditado conforme os prazos de repasse (boleto 2 dias, cartão 20 dias)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Previsão de Recebimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cashFlowByDate.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação de token encontrada
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data do Repasse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Taxa Boleto</TableHead>
                    <TableHead className="text-right">Taxa Cartão</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead className="text-right">Transações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowByDate.map((entry, index) => (
                    <TableRow key={index} className={
                      entry.status === 'past' ? 'bg-green-50' : 
                      entry.status === 'available' ? 'bg-blue-50' : ''
                    }>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(entry.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(entry)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.grossAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.stripeFeeBoleto > 0 ? `-${formatCurrency(entry.stripeFeeBoleto)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.stripeFeeCard > 0 ? `-${formatCurrency(entry.stripeFeeCard)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(entry.netAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{entry.purchaseIds.length}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment to Creators Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cálculo para Pagamento aos Criadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-3">Como calcular o valor a depositar:</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p><strong>1.</strong> Verifique o método de pagamento usado pelo apoiador (boleto ou cartão)</p>
              <p><strong>2.</strong> Aplique a taxa correspondente:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Boleto:</strong> Valor Bruto - R$ 3,45</li>
                <li><strong>Cartão Nacional:</strong> Valor Bruto - (3,99% + R$ 0,39)</li>
                <li><strong>Cartão Internacional:</strong> Valor Bruto - (5,99% + R$ 0,39)</li>
              </ul>
              <p><strong>3.</strong> Calcule a taxa da plataforma (10%) sobre o valor líquido após Stripe</p>
              <p><strong>4.</strong> O resultado é o valor a ser depositado para o criador</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
