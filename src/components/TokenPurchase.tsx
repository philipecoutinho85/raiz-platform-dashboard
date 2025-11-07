
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coins, CreditCard, QrCode, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TokenPurchase = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');

  // Calcular valor em reais baseado na quantidade de tokens
  const calculatePrice = (tokens: number) => {
    return (tokens * 0.10).toFixed(2);
  };

  const tokenPackages = [
    { tokens: 50, price: 5, bonus: 0 }, // Valor mínimo
    { tokens: 100, price: 10, bonus: 0 },
    { tokens: 500, price: 50, bonus: 0 },
    { tokens: 1000, price: 100, bonus: 0 },
    { tokens: 2000, price: 200, bonus: 0 },
  ];

  const handlePurchase = async (tokens: number) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para comprar tokens.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          userId: user.id,
          amount: tokens,
          paymentMethod
        }
      });

      if (error) throw error;

      if (data.paymentUrl) {
        // Redirecionar para página de pagamento
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: 'Atenção',
          description: 'Não foi possível gerar o link de pagamento. Entre em contato com o suporte.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro na compra:', error);
      toast({
        title: 'Erro na compra',
        description: error.message || 'Não foi possível processar a compra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span>Comprar Tokens</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-raiz-secondary text-sm">
          Use tokens para apoiar projetos na comunidade Raiz. Cada token vale R$ 0,10. Valor mínimo de compra: R$ 5,00 (50 tokens).
        </p>

        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">
                <div className="flex items-center">
                  <QrCode className="w-4 h-4 mr-2" />
                  PIX (aprovação instantânea)
                </div>
              </SelectItem>
              <SelectItem value="credit_card">
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cartão de Crédito
                </div>
              </SelectItem>
              <SelectItem value="boleto">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Boleto (até 3 dias úteis)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                onClick={() => handlePurchase(pkg.tokens + pkg.bonus)}
                disabled={loading}
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
              min="50"
              placeholder="Quantidade de tokens (mín. 50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount && parseInt(amount) >= 50 && (
              <div className="p-3 bg-raiz-primary/10 rounded-lg">
                <p className="text-sm font-medium text-raiz-primary">
                  Valor total: R$ {calculatePrice(parseInt(amount))}
                </p>
                <p className="text-xs text-raiz-secondary mt-1">
                  {amount} tokens × R$ 0,10
                </p>
              </div>
            )}
            <Button
              onClick={() => {
                const tokens = parseInt(amount);
                if (tokens >= 50 && tokens > 0) {
                  handlePurchase(tokens);
                }
              }}
              disabled={loading || !amount || parseInt(amount) < 50}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processando...' : 'Comprar'}
            </Button>
          </div>
          <p className="text-xs text-raiz-secondary mt-2">
            R$ 0,10 por token (mínimo: R$ 5,00 = 50 tokens)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPurchase;
