import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-TOKEN-PAYMENT] ${step}${detailsStr}`);
};

async function processTokenPurchase(supabase: any, purchaseId: string, userId: string, tokensAmount: number) {
  logStep("Processing token purchase", { purchaseId, userId, tokensAmount });

  // Check if already processed
  const { data: existingPurchase } = await supabase
    .from('token_purchases')
    .select('status')
    .eq('id', purchaseId)
    .single();

  if (existingPurchase?.status === 'paid') {
    logStep("Purchase already processed, skipping");
    return { alreadyProcessed: true };
  }

  // Update purchase status to paid
  await supabase
    .from('token_purchases')
    .update({ 
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', purchaseId);

  logStep("Purchase status updated to paid");

  // Get current user balance
  const { data: userTokens } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = userTokens?.balance || 0;
  const newBalance = currentBalance + tokensAmount;

  // Update user balance
  await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString()
    });

  logStep("User balance updated", { oldBalance: currentBalance, newBalance });

  // Create transaction record
  await supabase
    .from('token_transactions')
    .insert({
      user_id: userId,
      amount: tokensAmount,
      transaction_type: 'purchase',
      reference_id: purchaseId,
      description: `Compra de ${tokensAmount} tokens via Stripe`,
      balance_after: newBalance
    });

  logStep("Transaction record created");

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'token_purchase',
      title: 'Compra de Tokens Confirmada! 🎉',
      message: `Sua compra de ${tokensAmount} tokens foi confirmada e já está disponível em sua carteira!`,
      related_id: purchaseId
    });

  logStep("Notification created");
  return { success: true, newBalance };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Usuário não autenticado");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    logStep("User authenticated", { userId: user.id });

    const { sessionId, purchaseId } = await req.json();
    
    if (!sessionId && !purchaseId) {
      throw new Error("sessionId ou purchaseId é obrigatório");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the purchase record
    let purchase;
    if (purchaseId) {
      const { data } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('id', purchaseId)
        .eq('user_id', user.id)
        .single();
      purchase = data;
    } else if (sessionId) {
      const { data } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('pagarme_transaction_id', sessionId)
        .eq('user_id', user.id)
        .single();
      purchase = data;
    }

    if (!purchase) {
      throw new Error("Compra não encontrada");
    }

    logStep("Purchase found", { 
      purchaseId: purchase.id, 
      status: purchase.status,
      sessionId: purchase.pagarme_transaction_id 
    });

    // If already paid, just return success
    if (purchase.status === 'paid') {
      logStep("Purchase already paid");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'paid',
          message: 'Pagamento já foi processado'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check payment status in Stripe
    const stripeSessionId = purchase.pagarme_transaction_id;
    if (!stripeSessionId) {
      throw new Error("ID da sessão Stripe não encontrado");
    }

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    logStep("Stripe session retrieved", { 
      paymentStatus: session.payment_status,
      status: session.status
    });

    // Check if payment is complete
    if (session.payment_status === 'paid') {
      logStep("Payment confirmed in Stripe, processing tokens");
      
      const result = await processTokenPurchase(
        supabase, 
        purchase.id, 
        user.id, 
        purchase.amount
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'paid',
          message: 'Pagamento confirmado e tokens creditados!',
          ...result
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else if (session.payment_status === 'unpaid' && session.status === 'open') {
      // Payment still pending (boleto not paid yet)
      logStep("Payment still pending");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'pending',
          message: 'Pagamento ainda não confirmado. Aguardando pagamento do boleto.'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else if (session.status === 'expired') {
      // Session expired
      await supabase
        .from('token_purchases')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', purchase.id);

      logStep("Payment expired");
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'expired',
          message: 'Sessão de pagamento expirou'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Unknown status
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: session.payment_status,
        stripeStatus: session.status,
        message: 'Status do pagamento verificado'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
