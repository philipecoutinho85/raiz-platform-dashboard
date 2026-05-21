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
import { supabase } from '@/integrations/supabase/client';

const TokenPurchase = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const calculatePrice = (tokens: number) => {
    return (tokens * 1.00).toFixed(2);
  };

  const tokenPackages = [
    { tokens: 5, price: 5, bonus: 0 },
    { tokens: 50, price: 50, bonus: 0 },
    { tokens: 100, price: 100, bonus: 0 },
    { tokens: 500, price: 500, bonus: 0 },
    { tokens: 1000, price: 1000, bonus: 0 },
  ];

  const createCheckoutSession = async (tokens: number) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado para comprar tokens.', variant: 'destructive' });
      return;
    }

    try {
      setIsCreatingCheckout(true);
      console.log('[TokenPurchase] creating token checkout', { tokens });

      const { data, error } = await supabase.functions.invoke('stripe-token-checkout', {
        body: { amount: tokens }
      });

      if (error) throw error;
      if (!data?.clientSecret) throw new Error('Não foi possível iniciar o checkout.');

      console.log('[TokenPurchase] token checkout created', data);
      setSelectedAmount(tokens);
      setClientSecret(data.clientSecret);
      setShowCheckout(true);
    } catch (error: any) {
      console.error('[TokenPurchase] checkout creation failed', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar checkout',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleSelectPackage = (tokens: number) => {
    createCheckoutSession(tokens);
  };

  const handleCustomPurchase = () => {
    const tokens = parseInt(amount);
    if (tokens >= 5) createCheckoutSession(tokens);
  };

  const handleCheckoutComplete = () => {
    toast({
      title: 'Pagamento processado!',
      description: 'Seus tokens serão creditados em instantes.',
    });
    setShowCheckout(false);
    setSelectedAmount(null);
    setClientSecret(null);
    window.location.href = '/carteira?payment=success';
  };

  const handleBackToPackages = () => {
    setShowCheckout(false);
    setSelectedAmount(null);
    setClientSecret(null);
  };

  if (showCheckout && selectedAmount && clientSecret) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToPackages} className="p-2">
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
                </AlertDescription>
              </Alert>
            </div>
            <EmbeddedCheckoutComponent clientSecret={clientSecret} onComplete={handleCheckoutComplete} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Shield className="w-8 h-8 text-green-600" />
          <div><p className="font-semibold text-sm">100% Seguro</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Lock className="w-8 h-8 text-blue-600" />
          <div><p className="font-semibold text-sm">Criptografado</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <CheckCircle2 className="w-8 h-8 text-purple-600" />
          <div><p className="font-semibold text-sm">Aprovação Rápida</p></div>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Comprar Tokens</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokenPackages.map((pkg) => (
              <div key={pkg.tokens} className="border rounded-lg p-4 space-y-3">
                <div className="text-center"><div className="text-2xl font-bold">{pkg.tokens}</div></div>
                <div className="text-center"><div className="text-xl font-semibold">R$ {pkg.price}</div></div>
                <Button onClick={() => handleSelectPackage(pkg.tokens)} disabled={isCreatingCheckout} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" /> Comprar
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <Label htmlFor="custom-amount">Valor personalizado</Label>
            <div className="space-y-3 mt-2">
              <Input id="custom-amount" type="number" min="5" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button onClick={handleCustomPurchase} disabled={!amount || parseInt(amount) < 5 || isCreatingCheckout} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" /> Comprar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenPurchase;
