import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-TOKEN-WEBHOOK] ${step}${detailsStr}`);
};

async function processTokenPurchase(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const metadata = session.metadata;
  if (!metadata?.purchase_id || metadata?.type !== "token_purchase") {
    logStep("Not a token purchase, skipping");
    return false;
  }

  const purchaseId = metadata.purchase_id;
  const userId = metadata.user_id;
  const tokensAmount = Number.parseInt(metadata.tokens_amount || "0", 10);

  logStep("Token purchase details", { purchaseId, userId, tokensAmount });

  const { data, error } = await supabase.rpc("process_token_purchase_atomic", {
    p_purchase_id: purchaseId,
    p_user_id: userId,
    p_tokens_amount: tokensAmount,
    p_stripe_session_id: session.id,
    p_stripe_payment_status: session.payment_status,
    p_payment_type: session.payment_method_types?.includes("boleto") ? "boleto" : "card",
    p_expires_at: null,
    p_event_id: eventId,
  });

  if (error) throw error;

  logStep("Token purchase RPC completed", data?.[0] || {});
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let event: Stripe.Event | null = null;
  let supabase: any = null;

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_TOKEN_WEBHOOK_SECRET") ??
      Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No Stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err: any) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    logStep("Event type", { type: event.type, id: event.id });

    const eventObject = event.data.object as any;
    const eventMetadata = eventObject?.metadata || {};

    if (eventMetadata.type !== "token_purchase") {
      logStep("Ignoring non-token event before idempotency registration", {
        eventId: event.id,
        type: event.type,
        objectId: eventObject?.id,
      });

      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const objectId = eventObject?.id ?? null;
    const { data: shouldProcess, error: eventError } = await supabase.rpc(
      "record_stripe_event_once",
      {
        p_event_id: event.id,
        p_event_type: event.type,
        p_object_id: objectId,
        p_source: "stripe-token-webhook",
        p_metadata: {
          livemode: event.livemode,
          created: event.created,
        },
      },
    );

    if (eventError) throw eventError;

    if (!shouldProcess) {
      logStep("Duplicate Stripe event ignored", { eventId: event.id, type: event.type });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        paymentMethodTypes: session.payment_method_types,
      });

      const metadata = session.metadata;
      if (!metadata?.purchase_id || metadata?.type !== "token_purchase") {
        logStep("Not a token purchase, skipping");
        await supabase.rpc("mark_stripe_event_processed", {
          p_event_id: event.id,
          p_status: "ignored",
          p_error_message: null,
          p_metadata: null,
        });

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const paymentMethodTypes = session.payment_method_types || [];
      const isBoleto = paymentMethodTypes.includes("boleto") && session.payment_status !== "paid";
      const paymentType = isBoleto ? "boleto" : "card";

      let expiresAt = null;
      if (isBoleto) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 3);
        expiresAt = expireDate.toISOString();
      }

      const { data, error } = await supabase.rpc("process_token_purchase_atomic", {
        p_purchase_id: metadata.purchase_id,
        p_user_id: metadata.user_id,
        p_tokens_amount: Number.parseInt(metadata.tokens_amount || "0", 10),
        p_stripe_session_id: session.id,
        p_stripe_payment_status: session.payment_status,
        p_payment_type: paymentType,
        p_expires_at: expiresAt,
        p_event_id: event.id,
      });

      if (error) throw error;

      if (session.payment_status === "paid") {
        logStep("Immediate payment confirmed, token purchase processed", data?.[0] || {});
      } else {
        logStep("Async payment method, metadata updated and waiting for confirmation", {
          paymentStatus: session.payment_status,
        });
      }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.async_payment_succeeded", { sessionId: session.id });
      await processTokenPurchase(supabase, session, event.id);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.async_payment_failed", { sessionId: session.id });

      const metadata = session.metadata;
      if (metadata?.purchase_id && metadata?.type === "token_purchase") {
        await supabase.rpc("fail_token_purchase_if_unpaid", {
          p_purchase_id: metadata.purchase_id,
          p_stripe_session_id: session.id,
        });

        logStep("Purchase marked failed if it was not already paid");
      }
    }

    await supabase.rpc("mark_stripe_event_processed", {
      p_event_id: event.id,
      p_status: "processed",
      p_error_message: null,
      p_metadata: null,
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });

    if (event?.id && supabase) {
      await supabase.rpc("mark_stripe_event_processed", {
        p_event_id: event.id,
        p_status: "failed",
        p_error_message: error.message,
        p_metadata: null,
      });
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
