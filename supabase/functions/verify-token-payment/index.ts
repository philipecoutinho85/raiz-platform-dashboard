import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-TOKEN-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Usuario nao autenticado");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuario nao autenticado");
    }

    logStep("User authenticated", { userId: user.id });

    const { sessionId, purchaseId } = await req.json();

    if (!sessionId && !purchaseId) {
      throw new Error("sessionId ou purchaseId e obrigatorio");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let purchase;
    if (purchaseId) {
      const { data } = await supabase
        .from("token_purchases")
        .select("*")
        .eq("id", purchaseId)
        .eq("user_id", user.id)
        .single();
      purchase = data;
    } else if (sessionId) {
      const { data } = await supabase
        .from("token_purchases")
        .select("*")
        .eq("pagarme_transaction_id", sessionId)
        .eq("user_id", user.id)
        .single();
      purchase = data;
    }

    if (!purchase) {
      throw new Error("Compra nao encontrada");
    }

    logStep("Purchase found", {
      purchaseId: purchase.id,
      status: purchase.status,
      sessionId: purchase.pagarme_transaction_id,
    });

    if (purchase.status === "paid") {
      logStep("Purchase already paid");
      return new Response(
        JSON.stringify({
          success: true,
          status: "paid",
          alreadyProcessed: true,
          message: "Pagamento ja foi processado",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const stripeSessionId = purchase.pagarme_transaction_id;
    if (!stripeSessionId) {
      throw new Error("ID da sessao Stripe nao encontrado");
    }

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    logStep("Stripe session retrieved", {
      paymentStatus: session.payment_status,
      status: session.status,
    });

    if (session.metadata?.purchase_id && session.metadata.purchase_id !== purchase.id) {
      throw new Error("Stripe metadata purchase mismatch");
    }

    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      throw new Error("Stripe metadata user mismatch");
    }

    if (session.metadata?.tokens_amount && Number(session.metadata.tokens_amount) !== purchase.amount) {
      throw new Error("Stripe metadata amount mismatch");
    }

    if (session.currency && session.currency.toLowerCase() !== "brl") {
      throw new Error("Moeda invalida para compra de tokens");
    }

    if (session.payment_status === "paid") {
      logStep("Payment confirmed in Stripe, processing through atomic RPC");

      const { data, error } = await supabase.rpc("process_token_purchase_atomic", {
        p_purchase_id: purchase.id,
        p_user_id: user.id,
        p_tokens_amount: purchase.amount,
        p_stripe_session_id: stripeSessionId,
        p_stripe_payment_status: session.payment_status,
        p_payment_type: session.payment_method_types?.includes("boleto") ? "boleto" : "card",
        p_expires_at: null,
        p_event_id: null,
      });

      if (error) throw error;

      const result = data?.[0] || {};

      return new Response(
        JSON.stringify({
          success: true,
          status: "paid",
          message: result.already_processed
            ? "Pagamento ja foi processado"
            : "Pagamento confirmado e tokens creditados!",
          alreadyProcessed: result.already_processed,
          newBalance: result.new_balance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (session.payment_status === "unpaid" && session.status === "open") {
      logStep("Payment still pending");
      return new Response(
        JSON.stringify({
          success: true,
          status: "pending",
          message: "Pagamento ainda nao confirmado. Aguardando pagamento do boleto.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (session.status === "expired") {
      await supabase.rpc("fail_token_purchase_if_unpaid", {
        p_purchase_id: purchase.id,
        p_stripe_session_id: stripeSessionId,
      });

      logStep("Payment expired");
      return new Response(
        JSON.stringify({
          success: false,
          status: "expired",
          message: "Sessao de pagamento expirou",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: session.payment_status,
        stripeStatus: session.status,
        message: "Status do pagamento verificado",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
