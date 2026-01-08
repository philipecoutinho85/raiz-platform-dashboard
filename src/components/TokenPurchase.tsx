import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coins, CreditCard, Shield, Lock, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EmbeddedCheckoutComponent from './EmbeddedCheckout';

const TokenPurchase = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Calcular valor em reais baseado na quantidade de tokens (1 token = R$ 1,00)
  const calculatePrice = (tokens: number) => {
    return (tokens * 1.00).toFixed(2);
  };

  const tokenPackages = [
    { tokens: 5, price: 5, bonus: 0 }, // Valor mínimo
    { tokens: 50, price: 50, bonus: 0 },
    { tokens: 100, price: 100, bonus: 0 },
    { tokens: 500, price: 500, bonus: 0 },
    { tokens: 1000, price: 1000, bonus: 0 },
  ];

  const handleSelectPackage = (tokens: number) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para comprar tokens.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedAmount(tokens);
    setShowCheckout(true);
  };

  const handleCustomPurchase = () => {
    const tokens = parseInt(amount);
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para comprar tokens.',
        variant: 'destructive',
      });
      return;
    }
    if (tokens >= 5) {
      setSelectedAmount(tokens);
      setShowCheckout(true);
    }
  };

  const handleCheckoutComplete = () => {
    toast({
      title: 'Pagamento processado!',
      description: 'Seus tokens serão creditados em instantes.',
    });
    setShowCheckout(false);
    setSelectedAmount(null);
    // Redirect to wallet with success
    window.location.href = '/carteira?payment=success';
  };

  const handleCheckoutError = (error: string) => {
    console.error('Checkout error:', error);
    setShowCheckout(false);
    setSelectedAmount(null);
  };

  const handleBackToPackages = () => {
    setShowCheckout(false);
    setSelectedAmount(null);
  };

  // Show embedded checkout when amount is selected
  if (showCheckout && selectedAmount) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToPackages}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>Comprar {selectedAmount} Tokens - R$ {calculatePrice(selectedAmount)}</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Escolha seu método de pagamento: <strong>Cartão de Crédito</strong> ou <strong>Boleto Bancário</strong>
                </p>
              </div>
              <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Pagamento via Boleto:</strong> A compensação bancária pode levar até 3 dias úteis. 
                  Seus tokens serão creditados automaticamente após a confirmação do pagamento.
                </AlertDescription>
              </Alert>
            </div>
            <EmbeddedCheckoutComponent 
              amount={selectedAmount}
              onComplete={handleCheckoutComplete}
              onError={handleCheckoutError}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-semibold text-sm text-green-900 dark:text-green-100">100% Seguro</p>
            <p className="text-xs text-green-700 dark:text-green-300">Pagamento protegido</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Lock className="w-8 h-8 text-blue-600" />
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Criptografado</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">SSL/TLS 256-bit</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <CheckCircle2 className="w-8 h-8 text-purple-600" />
          <div>
            <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">Aprovação Rápida</p>
            <p className="text-xs text-purple-700 dark:text-purple-300">Processamento imediato</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>Comprar Tokens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-raiz-primary/5 border-raiz-primary/20">
            <Coins className="h-4 w-4" />
            <AlertDescription>
              <p>Use tokens para apoiar projetos na comunidade Raiz. Cada token vale R$ 1,00. Valor mínimo de compra: R$ 5,00 (5 tokens).</p>
              <p className="mt-2 font-medium text-amber-700">
                💡 A opção de pagamento via PIX estará disponível em breve.
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokenPackages.map((pkg) => (
              <div
                key={pkg.tokens}
                className="border rounded-lg p-4 space-y-3 hover:border-raiz-primary transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-raiz-primary">
                    {pkg.tokens}{pkg.bonus > 0 && `+${pkg.bonus}`}
                  </div>
                  <div className="text-sm text-raiz-secondary">tokens</div>
                  {pkg.bonus > 0 && (
                    <div className="text-xs text-raiz-gold font-medium">
                      +{pkg.bonus} bônus!
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-semibold">R$ {pkg.price}</div>
                </div>

                <Button
                  onClick={() => handleSelectPackage(pkg.tokens + pkg.bonus)}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Comprar
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="custom-amount">Valor personalizado</Label>
            <div className="space-y-3 mt-2">
              <Input
                id="custom-amount"
                type="number"
                min="5"
                placeholder="Quantidade de tokens (mín. 5)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && parseInt(amount) >= 5 && (
                <div className="p-3 bg-raiz-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-raiz-primary">
                    Valor total: R$ {calculatePrice(parseInt(amount))}
                  </p>
                  <p className="text-xs text-raiz-secondary mt-1">
                    {amount} tokens × R$ 1,00
                  </p>
                </div>
              )}
              <Button
                onClick={handleCustomPurchase}
                disabled={!amount || parseInt(amount) < 5}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Comprar
              </Button>
            </div>
            <p className="text-xs text-raiz-secondary mt-2">
              R$ 1,00 por token (mínimo: R$ 5,00 = 5 tokens)
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-raiz-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Garantia Raiz Token</p>
                <p className="text-xs text-muted-foreground">
                  Seus dados estão protegidos e criptografados. Processamento via Stripe, 
                  líder global em pagamentos online. Reembolso automático para projetos não concluídos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenPurchase;
