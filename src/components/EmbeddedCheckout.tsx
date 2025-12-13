import { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface EmbeddedCheckoutProps {
  amount: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const EmbeddedCheckoutComponent = ({ amount, onComplete, onError }: EmbeddedCheckoutProps) => {
  const { toast } = useToast();

  const fetchClientSecret = useCallback(async () => {
    try {
      // Verify session is still valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const { data, error } = await supabase.functions.invoke('stripe-token-checkout', {
        body: { amount }
      });

      if (error) {
        throw error;
      }

      if (!data?.clientSecret) {
        throw new Error('Não foi possível iniciar o checkout.');
      }

      return data.clientSecret;
    } catch (error: any) {
      console.error('Error fetching client secret:', error);
      
      const errorMessage = error.message || 'Erro ao iniciar checkout';
      
      // Check for token expired error
      if (errorMessage.includes('TOKEN_EXPIRED') || errorMessage.includes('expired')) {
        toast({
          title: 'Sessão expirada',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      onError?.(errorMessage);
      throw error;
    }
  }, [amount, toast, onError]);

  const onCheckoutComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete: onCheckoutComplete,
        }}
      >
        <EmbeddedCheckout className="w-full" />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedCheckoutComponent;
