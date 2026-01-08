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

interface RefundStatusHistory {
  id: string;
  new_status: string;
  notes: string | null;
  proof_url: string | null;
  created_at: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refundHistories, setRefundHistories] = useState<Record<string, RefundStatusHistory[]>>({});
  const [loadingHistories, setLoadingHistories] = useState<Record<string, boolean>>({});
  const [expandedRefund, setExpandedRefund] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchRefundHistory = async (refundId: string) => {
    setLoadingHistories(prev => ({ ...prev, [refundId]: true }));
    try {
      const { data, error } = await supabase
        .from('refund_status_history')
        .select('id, new_status, notes, proof_url, created_at')
        .eq('refund_request_id', refundId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setRefundHistories(prev => ({ ...prev, [refundId]: data }));
      }
    } catch (error) {
      console.error('Error fetching refund history:', error);
    } finally {
      setLoadingHistories(prev => ({ ...prev, [refundId]: false }));
    }
  };

  const toggleRefundHistory = async (refundId: string) => {
    if (expandedRefund === refundId) {
      setExpandedRefund(null);
    } else {
      setExpandedRefund(refundId);
      if (!refundHistories[refundId]) {
        await fetchRefundHistory(refundId);
      }
    }
  };

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
        label: 'Solicitado', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-orange-500 text-orange-600' 
      },
      pending: { 
        label: 'Solicitado', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-orange-500 text-orange-600' 
      },
      em_analise: { 
        label: 'Em Análise', 
        icon: <Clock className="h-3 w-3" />, 
        className: 'border-yellow-500 text-yellow-600' 
      },
      aprovado: { 
        label: 'Aprovado', 
        icon: <CheckCircle className="h-3 w-3" />, 
        className: 'border-blue-500 text-blue-600' 
      },
      realizado: { 
        label: 'Realizado', 
        icon: <CheckCircle className="h-3 w-3" />, 
        className: 'border-green-500 text-green-600' 
      },
      completed: { 
        label: 'Realizado', 
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

  const getHistoryStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      solicitado: 'Solicitação Enviada',
      pending: 'Solicitação Enviada',
      em_analise: 'Em Análise',
      aprovado: 'Reembolso Aprovado',
      realizado: 'Pagamento Realizado',
      completed: 'Pagamento Realizado',
      rejeitado: 'Solicitação Rejeitada',
      rejected: 'Solicitação Rejeitada',
    };
    return labels[status] || status;
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

                  {/* Aprovado aguardando pagamento */}
                  {refund.status === 'aprovado' && (
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Reembolso aprovado. Aguardando processamento do pagamento.
                      </span>
                    </div>
                  )}

                  {/* Concluído com comprovante */}
                  {(refund.status === 'realizado' || refund.status === 'completed') && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Reembolso realizado
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

                  {/* Solicitado */}
                  {refund.status === 'solicitado' && (
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-900">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Sua solicitação foi recebida e está aguardando análise.
                      </span>
                    </div>
                  )}

                  {/* Em Análise */}
                  {refund.status === 'em_analise' && (
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Sua solicitação está sendo analisada pela equipe. Prazo: até 5 dias úteis.
                      </span>
                    </div>
                  )}

                  {/* Botão para ver histórico */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => toggleRefundHistory(refund.id)}
                  >
                    {expandedRefund === refund.id ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Ocultar Histórico
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Ver Histórico Completo
                      </>
                    )}
                  </Button>

                  {/* Histórico expandido */}
                  {expandedRefund === refund.id && (
                    <div className="border-t pt-3 mt-2">
                      <h4 className="text-sm font-medium mb-2">Histórico de Status</h4>
                      {loadingHistories[refund.id] ? (
                        <div className="flex justify-center py-3">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      ) : refundHistories[refund.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {/* Evento inicial de solicitação */}
                          <div className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3 pb-2">
                            <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <div>
                              <p className="font-medium">Solicitação Enviada</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(refund.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          {/* Histórico de mudanças */}
                          {refundHistories[refund.id].map((history) => (
                            <div key={history.id} className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3 pb-2">
                              {history.new_status === 'rejeitado' || history.new_status === 'rejected' ? (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              ) : history.new_status === 'realizado' || history.new_status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              ) : history.new_status === 'aprovado' ? (
                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium">{getHistoryStatusLabel(history.new_status)}</p>
                                {history.notes && (
                                  <p className="text-muted-foreground">{history.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(history.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {history.proof_url && (
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="p-0 h-auto text-xs"
                                    onClick={() => handleViewProof(history.proof_url!)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Ver comprovante
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhum histórico adicional
                        </p>
                      )}
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
