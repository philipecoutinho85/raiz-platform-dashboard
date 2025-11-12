import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatToBrasilia } from '@/lib/dateUtils';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  balance_after: number;
  created_at: string;
  profile?: {
    nome: string;
    sobrenome: string;
    email: string;
  };
}

interface Purchase {
  id: string;
  user_id: string;
  amount: number;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
  profile?: {
    nome: string;
    sobrenome: string;
    email: string;
  };
}

interface Refund {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  profile?: {
    nome: string;
    sobrenome: string;
    email: string;
  };
}

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar transações
      const { data: transactionsData } = await supabase
        .from('token_transactions')
        .select(`
          *,
          profiles!token_transactions_user_id_fkey (nome, sobrenome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Buscar compras
      const { data: purchasesData } = await supabase
        .from('token_purchases')
        .select(`
          *,
          profiles!token_purchases_user_id_fkey (nome, sobrenome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Buscar reembolsos
      const { data: refundsData } = await supabase
        .from('refunds')
        .select(`
          *,
          profiles!refunds_user_id_fkey (nome, sobrenome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      setTransactions(transactionsData?.map((t: any) => ({
        ...t,
        profile: t.profiles
      })) || []);

      setPurchases(purchasesData?.map((p: any) => ({
        ...p,
        profile: p.profiles
      })) || []);

      setRefunds(refundsData?.map((r: any) => ({
        ...r,
        profile: r.profiles
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'support':
        return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
      completed: 'Completado',
      rejected: 'Rejeitado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      pix: 'PIX',
      credit_card: 'Cartão',
      boleto: 'Boleto'
    };
    return labels[method as keyof typeof labels] || method;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transações da Plataforma</CardTitle>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Todas Transações</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            {loading ? (
              <p className="text-center text-raiz-secondary py-8">Carregando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">Nenhuma transação encontrada</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-raiz-accent/5"
                  >
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium text-raiz-dark">
                          {transaction.profile?.nome} {transaction.profile?.sobrenome}
                        </p>
                        <p className="text-sm text-raiz-secondary">{transaction.description}</p>
                        <p className="text-xs text-raiz-secondary flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatToBrasilia(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-raiz-secondary">Saldo: {transaction.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases">
            {loading ? (
              <p className="text-center text-raiz-secondary py-8">Carregando...</p>
            ) : purchases.length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">Nenhuma compra encontrada</p>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-raiz-dark">
                        {purchase.profile?.nome} {purchase.profile?.sobrenome}
                      </p>
                      <p className="text-sm text-raiz-secondary">
                        {purchase.amount} tokens • {getPaymentMethodLabel(purchase.payment_method)} • R$ {purchase.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-raiz-secondary">
                        {formatToBrasilia(purchase.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(purchase.status)}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="refunds">
            {loading ? (
              <p className="text-center text-raiz-secondary py-8">Carregando...</p>
            ) : refunds.length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">Nenhum reembolso encontrado</p>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-raiz-dark">
                        {refund.profile?.nome} {refund.profile?.sobrenome}
                      </p>
                      <p className="text-sm text-raiz-secondary">
                        {refund.amount} tokens • {refund.reason}
                      </p>
                      <p className="text-xs text-raiz-secondary">
                        {formatToBrasilia(refund.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;