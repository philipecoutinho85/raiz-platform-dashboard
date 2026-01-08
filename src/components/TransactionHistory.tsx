import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  CreditCard,
  ExternalLink,
  AlertTriangle
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

interface RefundRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  rejection_reason: string | null;
  proof_of_payment_url: string | null;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [transactionsRes, purchasesRes, refundsRes] = await Promise.all([
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
          .limit(50),
        supabase
          .from('refund_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      // refunds might not exist for the user, so don't throw

      setTransactions(transactionsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setRefundRequests(refundsRes.data || []);
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

  const getRefundStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      solicitado: { 
        label: 'Em Análise', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-yellow-500 text-yellow-600' 
      },
      pending: { 
        label: 'Em Análise', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-yellow-500 text-yellow-600' 
      },
      realizado: { 
        label: 'Aprovado', 
        icon: <CheckCircle className="h-3 w-3" />, 
        className: 'border-green-500 text-green-600' 
      },
      completed: { 
        label: 'Aprovado', 
        icon: <CheckCircle className="h-3 w-3" />, 
        className: 'border-green-500 text-green-600' 
      },
      rejeitado: { 
        label: 'Rejeitado', 
        icon: <XCircle className="h-3 w-3" />, 
        className: 'border-red-500 text-red-600' 
      },
      rejected: { 
        label: 'Rejeitado', 
        icon: <XCircle className="h-3 w-3" />, 
        className: 'border-red-500 text-red-600' 
      },
    };

    const config = statusConfig[status] || statusConfig.solicitado;

    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    if (reason.startsWith('duplicate_purchase')) return 'Compra duplicada';
    if (reason.startsWith('wrong_amount')) return 'Quantidade errada';
    if (reason.startsWith('did_not_use')) return 'Não utilizou';
    if (reason.startsWith('technical_issue')) return 'Problema técnico';
    if (reason.startsWith('other')) return 'Outro motivo';
    return reason;
  };

  const handleViewProof = async (proofPath: string) => {
    try {
      const { data } = await supabase.storage
        .from('refund-proofs')
        .createSignedUrl(proofPath, 3600);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o comprovante.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o comprovante.",
        variant: "destructive"
      });
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">Movimentações</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="refunds">
              Reembolsos
              {refundRequests.length > 0 && (
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {refundRequests.length}
                </span>
              )}
            </TabsTrigger>
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

          <TabsContent value="refunds" className="space-y-3">
            {refundRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma solicitação de reembolso encontrada.</p>
              </div>
            ) : (
              refundRequests.map((refund) => (
                <div
                  key={refund.id}
                  className="flex flex-col p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{refund.amount} Tokens</span>
                          {getRefundStatusBadge(refund.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {format(new Date(refund.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Motivo: {getReasonLabel(refund.reason)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(refund.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Rejeição */}
                  {(refund.status === 'rejeitado' || refund.status === 'rejected') && refund.rejection_reason && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Motivo da rejeição:</strong> {refund.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Aprovado com comprovante */}
                  {(refund.status === 'realizado' || refund.status === 'completed') && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Reembolso processado
                          {refund.completed_at && (
                            <span className="font-normal ml-1">
                              em {format(new Date(refund.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </span>
                      </div>
                      {refund.proof_of_payment_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-500 hover:bg-green-100"
                          onClick={() => handleViewProof(refund.proof_of_payment_url!)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver Comprovante
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Pendente */}
                  {(refund.status === 'solicitado' || refund.status === 'pending') && (
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Sua solicitação está em análise. Prazo: até 5 dias úteis.
                      </span>
                    </div>
                  )}
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
