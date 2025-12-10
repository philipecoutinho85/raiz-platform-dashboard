import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet, ArrowDownToLine, Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ShieldX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StripeAccountStatus } from './StripeConnectSetup';

interface CreatorPayoutPanelProps {
  projectId?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export const CreatorPayoutPanel = ({ projectId }: CreatorPayoutPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);

  const fetchData = async () => {
    try {
      setLoadingPayouts(true);
      setCheckingAccount(true);
      
      // Get account status from Stripe (includes balance)
      const { data: accountData, error: accountError } = await supabase.functions.invoke('stripe-check-account');
      if (!accountError && accountData) {
        setAccountStatus(accountData);
        setBalance(accountData.balance || 0);
      }

      // Get payout history
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('creator_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!payoutsError && payoutsData) {
        setPayouts(payoutsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingPayouts(false);
      setCheckingAccount(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async () => {
    // Bloquear se não verificado
    if (!accountStatus?.verified) {
      toast.error('Para solicitar saque, finalize sua verificação. Vá ao seu perfil e clique em "Verificar conta para receber saques".');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const amountCents = Math.round(amount * 100);
    if (amountCents > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('stripe-request-payout', {
        body: { projectId, amount }
      });

      if (error) throw error;

      toast.success(data.message || 'Saque solicitado com sucesso!');
      setDialogOpen(false);
      setWithdrawAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast.error(error.message || 'Erro ao solicitar saque');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isVerified = accountStatus?.verified === true;

  if (loadingPayouts || checkingAccount) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Verificando status da conta...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Saldo e Saques
        </CardTitle>
        <CardDescription>
          Gerencie seu saldo e solicite transferências para sua conta bancária
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de Verificação */}
        {!isVerified && (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              <strong>Verificação pendente.</strong> Para solicitar saque, finalize sua verificação.{' '}
              <a href="/perfil?tab=payouts" className="underline font-medium">
                Vá ao seu perfil e clique em "Verificar conta para receber saques".
              </a>
            </AlertDescription>
          </Alert>
        )}

        {isVerified && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              <strong>Identidade verificada.</strong> Você pode solicitar saques normalmente.
            </AlertDescription>
          </Alert>
        )}

        {/* Balance */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Saldo disponível para saque</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(balance)}</p>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4" disabled={balance <= 0 || !isVerified}>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Solicitar saque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar saque</DialogTitle>
                <DialogDescription>
                  O valor será transferido para a conta bancária cadastrada na Stripe.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Valor do saque</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      max={balance / 100}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="pl-10"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disponível: {formatCurrency(balance)}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setWithdrawAmount((balance / 100).toFixed(2))}
                >
                  Sacar todo o saldo
                </Button>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    O valor será depositado em até 2 dias úteis.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleWithdraw} 
                  disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar saque'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payout History */}
        {payouts.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Histórico de saques</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {format(new Date(payout.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payout.status)}
                      {payout.error_message && (
                        <p className="text-xs text-destructive mt-1">{payout.error_message}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {payouts.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum saque realizado ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
