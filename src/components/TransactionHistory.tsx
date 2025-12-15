import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  balance_after: number;
  created_at: string;
  reference_id: string | null;
}

interface Purchase {
  id: string;
  amount: number;
  price: number;
  status: string;
  payment_type: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [transactionsRes, purchasesRes] = await Promise.all([
        supabase
          .from('token_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('token_purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      setTransactions(transactionsRes.data || []);
      setPurchases(purchasesRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'purchase' || type === 'credit') {
      return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
    }
    if (type === 'refund') {
      return <RefreshCw className="h-5 w-5 text-blue-500" />;
    }
    return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
  };

  const getTransactionBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      purchase: { label: 'Compra', variant: 'default' },
      support: { label: 'Apoio', variant: 'secondary' },
      refund: { label: 'Reembolso', variant: 'outline' },
      credit: { label: 'Crédito', variant: 'default' },
    };

    const badge = badges[type] || { label: type, variant: 'outline' };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getPurchaseStatusBadge = (purchase: Purchase) => {
    const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      pending: { 
        label: 'Aguardando', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-yellow-500 text-yellow-600' 
      },
      paid: { 
        label: 'Pago', 
        icon: <CheckCircle className="h-3 w-3" />, 
        className: 'border-green-500 text-green-600' 
      },
      expired: { 
        label: 'Expirado', 
        icon: <XCircle className="h-3 w-3" />, 
        className: 'border-red-500 text-red-600' 
      },
      failed: { 
        label: 'Falhou', 
        icon: <XCircle className="h-3 w-3" />, 
        className: 'border-red-500 text-red-600' 
      },
    };

    const config = statusConfig[purchase.status] || statusConfig.pending;

    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPaymentTypeIcon = (type: string) => {
    if (type === 'boleto') {
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
    return <CreditCard className="h-4 w-4 text-muted-foreground" />;
  };

  const getPaymentTypeLabel = (type: string) => {
    return type === 'boleto' ? 'Boleto' : 'Cartão';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">Movimentações</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma movimentação encontrada.</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type, transaction.amount)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{transaction.description}</span>
                        {getTransactionBadge(transaction.transaction_type)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} tokens
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {transaction.balance_after}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-3">
            {purchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma compra encontrada.</p>
              </div>
            ) : (
              purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                >
                  <div className="flex items-start gap-3">
                    {getPaymentTypeIcon(purchase.payment_type || 'card')}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{purchase.amount} Tokens</span>
                        {getPurchaseStatusBadge(purchase)}
                        <Badge variant="outline" className="text-xs">
                          {getPaymentTypeLabel(purchase.payment_type || 'card')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gerado em {format(new Date(purchase.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {purchase.status === 'paid' && (
                        <p className="text-xs text-green-600">
                          Pago em {format(new Date(purchase.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      {purchase.status === 'expired' && (
                        <p className="text-xs text-red-600">
                          Expirado em {format(new Date(purchase.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      {purchase.status === 'pending' && purchase.expires_at && (
                        <p className="text-xs text-yellow-600">
                          Vence em {format(new Date(purchase.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      R$ {purchase.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;