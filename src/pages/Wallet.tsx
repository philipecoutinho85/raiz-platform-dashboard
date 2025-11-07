import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TokenPurchase from '@/components/TokenPurchase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  balance_after: number;
  created_at: string;
}

interface Purchase {
  id: string;
  amount: number;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const { tokens, loading: tokensLoading } = useTokens();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar transações
      const { data: transactionsData } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Buscar compras
      const { data: purchasesData } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Buscar reembolsos
      const { data: refundsData } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTransactions(transactionsData || []);
      setPurchases(purchasesData || []);
      setRefunds(refundsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados da carteira:', error);
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
        return <Coins className="w-4 h-4" />;
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
      credit_card: 'Cartão de Crédito',
      boleto: 'Boleto'
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-raiz-light">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-raiz-dark mb-4">Acesso Restrito</h1>
          <p className="text-raiz-secondary">Você precisa estar logado para acessar sua carteira.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Minha Carteira</h1>
          <p className="text-raiz-secondary">Gerencie seus tokens e acompanhe suas transações</p>
        </div>

        {/* Saldo */}
        <Card className="mb-8 border-raiz-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-raiz-secondary text-sm mb-1">Saldo Disponível</p>
                <div className="flex items-center space-x-3">
                  <Coins className="w-8 h-8 text-raiz-primary" />
                  <span className="text-4xl font-bold text-raiz-dark">
                    {tokensLoading ? '...' : tokens.toLocaleString()}
                  </span>
                  <span className="text-raiz-secondary">tokens</span>
                </div>
                <p className="text-sm text-raiz-secondary mt-2">
                  ≈ R$ {(tokens * 0.10).toFixed(2)}
                </p>
              </div>
              <Button onClick={fetchWalletData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">Histórico</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
            <TabsTrigger value="buy">Comprar Tokens</TabsTrigger>
          </TabsList>

          {/* Histórico de Transações */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhuma transação encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-raiz-accent/5 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {getTransactionIcon(transaction.transaction_type)}
                          <div>
                            <p className="font-medium text-raiz-dark">{transaction.description}</p>
                            <p className="text-sm text-raiz-secondary flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(transaction.created_at).toLocaleString('pt-BR')}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compras */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Compras</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : purchases.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhuma compra encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-raiz-dark">{purchase.amount} tokens</p>
                          <p className="text-sm text-raiz-secondary">
                            {getPaymentMethodLabel(purchase.payment_method)} • R$ {purchase.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-raiz-secondary">
                            {new Date(purchase.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {getStatusBadge(purchase.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reembolsos */}
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle>Reembolsos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : refunds.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhum reembolso encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-raiz-dark">{refund.amount} tokens</p>
                          <p className="text-sm text-raiz-secondary">{refund.reason}</p>
                          <p className="text-xs text-raiz-secondary">
                            {new Date(refund.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {getStatusBadge(refund.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprar Tokens */}
          <TabsContent value="buy">
            <TokenPurchase />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Wallet;