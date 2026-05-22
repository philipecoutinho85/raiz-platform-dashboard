import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const allowedOrigins = new Set([
  "https://raiztoken.com.br",
  "https://www.raiztoken.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://raiztoken.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

const publicErrors = new Map<string, string>([
  ["AUTH_REQUIRED", "Usuário não autenticado."],
  ["METHOD_NOT_ALLOWED", "Método não permitido."],
]);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-CHECK-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestOrigin = req.headers.get("origin") || "";
  if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  if (!["GET", "POST"].includes(req.method)) {
    return new Response(JSON.stringify({ error: publicErrors.get("METHOD_NOT_ALLOWED") }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("INTERNAL_ERROR");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("AUTH_REQUIRED");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_account_status, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("INTERNAL_ERROR");

    if (!profile.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          verified: false,
          status: "not_connected",
          balance: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let account;
    try {
      account = await stripe.accounts.retrieve(profile.stripe_account_id);
      logStep("Account retrieved", { accountId: account.id, chargesEnabled: account.charges_enabled });
    } catch (accountError: any) {
      logStep("Account not accessible", { reason: accountError?.type || "unknown" });

      await supabase
        .from("profiles")
        .update({
          stripe_account_id: null,
          stripe_account_status: null,
          stripe_onboarding_complete: false,
        })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({
          connected: false,
          verified: false,
          status: "not_connected",
          balance: 0,
          message: "Conta anterior não acessível. Por favor, configure uma nova conta.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const isVerified = account.charges_enabled && account.payouts_enabled;
    let status = "pending";
    if (isVerified) {
      status = "active";
    } else if (account.requirements?.currently_due?.length) {
      status = "incomplete";
    }

    let balance = 0;
    if (isVerified) {
      try {
        const stripeBalance = await stripe.balance.retrieve({
          stripeAccount: profile.stripe_account_id,
        });
        balance = stripeBalance.available.filter((b) => b.currency === "brl").reduce((sum, b) => sum + b.amount, 0);
      } catch (e) {
        logStep("Balance retrieval failed", { source: e });
      }
    }

    if (profile.stripe_account_status !== status || profile.stripe_onboarding_complete !== isVerified) {
      await supabase
        .from("profiles")
        .update({
          stripe_account_status: status,
          stripe_onboarding_complete: isVerified,
        })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        connected: true,
        verified: isVerified,
        status,
        balance,
        requirements: account.requirements?.currently_due || [],
        accountId: profile.stripe_account_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    logStep("ERROR", { error: errorMessage, source: error });
    const publicMessage = publicErrors.get(errorMessage) || "Erro ao processar solicitação.";
    const statusCode = errorMessage === "AUTH_REQUIRED" ? 401 : 500;

    return new Response(JSON.stringify({ error: publicMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
