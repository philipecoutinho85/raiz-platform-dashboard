import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const MIN_TOKEN_PURCHASE = 5;
const MAX_TOKEN_PURCHASE = 1000000;

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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-TOKEN-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const requestOrigin = req.headers.get("origin") || "";
    if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

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
      throw new Error("AUTH_ERROR:Usuário não autenticado. Faça login novamente.");
    }
    
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
      const errorMessage = userError?.message?.toLowerCase() || '';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('jwt')) {
        throw new Error("TOKEN_EXPIRED:Sua sessão expirou. Por favor, faça login novamente.");
      }
      throw new Error("AUTH_ERROR:Usuário não autenticado. Faça login novamente.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!user.email) throw new Error("AUTH_ERROR:Email do usuário não disponível");
    logStep("User authenticated", { userId: user.id });

    const { amount } = await req.json();
    const tokenAmount = Number(amount);
    
    if (!Number.isInteger(tokenAmount)) {
      throw new Error("INVALID_TOKEN_AMOUNT");
    }

    if (tokenAmount < MIN_TOKEN_PURCHASE) {
      throw new Error("MIN_TOKEN_PURCHASE");
    }

    if (tokenAmount > MAX_TOKEN_PURCHASE) {
      throw new Error("MAX_TOKEN_PURCHASE");
    }

    const priceInCents = tokenAmount * 100;
    logStep("Price calculated", { tokens: tokenAmount, priceInCents });

    const { data: purchase, error: purchaseError } = await supabase
      .from('token_purchases')
      .insert({
        user_id: user.id,
        amount: tokenAmount,
        price: tokenAmount,
        payment_method: 'stripe',
        status: 'pending'
      })
      .select()
      .single();

    if (purchaseError) {
      logStep("Error creating purchase", { error: purchaseError.message });
      throw new Error("Erro ao iniciar compra de tokens");
    }
    logStep("Purchase record created", { purchaseId: purchase.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer");
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer");
    }

    const origin = allowedOrigins.has(requestOrigin) ? requestOrigin : "https://raiztoken.com.br";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `${tokenAmount} Raiz Tokens`,
              description: `Compra de ${tokenAmount} tokens para apoiar projetos`,
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
        tokens_amount: tokenAmount.toString(),
        type: "token_purchase"
      }
    });

    logStep("Checkout session created (embedded mode)", { sessionId: session.id });

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
    const message = String(error?.message || "Erro ao iniciar checkout");
    logStep("ERROR", { message });
    const isAuthError = message.startsWith("AUTH_ERROR") || message.startsWith("TOKEN_EXPIRED");

    const publicErrors: Record<string, string> = {
      INVALID_TOKEN_AMOUNT: "Valor inválido para compra de tokens.",
      MIN_TOKEN_PURCHASE: "A compra mínima é de 5 tokens.",
      MAX_TOKEN_PURCHASE: "Valor máximo de compra excedido.",
    };

    const publicError = isAuthError
      ? message
      : publicErrors[message] || "Erro ao iniciar checkout de tokens";

    return new Response(
      JSON.stringify({ error: publicError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: isAuthError ? 401 : 500,
      }
    );
  }
});
