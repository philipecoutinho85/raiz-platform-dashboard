import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StripeAccountStatus {
  connected: boolean;
  verified: boolean;
  status: string;
  balance: number;
  requirements?: string[];
  accountId?: string;
}

interface StripeConnectSetupProps {
  onStatusChange?: (status: StripeAccountStatus | null) => void;
  compact?: boolean;
}

export const StripeConnectSetup = ({ onStatusChange, compact = false }: StripeConnectSetupProps) => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  const checkAccountStatus = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('stripe-check-account');
      
      if (error) throw error;
      setAccountStatus(data);
      onStatusChange?.(data);
    } catch (error) {
      console.error('Error checking Stripe account:', error);
      onStatusChange?.(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkAccountStatus();
    
    // Check for redirect params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') === 'true') {
      toast.success('Verificação de identidade concluída com sucesso!');
      checkAccountStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('stripe_refresh') === 'true') {
      toast.info('Por favor, complete a verificação da sua conta.');
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
      toast.error(error.message || 'Erro ao configurar verificação');
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
      return <Badge variant="outline" className="text-muted-foreground">Ainda não verificado</Badge>;
    }
    if (accountStatus.verified) {
      return <Badge className="bg-green-500 text-white"><ShieldCheck className="h-3 w-3 mr-1" />Verificado</Badge>;
    }
    if (accountStatus.status === 'incomplete') {
      return <Badge variant="destructive">Ainda não verificado</Badge>;
    }
    return <Badge variant="secondary">Ainda não verificado</Badge>;
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

  if (compact) {
    // Versão compacta para exibir em outros locais
    if (checkingStatus) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Verificando...</span>
        </div>
      );
    }

    if (accountStatus?.verified) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-medium">Verificado</span>
        </div>
      );
    }

    return (
      <Alert variant="destructive" className="py-3">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Para solicitar saque, finalize sua verificação.{' '}
          <a href="/perfil?tab=payouts" className="underline font-medium">
            Vá ao seu perfil e clique em "Verificar conta para receber saques".
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Verificação de Identidade
            </CardTitle>
            <CardDescription>
              Verifique sua identidade para receber saques dos seus projetos
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
                Para receber os valores arrecadados dos seus projetos, você precisa verificar sua identidade.
                O processo é rápido, seguro e feito através da Stripe, nossa parceira de pagamentos.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectStripe} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Verificar conta para receber saques
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        ) : accountStatus.verified ? (
          <>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <span className="font-semibold block">Identidade Verificada</span>
                <span className="text-sm text-green-700 dark:text-green-400">Você pode solicitar saques dos seus projetos</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(accountStatus.balance)}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Status da conta</p>
                <p className="text-lg font-medium text-green-600">Verificada</p>
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
                <strong>Ainda não verificado.</strong> Complete a verificação de identidade para poder receber saques.
                {accountStatus.requirements && accountStatus.requirements.length > 0 && (
                  <span className="block mt-1">
                    Documentos/informações pendentes: {accountStatus.requirements.length}
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectStripe} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
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
