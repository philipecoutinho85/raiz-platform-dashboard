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
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}${detailsStr}`);
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

  if (req.method !== "POST") {
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
    if (userError || !userData.user?.email) throw new Error("AUTH_REQUIRED");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id, nome, sobrenome, email")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("INTERNAL_ERROR");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let accountId = profile.stripe_account_id;
    let needsNewAccount = !accountId;

    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
        logStep("Existing account verified", { accountId });
      } catch (accountError: any) {
        logStep("Account not accessible, will create new", { oldAccountId: accountId, reason: accountError?.type || "unknown" });
        needsNewAccount = true;
        accountId = null;
      }
    }

    if (needsNewAccount) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          user_id: user.id,
          platform: "raiz_token",
        },
      });

      accountId = account.id;
      logStep("Stripe account created", { accountId });

      await supabase
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_account_status: "pending",
          stripe_onboarding_complete: false,
        })
        .eq("id", user.id);
    }

    const safeOrigin = allowedOrigins.has(requestOrigin) ? requestOrigin : "https://raiztoken.com.br";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${safeOrigin}/meus-projetos?stripe_refresh=true`,
      return_url: `${safeOrigin}/meus-projetos?stripe_success=true`,
      type: "account_onboarding",
    });

    logStep("Account link created", { accountId });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId,
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
