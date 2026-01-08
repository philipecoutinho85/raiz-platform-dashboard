import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatToBrasilia } from '@/lib/dateUtils';
import {
  RefreshCw, Search, FileText, Clock, CheckCircle, XCircle,
  Eye, Upload, AlertTriangle, DollarSign, Calendar, User,
  Building2, CreditCard, Loader2, Download, Send, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefundRequest {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  reason: string;
  status: string;
  bank_account_holder: string;
  bank_cpf_cnpj: string;
  bank_name: string;
  bank_account_agency: string;
  bank_account_number: string;
  bank_account_type: string;
  proof_of_payment_url: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  requested_at: string;
  analyzed_at: string | null;
  completed_at: string | null;
  analyzed_by: string | null;
  completed_by: string | null;
  // Joined data
  user_name?: string;
  user_email?: string;
  user_cpf?: string;
  user_phone?: string;
  purchase_amount?: number;
  purchase_created_at?: string;
  purchase_updated_at?: string;
}

interface DashboardStats {
  pending: number;
  pendingAmount: number;
  analyzing: number;
  analyzingAmount: number;
  completedMonth: number;
  completedMonthAmount: number;
  approved: number;
  approvedAmount: number;
}

const BoletoRefundsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    pendingAmount: 0,
    analyzing: 0,
    analyzingAmount: 0,
    completedMonth: 0,
    completedMonthAmount: 0,
    approved: 0,
    approvedAmount: 0
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      // Fetch refund requests with user and purchase data
      const { data: refundsData, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      if (!refundsData || refundsData.length === 0) {
        setRefunds([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs and transaction IDs
      const userIds = [...new Set(refundsData.map(r => r.user_id))];
      const transactionIds = [...new Set(refundsData.map(r => r.transaction_id))];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email, cpf, celular')
        .in('id', userIds);

      // Fetch token purchases
      const { data: purchases } = await supabase
        .from('token_purchases')
        .select('id, amount, created_at, updated_at')
        .in('id', transactionIds);

      // Map data together
      const enrichedRefunds = refundsData.map(refund => {
        const profile = profiles?.find(p => p.id === refund.user_id);
        const purchase = purchases?.find(p => p.id === refund.transaction_id);
        return {
          ...refund,
          user_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Desconhecido',
          user_email: profile?.email || '',
          user_cpf: profile?.cpf || '',
          user_phone: profile?.celular || '',
          purchase_amount: purchase?.amount || 0,
          purchase_created_at: purchase?.created_at || null,
          purchase_updated_at: purchase?.updated_at || null
        };
      });

      setRefunds(enrichedRefunds);
      calculateStats(enrichedRefunds);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as solicitações de reembolso.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: RefundRequest[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pending = data.filter(r => r.status === 'solicitado');
    const analyzing = data.filter(r => r.status === 'em_analise');
    const approved = data.filter(r => r.status === 'aprovado');
    const completedMonth = data.filter(r => 
      r.status === 'realizado' && 
      new Date(r.completed_at || '') >= firstDayOfMonth
    );

    setStats({
      pending: pending.length,
      pendingAmount: pending.reduce((sum, r) => sum + Number(r.amount), 0),
      analyzing: analyzing.length,
      analyzingAmount: analyzing.reduce((sum, r) => sum + Number(r.amount), 0),
      completedMonth: completedMonth.length,
      completedMonthAmount: completedMonth.reduce((sum, r) => sum + Number(r.amount), 0),
      approved: approved.length,
      approvedAmount: approved.reduce((sum, r) => sum + Number(r.amount), 0)
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      solicitado: { label: 'Solicitado', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      em_analise: { label: 'Em Análise', variant: 'outline', icon: <Eye className="w-3 h-3" /> },
      aprovado: { label: 'Aprovado', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      realizado: { label: 'Realizado', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejeitado: { label: 'Rejeitado', variant: 'destructive', icon: <XCircle className="w-3 h-3" /> }
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: null };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCpfCnpj = (value: string) => {
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length === 14) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const handleStatusChange = async (refundId: string, newStatus: string) => {
    if (!user) return;
    setActionLoading(true);

    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'em_analise') {
        updates.analyzed_at = new Date().toISOString();
        updates.analyzed_by = user.id;
      }

      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }

      if (newStatus === 'rejeitado' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('refund_requests')
        .update(updates)
        .eq('id', refundId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: `refund_status_change_${newStatus}`,
        target_type: 'refund_request',
        target_id: refundId,
        details: { previous_status: selectedRefund?.status, new_status: newStatus }
      });

      // Notify user
      if (selectedRefund) {
        await supabase.from('notifications').insert({
          user_id: selectedRefund.user_id,
          title: newStatus === 'rejeitado' ? 'Reembolso Rejeitado' : 'Atualização de Reembolso',
          message: newStatus === 'rejeitado' 
            ? `Sua solicitação de reembolso de ${formatCurrency(selectedRefund.amount)} foi rejeitada. Motivo: ${rejectionReason}`
            : `Sua solicitação de reembolso está ${newStatus === 'em_analise' ? 'em análise' : newStatus === 'aprovado' ? 'aprovada e aguardando pagamento' : 'atualizada'}.`,
          type: 'refund_update',
          related_id: refundId
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso.'
      });

      setDetailsOpen(false);
      setAdminNotes('');
      setRejectionReason('');
      fetchRefunds();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRefund || !user) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas PDF, JPEG, JPG e PNG são aceitos.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingProof(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedRefund.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('refund-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update refund request with proof URL
      const { error: updateError } = await supabase
        .from('refund_requests')
        .update({
          proof_of_payment_url: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRefund.id);

      if (updateError) throw updateError;

      toast({
        title: 'Comprovante enviado',
        description: 'O comprovante foi anexado com sucesso.'
      });

      // Update local state
      setSelectedRefund({
        ...selectedRefund,
        proof_of_payment_url: fileName
      });

      fetchRefunds();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({
        title: 'Erro ao enviar comprovante',
        description: 'Não foi possível enviar o arquivo.',
        variant: 'destructive'
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedRefund || !user || !selectedRefund.proof_of_payment_url) {
      toast({
        title: 'Comprovante necessário',
        description: 'É necessário anexar o comprovante antes de confirmar o pagamento.',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'realizado',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          admin_notes: adminNotes || selectedRefund.admin_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRefund.id);

      if (error) throw error;

      // Send email with attachment
      try {
        await supabase.functions.invoke('send-boleto-refund-email', {
          body: {
            type: 'payment_confirmation',
            refundId: selectedRefund.id
          }
        });
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError);
        toast({
          title: 'Aviso',
          description: 'Pagamento confirmado, mas houve um erro ao enviar o e-mail.',
          variant: 'default'
        });
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: 'refund_payment_confirmed',
        target_type: 'refund_request',
        target_id: selectedRefund.id,
        details: { amount: selectedRefund.amount }
      });

      // Notify user
      await supabase.from('notifications').insert({
        user_id: selectedRefund.user_id,
        title: 'Reembolso Realizado',
        message: `Seu reembolso de ${formatCurrency(selectedRefund.amount)} foi processado. Confira seu e-mail para mais detalhes e comprovante.`,
        type: 'refund_completed',
        related_id: selectedRefund.id
      });

      toast({
        title: 'Pagamento confirmado!',
        description: 'O usuário será notificado via e-mail com o comprovante em anexo.'
      });

      setDetailsOpen(false);
      setAdminNotes('');
      fetchRefunds();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pagamento.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter refunds
  const filteredRefunds = refunds.filter(refund => {
    // Status filter
    if (filterStatus !== 'all' && refund.status !== filterStatus) return false;

    // Period filter
    if (filterPeriod !== 'all') {
      const requestedAt = new Date(refund.requested_at);
      const now = new Date();
      
      if (filterPeriod === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (requestedAt < today) return false;
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (requestedAt < weekAgo) return false;
      } else if (filterPeriod === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (requestedAt < monthAgo) return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        refund.user_name?.toLowerCase().includes(search) ||
        refund.user_email?.toLowerCase().includes(search) ||
        refund.id.toLowerCase().includes(search) ||
        refund.bank_account_holder.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const openDetails = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setAdminNotes(refund.admin_notes || '');
    setRejectionReason(refund.rejection_reason || '');
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solicitações Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Análise</p>
                <p className="text-2xl font-bold">{stats.analyzing}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.analyzingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Pagamento</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.approvedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Realizados (Mês)</p>
                <p className="text-2xl font-bold">{stats.completedMonth}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.completedMonthAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Solicitações de Reembolso de Boleto
              </CardTitle>
              <CardDescription>Gerencie as solicitações de reembolso</CardDescription>
            </div>
            <Button onClick={fetchRefunds} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="solicitado">Solicitado</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-mono text-xs">
                        {refund.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{refund.user_name}</p>
                          <p className="text-xs text-muted-foreground">{refund.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(refund.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatToBrasilia(refund.requested_at, 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(refund)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRefund && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Solicitação #{selectedRefund.id.substring(0, 8)}
                  {getStatusBadge(selectedRefund.status)}
                </DialogTitle>
                <DialogDescription>
                  Detalhes completos da solicitação de reembolso
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedRefund.user_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium">{selectedRefund.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{formatCpfCnpj(selectedRefund.user_cpf || '')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedRefund.user_phone}</p>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Dados da Compra Original
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium text-lg">{formatCurrency(selectedRefund.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tokens</p>
                      <p className="font-medium">{selectedRefund.purchase_amount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data da Compra</p>
                      <p className="font-medium">
                        {selectedRefund.purchase_created_at 
                          ? formatToBrasilia(selectedRefund.purchase_created_at, "dd/MM/yyyy 'às' HH:mm")
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confirmação</p>
                      <p className="font-medium">
                        {selectedRefund.purchase_updated_at 
                          ? formatToBrasilia(selectedRefund.purchase_updated_at, "dd/MM/yyyy 'às' HH:mm")
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Dados Bancários para Reembolso
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Titular</p>
                      <p className="font-medium">{selectedRefund.bank_account_holder}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{formatCpfCnpj(selectedRefund.bank_cpf_cnpj)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Banco</p>
                      <p className="font-medium">{selectedRefund.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agência</p>
                      <p className="font-medium">{selectedRefund.bank_account_agency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conta</p>
                      <p className="font-medium">{selectedRefund.bank_account_number}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {selectedRefund.bank_account_type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Motivo da Solicitação</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedRefund.reason}</p>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedRefund.status === 'rejeitado' && selectedRefund.rejection_reason && (
                  <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                    <h4 className="font-semibold mb-2 text-destructive">Motivo da Rejeição</h4>
                    <p className="text-sm">{selectedRefund.rejection_reason}</p>
                  </div>
                )}

                {/* Admin Notes */}
                {(selectedRefund.status === 'solicitado' || selectedRefund.status === 'em_analise' || selectedRefund.status === 'aprovado') && (
                  <div className="space-y-2">
                    <Label>Notas Administrativas</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Adicione observações internas..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Rejection Input */}
                {(selectedRefund.status === 'solicitado' || selectedRefund.status === 'em_analise') && (
                  <div className="space-y-2">
                    <Label>Motivo da Rejeição (se aplicável)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Informe o motivo caso vá rejeitar..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Proof Upload (only for approved status) */}
                {selectedRefund.status === 'aprovado' && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Comprovante de Pagamento
                    </h4>
                    
                    {selectedRefund.proof_of_payment_url ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-800">Comprovante anexado</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = supabase.storage
                              .from('refund-proofs')
                              .getPublicUrl(selectedRefund.proof_of_payment_url!).data.publicUrl;
                            window.open(url, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingProof ? (
                          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Clique ou arraste para enviar o comprovante
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, JPEG, JPG ou PNG (máx. 10MB)
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Existing Admin Notes (read-only for completed/rejected) */}
                {(selectedRefund.status === 'realizado' || selectedRefund.status === 'rejeitado') && selectedRefund.admin_notes && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Notas Administrativas</h4>
                    <p className="text-sm">{selectedRefund.admin_notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {/* Actions based on status */}
                {selectedRefund.status === 'solicitado' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedRefund.id, 'rejeitado')}
                      disabled={actionLoading || !rejectionReason}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedRefund.id, 'em_analise')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                      Analisar
                    </Button>
                  </>
                )}

                {selectedRefund.status === 'em_analise' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedRefund.id, 'rejeitado')}
                      disabled={actionLoading || !rejectionReason}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedRefund.id, 'aprovado')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Aprovar
                    </Button>
                  </>
                )}

                {selectedRefund.status === 'aprovado' && (
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading || !selectedRefund.proof_of_payment_url}
                    className="w-full sm:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Confirmar Pagamento
                  </Button>
                )}

                {(selectedRefund.status === 'realizado' || selectedRefund.status === 'rejeitado') && (
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoletoRefundsTab;
