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
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logStep("Auth error", { error: "No valid authorization header" });
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    
    // Create auth client with user's JWT to validate the token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      logStep("Auth error", { error: userError?.message || "User not found" });
      // Check if error is related to expired token
      const errorMessage = userError?.message?.toLowerCase() || '';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('jwt')) {
        throw new Error("TOKEN_EXPIRED:Sua sessão expirou. Por favor, faça login novamente.");
      }
      throw new Error("AUTH_ERROR:Usuário não autenticado. Faça login novamente.");
    }
    
    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!user.email) throw new Error("Email do usuário não disponível");
    logStep("User authenticated", { userId: user.id, email: user.email });

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
    } else {
      // Create a new customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://raiztoken.com.br";

    // Create Stripe Checkout session with embedded mode (ui_mode: 'embedded')
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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
      payment_method_options: {
        boleto: {
          expires_after_days: 3
        }
      },
      ui_mode: "embedded",
      return_url: `${origin}/carteira?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        purchase_id: purchase.id,
        user_id: user.id,
        tokens_amount: amount.toString(),
        type: "token_purchase"
      }
    });

    logStep("Checkout session created (embedded mode)", { sessionId: session.id });

    // Update purchase with Stripe session ID
    await supabase
      .from('token_purchases')
      .update({ 
        pagarme_transaction_id: session.id,
        status: 'pending'
      })
      .eq('id', purchase.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: session.client_secret,
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
