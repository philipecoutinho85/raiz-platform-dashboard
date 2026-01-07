import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, User, Coins, Calendar } from 'lucide-react';
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

      // Buscar profiles separadamente
      if (refundsData && refundsData.length > 0) {
        const userIds = [...new Set(refundsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome, email')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
        
        const refundsWithProfiles = refundsData.map(refund => ({
          ...refund,
          user_profile: profilesMap.get(refund.user_id)
        }));

        setRefunds(refundsWithProfiles as Refund[]);
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

      // Se aprovando, creditar tokens de volta
      if (action === 'approve') {
        const { data: currentTokens, error: fetchError } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', refund.user_id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const newBalance = (currentTokens?.balance || 0) + refund.amount;

        const { error: updateError } = await supabase
          .from('user_tokens')
          .upsert({
            user_id: refund.user_id,
            balance: newBalance,
            updated_at: new Date().toISOString()
          });

        if (updateError) throw updateError;

        // Registrar transação
        await supabase.from('token_transactions').insert({
          user_id: refund.user_id,
          amount: refund.amount,
          balance_after: newBalance,
          transaction_type: 'refund',
          description: `Reembolso de ${refund.amount} tokens aprovado`,
          reference_id: refundId
        });
      }

      // Log admin action
      await logAdminAction(
        action === 'approve' ? 'approve_refund' : 'reject_refund',
        'refund',
        refundId,
        { amount: refund.amount, user_id: refund.user_id }
      );

      toast({
        title: "Sucesso",
        description: `Reembolso ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`,
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
                Aprovar ou rejeitar solicitações de reembolso
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

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Reembolso
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

              {/* Informações do Usuário */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Solicitante
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <p className="font-medium">
                      {selectedRefund.user_profile?.nome} {selectedRefund.user_profile?.sobrenome}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedRefund.user_profile?.email}</p>
                  </div>
                </div>
              </div>

              {/* Valores */}
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
                    <p className="text-sm text-muted-foreground mb-2">Valor em R$</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedRefund.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">1 token = R$ 1,00</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Motivo</label>
                  <p className="font-medium">{getReasonLabel(selectedRefund.reason)}</p>
                  {selectedRefund.reason.includes(':') && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRefund.reason.split(':').slice(1).join(':').trim()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm text-muted-foreground">Data da Solicitação</label>
                    <p className="text-sm">
                      {format(new Date(selectedRefund.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {selectedRefund.processed_at && (
                  <div>
                    <label className="text-sm text-muted-foreground">Processado em</label>
                    <p className="text-sm">
                      {format(new Date(selectedRefund.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações para pendentes */}
              {selectedRefund.status === 'pending' && (
                <div className="border-t pt-4 flex justify-end gap-2">
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
                    Aprovar Reembolso
                  </Button>
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
