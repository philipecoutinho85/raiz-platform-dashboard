import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/contexts/TokensContext';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, TrendingDown, RefreshCw, Clock, Filter, Trash2, FileText, CreditCard, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import TokenPurchase from '@/components/TokenPurchase';
import BoletoRefundRequest from '@/components/BoletoRefundRequest';
import PendingPayments from '@/components/PendingPayments';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

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
  payment_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}
import { formatToBrasilia } from '@/lib/dateUtils';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Wallet = () => {
  const { user } = useAuth();
  const { tokens, loading: tokensLoading, fetchTokens } = useTokens();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  
  // Filtros
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Verify pending payments with Stripe
  const verifyPendingPayments = async () => {
    if (!user) return;
    
    try {
      // Get pending purchases
      const { data: pendingPurchases } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .not('pagarme_transaction_id', 'is', null);

      if (!pendingPurchases || pendingPurchases.length === 0) {
        return;
      }

      console.log(`Verifying ${pendingPurchases.length} pending payments...`);
      setVerifyingPayment(true);

      let anyUpdated = false;

      for (const purchase of pendingPurchases) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-token-payment', {
            body: { purchaseId: purchase.id }
          });

          if (error) {
            console.warn('Error verifying payment:', error);
            continue;
          }

          if (data?.status === 'paid' && !data?.alreadyProcessed) {
            anyUpdated = true;
            toast.success(`Pagamento confirmado! ${purchase.amount} tokens creditados.`);
          }
        } catch (err) {
          console.warn('Error verifying purchase:', purchase.id, err);
        }
      }

      if (anyUpdated) {
        // Refresh all data
        await fetchWalletData();
        await fetchTokens();
      }
    } catch (error) {
      console.error('Error verifying pending payments:', error);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleClearPurchaseHistory = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Tem certeza que deseja limpar todo o histórico de compras? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('token_purchases')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Histórico de compras limpo com sucesso!');
      await fetchWalletData();
    } catch (error) {
      console.error('Error clearing purchase history:', error);
      toast.error('Erro ao limpar histórico de compras');
    }
  };

  // Handler para atualizações de compras via realtime
  const handlePurchaseChange = useCallback((payload: any) => {
    console.log('[Wallet] Purchase changed:', payload);
    const updatedPurchase = payload.new;
    
    if (payload.eventType === 'INSERT') {
      setPurchases(prev => [updatedPurchase, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
      
      // Se o pagamento foi confirmado, mostrar toast
      if (updatedPurchase.status === 'paid') {
        toast.success(`Pagamento confirmado! ${updatedPurchase.amount} tokens creditados.`);
      }
    }
  }, []);

  // Handler para novas transações via realtime
  const handleTransactionInsert = useCallback((payload: any) => {
    console.log('[Wallet] New transaction:', payload);
    const newTransaction = payload.new;
    setTransactions(prev => [newTransaction, ...prev].slice(0, 50));
  }, []);

  // Configurar realtime para token_purchases (INSERT e UPDATE)
  useRealtimeChannel({
    channelName: `wallet-purchases-${user?.id || 'none'}`,
    enabled: !!user?.id,
    table: 'token_purchases',
    schema: 'public',
    event: '*',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onEvent: handlePurchaseChange,
  });

  // Configurar realtime para token_transactions (INSERT)
  useRealtimeChannel({
    channelName: `wallet-transactions-${user?.id || 'none'}`,
    enabled: !!user?.id,
    table: 'token_transactions',
    schema: 'public',
    event: 'INSERT',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onEvent: handleTransactionInsert,
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
      // Verify pending payments when page loads
      verifyPendingPayments();
    }
  }, [user]);

  // Check for payment success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (payment === 'success' && sessionId && user) {
      // Verify this specific payment
      supabase.functions.invoke('verify-token-payment', {
        body: { sessionId }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error verifying payment:', error);
          return;
        }
        
        if (data?.status === 'paid' && !data?.alreadyProcessed) {
          toast.success('Pagamento confirmado! Seus tokens foram creditados.');
        } else if (data?.status === 'pending') {
          toast.info('Pagamento pendente. Aguardando confirmação do boleto.');
        }

        // Remove URL params
        window.history.replaceState({}, '', window.location.pathname);
      });
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
      expired: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
      expired: 'Expirado',
      completed: 'Completado',
      rejected: 'Rejeitado'
    };

    const icons: Record<string, React.ReactNode> = {
      paid: <CheckCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
      expired: <XCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string, type: string | null) => {
    if (type === 'boleto') return 'Boleto';
    if (type === 'card' || method === 'stripe') return 'Cartão';
    
    const labels = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      boleto: 'Boleto',
      stripe: 'Cartão'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getPaymentTypeIcon = (type: string | null) => {
    if (type === 'boleto') {
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
    return <CreditCard className="w-4 h-4 text-muted-foreground" />;
  };

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    if (filterType !== 'all' && transaction.transaction_type !== filterType) return false;
    if (filterDate && !transaction.created_at.startsWith(filterDate)) return false;
    return true;
  });

  // Filtrar compras
  const filteredPurchases = purchases.filter(purchase => {
    if (filterStatus !== 'all' && purchase.status !== filterStatus) return false;
    if (filterDate && !purchase.created_at.startsWith(filterDate)) return false;
    return true;
  });

  // Filtrar reembolsos
  const filteredRefunds = refunds.filter(refund => {
    if (filterStatus !== 'all' && refund.status !== filterStatus) return false;
    if (filterDate && !refund.created_at.startsWith(filterDate)) return false;
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-raiz-light">
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
      <main className="container mx-auto px-4 py-8 mb-16 md:mb-0">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-raiz-dark mb-2">Minha Carteira</h1>
          <p className="text-sm md:text-base text-raiz-secondary">Gerencie seus tokens e acompanhe suas transações</p>
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
                  1 token = R$ 1,00 | Total: R$ {tokens.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                {purchases.some(p => p.status === 'pending') && (
                  <Button 
                    onClick={verifyPendingPayments} 
                    variant="default" 
                    size="sm"
                    disabled={verifyingPayment}
                  >
                    {verifyingPayment ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Verificar Pagamentos
                  </Button>
                )}
                <Button onClick={fetchWalletData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boletos Pendentes */}
        <div className="mb-8">
          <PendingPayments />
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="transactions" className="text-xs md:text-sm">Histórico</TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs md:text-sm">Compras</TabsTrigger>
            <TabsTrigger value="refunds" className="text-xs md:text-sm">Reembolsos</TabsTrigger>
            <TabsTrigger value="refund-request" className="text-xs md:text-sm">Solicitar Reembolso</TabsTrigger>
            <TabsTrigger value="buy" className="text-xs md:text-sm">Comprar Tokens</TabsTrigger>
          </TabsList>

          {/* Histórico de Transações */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Histórico de Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="purchase">Compra</SelectItem>
                      <SelectItem value="support">Apoio</SelectItem>
                      <SelectItem value="refund">Reembolso</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    placeholder="Data"
                  />

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : filteredTransactions.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhuma transação encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compras */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Minhas Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    placeholder="Data"
                  />

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                  >
                    Limpar Filtros
                  </Button>

                  <Button 
                    variant="destructive" 
                    onClick={handleClearPurchaseHistory}
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Histórico
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : filteredPurchases.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhuma compra encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {filteredPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {getPaymentTypeIcon(purchase.payment_type)}
                          <div className="flex-1">
                            <p className="font-medium text-raiz-dark">{purchase.amount} tokens</p>
                            <p className="text-sm text-raiz-secondary">
                              {getPaymentMethodLabel(purchase.payment_method, purchase.payment_type)} • R$ {purchase.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-raiz-secondary">
                              Gerado em {formatToBrasilia(purchase.created_at)}
                            </p>
                            {purchase.status === 'paid' && (
                              <p className="text-xs text-green-600">
                                Pago em {formatToBrasilia(purchase.updated_at)}
                              </p>
                            )}
                            {purchase.status === 'expired' && (
                              <p className="text-xs text-red-600">
                                Expirado em {formatToBrasilia(purchase.updated_at)}
                              </p>
                            )}
                            {purchase.status === 'pending' && purchase.expires_at && (
                              <p className={`text-xs ${isPast(new Date(purchase.expires_at)) ? 'text-red-600' : 'text-yellow-600'}`}>
                                {isPast(new Date(purchase.expires_at)) 
                                  ? `Venceu em ${format(new Date(purchase.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                                  : `Vence em ${format(new Date(purchase.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(purchase.status)}
                        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Reembolsos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    placeholder="Data"
                  />

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center text-raiz-secondary">Carregando...</p>
                ) : filteredRefunds.length === 0 ? (
                  <p className="text-center text-raiz-secondary">Nenhum reembolso encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {filteredRefunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-raiz-dark">{refund.amount} tokens</p>
                          <p className="text-sm text-raiz-secondary">{refund.reason}</p>
                          <p className="text-xs text-raiz-secondary">
                            {formatToBrasilia(refund.created_at)}
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

          {/* Solicitar Reembolso */}
          <TabsContent value="refund-request">
            <BoletoRefundRequest />
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