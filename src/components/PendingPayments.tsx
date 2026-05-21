import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, FileText, RefreshCw, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingPayment {
  id: string;
  amount: number;
  price: number;
  status: string;
  payment_type: string | null;
  created_at: string;
  pagarme_transaction_id?: string | null;
}

const PendingPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchPayments = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`pending-token-purchases-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'token_purchases',
        filter: `user_id=eq.${user.id}`
      }, fetchPayments)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-5 w-5" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) return null;

  const visiblePayments = payments.slice(0, 3);
  const remaining = Math.max(payments.length - visiblePayments.length, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 p-4 md:p-6 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Clock className="h-5 w-5 shrink-0" />
          <span>Pagamentos Pendentes ({payments.length})</span>
        </CardTitle>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setExpanded((value) => !value)} className="flex-1 sm:flex-none">
            {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {expanded ? 'Recolher' : 'Ver pendentes'}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchPayments} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
          {visiblePayments.map((payment) => {
            const isBoleto = payment.payment_type === 'boleto';
            return (
              <div key={payment.id} className="w-full overflow-hidden rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  {isBoleto ? <FileText className="h-5 w-5 shrink-0 text-muted-foreground" /> : <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold leading-tight">{payment.amount} Tokens</span>
                      <Badge variant={payment.status === 'expired' ? 'destructive' : 'outline'} className="w-fit">
                        {payment.status === 'expired' ? 'Expirado' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isBoleto ? 'Boleto pendente' : 'Pagamento iniciado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {Number(payment.price).toFixed(2)} • {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {payment.pagarme_transaction_id && (
                      <p className="max-w-full break-all text-[10px] leading-relaxed text-muted-foreground md:text-xs">
                        ID de pagamento: {payment.pagarme_transaction_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {remaining > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Existem mais {remaining} tentativa(s) pendente(s) no histórico completo de compras.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PendingPayments;
