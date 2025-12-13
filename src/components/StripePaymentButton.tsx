import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StripePaymentButtonProps {
  projectId: string;
  projectTitle: string;
  creatorHasStripe: boolean;
  minAmount?: number;
  isOwner?: boolean;
}

export const StripePaymentButton = ({ 
  projectId, 
  projectTitle, 
  creatorHasStripe,
  minAmount = 5,
  isOwner = false
}: StripePaymentButtonProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(minAmount.toString());

  const handlePayment = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para apoiar este projeto');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minAmount) {
      toast.error(`O valor mínimo é R$ ${minAmount.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('stripe-create-payment', {
        body: { projectId, amount: numAmount }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  // Only show message to the project owner
  if (!creatorHasStripe && isOwner) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você ainda não configurou sua conta para receber pagamentos. Configure no seu perfil.
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show anything if creator hasn't set up Stripe and user is not owner
  if (!creatorHasStripe) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <CreditCard className="mr-2 h-5 w-5" />
          Apoiar este projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apoiar projeto</DialogTitle>
          <DialogDescription>
            Escolha o valor que deseja contribuir para "{projectTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant={amount === quickAmount.toString() ? "default" : "outline"}
                onClick={() => setAmount(quickAmount.toString())}
                className="text-sm"
              >
                R$ {quickAmount}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Ou digite outro valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="custom-amount"
                type="number"
                min={minAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder={minAmount.toString()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valor mínimo: R$ {minAmount.toFixed(2)}
            </p>
          </div>

          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Você será redirecionado para o checkout seguro da Stripe.
              Aceitamos cartão de crédito, boleto e PIX.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handlePayment} 
            disabled={loading || parseFloat(amount) < minAmount}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Continuar para pagamento
                <span className="ml-2 font-bold">
                  R$ {parseFloat(amount || '0').toFixed(2)}
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
