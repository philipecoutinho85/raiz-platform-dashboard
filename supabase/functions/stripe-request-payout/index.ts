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
  ["INVALID_AMOUNT", "Valor inválido."],
  ["INVALID_PROJECT_ID", "Projeto inválido."],
  ["STRIPE_ACCOUNT_REQUIRED", "Finalize sua verificação para continuar."],
  ["STRIPE_VERIFICATION_REQUIRED", "Finalize sua verificação Stripe para continuar."],
  ["INSUFFICIENT_BALANCE", "Saldo indisponível para o saque solicitado."],
  ["METHOD_NOT_ALLOWED", "Método não permitido."],
]);

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-REQUEST-PAYOUT] ${step}${detailsStr}`);
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
    if (userError || !userData.user) throw new Error("AUTH_REQUIRED");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { projectId, amount } = await req.json();
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      throw new Error("INVALID_AMOUNT");
    }

    if (projectId && (typeof projectId !== "string" || !isUuid(projectId))) {
      throw new Error("INVALID_PROJECT_ID");
    }

    const amountCents = Math.round(amount * 100);
    const payoutScope = projectId || "general";
    const payoutIdempotencyKey = `creator-payout-${user.id}-${payoutScope}-${amountCents}`;
    logStep("Payout request", { projectId, amountCents });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("INTERNAL_ERROR");
    if (!profile.stripe_account_id) {
      throw new Error("STRIPE_ACCOUNT_REQUIRED");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const isVerified =
      account.payouts_enabled &&
      account.charges_enabled &&
      (!account.requirements?.currently_due || account.requirements.currently_due.length === 0);

    if (!isVerified) {
      await supabase
        .from("profiles")
        .update({
          stripe_account_status: account.payouts_enabled ? "active" : "incomplete",
          stripe_onboarding_complete: isVerified,
        })
        .eq("id", user.id);

      throw new Error("STRIPE_VERIFICATION_REQUIRED");
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    });

    const availableBalance = balance.available.filter((b) => b.currency === "brl").reduce((sum, b) => sum + b.amount, 0);

    logStep("Balance check", { requested: amountCents, hasBalance: availableBalance >= amountCents });

    if (availableBalance < amountCents) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: "brl",
        metadata: {
          user_id: user.id,
          project_id: payoutScope,
        },
      },
      {
        stripeAccount: profile.stripe_account_id,
        idempotencyKey: payoutIdempotencyKey,
      },
    );

    logStep("Payout created", { payoutId: payout.id, status: payout.status });

    const { data: existingPayout } = await supabase
      .from("creator_payouts")
      .select("id, status")
      .eq("stripe_payout_id", payout.id)
      .maybeSingle();

    if (existingPayout) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyProcessed: true,
          payoutId: payout.id,
          status: existingPayout.status,
          amount: amountCents / 100,
          message: "Saque ja estava registrado e em processamento.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    await supabase.from("creator_payouts").insert({
      user_id: user.id,
      project_id: projectId || null,
      amount: amountCents,
      stripe_payout_id: payout.id,
      status: payout.status === "paid" ? "completed" : "processing",
    });

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "payout_requested",
      title: "Saque solicitado",
      message: `Seu saque de R$ ${(amountCents / 100).toFixed(2)} foi solicitado e está sendo processado.`,
      related_id: projectId || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payoutId: payout.id,
        status: payout.status,
        amount: amountCents / 100,
        message: "Saque solicitado com sucesso! O valor será depositado em sua conta em até 2 dias úteis.",
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
