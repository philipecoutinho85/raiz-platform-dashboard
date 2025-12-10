import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-TOKEN-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    logStep("Stripe key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with anon key to verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      logStep("Auth error", { error: userError?.message });
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    
    if (!user.email) throw new Error("Email do usuário não disponível");
    logStep("User authenticated", { userId: user.id, email: user.email });
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { amount } = await req.json();
    
    if (!amount || amount < 5) {
      throw new Error("Valor mínimo é 5 tokens (R$ 5,00)");
    }

    // 1 token = R$ 1,00
    const priceInCents = amount * 100;
    logStep("Price calculated", { tokens: amount, priceInCents });

    // Create pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('token_purchases')
      .insert({
        user_id: user.id,
        amount,
        price: amount,
        payment_method: 'stripe',
        status: 'pending'
      })
      .select()
      .single();

    if (purchaseError) {
      logStep("Error creating purchase", { error: purchaseError });
      throw purchaseError;
    }
    logStep("Purchase record created", { purchaseId: purchase.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://raiztoken.com.br";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `${amount} Raiz Tokens`,
              description: `Compra de ${amount} tokens para apoiar projetos`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_method_types: ["card", "boleto"],
      success_url: `${origin}/carteira?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carteira?payment=cancelled`,
      metadata: {
        purchase_id: purchase.id,
        user_id: user.id,
        tokens_amount: amount.toString(),
        type: "token_purchase"
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update purchase with Stripe session ID
    await supabase
      .from('token_purchases')
      .update({ 
        pagarme_transaction_id: session.id, // Reusing field for Stripe session ID
        status: 'pending'
      })
      .eq('id', purchase.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        purchaseId: purchase.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
