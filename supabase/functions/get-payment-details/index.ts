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
    const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { transactionId } = await req.json();
    
    if (!transactionId) {
      throw new Error('Transaction ID é obrigatório');
    }
    
    // Buscar detalhes da transação no Pagar.me
    const authString = btoa(`${pagarmeKey}:`);
    
    const pagarmeResponse = await fetch(`https://api.pagar.me/core/v5/orders/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pagarmeResponse.ok) {
      throw new Error('Erro ao buscar detalhes do pagamento');
    }
    
    const pagarmeData = await pagarmeResponse.json();
    
    let result: any = {
      status: pagarmeData.status,
      amount: pagarmeData.amount,
    };
    
    // Extrair dados específicos baseado no método de pagamento
    if (pagarmeData.charges && pagarmeData.charges.length > 0) {
      const charge = pagarmeData.charges[0];
      const lastTransaction = charge.last_transaction;
      
      if (charge.payment_method === 'pix' && lastTransaction) {
        result.qr_code = lastTransaction.qr_code;
        result.qr_code_url = lastTransaction.qr_code_url;
      } else if (charge.payment_method === 'boleto' && lastTransaction) {
        result.boleto_url = lastTransaction.pdf;
        result.boleto_barcode = lastTransaction.line;
      }
    }
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do pagamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
