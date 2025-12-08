import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Check, X, DollarSign, Eye, MessageSquare, XCircle, Filter, AlertTriangle } from 'lucide-react';
import { formatToBrasilia } from '@/lib/dateUtils';
import RejectWithdrawalModal from './RejectWithdrawalModal';
import { WithdrawalChat } from '@/components/WithdrawalChat';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  requested_amount: number;
  admin_fee: number;
  net_amount: number;
  status: string;
  payment_method: string;
  pix_key?: string;
  pix_key_type?: string;
  bank_account: any;
  requested_at: string;
  rejection_reason?: string;
  chat_active?: boolean;
  chat_closed_at?: string;
  total_messages?: number;
  unread_messages?: number;
  last_activity?: string;
  projects: {
    title: string;
  };
  profiles?: {
    nome: string;
    email: string;
  };
}

export const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [correctionMessage, setCorrectionMessage] = useState('');
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWithdrawals();
    
    // Realtime subscription para novas mensagens
    const channel = supabase
      .channel('withdrawal_messages_admin')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'withdrawal_messages',
        filter: 'sender_type=eq.user'
      }, () => {
        toast.info('Nova mensagem recebida em resgate!');
        fetchWithdrawals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withdrawals, statusFilter, searchTerm]);

  const applyFilters = () => {
    let filtered = [...withdrawals];

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        w.bank_account?.holder_name?.toLowerCase().includes(search) ||
        w.bank_account?.document?.includes(search) ||
        w.projects?.title?.toLowerCase().includes(search) ||
        w.profiles?.nome?.toLowerCase().includes(search)
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos projetos, usuários e contagem de mensagens não lidas
      const withdrawalsWithDetails = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const [{ data: project }, { data: profile }, { count: unreadCount }] = await Promise.all([
            supabase
              .from('projects')
              .select('title')
              .eq('id', withdrawal.project_id)
              .single(),
            supabase
              .from('profiles')
              .select('nome, email')
              .eq('id', withdrawal.user_id)
              .single(),
            supabase
              .from('withdrawal_messages')
              .select('*', { count: 'exact', head: true })
              .eq('withdrawal_id', withdrawal.id)
              .eq('sender_type', 'user')
              .eq('is_read', false)
          ]);

          return { 
            ...withdrawal, 
            projects: project,
            profiles: profile,
            unread_messages: unreadCount || 0
          };
        })
      );

      setWithdrawals(withdrawalsWithDetails as Withdrawal[]);
    } catch (error) {
      console.error('Erro ao buscar resgates:', error);
      toast.error('Erro ao carregar resgates');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: { withdrawalId, action: 'approve' }
      });

      if (error) throw error;

      // Verificar se requer processamento manual
      if (data?.requiresManual) {
        toast.warning(data.message || 'Resgate marcado para processamento manual', {
          duration: 10000, // 10 segundos para ler a mensagem
        });
      } else if (data?.success) {
        toast.success(data?.message || '✅ Resgate aprovado! Transferência criada no Pagar.me.', {
          duration: 8000,
        });
      } else {
        toast.error(data?.error || 'Erro desconhecido ao processar resgate');
      }
      
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao aprovar resgate:', error);
      toast.error('Erro ao processar resgate');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim() || !rejectionCategory) {
      toast.error('Informe a categoria e o motivo da rejeição');
      return;
    }

    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('process-withdrawal', {
        body: { 
          withdrawalId: selectedWithdrawal.id, 
          action: 'reject',
          rejectionReason: `[${rejectionCategory}] ${rejectionReason}`,
          allowRetry: rejectionCategory === 'dados_incorretos'
        }
      });

      if (error) throw error;

      toast.success(
        rejectionCategory === 'dados_incorretos' 
          ? 'Resgate rejeitado. Usuário poderá corrigir e solicitar novamente.'
          : 'Resgate rejeitado'
      );
      setShowRejectDialog(false);
      setRejectionReason('');
      setRejectionCategory('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao rejeitar resgate:', error);
      toast.error('Erro ao processar rejeição');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedWithdrawal || !correctionMessage.trim() || correctionMessage.length < 30) {
      toast.error('Mensagem deve ter no mínimo 30 caracteres');
      return;
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Inserir mensagem
      const { error: messageError } = await supabase
        .from('withdrawal_messages')
        .insert({
          withdrawal_id: selectedWithdrawal.id,
          sender_id: user?.id,
          sender_type: 'admin',
          message: correctionMessage,
          is_read: false
        });

      if (messageError) throw messageError;

      // Atualizar status do resgate
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'pending_correction',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (updateError) throw updateError;

      // Criar notificação para o usuário
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedWithdrawal.user_id,
          type: 'withdrawal_correction',
          title: 'Correção Necessária no Resgate',
          message: 'O administrador solicitou correção dos seus dados bancários. Acesse o projeto para ver os detalhes.',
          related_id: selectedWithdrawal.id
        });

      toast.success('Solicitação de correção enviada!');
      setShowCorrectionDialog(false);
      setCorrectionMessage('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao solicitar correção:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseChat = async (withdrawalId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          chat_active: false,
          chat_closed_at: new Date().toISOString(),
          chat_closed_by: user?.id
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast.success('Chat encerrado com sucesso');
      setShowChatDialog(false);
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
      toast.error('Erro ao encerrar chat');
    }
  };

  const handleSyncPastWithdrawals = async () => {
    try {
      setProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      toast.info('Iniciando sincronização de resgates antigos...');

      const { data, error } = await supabase.functions.invoke('sync-past-withdrawals', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        if (data.synced > 0) {
          fetchWithdrawals(); // Atualizar lista
        }
        if (data.errors && data.errors.length > 0) {
          console.error('Erros na sincronização:', data.errors);
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar resgates:', error);
      toast.error(error.message || 'Erro ao sincronizar resgates antigos');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusCounts = () => {
    return {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending' || w.status === 'verification_pending').length,
      pending_correction: withdrawals.filter(w => w.status === 'pending_correction').length,
      unread_messages: withdrawals.reduce((sum, w) => sum + (w.unread_messages || 0), 0)
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      verification_pending: 'secondary',
      pending_correction: 'default',
      pending_manual: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      verification_pending: 'Aguardando Verificação',
      pending_correction: 'Pendente de Correção',
      pending_manual: 'Processamento Manual',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Solicitações de Resgate
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="secondary">Total: {counts.total}</Badge>
              <Badge variant="destructive">Aguardando: {counts.pending}</Badge>
              <Badge variant="default">Correção: {counts.pending_correction}</Badge>
              {counts.unread_messages > 0 && (
                <Badge variant="outline" className="bg-blue-50">
                  💬 {counts.unread_messages} não lidas
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Botão de Sincronização de Resgates Antigos */}
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Tem resgates aprovados que não aparecem no Pagar.me? Sincronize-os agora.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncPastWithdrawals}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  'Sincronizar Resgates Antigos'
                )}
              </Button>
            </AlertDescription>
          </Alert>

          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="verification_pending">Aguardando Verificação</SelectItem>
                  <SelectItem value="pending_correction">Pendente de Correção</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome, CPF, projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredWithdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {withdrawals.length === 0 
                ? 'Nenhuma solicitação de resgate encontrada'
                : 'Nenhum resultado para os filtros aplicados'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Método</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className={withdrawal.unread_messages && withdrawal.unread_messages > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {withdrawal.projects?.title}
                        {withdrawal.unread_messages && withdrawal.unread_messages > 0 && (
                          <Badge variant="destructive" className="animate-pulse text-xs">
                            {withdrawal.unread_messages} {withdrawal.unread_messages === 1 ? 'msg' : 'msgs'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{withdrawal.profiles?.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.profiles?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {withdrawal.payment_method === 'bank_transfer' ? '🏦 TED' : '⚡ PIX'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {withdrawal.bank_account?.document}
                    </TableCell>
                    <TableCell className="text-xs">
                      {withdrawal.bank_account?.bank_code || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {withdrawal.bank_account?.branch ? `${withdrawal.bank_account.branch}-${withdrawal.bank_account.branch_check_digit || '0'}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {withdrawal.bank_account?.account ? `${withdrawal.bank_account.account}-${withdrawal.bank_account.account_check_digit}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {withdrawal.bank_account?.account_type === 'checking' ? 'Corrente' : withdrawal.bank_account?.account_type === 'savings' ? 'Poupança' : '-'}
                    </TableCell>
                    <TableCell>R$ {Number(withdrawal.requested_amount).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(withdrawal.admin_fee).toFixed(2)}</TableCell>
                    <TableCell className="font-bold">
                      R$ {Number(withdrawal.net_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {formatToBrasilia(withdrawal.requested_at, 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {(withdrawal.status === 'pending' || withdrawal.status === 'verification_pending' || withdrawal.status === 'pending_manual') && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={processing}
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowRejectDialog(true);
                              }}
                              disabled={processing}
                              title="Rejeitar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowCorrectionDialog(true);
                              }}
                              disabled={processing}
                              title="Solicitar Correção"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(withdrawal.status === 'rejected' || withdrawal.status === 'pending_correction') && withdrawal.chat_active && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowChatDialog(true);
                              }}
                              title="Ver Chat"
                              className="relative"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {withdrawal.unread_messages && withdrawal.unread_messages > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                >
                                  {withdrawal.unread_messages}
                                </Badge>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCloseChat(withdrawal.id)}
                              title="Encerrar Chat"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Rejeição */}
      <RejectWithdrawalModal
        isOpen={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        withdrawalId={selectedWithdrawal?.id || null}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        rejectionCategory={rejectionCategory}
        setRejectionCategory={setRejectionCategory}
        onReject={handleReject}
        onCancel={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
          setRejectionCategory('');
          setSelectedWithdrawal(null);
        }}
        loading={processing}
      />

      {/* Modal de Solicitar Correção */}
      {selectedWithdrawal && (
        <Dialog open={showCorrectionDialog} onOpenChange={(open) => {
          setShowCorrectionDialog(open);
          if (!open) {
            setCorrectionMessage('');
            setSelectedWithdrawal(null);
          }
        }}>
          <DialogContent className="max-w-2xl z-[100]">
            <DialogHeader>
              <DialogTitle>Solicitar Correção de Dados</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para o usuário solicitando correção dos dados bancários
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dados Bancários Atuais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dados Bancários Atuais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Titular:</span>
                      <p>{selectedWithdrawal.bank_account?.holder_name}</p>
                    </div>
                    <div>
                      <span className="font-medium">CPF:</span>
                      <p className="font-mono">{selectedWithdrawal.bank_account?.document}</p>
                    </div>
                    <div>
                      <span className="font-medium">Banco:</span>
                      <p>{selectedWithdrawal.bank_account?.bank_code}</p>
                    </div>
                    <div>
                      <span className="font-medium">Agência:</span>
                      <p>{selectedWithdrawal.bank_account?.branch}-{selectedWithdrawal.bank_account?.branch_check_digit}</p>
                    </div>
                    <div>
                      <span className="font-medium">Conta:</span>
                      <p>{selectedWithdrawal.bank_account?.account}-{selectedWithdrawal.bank_account?.account_check_digit}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p>{selectedWithdrawal.bank_account?.account_type === 'checking' ? 'Corrente' : 'Poupança'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagem */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mensagem para o usuário *
                </label>
                <Textarea
                  placeholder="Explique o que precisa ser corrigido nos dados bancários..."
                  value={correctionMessage}
                  onChange={(e) => setCorrectionMessage(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {correctionMessage.length}/30 caracteres (mínimo 30)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCorrectionDialog(false);
                  setCorrectionMessage('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestCorrection}
                disabled={processing || correctionMessage.length < 30}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedWithdrawal && showChatDialog && (
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chat do Resgate</DialogTitle>
              <DialogDescription>
                Converse com o usuário sobre o resgate rejeitado
              </DialogDescription>
            </DialogHeader>
            <WithdrawalChat 
              withdrawalId={selectedWithdrawal.id}
              chatActive={selectedWithdrawal.chat_active !== false}
              chatClosedAt={selectedWithdrawal.chat_closed_at}
              isAdminView={true}
              withdrawalUserId={selectedWithdrawal.user_id}
            />
            {selectedWithdrawal.chat_active && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleCloseChat(selectedWithdrawal.id)}
                >
                  Encerrar Chat
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {selectedWithdrawal && !showRejectDialog && !showChatDialog && !showCorrectionDialog && (
        <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Resgate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge>{selectedWithdrawal.payment_method === 'bank_transfer' ? 'Transferência Bancária (TED)' : 'PIX'}</Badge>
                </h4>
                <div className="space-y-1 text-sm bg-muted p-4 rounded-lg">
                  <p><strong>Titular:</strong> {selectedWithdrawal.bank_account?.holder_name}</p>
                  <p><strong>CPF:</strong> <code className="bg-background px-2 py-1 rounded">{selectedWithdrawal.bank_account?.document}</code></p>
                  
                  {selectedWithdrawal.payment_method === 'bank_transfer' ? (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <p className="font-semibold text-base mb-2">📋 Dados Bancários para TED:</p>
                        <p><strong>Banco:</strong> {selectedWithdrawal.bank_account?.bank_code}</p>
                        <p><strong>Agência:</strong> {selectedWithdrawal.bank_account?.branch}-{selectedWithdrawal.bank_account?.branch_check_digit || '0'}</p>
                        <p><strong>Conta:</strong> {selectedWithdrawal.bank_account?.account}-{selectedWithdrawal.bank_account?.account_check_digit}</p>
                        <p><strong>Tipo de Conta:</strong> {selectedWithdrawal.bank_account?.account_type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}</p>
                      </div>
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">⏱️ PRAZO DE PROCESSAMENTO:</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          A transferência deve ser processada manualmente em até 7 dias úteis após a aprovação.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p><strong>Tipo de Chave:</strong> {selectedWithdrawal.pix_key_type?.toUpperCase()}</p>
                      <p><strong>Chave PIX:</strong> <code className="bg-background px-2 py-1 rounded">{selectedWithdrawal.pix_key}</code></p>
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">✅ PROCESSO AUTOMÁTICO:</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          1. Clique em "Aprovar" para enviar o pagamento ao Pagar.me<br/>
                          2. O PIX será criado automaticamente no Pagar.me<br/>
                          3. O Pagar.me processará o pagamento<br/>
                          4. Acompanhe o status no dashboard do Pagar.me
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <p><strong>Valor a Transferir:</strong> <span className="text-lg font-bold text-green-600">R$ {Number(selectedWithdrawal.net_amount).toFixed(2)}</span></p>
                  </div>
                </div>
              </div>
              {selectedWithdrawal.rejection_reason && (
                <div>
                  <h4 className="font-semibold mb-2">Motivo da Rejeição:</h4>
                  <p className="text-sm">{selectedWithdrawal.rejection_reason}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
