import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const jsonResponse = (payload: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-TOKEN-WEBHOOK] ${step}${detailsStr}`);
};

const getWebhookSecret = () => {
  return Deno.env.get("STRIPE_TOKEN_WEBHOOK_SECRET") || Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
};

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) throw new Error("SUPABASE_URL not configured");
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

  return createClient(supabaseUrl, supabaseServiceKey);
};

const isTokenPurchaseSession = (session: Stripe.Checkout.Session) => {
  return session.metadata?.type === "token_purchase" && Boolean(session.metadata?.purchase_id);
};

const safeMarkStripeEvent = async (
  supabase: any,
  eventId: string | undefined,
  status: "processed" | "ignored" | "failed",
  errorMessage: string | null = null,
  metadata: Record<string, unknown> | null = null,
) => {
  if (!supabase || !eventId) return;

  try {
    const { error } = await supabase.rpc("mark_stripe_event_processed", {
      p_event_id: eventId,
      p_status: status,
      p_error_message: errorMessage,
      p_metadata: metadata,
    });

    if (error) {
      logStep("Failed to mark Stripe event", { eventId, status, error: error.message });
    }
  } catch (error: any) {
    logStep("Failed to mark Stripe event exception", { eventId, status, error: error.message });
  }
};

const recordStripeEventOnce = async (supabase: any, event: Stripe.Event, source: string) => {
  const eventObject = event.data.object as any;
  const objectId = eventObject?.id ?? null;

  try {
    const { data, error } = await supabase.rpc("record_stripe_event_once", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_object_id: objectId,
      p_source: source,
      p_metadata: {
        livemode: event.livemode,
        created: event.created,
      },
    });

    if (error) {
      logStep("Idempotency registration failed; continuing with atomic processor", {
        eventId: event.id,
        error: error.message,
      });
      return true;
    }

    return Boolean(data);
  } catch (error: any) {
    logStep("Idempotency registration exception; continuing with atomic processor", {
      eventId: event.id,
      error: error.message,
    });
    return true;
  }
};

const processTokenPurchase = async (
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string,
  paymentTypeOverride?: "card" | "boleto",
  expiresAtOverride: string | null = null,
) => {
  const metadata = session.metadata;

  if (!metadata?.purchase_id || metadata?.type !== "token_purchase") {
    logStep("Not a token purchase session, skipping", { sessionId: session.id });
    return false;
  }

  const tokensAmount = Number.parseInt(metadata.tokens_amount || "0", 10);
  const paymentType = paymentTypeOverride || (session.payment_method_types?.includes("boleto") ? "boleto" : "card");

  logStep("Processing token purchase", {
    purchaseId: metadata.purchase_id,
    userId: metadata.user_id,
    tokensAmount,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    paymentType,
  });

  const { data, error } = await supabase.rpc("process_token_purchase_atomic", {
    p_purchase_id: metadata.purchase_id,
    p_user_id: metadata.user_id,
    p_tokens_amount: tokensAmount,
    p_stripe_session_id: session.id,
    p_stripe_payment_status: session.payment_status,
    p_payment_type: paymentType,
    p_expires_at: expiresAtOverride,
    p_event_id: eventId,
  });

  if (error) throw error;

  logStep("Token purchase RPC completed", data?.[0] || {});
  return true;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ received: false, error: "Method not allowed" }, 405);
  }

  let event: Stripe.Event | null = null;
  let supabase: any = null;

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = getWebhookSecret();

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_TOKEN_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("Missing Stripe signature");
      return jsonResponse({ received: false, error: "No Stripe signature" }, 400);
    }

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventId: event.id, type: event.type });
    } catch (error: any) {
      logStep("Webhook signature verification failed", { error: error.message });
      return jsonResponse({ received: false, error: "Webhook signature verification failed" }, 400);
    }

    const eventObject = event.data.object as any;
    const eventMetadata = eventObject?.metadata || {};
    const isCheckoutSessionEvent = event.type.startsWith("checkout.session.");
    const isTokenPurchaseEvent = eventMetadata.type === "token_purchase";

    if (!isTokenPurchaseEvent) {
      logStep("Ignoring non-token event", {
        eventId: event.id,
        type: event.type,
        objectId: eventObject?.id,
      });
      return jsonResponse({ received: true, ignored: true });
    }

    if (!isCheckoutSessionEvent) {
      logStep("Ignoring unsupported token event type", { eventId: event.id, type: event.type });
      return jsonResponse({ received: true, ignored: true, reason: "unsupported_token_event_type" });
    }

    supabase = getSupabaseAdmin();

    const shouldProcess = await recordStripeEventOnce(supabase, event, "stripe-token-webhook");
    if (!shouldProcess) {
      logStep("Duplicate Stripe event ignored", { eventId: event.id, type: event.type });
      return jsonResponse({ received: true, duplicate: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (!isTokenPurchaseSession(session)) {
      logStep("Token event missing purchase metadata", { eventId: event.id, sessionId: session.id });
      await safeMarkStripeEvent(supabase, event.id, "ignored", null, { reason: "missing_token_purchase_metadata" });
      return jsonResponse({ received: true, ignored: true, reason: "missing_token_purchase_metadata" });
    }

    if (event.type === "checkout.session.completed") {
      const paymentMethodTypes = session.payment_method_types || [];
      const isBoletoPending = paymentMethodTypes.includes("boleto") && session.payment_status !== "paid";
      let expiresAt: string | null = null;

      if (isBoletoPending) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 3);
        expiresAt = expireDate.toISOString();
      }

      await processTokenPurchase(
        supabase,
        session,
        event.id,
        isBoletoPending ? "boleto" : undefined,
        expiresAt,
      );
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await processTokenPurchase(supabase, session, event.id, "boleto", null);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const metadata = session.metadata;
      if (metadata?.purchase_id && metadata?.type === "token_purchase") {
        const { error } = await supabase.rpc("fail_token_purchase_if_unpaid", {
          p_purchase_id: metadata.purchase_id,
          p_stripe_session_id: session.id,
        });

        if (error) {
          logStep("Failed to mark token purchase failed", { eventId: event.id, error: error.message });
        } else {
          logStep("Purchase marked failed if it was not already paid", { purchaseId: metadata.purchase_id });
        }
      }
    } else {
      logStep("Token checkout event ignored", { eventId: event.id, type: event.type });
      await safeMarkStripeEvent(supabase, event.id, "ignored", null, { reason: "unsupported_checkout_event" });
      return jsonResponse({ received: true, ignored: true, reason: "unsupported_checkout_event" });
    }

    await safeMarkStripeEvent(supabase, event.id, "processed");
    return jsonResponse({ received: true, processed: true });
  } catch (error: any) {
    const message = error?.message || "Unknown webhook error";
    logStep("ERROR", { message, eventId: event?.id, type: event?.type });

    if (event?.id && supabase) {
      await safeMarkStripeEvent(supabase, event.id, "failed", message);
    }

    return jsonResponse({ received: false, error: message }, 500);
  }
});
