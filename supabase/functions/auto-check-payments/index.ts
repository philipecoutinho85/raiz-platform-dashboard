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
    
    console.log('Starting automatic payment verification...');

    // Buscar todas as compras pendentes dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: pendingPurchases, error: fetchError } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    if (fetchError) {
      console.error('Error fetching pending purchases:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingPurchases?.length || 0} pending purchases`);

    let processedCount = 0;

    for (const purchase of pendingPurchases || []) {
      if (!purchase.pagarme_transaction_id) {
        console.log(`Skipping purchase ${purchase.id} - no Pagar.me transaction ID`);
        continue;
      }

      try {
        console.log(`Checking Pagar.me order: ${purchase.pagarme_transaction_id}`);

        const response = await fetch(`https://api.pagar.me/core/v5/orders/${purchase.pagarme_transaction_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(pagarmeSecretKey + ':')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Pagar.me API error for order ${purchase.pagarme_transaction_id}:`, response.status);
          continue;
        }

        const orderData = await response.json();
        console.log(`Order ${purchase.pagarme_transaction_id} status:`, orderData.status);

        // Se pagamento foi confirmado, processar
        if (orderData.status === 'paid') {
          console.log(`Processing payment for purchase ${purchase.id}...`);

          // Atualizar status da compra
          await supabase
            .from('token_purchases')
            .update({ 
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', purchase.id);

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
              reference_id: purchase.id,
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
              related_id: purchase.id
            });

          processedCount++;
          console.log(`Payment processed successfully for purchase ${purchase.id}`);
        }
      } catch (error) {
        console.error(`Error processing purchase ${purchase.id}:`, error);
        // Continua para o próximo
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processedCount} payments out of ${pendingPurchases?.length || 0} pending`,
        processedCount,
        totalPending: pendingPurchases?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-check-payments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
