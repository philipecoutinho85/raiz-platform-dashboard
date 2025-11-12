import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatToBrasilia } from '@/lib/dateUtils';

interface Purchase {
  id: string;
  amount: number;
  price: number;
  payment_method: string;
  created_at: string;
}

const RefundRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10);

    setPurchases(data || []);
  };

  const handleSubmit = async () => {
    if (!user || !selectedPurchase || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const purchase = purchases.find(p => p.id === selectedPurchase);
      if (!purchase) return;

      const { error } = await supabase
        .from('refunds')
        .insert({
          user_id: user.id,
          amount: purchase.amount,
          reason: `${reason}${description ? ': ' + description : ''}`,
          status: 'pending',
          requested_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Seu pedido de reembolso será analisado em até 48 horas.",
      });

      setSelectedPurchase('');
      setReason('');
      setDescription('');
      fetchPurchases();
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      boleto: 'Boleto'
    };
    return labels[method as keyof typeof labels] || method;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="w-5 h-5 mr-2" />
          Solicitar Reembolso
        </CardTitle>
        <CardDescription>
          Solicite o reembolso de tokens não utilizados de compras recentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Reembolsos são processados em até 7 dias úteis. O valor será devolvido ao método de pagamento original.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-raiz-dark mb-2 block">
              Selecione a compra
            </label>
            <Select value={selectedPurchase} onValueChange={setSelectedPurchase}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma compra" />
              </SelectTrigger>
              <SelectContent>
                {purchases.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhuma compra disponível</SelectItem>
                ) : (
                  purchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.amount} tokens • {getPaymentMethodLabel(purchase.payment_method)} • R$ {purchase.price.toFixed(2)} • {formatToBrasilia(purchase.created_at, 'dd/MM/yyyy')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-raiz-dark mb-2 block">
              Motivo do reembolso *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duplicate_purchase">Compra duplicada</SelectItem>
                <SelectItem value="wrong_amount">Quantidade errada</SelectItem>
                <SelectItem value="did_not_use">Não utilizei os tokens</SelectItem>
                <SelectItem value="technical_issue">Problema técnico</SelectItem>
                <SelectItem value="other">Outro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-raiz-dark mb-2 block">
              Descrição adicional (opcional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o motivo da sua solicitação..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={loading || !selectedPurchase || !reason}
            className="w-full"
          >
            {loading ? 'Enviando...' : 'Solicitar Reembolso'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefundRequest;
