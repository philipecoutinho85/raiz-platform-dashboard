import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, User, Coins, Calendar, CreditCard, Mail, Phone, FileText, Info, Upload, AlertTriangle, ExternalLink } from 'lucide-react';
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
  rejection_reason?: string;
  proof_of_payment_url?: string;
  source?: 'refund_requests' | 'refunds';
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
  }).format(value);
};

const RefundsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurity();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      // Buscar de refund_requests (nova tabela) e refunds (antiga) para compatibilidade
      const { data: refundRequestsData, error: rrError } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: oldRefundsData, error: orError } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (rrError) console.error('Error fetching refund_requests:', rrError);
      if (orError) console.error('Error fetching refunds:', orError);

      // Combinar dados de ambas as tabelas
      const combinedRefunds = [
        ...(refundRequestsData?.map(r => ({
          id: r.id,
          user_id: r.user_id,
          amount: r.amount,
          reason: r.reason,
          status: r.status === 'solicitado' ? 'pending' : r.status === 'realizado' ? 'completed' : r.status,
          created_at: r.created_at || r.requested_at,
          processed_at: r.completed_at,
          processed_by: r.completed_by,
          rejection_reason: r.rejection_reason,
          proof_of_payment_url: r.proof_of_payment_url,
          transaction_id: r.transaction_id,
          source: 'refund_requests' as const
        })) || []),
        ...(oldRefundsData?.map(r => ({
          ...r,
          source: 'refunds' as const
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const refundsData = combinedRefunds;

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

  const handleApproveClick = (refund: Refund) => {
    setSelectedRefund(refund);
    setProofFile(null);
    setShowApproveModal(true);
  };

  const handleRejectClick = (refund: Refund) => {
    setSelectedRefund(refund);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const uploadProofFile = async (file: File, refundId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${refundId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('refund-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading proof:', error);
      return null;
    }
  };

  const handleApproveRefund = async () => {
    if (!user || !selectedRefund) return;

    if (!proofFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "É necessário anexar um comprovante de depósito para aprovar o estorno.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingProof(true);
      
      // Upload do comprovante
      const proofPath = await uploadProofFile(proofFile, selectedRefund.id);
      if (!proofPath) {
        toast({
          title: "Erro",
          description: "Erro ao enviar comprovante. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar status na tabela correta
      if (selectedRefund.source === 'refund_requests') {
        const { error } = await supabase
          .from('refund_requests')
          .update({
            status: 'realizado',
            completed_at: new Date().toISOString(),
            completed_by: user.id,
            proof_of_payment_url: proofPath
          })
          .eq('id', selectedRefund.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('refunds')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            processed_by: user.id
          })
          .eq('id', selectedRefund.id);

        if (error) throw error;
      }

      // Notificar usuário
      await supabase.from('notifications').insert({
        user_id: selectedRefund.user_id,
        title: 'Reembolso Aprovado',
        message: `Seu reembolso de ${selectedRefund.amount} tokens (${formatCurrency(selectedRefund.amount)}) foi aprovado e processado. O comprovante está disponível no seu histórico.`,
        type: 'refund',
        related_id: selectedRefund.id
      });

      // Enviar email de confirmação
      try {
        await supabase.functions.invoke('send-boleto-refund-email', {
          body: {
            type: 'payment_confirmation',
            refundId: selectedRefund.id
          }
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      // Log admin action
      await logAdminAction(
        'approve_refund',
        'refund',
        selectedRefund.id,
        { amount: selectedRefund.amount, user_id: selectedRefund.user_id, proof_uploaded: true }
      );

      toast({
        title: "Sucesso",
        description: "Reembolso aprovado! O usuário foi notificado por e-mail.",
      });

      setShowApproveModal(false);
      setSelectedRefund(null);
      setProofFile(null);
      fetchRefunds();
    } catch (error) {
      console.error('Error approving refund:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar reembolso.",
        variant: "destructive"
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!user || !selectedRefund) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "É necessário informar o motivo da rejeição.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingAction(true);

      // Atualizar status na tabela correta
      if (selectedRefund.source === 'refund_requests') {
        const { error } = await supabase
          .from('refund_requests')
          .update({
            status: 'rejeitado',
            rejection_reason: rejectionReason,
            analyzed_at: new Date().toISOString(),
            analyzed_by: user.id
          })
          .eq('id', selectedRefund.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('refunds')
          .update({
            status: 'rejected',
            processed_at: new Date().toISOString(),
            processed_by: user.id
          })
          .eq('id', selectedRefund.id);

        if (error) throw error;
      }

      // Notificar usuário com o motivo
      await supabase.from('notifications').insert({
        user_id: selectedRefund.user_id,
        title: 'Solicitação de Reembolso Rejeitada',
        message: `Sua solicitação de reembolso de ${selectedRefund.amount} tokens foi rejeitada. Motivo: ${rejectionReason}`,
        type: 'refund',
        related_id: selectedRefund.id
      });

      // Log admin action
      await logAdminAction(
        'reject_refund',
        'refund',
        selectedRefund.id,
        { amount: selectedRefund.amount, user_id: selectedRefund.user_id, rejection_reason: rejectionReason }
      );

      toast({
        title: "Reembolso Rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });

      setShowRejectModal(false);
      setSelectedRefund(null);
      setRejectionReason('');
      fetchRefunds();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar reembolso.",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getProofUrl = async (path: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('refund-proofs')
        .createSignedUrl(path, 3600); // 1 hour
      return data?.signedUrl || null;
    } catch {
      return null;
    }
  };

  const handleViewProof = async (refund: Refund) => {
    if (!refund.proof_of_payment_url) return;
    
    const url = await getProofUrl(refund.proof_of_payment_url);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o comprovante.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'realizado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
      case 'rejeitado':
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

  // Filtrar apenas pendentes para exibição principal (rejeitados não aparecem)
  const pendingRefunds = refunds.filter(r => r.status === 'pending' || r.status === 'solicitado');
  const completedRefunds = refunds.filter(r => r.status === 'completed' || r.status === 'realizado');

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
            <Button variant="outline" size="sm" onClick={fetchRefunds} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pendentes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Solicitações Pendentes ({pendingRefunds.length})
            </h3>
            {pendingRefunds.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {refund.user_profile?.nome} {refund.user_profile?.sobrenome}
                          </span>
                          <span className="text-xs text-muted-foreground">
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
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRefund(refund)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApproveClick(refund)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleRejectClick(refund)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Aprovados */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Reembolsos Aprovados ({completedRefunds.length})
            </h3>
            {completedRefunds.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum reembolso aprovado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Aprovação</TableHead>
                    <TableHead>Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {refund.user_profile?.nome} {refund.user_profile?.sobrenome}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {refund.user_profile?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{refund.amount} tokens</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(refund.amount)}
                      </TableCell>
                      <TableCell>
                        {refund.processed_at ? formatToBrasilia(refund.processed_at) : '-'}
                      </TableCell>
                      <TableCell>
                        {refund.proof_of_payment_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProof(refund)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedRefund && !showApproveModal && !showRejectModal} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                {selectedRefund.rejection_reason && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Motivo da Rejeição:</strong> {selectedRefund.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm text-muted-foreground">Data da Solicitação</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRefund.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações para pendentes */}
              {(selectedRefund.status === 'pending' || selectedRefund.status === 'solicitado') && (
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowRejectModal(true);
                      setRejectionReason('');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setProofFile(null);
                      setShowApproveModal(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Estorno
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Aprovação com Upload */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aprovar Reembolso
            </DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Valor a ser estornado: <strong>{formatCurrency(selectedRefund.amount)}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="proof" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Comprovante de Depósito *
                </Label>
                <Input
                  ref={fileInputRef}
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {proofFile && (
                  <p className="text-sm text-green-600">
                    ✓ Arquivo selecionado: {proofFile.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Anexe o comprovante de transferência/depósito (imagem ou PDF)
                </p>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  O usuário receberá um e-mail com o comprovante anexado.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveRefund}
              disabled={uploadingProof || !proofFile}
            >
              {uploadingProof ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Aprovação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejeitar Reembolso
            </DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Você está rejeitando o reembolso de <strong>{formatCurrency(selectedRefund.amount)}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Motivo da Rejeição *
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Informe o motivo da rejeição. Este texto será visível para o usuário."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  O usuário será notificado com este motivo.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRefund}
              disabled={processingAction || !rejectionReason.trim()}
            >
              {processingAction ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmar Rejeição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RefundsTab;
