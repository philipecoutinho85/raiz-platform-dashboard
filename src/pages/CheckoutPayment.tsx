import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Clock, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  CreditCard,
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const CheckoutPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const purchaseId = searchParams.get('purchaseId');
  const paymentMethod = searchParams.get('method') as 'pix' | 'credit_card' | 'boleto';
  
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hora em segundos
  const [qrCode, setQrCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [boletoUrl, setBoletoUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!purchaseId) {
      navigate('/carteira');
      return;
    }

    loadPurchaseData();
  }, [purchaseId]);

  // Realtime listener para atualizações de pagamento
  useEffect(() => {
    if (!purchaseId) return;

    // Nome único do canal usando o purchaseId
    const channelName = `token-purchase-${purchaseId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'token_purchases',
          filter: `id=eq.${purchaseId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          
          if (newStatus === 'paid') {
            toast({
              title: '🎉 Pagamento Confirmado!',
              description: 'Seus tokens foram creditados com sucesso. Redirecionando...',
            });
            
            // Redirecionar para carteira imediatamente
            navigate('/carteira');
          } else if (newStatus === 'failed' || newStatus === 'cancelled') {
            toast({
              title: 'Pagamento não realizado',
              description: 'O pagamento não foi confirmado. Tente novamente.',
              variant: 'destructive',
            });
          }
          
          setPurchase(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up payment channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [purchaseId, navigate, toast]);

  // Timer de expiração
  useEffect(() => {
    if (!purchase || purchase.status !== 'pending') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: 'Pagamento Expirado',
            description: 'O tempo para pagamento expirou. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [purchase, toast]);

  const loadPurchaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      setPurchase(data);

      // Buscar dados de pagamento do Pagar.me
      if (data.pagarme_transaction_id) {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'get-payment-details',
          {
            body: { transactionId: data.pagarme_transaction_id }
          }
        );

        if (!paymentError && paymentData) {
          if (paymentMethod === 'pix') {
            setQrCode(paymentData.qr_code || '');
            setQrCodeUrl(paymentData.qr_code_url || '');
          } else if (paymentMethod === 'boleto') {
            setBoletoUrl(paymentData.boleto_url || '');
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da compra:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do pagamento.',
        variant: 'destructive',
      });
      navigate('/carteira');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: 'Código PIX copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((3600 - timeLeft) / 3600) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-raiz-gold animate-spin mx-auto mb-4" />
          <p className="text-raiz-light">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return null;
  }

  const isPaid = purchase.status === 'paid';
  const isPending = purchase.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/carteira')}
          className="mb-6 text-raiz-light hover:text-raiz-gold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Carteira
        </Button>

        {/* Status do Pagamento */}
        {isPaid && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>Pagamento Confirmado!</strong> Seus {purchase.amount} tokens foram creditados na sua carteira.
            </AlertDescription>
          </Alert>
        )}

        {timeLeft === 0 && isPending && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-950/20 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 dark:text-red-100">
              <strong>Pagamento Expirado.</strong> O tempo limite foi atingido. Por favor, faça uma nova compra.
            </AlertDescription>
          </Alert>
        )}

        {/* PIX */}
        {paymentMethod === 'pix' && isPending && (
          <>
            <Card className="mb-6 bg-white/10 backdrop-blur-lg border-raiz-accent/20">
              <CardHeader>
                <CardTitle className="text-raiz-gold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-6 h-6" />
                    Pagamento via PIX
                  </div>
                  <div className="flex items-center gap-2 text-raiz-light">
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-mono">{formatTime(timeLeft)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Progress value={getProgressPercentage()} className="h-2" />
                
                <Alert>
                  <AlertDescription>
                    <strong>Valor:</strong> R$ {(purchase.price || 0).toFixed(2)} | <strong>Tokens:</strong> {purchase.amount}
                  </AlertDescription>
                </Alert>

                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64" />
                    </div>
                  </div>
                )}

                {qrCode && (
                  <div className="space-y-3">
                    <p className="text-raiz-light text-sm font-medium">
                      Ou copie o código PIX:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrCode}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/5 border border-raiz-accent/20 rounded text-raiz-light text-sm font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(qrCode)}
                        variant="outline"
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    📱 Como pagar:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>Abra o aplicativo do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Escaneie o QR Code ou cole o código acima</li>
                    <li>Confirme o pagamento</li>
                    <li>Aguarde a confirmação automática (geralmente instantânea)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Cartão de Crédito */}
        {paymentMethod === 'credit_card' && (
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-raiz-gold flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Pagamento via Cartão de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Pagamento processado com sucesso. Aguarde a confirmação.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Boleto */}
        {paymentMethod === 'boleto' && isPending && (
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-raiz-gold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Pagamento via Boleto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Valor:</strong> R$ {(purchase.price || 0).toFixed(2)} | <strong>Tokens:</strong> {purchase.amount}
                </AlertDescription>
              </Alert>

              {boletoUrl && (
                <Button
                  onClick={() => window.open(boletoUrl, '_blank')}
                  className="w-full bg-raiz-gold hover:bg-raiz-gold/90"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Baixar Boleto
                </Button>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                  ⏰ Prazo de pagamento:
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  O boleto expira em 3 dias úteis. Após o pagamento, a confirmação pode levar até 2 dias úteis.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                  <li>Pague em qualquer banco, lotérica ou aplicativo</li>
                  <li>Use o código de barras para pagamento</li>
                  <li>Guarde o comprovante de pagamento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações de Segurança */}
        <Card className="mt-6 bg-white/10 backdrop-blur-lg border-raiz-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-raiz-light">Pagamento Seguro</p>
                <p className="text-xs text-raiz-light/70">
                  Ambiente 100% seguro e criptografado. Processado pela Pagar.me. 
                  Você receberá uma notificação assim que o pagamento for confirmado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPayment;
