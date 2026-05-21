import { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onComplete?: () => void;
}

const EmbeddedCheckoutComponent = ({ clientSecret, onComplete }: EmbeddedCheckoutProps) => {
  const fetchClientSecret = useCallback(async () => clientSecret, [clientSecret]);

  const onCheckoutComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: onCheckoutComplete }}
      >
        <EmbeddedCheckout className="w-full" />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedCheckoutComponent;
