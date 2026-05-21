import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-reconcile-secret",
};

const allowedAdminTypes = new Set(["master", "financial"]);

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-RECONCILE-TOKEN-PURCHASE] ${step}${detailsStr}`);
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminReconcileSecret = Deno.env.get("ADMIN_RECONCILE_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl) throw new Error("SUPABASE_URL not configured");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const internalSecretHeader = req.headers.get("x-admin-reconcile-secret")?.trim();
    const isInternalAdmin = Boolean(
      adminReconcileSecret &&
      internalSecretHeader &&
      internalSecretHeader === adminReconcileSecret,
    );

    let callerId = "internal_admin";

    if (isInternalAdmin) {
      logStep("Internal secret authentication accepted");
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const token = authHeader.replace("Bearer ", "").trim();
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      const caller = authData?.user;

      if (authError || !caller) {
        logStep("Auth failed", { error: authError?.message });
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      callerId = caller.id;

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

        return jsonResponse({ error: "Forbidden: financial administrator role required" }, 403);
      }
    }

    const { purchaseId, sessionId } = await req.json();

    if (!purchaseId && !sessionId) {
      return jsonResponse({ error: "purchaseId or sessionId is required" }, 400);
    }

    let purchaseQuery = supabase.from("token_purchases").select("*");

    if (purchaseId) {
      purchaseQuery = purchaseQuery.eq("id", purchaseId);
    } else {
      purchaseQuery = purchaseQuery.eq("pagarme_transaction_id", sessionId);
    }

    const { data: purchase, error: purchaseError } = await purchaseQuery.maybeSingle();

    if (purchaseError) {
      logStep("Purchase lookup failed", { error: purchaseError.message });
      return jsonResponse({ error: "Purchase lookup failed", details: purchaseError.message }, 500);
    }

    if (!purchase) {
      return jsonResponse({ error: "Token purchase not found" }, 404);
    }

    const stripeSessionId = purchase.pagarme_transaction_id;
    if (!stripeSessionId) {
      return jsonResponse({ error: "Token purchase does not have a Stripe session id" }, 409);
    }

    logStep("Purchase found", {
      purchaseId: purchase.id,
      status: purchase.status,
      adminId: callerId,
      authMode: isInternalAdmin ? "internal_secret" : "jwt_admin",
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

    logStep("Stripe session retrieved", {
      purchaseId: purchase.id,
      paymentStatus: session.payment_status,
      stripeStatus: session.status,
    });

    if (session.metadata?.purchase_id && session.metadata.purchase_id !== purchase.id) {
      return jsonResponse({ error: "Stripe metadata purchase mismatch" }, 409);
    }

    if (session.metadata?.user_id && session.metadata.user_id !== purchase.user_id) {
      return jsonResponse({ error: "Stripe metadata user mismatch" }, 409);
    }

    if (session.metadata?.tokens_amount && Number(session.metadata.tokens_amount) !== Number(purchase.amount)) {
      return jsonResponse({ error: "Stripe metadata token amount mismatch" }, 409);
    }

    if (session.payment_status !== "paid") {
      return jsonResponse({
        success: true,
        purchaseId: purchase.id,
        userId: purchase.user_id,
        status: session.payment_status,
        stripeStatus: session.status,
        message: "Stripe session is not paid. Wallet was not changed.",
      });
    }

    const paymentMethodTypes = session.payment_method_types || [];
    const paymentType = paymentMethodTypes.includes("boleto")
      ? "boleto"
      : paymentMethodTypes.includes("pix")
        ? "pix"
        : "card";

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
      logStep("Token purchase RPC failed", {
        purchaseId: purchase.id,
        code: rpcError.code,
        message: rpcError.message,
      });

      return jsonResponse(
        {
          error: "process_token_purchase_atomic failed",
          code: rpcError.code,
          details: rpcError.message,
        },
        500,
      );
    }

    const result = Array.isArray(rpcData) ? (rpcData[0] || {}) : (rpcData || {});

    logStep("Token purchase reconciled", {
      purchaseId: purchase.id,
      alreadyProcessed: result.already_processed ?? false,
    });

    return jsonResponse({
      success: true,
      purchaseId: purchase.id,
      userId: purchase.user_id,
      status: "paid",
      alreadyProcessed: result.already_processed ?? false,
      newBalance: result.new_balance ?? null,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return jsonResponse({ error: error.message }, 500);
  }
});