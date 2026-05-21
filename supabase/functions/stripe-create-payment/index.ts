import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CREATE-PAYMENT] ${step}${detailsStr}`);
};

const enrichError = (message: string, sourceError?: any) => {
  return Object.assign(new Error(message), {
    code: sourceError?.code,
    details: sourceError?.details,
    hint: sourceError?.hint,
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let currentStep = "Function started";

  try {
    currentStep = "Function started";
    logStep("Function started");

    currentStep = "Validate Stripe secret";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    currentStep = "Initialize Supabase client";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    currentStep = "Read authorization header";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    currentStep = "Authenticate user";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw enrichError(`Auth error: ${userError.message}`, userError);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    currentStep = "Parse payment request";
    const { projectId, amount } = await req.json();
    if (!projectId || !amount) throw new Error("Missing projectId or amount");
    
    const amountCents = Math.round(amount * 100);
    if (amountCents < 500) throw new Error("Minimum amount is R$5.00");
    logStep("Payment request", { projectId, amount, amountCents });

    // Get project using only columns that exist in production.
    currentStep = "Load project";
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        user_id,
        title,
        status,
        goal,
        platform_fee_percentage,
        project_type
      `)
      .eq('id', projectId)
      .single();

    if (projectError) throw enrichError(`Project error: ${projectError.message}`, projectError);
    if (!project) throw new Error("Project not found");
    logStep("Project loaded", {
      projectId: project.id,
      creatorId: project.user_id,
      status: project.status,
      goal: project.goal,
      projectType: project.project_type,
    });

    if (project.status !== 'approved') {
      throw new Error("Projeto nao esta aprovado para receber pagamentos");
    }
    if (project.user_id === user.id) {
      throw new Error("Criador nao pode apoiar o proprio projeto por pagamento Stripe");
    }

    currentStep = "Load creator profile";
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('id, nome, sobrenome, email, stripe_account_id, stripe_onboarding_complete')
      .eq('id', project.user_id)
      .single();

    if (creatorError) throw enrichError(`Creator profile error: ${creatorError.message}`, creatorError);
    if (!creatorProfile) throw new Error("Perfil do criador nao encontrado");

    if (!creatorProfile?.stripe_account_id) {
      throw new Error("Criador ainda não configurou a conta para receber pagamentos");
    }
    if (!creatorProfile.stripe_onboarding_complete) {
      throw new Error("Criador ainda não completou a verificação da conta");
    }

    logStep("Project found", { 
      title: project.title, 
      creatorId: creatorProfile.id,
      stripeAccountId: creatorProfile.stripe_account_id,
      platformFee: project.platform_fee_percentage,
      projectType: project.project_type
    });

    // Calculate platform fee and creator amount based on project type
    // Seed projects: 0% fee, Regular projects: 10% fee (or custom)
    currentStep = "Calculate payment fees";
    const projectType = project.project_type || 'regular';
    const platformFeePercent = projectType === 'seed' ? 0 : (project.platform_fee_percentage || 10);
    const platformFeeCents = Math.round(amountCents * (platformFeePercent / 100));
    const creatorAmountCents = amountCents - platformFeeCents;

    logStep("Fee calculation", { 
      projectType,
      platformFeePercent, 
      platformFeeCents, 
      creatorAmountCents 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    currentStep = "Find Stripe customer";
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://raiztoken.com.br";

    // Create Checkout Session with transfer to connected account
    currentStep = "Create Stripe checkout session";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ['card', 'boleto', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Apoio ao projeto: ${project.title}`,
              description: `Contribuição de R$ ${(amount).toFixed(2)} para o projeto`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: creatorProfile.stripe_account_id,
        },
        metadata: {
          project_id: projectId,
          project_type: projectType,
          user_id: user.id,
          creator_id: creatorProfile.id,
          platform_fee: platformFeeCents,
          creator_amount: creatorAmountCents,
        },
      },
      success_url: `${origin}/projeto/${projectId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/projeto/${projectId}?payment=cancelled`,
      metadata: {
        project_id: projectId,
        project_type: projectType,
        user_id: user.id,
        creator_id: creatorProfile.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Record payment intent (pending)
    currentStep = "Insert stripe_payments pending record";
    const { error: paymentInsertError } = await supabase.from('stripe_payments').insert({
      user_id: user.id,
      project_id: projectId,
      stripe_session_id: session.id,
      amount: amountCents,
      platform_fee: platformFeeCents,
      creator_amount: creatorAmountCents,
      status: 'pending'
    });

    if (paymentInsertError) {
      throw enrichError(`Stripe payment insert error: ${paymentInsertError.message}`, paymentInsertError);
    }

    currentStep = "Return checkout URL";
    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const safeError = error as any;
    const errorMessage = safeError?.message ?? String(error);
    const errorCode = safeError?.code ?? null;
    const errorDetails = safeError?.details ?? null;
    const errorHint = safeError?.hint ?? null;

    console.error("[STRIPE-CREATE-PAYMENT] ERROR", {
      step: currentStep,
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      hint: errorHint,
    });

    return new Response(
      JSON.stringify({
        error: errorMessage,
        step: currentStep,
        code: errorCode,
        details: errorDetails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
