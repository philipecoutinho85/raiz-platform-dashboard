import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-TOKEN-WEBHOOK] ${step}${detailsStr}`);
};

async function processTokenPurchase(supabase: any, session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata?.purchase_id || metadata?.type !== "token_purchase") {
    logStep("Not a token purchase, skipping");
    return false;
  }

  const purchaseId = metadata.purchase_id;
  const userId = metadata.user_id;
  const tokensAmount = parseInt(metadata.tokens_amount || "0");

  logStep("Token purchase details", { purchaseId, userId, tokensAmount });

  // Check if already processed
  const { data: existingPurchase } = await supabase
    .from('token_purchases')
    .select('status')
    .eq('id', purchaseId)
    .single();

  if (existingPurchase?.status === 'paid') {
    logStep("Purchase already processed, skipping");
    return true;
  }

  // Update purchase status to paid
  await supabase
    .from('token_purchases')
    .update({ 
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', purchaseId);

  logStep("Purchase status updated to paid");

  // Get current user balance
  const { data: userTokens } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = userTokens?.balance || 0;
  const newBalance = currentBalance + tokensAmount;

  // Update user balance
  await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString()
    });

  logStep("User balance updated", { oldBalance: currentBalance, newBalance });

  // Create transaction record
  await supabase
    .from('token_transactions')
    .insert({
      user_id: userId,
      amount: tokensAmount,
      transaction_type: 'purchase',
      reference_id: purchaseId,
      description: `Compra de ${tokensAmount} tokens via Stripe`,
      balance_after: newBalance
    });

  logStep("Transaction record created");

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'token_purchase',
      title: 'Compra de Tokens Confirmada! 🎉',
      message: `Sua compra de ${tokensAmount} tokens foi confirmada e já está disponível em sua carteira!`,
      related_id: purchaseId
    });

  logStep("Notification created");
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err: any) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(
          JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      event = JSON.parse(body);
      logStep("Webhook received without signature verification");
    }

    logStep("Event type", { type: event.type });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { 
        sessionId: session.id,
        paymentStatus: session.payment_status 
      });

      // For card payments, payment_status is 'paid' immediately
      // For boleto/async payments, payment_status is 'unpaid' - we need to wait for async_payment_succeeded
      if (session.payment_status === 'paid') {
        logStep("Immediate payment confirmed (card), processing tokens");
        await processTokenPurchase(supabase, session);
      } else {
        logStep("Async payment method (boleto), waiting for payment confirmation", {
          paymentStatus: session.payment_status
        });
        // Don't credit tokens yet - wait for async_payment_succeeded event
      }
    } 
    // Handle async payment success (boleto paid)
    else if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.async_payment_succeeded (boleto paid)", { 
        sessionId: session.id 
      });
      await processTokenPurchase(supabase, session);
    }
    // Handle async payment failure (boleto expired/failed)
    else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.async_payment_failed (boleto failed)", { 
        sessionId: session.id 
      });
      
      const metadata = session.metadata;
      if (metadata?.purchase_id && metadata?.type === "token_purchase") {
        // Update purchase status to failed
        await supabase
          .from('token_purchases')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.purchase_id);
        
        logStep("Purchase status updated to failed");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});