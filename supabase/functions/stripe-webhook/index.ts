import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const getPaymentMethod = (session: Stripe.Checkout.Session) => {
  if (session.payment_method_types?.includes("boleto")) return "boleto";
  if (session.payment_method_types?.includes("pix")) return "pix";
  return "card";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let event: Stripe.Event | null = null;
  let supabase: any = null;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature");

    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Webhook received", { type: event.type, id: event.id });

    const eventObject = event.data.object as any;
    const eventMetadata = eventObject?.metadata || {};

    if (event.type.startsWith("checkout.session.") && !eventMetadata.project_id) {
      logStep("Ignoring non-project checkout event before idempotency registration", {
        eventId: event.id,
        type: event.type,
        objectId: eventObject?.id,
      });

      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const objectId = eventObject?.id ?? null;
    const { data: shouldProcess, error: eventError } = await supabase.rpc(
      "record_stripe_event_once",
      {
        p_event_id: event.id,
        p_event_type: event.type,
        p_object_id: objectId,
        p_source: "stripe-webhook",
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

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });

        if (session.payment_status !== "paid") {
          break;
        }

        const metadata = session.metadata || {};
        const projectId = metadata.project_id;
        const userId = metadata.user_id;

        if (!projectId || !userId) {
          logStep("Missing project payment metadata, ignoring", { sessionId: session.id });
          break;
        }

        const { data, error } = await supabase.rpc("process_stripe_project_payment_atomic", {
          p_session_id: session.id,
          p_payment_intent_id: session.payment_intent as string,
          p_project_id: projectId,
          p_user_id: userId,
          p_currency: session.currency,
          p_amount_cents: session.amount_total || 0,
          p_payment_method: getPaymentMethod(session),
          p_event_id: event.id,
        });

        if (error) throw error;

        logStep("Project payment RPC completed", data?.[0] || {});
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const chargesEnabled = account.charges_enabled;
        const payoutsEnabled = account.payouts_enabled;
        const requirementsDue = account.requirements?.currently_due || [];
        const requirementsPastDue = account.requirements?.past_due || [];

        logStep("Account updated", {
          accountId: account.id,
          chargesEnabled,
          payoutsEnabled,
          requirementsDue: requirementsDue.length,
          requirementsPastDue: requirementsPastDue.length,
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_account_id", account.id)
          .single();

        if (profile) {
          const isVerified = chargesEnabled && payoutsEnabled &&
            requirementsDue.length === 0 && requirementsPastDue.length === 0;

          let status = "pending";
          if (isVerified) {
            status = "active";
          } else if (chargesEnabled || payoutsEnabled) {
            status = "restricted";
          }

          await supabase
            .from("profiles")
            .update({
              stripe_account_status: status,
              stripe_onboarding_complete: isVerified,
            })
            .eq("id", profile.id);

          logStep("Profile updated", { userId: profile.id, status, isVerified });
        } else {
          logStep("No profile found for account", { accountId: account.id });
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout completed", { payoutId: payout.id, amount: payout.amount });

        await supabase
          .from("creator_payouts")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("stripe_payout_id", payout.id)
          .neq("status", "completed");
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout failed", { payoutId: payout.id });

        await supabase
          .from("creator_payouts")
          .update({
            status: "failed",
            error_message: payout.failure_message || "Payout failed",
          })
          .eq("stripe_payout_id", payout.id)
          .neq("status", "completed");
        break;
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    if (event?.id && supabase) {
      await supabase.rpc("mark_stripe_event_processed", {
        p_event_id: event.id,
        p_status: "failed",
        p_error_message: errorMessage,
        p_metadata: null,
      });
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
