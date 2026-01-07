import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, User, Coins, Calendar, CreditCard, Mail, Phone, FileText, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';
import { formatToBrasilia } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Refund {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  user_profile?: {
    nome: string;
    sobrenome: string;
    email: string;
    cpf?: string;
    celular?: string;
  };
  purchase_details?: {
    id: string;
    created_at: string;
    payment_method: string;
    payment_type?: string;
    price: number;
    pagarme_transaction_id?: string;
    updated_at?: string;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value); // 1 token = R$ 1
};

const RefundsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurity();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const { data: refundsData, error } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar profiles e detalhes de compra
      if (refundsData && refundsData.length > 0) {
        const userIds = [...new Set(refundsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome, email, cpf, celular')
          .in('id', userIds);

        // Buscar compras relacionadas (última compra de cada usuário com quantidade igual)
        const { data: purchasesData } = await supabase
          .from('token_purchases')
          .select('*')
          .in('user_id', userIds)
          .eq('status', 'paid')
          .order('created_at', { ascending: false });

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
        
        const refundsWithDetails = refundsData.map(refund => {
          // Encontrar a compra mais recente que corresponde à quantidade do reembolso
          const userPurchases = purchasesData?.filter(p => 
            p.user_id === refund.user_id && p.amount === refund.amount
          );
          const relatedPurchase = userPurchases?.[0];

          return {
            ...refund,
            user_profile: profilesMap.get(refund.user_id),
            purchase_details: relatedPurchase
          };
        });

        setRefunds(refundsWithDetails as Refund[]);
      } else {
        setRefunds([]);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reembolsos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (refundId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      setProcessingAction(true);
      const refund = refunds.find(r => r.id === refundId);
      if (!refund) return;

      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      const { error } = await supabase
        .from('refunds')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', refundId);

      if (error) throw error;

      // NÃO devolver tokens - é estorno em dinheiro na origem do pagamento
      // Os tokens já foram utilizados ou deduzidos, o reembolso é financeiro

      // Notificar usuário sobre aprovação/rejeição
      await supabase.from('notifications').insert({
        user_id: refund.user_id,
        title: action === 'approve' ? 'Reembolso Aprovado' : 'Reembolso Rejeitado',
        message: action === 'approve' 
          ? `Seu reembolso de ${refund.amount} tokens (${formatCurrency(refund.amount)}) foi aprovado. Você receberá um e-mail com os próximos passos para devolução do valor.`
          : `Seu reembolso de ${refund.amount} tokens foi rejeitado. Entre em contato com o suporte para mais informações.`,
        type: 'refund',
        related_id: refundId
      });

      // Log admin action
      await logAdminAction(
        action === 'approve' ? 'approve_refund' : 'reject_refund',
        'refund',
        refundId,
        { amount: refund.amount, user_id: refund.user_id }
      );

      toast({
        title: "Sucesso",
        description: action === 'approve' 
          ? "Reembolso aprovado! O usuário será notificado sobre os próximos passos via e-mail."
          : "Reembolso rejeitado com sucesso!",
      });

      setSelectedRefund(null);
      fetchRefunds();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reembolso.",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    if (reason.startsWith('duplicate_purchase')) return 'Compra duplicada';
    if (reason.startsWith('wrong_amount')) return 'Quantidade errada';
    if (reason.startsWith('did_not_use')) return 'Não utilizou';
    if (reason.startsWith('technical_issue')) return 'Problema técnico';
    if (reason.startsWith('other')) return 'Outro motivo';
    return reason;
  };

  const getPaymentTypeLabel = (type?: string) => {
    switch (type) {
      case 'card': return 'Cartão de Crédito';
      case 'boleto': return 'Boleto Bancário';
      case 'pix': return 'PIX';
      default: return type || 'Não informado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Gerenciar Reembolsos
              </CardTitle>
              <CardDescription>
                Aprovar ou rejeitar solicitações de reembolso (estorno em dinheiro)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRefunds}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="text-center py-8 text-raiz-secondary">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma solicitação de reembolso encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {refund.user_profile?.nome} {refund.user_profile?.sobrenome}
                        </span>
                        <span className="text-xs text-raiz-secondary">
                          {refund.user_profile?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{refund.amount} tokens</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(refund.amount)}
                    </TableCell>
                    <TableCell>
                      {formatToBrasilia(refund.created_at)}
                    </TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {refund.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleRefundAction(refund.id, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRefundAction(refund.id, 'reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes Completo */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes Completos do Reembolso
            </DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex justify-between items-center">
                {getStatusBadge(selectedRefund.status)}
                <span className="text-xs text-muted-foreground">
                  ID: {selectedRefund.id.slice(0, 8)}...
                </span>
              </div>

              {/* Aviso sobre estorno */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Este é um estorno em dinheiro. O valor será devolvido na origem do pagamento, sem devolução de tokens.
                </AlertDescription>
              </Alert>

              {/* Informações do Usuário */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Solicitante
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome Completo</label>
                    <p className="font-medium">
                      {selectedRefund.user_profile?.nome} {selectedRefund.user_profile?.sobrenome}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </label>
                    <p className="text-sm">{selectedRefund.user_profile?.email}</p>
                  </div>
                  {selectedRefund.user_profile?.cpf && (
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> CPF
                      </label>
                      <p className="text-sm font-mono">{selectedRefund.user_profile.cpf}</p>
                    </div>
                  )}
                  {selectedRefund.user_profile?.celular && (
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Celular
                      </label>
                      <p className="text-sm">{selectedRefund.user_profile.celular}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Valores do Reembolso */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Coins className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="text-2xl font-bold">{selectedRefund.amount}</p>
                    <p className="text-xs text-muted-foreground">tokens</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Valor a Estornar</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedRefund.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">1 token = R$ 1,00</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes da Compra Original */}
              {selectedRefund.purchase_details && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Detalhes da Compra Original
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Forma de Pagamento</label>
                      <p className="font-medium">
                        {getPaymentTypeLabel(selectedRefund.purchase_details.payment_type)}
                      </p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Valor Pago</label>
                      <p className="font-medium">{formatCurrency(selectedRefund.purchase_details.price)}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Data da Compra</label>
                      <p className="font-medium">
                        {format(new Date(selectedRefund.purchase_details.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Hora da Compra</label>
                      <p className="font-medium">
                        {format(new Date(selectedRefund.purchase_details.created_at), "HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                    {selectedRefund.purchase_details.updated_at && (
                      <>
                        <div>
                          <label className="text-muted-foreground">Pagamento Confirmado</label>
                          <p className="font-medium">
                            {format(new Date(selectedRefund.purchase_details.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Hora da Confirmação</label>
                          <p className="font-medium">
                            {format(new Date(selectedRefund.purchase_details.updated_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </>
                    )}
                    {selectedRefund.purchase_details.pagarme_transaction_id && (
                      <div className="col-span-2">
                        <label className="text-muted-foreground">ID da Transação (Stripe)</label>
                        <p className="font-mono text-xs break-all bg-white dark:bg-gray-900 p-2 rounded mt-1">
                          {selectedRefund.purchase_details.pagarme_transaction_id}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-muted-foreground">ID da Compra</label>
                      <p className="font-mono text-xs break-all bg-white dark:bg-gray-900 p-2 rounded mt-1">
                        {selectedRefund.purchase_details.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivo e Datas */}
              <div className="space-y-3">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">Motivo do Reembolso</label>
                  <p className="font-medium">{getReasonLabel(selectedRefund.reason)}</p>
                  {selectedRefund.reason.includes(':') && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{selectedRefund.reason.split(':').slice(1).join(':').trim()}"
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm text-muted-foreground">Data da Solicitação</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRefund.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {selectedRefund.processed_at && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <label className="text-sm text-muted-foreground">Processado em</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRefund.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações para pendentes */}
              {selectedRefund.status === 'pending' && (
                <div className="border-t pt-4 space-y-3">
                  <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Ao aprovar, o usuário será notificado automaticamente sobre os próximos passos via e-mail.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleRefundAction(selectedRefund.id, 'reject')}
                      disabled={processingAction}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleRefundAction(selectedRefund.id, 'approve')}
                      disabled={processingAction}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar Estorno
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RefundsTab;
