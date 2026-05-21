import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertTriangle, CheckCircle, XCircle, FileText, RefreshCw, CreditCard } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingPayment {
  id: string;
  amount: number;
  price: number;
  status: string;
  payment_type: string | null;
  payment_method?: string | null;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
  pagarme_transaction_id?: string | null;
}

const PendingPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'token_purchases',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getPaymentLabel = (payment: PendingPayment) => {
    if (payment.payment_type === 'boleto') return 'Boleto pendente';
    if (payment.payment_type === 'card') return 'Pagamento com cartão pendente';
    if (payment.payment_type === 'pix') return 'PIX pendente';
    return 'Pagamento iniciado';
  };

  const getPaymentIcon = (payment: PendingPayment) => {
    if (payment.payment_type === 'boleto') return <FileText className="h-5 w-5 text-muted-foreground" />;
    return <CreditCard className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (payment: PendingPayment) => {
    if (payment.status === 'expired') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expirado
        </Badge>
      );
    }

    if (payment.expires_at && isPast(new Date(payment.expires_at))) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Vencido
        </Badge>
      );
    }

    if (payment.expires_at) {
      const expiresAt = new Date(payment.expires_at);
      const now = new Date();
      const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursRemaining <= 24) {
        return (
          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            Vence em breve
          </Badge>
        );
      }
    }

    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
        <Clock className="h-3 w-3" />
        Aguardando pagamento
      </Badge>
    );
  };

  const getExpirationText = (payment: PendingPayment) => {
    if (payment.payment_type !== 'boleto') {
      return 'Finalize o checkout para confirmar ou descarte esta tentativa.';
    }

    if (!payment.expires_at) return 'Aguardando confirmação do boleto pela Stripe.';

    const expiresAt = new Date(payment.expires_at);
    if (isPast(expiresAt)) {
      return `Venceu ${formatDistanceToNow(expiresAt, { locale: ptBR, addSuffix: true })}`;
    }

    return `Vence ${formatDistanceToNow(expiresAt, { locale: ptBR, addSuffix: true })}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">Nenhum pagamento pendente</p>
            <p className="text-sm text-center">Você não possui compras de tokens aguardando conclusão ou compensação.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pagamentos Pendentes ({payments.length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
          >
            <div className="flex items-start gap-3 space-y-1">
              {getPaymentIcon(payment)}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{payment.amount} Tokens</span>
                  {getStatusBadge(payment)}
                </div>
                <p className="text-sm font-medium text-raiz-dark">
                  {getPaymentLabel(payment)}
                </p>
                <p className="text-sm text-muted-foreground">
                  R$ {Number(payment.price).toFixed(2)} • Gerado em {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getExpirationText(payment)}
                </p>
                {payment.pagarme_transaction_id && (
                  <p className="text-xs text-muted-foreground break-all">
                    Sessão Stripe: {payment.pagarme_transaction_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingPayments;
