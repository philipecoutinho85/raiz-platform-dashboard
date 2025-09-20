
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coins, CreditCard } from 'lucide-react';

const TokenPurchase = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenPackages = [
    { tokens: 50, price: 5, bonus: 0 }, // Valor mínimo
    { tokens: 100, price: 10, bonus: 0 },
    { tokens: 500, price: 50, bonus: 0 },
    { tokens: 1000, price: 100, bonus: 0 },
    { tokens: 2000, price: 200, bonus: 0 },
  ];

  const handlePurchase = async (tokens: number, price: number) => {
    setLoading(true);
    try {
      // Simulação de compra - aqui você integraria com um sistema de pagamento real
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Compra realizada!',
        description: `Você adquiriu ${tokens} tokens por R$ ${price}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro na compra',
        description: 'Não foi possível processar a compra. Tente novamente.',
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
                onClick={() => handlePurchase(pkg.tokens + pkg.bonus, pkg.price)}
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
          <div className="flex space-x-2 mt-2">
            <Input
              id="custom-amount"
              type="number"
              min="50"
              placeholder="Quantidade de tokens (mín. 50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              onClick={() => {
                const tokens = parseInt(amount);
                if (tokens >= 50 && tokens > 0) {
                  handlePurchase(tokens, tokens * 0.1);
                }
              }}
              disabled={loading || !amount || parseInt(amount) < 50}
            >
              Comprar
            </Button>
          </div>
          <p className="text-xs text-raiz-secondary mt-1">
            R$ 0,10 por token (mínimo: R$ 5,00 = 50 tokens)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPurchase;
