import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-REQUEST-PAYOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { projectId, amount } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const amountCents = Math.round(amount * 100);
    logStep("Payout request", { projectId, amountCents });

    // Get user profile with Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (!profile.stripe_account_id) throw new Error("Conta Stripe não configurada");
    if (!profile.stripe_onboarding_complete) throw new Error("Verificação da conta não completada");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check available balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id
    });

    const availableBalance = balance.available
      .filter(b => b.currency === 'brl')
      .reduce((sum, b) => sum + b.amount, 0);

    logStep("Balance check", { available: availableBalance, requested: amountCents });

    if (availableBalance < amountCents) {
      throw new Error(`Saldo insuficiente. Disponível: R$ ${(availableBalance / 100).toFixed(2)}`);
    }

    // Create payout to the connected account's bank
    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: 'brl',
        metadata: {
          user_id: user.id,
          project_id: projectId || 'general',
        },
      },
      {
        stripeAccount: profile.stripe_account_id,
      }
    );

    logStep("Payout created", { payoutId: payout.id, status: payout.status });

    // Record payout request
    await supabase.from('creator_payouts').insert({
      user_id: user.id,
      project_id: projectId || null,
      amount: amountCents,
      stripe_payout_id: payout.id,
      status: payout.status === 'paid' ? 'completed' : 'processing',
    });

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'payout_requested',
      title: 'Saque solicitado',
      message: `Seu saque de R$ ${(amountCents / 100).toFixed(2)} foi solicitado e está sendo processado.`,
      related_id: projectId || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        payoutId: payout.id,
        status: payout.status,
        amount: amountCents / 100,
        message: 'Saque solicitado com sucesso! O valor será depositado em sua conta em até 2 dias úteis.'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
