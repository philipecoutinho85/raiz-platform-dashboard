import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://raiztoken.com.br",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedAdminTypes = new Set(["master", "financial"]);
const allowedOrigins = new Set([
  "https://raiztoken.com.br",
  "https://www.raiztoken.com.br",
]);

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-RECONCILE-TOKEN-PURCHASE] ${step}${detailsStr}`);
};

const jsonResponse = (body: Record<string, unknown>, status = 200, origin?: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      "Content-Type": "application/json"
    },
  });

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      }
    });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl) throw new Error("SUPABASE_URL not configured");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401, origin);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const caller = authData?.user;

    if (authError || !caller) {
      logStep("Auth failed", { error: authError?.message });
      return jsonResponse({ error: "Unauthorized" }, 401, origin);
    }

    const callerId = caller.id;

    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role, admin_type")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole || !allowedAdminTypes.has(adminRole.admin_type || "")) {
      logStep("Forbidden reconciliation attempt", {
        callerId: caller.id,
        adminType: adminRole?.admin_type ?? null,
        roleError: roleError?.message,
      });

      return jsonResponse({ error: "Forbidden: financial administrator role required" }, 403, origin);
    }

    const { purchaseId, sessionId } = await req.json();

    if (!purchaseId && !sessionId) {
      return jsonResponse({ error: "purchaseId or sessionId is required" }, 400, origin);
    }

    let purchaseQuery = supabase.from("token_purchases").select("*");

    if (purchaseId) purchaseQuery = purchaseQuery.eq("id", purchaseId);
    else purchaseQuery = purchaseQuery.eq("pagarme_transaction_id", sessionId);

    const { data: purchase, error: purchaseError } = await purchaseQuery.maybeSingle();

    if (purchaseError) {
      return jsonResponse({ error: "Purchase lookup failed", details: purchaseError.message }, 500, origin);
    }

    if (!purchase) return jsonResponse({ error: "Token purchase not found" }, 404, origin);

    const stripeSessionId = purchase.pagarme_transaction_id;
    if (!stripeSessionId) {
      return jsonResponse({ error: "Token purchase does not have a Stripe session id" }, 409, origin);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

    if (session.payment_status !== "paid") {
      return jsonResponse({ success: true, status: session.payment_status }, 200, origin);
    }

    const paymentMethodTypes = session.payment_method_types || [];
    const paymentType = paymentMethodTypes.includes("boleto") ? "boleto" : paymentMethodTypes.includes("pix") ? "pix" : "card";

    const { data: rpcData, error: rpcError } = await supabase.rpc("process_token_purchase_atomic", {
      p_purchase_id: purchase.id,
      p_user_id: purchase.user_id,
      p_tokens_amount: purchase.amount,
      p_stripe_session_id: stripeSessionId,
      p_stripe_payment_status: session.payment_status,
      p_payment_type: paymentType,
      p_expires_at: null,
      p_event_id: null,
    });

    if (rpcError) {
      return jsonResponse({ error: rpcError.message }, 500, origin);
    }

    const result = Array.isArray(rpcData) ? (rpcData[0] || {}) : (rpcData || {});

    return jsonResponse({
      success: true,
      purchaseId: purchase.id,
      alreadyProcessed: result.already_processed ?? false,
      newBalance: result.new_balance ?? null,
    }, 200, origin);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500, origin);
  }
});