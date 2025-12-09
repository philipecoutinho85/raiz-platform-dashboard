import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeAccountStatus {
  connected: boolean;
  verified: boolean;
  status: string;
  balance: number;
  requirements?: string[];
  accountId?: string;
}

export const StripeConnectSetup = () => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  const checkAccountStatus = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('stripe-check-account');
      
      if (error) throw error;
      setAccountStatus(data);
    } catch (error) {
      console.error('Error checking Stripe account:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkAccountStatus();
    
    // Check for redirect params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') === 'true') {
      toast.success('Configuração da conta Stripe concluída!');
      checkAccountStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('stripe_refresh') === 'true') {
      toast.info('Por favor, complete a configuração da sua conta.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      toast.error(error.message || 'Erro ao configurar conta Stripe');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const getStatusBadge = () => {
    if (!accountStatus?.connected) {
      return <Badge variant="outline" className="text-muted-foreground">Não conectada</Badge>;
    }
    if (accountStatus.verified) {
      return <Badge className="bg-green-500 text-white">Verificada</Badge>;
    }
    if (accountStatus.status === 'incomplete') {
      return <Badge variant="destructive">Verificação pendente</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Verificando status da conta...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Conta para Recebimentos
            </CardTitle>
            <CardDescription>
              Configure sua conta Stripe para receber pagamentos dos apoiadores
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!accountStatus?.connected ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para receber pagamentos dos seus projetos, você precisa configurar uma conta Stripe.
                O processo é rápido e seguro.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectStripe} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  Configurar conta para receber repasses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        ) : accountStatus.verified ? (
          <>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Conta verificada e pronta para receber pagamentos</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(accountStatus.balance)}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium text-green-600">Ativa</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={checkAccountStatus}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar status
            </Button>
          </>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sua conta precisa completar a verificação para receber pagamentos.
                {accountStatus.requirements && accountStatus.requirements.length > 0 && (
                  <span className="block mt-1">
                    Itens pendentes: {accountStatus.requirements.length}
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectStripe} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Completar verificação
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
