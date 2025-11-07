import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  userId: string;
  amount: number; // quantidade de tokens
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY')!;
    
    console.log('Chave Pagar.me encontrada:', pagarmeKey ? `${pagarmeKey.substring(0, 8)}...` : 'NÃO ENCONTRADA');
    
    if (!pagarmeKey) {
      throw new Error('PAGARME_SECRET_KEY não configurada');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { userId, amount, paymentMethod }: PaymentRequest = await req.json();
    
    // Calcular preço (R$ 0,10 por token)
    const price = amount * 0.10;
    const priceInCents = Math.round(price * 100);
    
    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, sobrenome, email, cpf, celular')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      throw new Error('Perfil do usuário não encontrado');
    }
    
    if (!profile.celular) {
      throw new Error('Telefone não cadastrado. Por favor, atualize seu perfil.');
    }
    
    // Criar transação no banco antes de chamar Pagar.me
    const { data: purchase, error: purchaseError } = await supabase
      .from('token_purchases')
      .insert({
        user_id: userId,
        amount,
        price,
        payment_method: paymentMethod,
        status: 'pending'
      })
      .select()
      .single();
    
    if (purchaseError) {
      console.error('Erro ao criar compra:', purchaseError);
      throw purchaseError;
    }
    
    // Preparar payload para Pagar.me
    const pagarmePayload: any = {
      amount: priceInCents,
      currency: 'BRL',
      customer: {
        name: `${profile.nome} ${profile.sobrenome}`,
        email: profile.email,
        document: profile.cpf.replace(/\D/g, ''),
        type: 'individual',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: profile.celular.substring(0, 2),
            number: profile.celular.substring(2)
          }
        }
      },
      items: [
        {
          amount: priceInCents,
          description: `${amount} Raiz Tokens`,
          quantity: 1,
          code: purchase.id
        }
      ],
      metadata: {
        purchase_id: purchase.id,
        user_id: userId,
        tokens_amount: amount
      }
    };
    
    // Configurar método de pagamento
    if (paymentMethod === 'pix') {
      pagarmePayload.payments = [{
        payment_method: 'pix',
        pix: {
          expires_in: 3600 // 1 hora
        }
      }];
    } else if (paymentMethod === 'credit_card') {
      // Para cartão de crédito, criar checkout sem dados do cartão
      // O usuário será redirecionado para página do Pagar.me
      pagarmePayload.payments = [{
        payment_method: 'checkout'
      }];
      pagarmePayload.closed = false; // Permitir que o usuário escolha o método na página
    } else if (paymentMethod === 'boleto') {
      pagarmePayload.payments = [{
        payment_method: 'boleto',
        boleto: {
          bank: '033',
          instructions: `Pagamento de ${amount} Raiz Tokens`,
          due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 dias
        }
      }];
    }
    
    console.log('Criando ordem no Pagar.me:', JSON.stringify(pagarmePayload, null, 2));
    
    // Criar ordem no Pagar.me (usando Basic Auth com base64)
    const authString = btoa(`${pagarmeKey}:`);
    console.log('Auth string criada (primeiros chars):', authString.substring(0, 20) + '...');
    
    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(pagarmePayload)
    });
    
    console.log('Status da resposta Pagar.me:', pagarmeResponse.status);
    
    const pagarmeData = await pagarmeResponse.json();
    
    console.log('Resposta do Pagar.me:', JSON.stringify(pagarmeData, null, 2));
    
    if (!pagarmeResponse.ok) {
      console.error('Erro do Pagar.me:', pagarmeData);
      
      // Atualizar status da compra para failed
      await supabase
        .from('token_purchases')
        .update({ status: 'failed' })
        .eq('id', purchase.id);
      
      throw new Error(pagarmeData.message || 'Erro ao processar pagamento');
    }
    
    // Atualizar compra com ID da transação do Pagar.me
    await supabase
      .from('token_purchases')
      .update({ 
        pagarme_transaction_id: pagarmeData.id,
        status: pagarmeData.status === 'paid' ? 'paid' : 'pending'
      })
      .eq('id', purchase.id);
    
    // Se já foi pago (improvável para PIX/Boleto), creditar tokens
    if (pagarmeData.status === 'paid') {
      const { data: userTokens } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      const currentBalance = userTokens?.balance || 0;
      const newBalance = currentBalance + amount;
      
      await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          balance: newBalance
        });
      
      await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          amount,
          transaction_type: 'purchase',
          reference_id: purchase.id,
          description: `Compra de ${amount} tokens`,
          balance_after: newBalance
        });
    }
    
    // Extrair URL de pagamento baseado no método
    let paymentUrl = null;
    
    if (paymentMethod === 'credit_card') {
      // Para cartão, retornar URL do checkout
      paymentUrl = pagarmeData.checkouts?.[0]?.payment_url || null;
    } else if (pagarmeData.charges && pagarmeData.charges.length > 0) {
      const charge = pagarmeData.charges[0];
      
      if (paymentMethod === 'pix' && charge.last_transaction?.qr_code_url) {
        paymentUrl = charge.last_transaction.qr_code_url;
      } else if (paymentMethod === 'boleto' && charge.last_transaction?.pdf) {
        paymentUrl = charge.last_transaction.pdf;
      }
    }
    
    console.log('URL de pagamento extraída:', paymentUrl);
    
    return new Response(
      JSON.stringify({
        success: true,
        purchaseId: purchase.id,
        pagarmeOrderId: pagarmeData.id,
        status: pagarmeData.status,
        paymentUrl,
        paymentMethod,
        charges: pagarmeData.charges
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});