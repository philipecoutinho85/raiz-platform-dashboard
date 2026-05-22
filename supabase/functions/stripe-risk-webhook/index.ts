import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
};

const supportedEvents = new Set([
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.refunded",
]);

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[STRIPE-RISK-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const getId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

async function findSessionId(stripe: Stripe, paymentIntentId: string | null): Promise<string | null> {
  if (!paymentIntentId) return null;

  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    return sessions.data[0]?.id ?? null;
  } catch (error) {
    logStep("session lookup failed", {
      paymentIntentId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let event: Stripe.Event | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_RISK_WEBHOOK_SECRET") || Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    if (!supportedEvents.has(event.type)) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const object = event.data.object as Record<string, any>;
    const objectId = typeof object.id === "string" ? object.id : null;

    const { data: shouldProcess, error: recordError } = await supabase.rpc("record_stripe_event_once", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_object_id: objectId,
      p_source: "stripe-risk-webhook",
      p_metadata: {
        livemode: event.livemode,
        created: event.created,
      },
    });

    if (recordError) throw recordError;

    if (!shouldProcess) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentIntentId = getId(object.payment_intent);
    const chargeId = event.type.startsWith("charge.dispute") ? getId(object.charge) : objectId;
    const sessionId = await findSessionId(stripe, paymentIntentId);
    const disputeId = event.type.startsWith("charge.dispute") ? objectId : null;

    const { data, error } = await supabase.rpc("process_stripe_dispute_atomic", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_dispute_id: disputeId,
      p_payment_intent_id: paymentIntentId,
      p_charge_id: chargeId,
      p_session_id: sessionId,
      p_amount_cents: Number(object.amount || 0),
      p_currency: String(object.currency || "brl"),
      p_status: object.status ? String(object.status) : null,
      p_reason: object.reason ? String(object.reason) : null,
      p_metadata: {
        stripe_object_id: objectId,
        stripe_object_type: object.object || null,
        session_id: sessionId,
        raw_status: object.status || null,
      },
    });

    if (error) throw error;

    await supabase.rpc("mark_stripe_event_processed", {
      p_event_id: event.id,
      p_status: "processed",
      p_error_message: null,
      p_metadata: { result: data?.[0] || null },
    });

    logStep("processed", { eventId: event.id, type: event.type, result: data?.[0] || null });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("error", { eventId: event?.id || null, message });

    if (event?.id && supabase) {
      await supabase.rpc("mark_stripe_event_processed", {
        p_event_id: event.id,
        p_status: "failed",
        p_error_message: message,
        p_metadata: null,
      });
    }

    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
