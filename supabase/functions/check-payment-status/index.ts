import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { purchaseId } = await req.json();
    
    if (!purchaseId) {
      return new Response(
        JSON.stringify({ error: 'purchaseId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking payment status for purchase:', purchaseId);

    // Buscar compra no banco
    const { data: purchase, error: fetchError } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();
    
    if (fetchError || !purchase) {
      console.error('Purchase not found:', purchaseId);
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se já foi pago, retornar
    if (purchase.status === 'paid') {
      return new Response(
        JSON.stringify({ 
          message: 'Payment already processed',
          status: 'paid'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar status no Pagar.me
    const pagarmeOrderId = purchase.pagarme_transaction_id;
    if (!pagarmeOrderId) {
      return new Response(
        JSON.stringify({ error: 'No Pagar.me transaction ID found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking Pagar.me order:', pagarmeOrderId);

    const response = await fetch(`https://api.pagar.me/core/v5/orders/${pagarmeOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeSecretKey + ':')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Pagar.me API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to check payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await response.json();
    console.log('Pagar.me order status:', orderData.status);

    // Se pagamento foi confirmado no Pagar.me, processar
    if (orderData.status === 'paid') {
      console.log('Payment confirmed! Processing...');

      // Atualizar status da compra
      await supabase
        .from('token_purchases')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId);

      // Buscar saldo atual do usuário
      const { data: userTokens } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', purchase.user_id)
        .single();
      
      const currentBalance = userTokens?.balance || 0;
      const newBalance = currentBalance + purchase.amount;
      
      // Atualizar saldo
      await supabase
        .from('user_tokens')
        .upsert({
          user_id: purchase.user_id,
          balance: newBalance,
          updated_at: new Date().toISOString()
        });
      
      // Criar transação no histórico
      await supabase
        .from('token_transactions')
        .insert({
          user_id: purchase.user_id,
          amount: purchase.amount,
          transaction_type: 'purchase',
          reference_id: purchaseId,
          description: `Compra de ${purchase.amount} tokens via ${purchase.payment_method}`,
          balance_after: newBalance
        });
      
      // Criar notificação
      await supabase
        .from('notifications')
        .insert({
          user_id: purchase.user_id,
          type: 'token_purchase',
          title: 'Compra de Tokens Confirmada! 🎉',
          message: `Sua compra de ${purchase.amount} tokens foi confirmada e já está disponível em sua carteira!`,
          related_id: purchaseId
        });

      console.log('Payment processed successfully!');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment confirmed and tokens credited',
          status: 'paid',
          balance: newBalance
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar status atual
    return new Response(
      JSON.stringify({ 
        message: 'Payment still pending',
        status: orderData.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
