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
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const webhookData = await req.json();
    
    console.log('Webhook recebido do Pagar.me:', JSON.stringify(webhookData, null, 2));
    
    const { id: orderId, status, metadata } = webhookData;
    
    if (!orderId || !metadata?.purchase_id) {
      console.error('Webhook inválido - faltando dados obrigatórios');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const purchaseId = metadata.purchase_id;
    const userId = metadata.user_id;
    const tokensAmount = parseInt(metadata.tokens_amount);
    
    // Buscar compra no banco
    const { data: purchase, error: fetchError } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();
    
    if (fetchError || !purchase) {
      console.error('Compra não encontrada:', purchaseId);
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Se já foi processado, ignorar
    if (purchase.status === 'paid') {
      console.log('Pagamento já processado anteriormente');
      return new Response(
        JSON.stringify({ message: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Mapear status do Pagar.me
    let newStatus = 'pending';
    if (status === 'paid') {
      newStatus = 'paid';
    } else if (status === 'failed' || status === 'canceled') {
      newStatus = 'failed';
    }
    
    // Atualizar status da compra
    await supabase
      .from('token_purchases')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);
    
    console.log(`Status da compra ${purchaseId} atualizado para: ${newStatus}`);
    
    // Se pagamento confirmado, creditar tokens
    if (newStatus === 'paid') {
      console.log(`Creditando ${tokensAmount} tokens para usuário ${userId}`);
      
      // Buscar saldo atual
      const { data: userTokens } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      const currentBalance = userTokens?.balance || 0;
      const newBalance = currentBalance + tokensAmount;
      
      // Atualizar saldo
      const { error: updateError } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('Erro ao atualizar tokens:', updateError);
        throw updateError;
      }
      
      // Criar transação no histórico
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          amount: tokensAmount,
          transaction_type: 'purchase',
          reference_id: purchaseId,
          description: `Compra de ${tokensAmount} tokens via ${purchase.payment_method}`,
          balance_after: newBalance
        });
      
      if (transactionError) {
        console.error('Erro ao criar transação:', transactionError);
        throw transactionError;
      }
      
      console.log(`Tokens creditados com sucesso! Novo saldo: ${newBalance}`);
      
      // Criar notificação para o usuário (push notification)
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'token_purchase',
          title: 'Compra de Tokens Confirmada! 🎉',
          message: `Sua compra de ${tokensAmount} tokens foi confirmada e já está disponível em sua carteira!`,
          related_id: purchaseId
        });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processado com sucesso',
        status: newStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});