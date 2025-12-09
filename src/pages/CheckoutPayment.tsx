import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CheckoutPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const payment = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to show loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-raiz-gold animate-spin mx-auto mb-4" />
          <p className="text-raiz-light">Verificando status do pagamento...</p>
        </div>
      </div>
    );
  }

  const isSuccess = payment === 'success';
  const isCancelled = payment === 'cancelled';

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

        {isSuccess && (
          <Card className="bg-white/10 backdrop-blur-lg border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                Pagamento Confirmado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <strong>Seus tokens foram creditados!</strong> O pagamento foi processado com sucesso e seus tokens já estão disponíveis na sua carteira.
                </AlertDescription>
              </Alert>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                  ✅ O que aconteceu:
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-green-800 dark:text-green-200">
                  <li>Seu pagamento foi processado pela Stripe</li>
                  <li>Os tokens foram creditados na sua carteira</li>
                  <li>Você já pode usar os tokens para apoiar projetos</li>
                </ul>
              </div>

              <Button 
                onClick={() => navigate('/carteira')}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ver Minha Carteira
              </Button>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card className="bg-white/10 backdrop-blur-lg border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <XCircle className="w-8 h-8" />
                Pagamento Cancelado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 dark:text-red-100">
                  O pagamento foi cancelado. Nenhum valor foi cobrado do seu cartão.
                </AlertDescription>
              </Alert>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
                  💡 O que você pode fazer:
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li>Tentar novamente com outro método de pagamento</li>
                  <li>Verificar os dados do seu cartão</li>
                  <li>Entrar em contato com o suporte se o problema persistir</li>
                </ul>
              </div>

              <Button 
                onClick={() => navigate('/carteira')}
                className="w-full"
                size="lg"
              >
                Voltar e Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {!isSuccess && !isCancelled && (
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-raiz-gold">
                Página de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-light/80 mb-4">
                Redirecionando para a carteira...
              </p>
              <Button 
                onClick={() => navigate('/carteira')}
                className="w-full"
              >
                Ir para Carteira
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Info */}
        <Card className="mt-6 bg-white/10 backdrop-blur-lg border-raiz-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-raiz-light">Pagamento Seguro</p>
                <p className="text-xs text-raiz-light/70">
                  Ambiente 100% seguro e criptografado. Processado pela Stripe, líder global em pagamentos online.
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
