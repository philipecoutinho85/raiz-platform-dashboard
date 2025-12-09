import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) throw new Error("No Stripe signature");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, paymentStatus: session.payment_status });

        if (session.payment_status === 'paid') {
          const metadata = session.metadata || {};
          const projectId = metadata.project_id;
          const userId = metadata.user_id;

          if (projectId && userId) {
            // Update stripe_payments record
            await supabase
              .from('stripe_payments')
              .update({ 
                status: 'completed',
                stripe_payment_intent_id: session.payment_intent as string,
                completed_at: new Date().toISOString()
              })
              .eq('stripe_session_id', session.id);

            // Get payment details
            const { data: payment } = await supabase
              .from('stripe_payments')
              .select('amount')
              .eq('stripe_session_id', session.id)
              .single();

            const amountTokens = Math.floor((payment?.amount || 0) / 100);

            // Create contribution record
            await supabase.from('project_contributions').insert({
              user_id: userId,
              project_id: projectId,
              amount: amountTokens,
              status: 'completed'
            });

            // Update project stats
            const { data: project } = await supabase
              .from('projects')
              .select('raised_amount, backers_count, user_id, title')
              .eq('id', projectId)
              .single();

            if (project) {
              await supabase
                .from('projects')
                .update({
                  raised_amount: (project.raised_amount || 0) + amountTokens,
                  backers_count: (project.backers_count || 0) + 1
                })
                .eq('id', projectId);

              // Notify creator
              await supabase.from('notifications').insert({
                user_id: project.user_id,
                type: 'new_contribution',
                title: 'Nova contribuição recebida!',
                message: `Você recebeu uma contribuição de R$ ${amountTokens} no projeto "${project.title}"`,
                related_id: projectId
              });

              // Notify supporter
              await supabase.from('notifications').insert({
                user_id: userId,
                type: 'payment_success',
                title: 'Pagamento confirmado!',
                message: `Sua contribuição de R$ ${amountTokens} foi confirmada para o projeto "${project.title}"`,
                related_id: projectId
              });
            }

            logStep("Payment processed", { projectId, userId, amount: amountTokens });
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        logStep("Account updated", { accountId: account.id, chargesEnabled: account.charges_enabled });

        const userId = account.metadata?.user_id;
        if (userId) {
          const isVerified = account.charges_enabled && account.payouts_enabled;
          await supabase
            .from('profiles')
            .update({
              stripe_account_status: isVerified ? 'active' : 'pending',
              stripe_onboarding_complete: isVerified
            })
            .eq('id', userId);
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout completed", { payoutId: payout.id, amount: payout.amount });
        
        // Update payout record
        await supabase
          .from('creator_payouts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout failed", { payoutId: payout.id });
        
        await supabase
          .from('creator_payouts')
          .update({ 
            status: 'failed',
            error_message: payout.failure_message || 'Payout failed'
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
