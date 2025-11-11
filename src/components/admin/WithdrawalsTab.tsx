import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Check, X, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  requested_amount: number;
  admin_fee: number;
  net_amount: number;
  status: string;
  bank_account: any;
  requested_at: string;
  rejection_reason?: string;
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
  const [rejectionReason, setRejectionReason] = useState('');

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
      const { error } = await supabase.functions.invoke('process-withdrawal', {
        body: { withdrawalId, action: 'approve' }
      });

      if (error) throw error;

      toast.success('Resgate aprovado e transferência iniciada!');
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao aprovar resgate:', error);
      toast.error('Erro ao processar resgate');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('process-withdrawal', {
        body: { 
          withdrawalId: selectedWithdrawal.id, 
          action: 'reject',
          rejectionReason 
        }
      });

      if (error) throw error;

      toast.success('Resgate rejeitado');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      console.error('Erro ao rejeitar resgate:', error);
      toast.error('Erro ao processar rejeição');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
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
                  <TableHead>Projeto</TableHead>
                  <TableHead>Autor</TableHead>
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
                    <TableCell>R$ {Number(withdrawal.requested_amount).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(withdrawal.admin_fee).toFixed(2)}</TableCell>
                    <TableCell className="font-bold">
                      R$ {Number(withdrawal.net_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(withdrawal.requested_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={processing}
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Resgate</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O autor será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedWithdrawal && !showRejectDialog && (
        <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Resgate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Dados Bancários:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Banco:</strong> {selectedWithdrawal.bank_account.bank_code}</p>
                  <p><strong>Agência:</strong> {selectedWithdrawal.bank_account.branch}-{selectedWithdrawal.bank_account.branch_check_digit}</p>
                  <p><strong>Conta:</strong> {selectedWithdrawal.bank_account.account}-{selectedWithdrawal.bank_account.account_check_digit}</p>
                  <p><strong>Tipo:</strong> {selectedWithdrawal.bank_account.account_type === 'checking' ? 'Corrente' : 'Poupança'}</p>
                  <p><strong>Titular:</strong> {selectedWithdrawal.bank_account.holder_name}</p>
                  <p><strong>CPF:</strong> {selectedWithdrawal.bank_account.document}</p>
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
