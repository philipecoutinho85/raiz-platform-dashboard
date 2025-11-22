import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Check, X, DollarSign, Eye, MessageSquare, XCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          projects(title)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários separadamente
      const withdrawalsWithProfiles = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, email')
            .eq('id', withdrawal.user_id)
            .single();

          return { ...withdrawal, profiles: profile };
        })
      );

      setWithdrawals(withdrawalsWithProfiles as Withdrawal[]);
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
        toast.warning(data.message || 'Resgate marcado para processamento manual');
      } else {
        toast.success('Resgate aprovado e transferência iniciada!');
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      pending_manual: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      pending_manual: 'Processamento Manual',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

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
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Solicitações de Resgate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma solicitação de resgate encontrada
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
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">
                      {withdrawal.projects?.title}
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
                      <div className="flex gap-2">
                        {(withdrawal.status === 'pending' || withdrawal.status === 'pending_manual') && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={processing}
                              title={withdrawal.status === 'pending_manual' ? 'Tentar novamente' : 'Aprovar'}
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
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {withdrawal.status === 'rejected' && withdrawal.chat_active && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowChatDialog(true);
                              }}
                              title="Ver Chat"
                            >
                              <MessageSquare className="h-4 w-4" />
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
              chatActive={selectedWithdrawal.chat_active || false}
              chatClosedAt={selectedWithdrawal.chat_closed_at}
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

      {selectedWithdrawal && !showRejectDialog && !showChatDialog && (
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
