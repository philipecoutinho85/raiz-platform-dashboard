import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Log para debug (apenas primeiros caracteres da chave)
    console.log('[Process Withdrawal] Using API key starting with:', pagarmeKey.substring(0, 8) + '...');
    console.log('[Process Withdrawal] API key type:', pagarmeKey.startsWith('sk_test') ? 'SANDBOX' : pagarmeKey.startsWith('sk_') ? 'PRODUCTION' : 'UNKNOWN');

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Pegar token de autenticação do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { withdrawalId, action, rejectionReason } = await req.json();

    console.log('[Process Withdrawal] Processing:', { withdrawalId, action });

    // Buscar withdrawal
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*, projects(title, user_id)')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Pegar dados do usuário admin do token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const adminId = user?.id;

    if (action === 'reject') {
      // Rejeitar resgate
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: 'Withdrawal rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar aprovação e transferência via Pagar.me
    if (action === 'approve') {
      console.log('[Process Withdrawal] Approving withdrawal');

      // Verificar se é PIX - aprovação manual sem Pagar.me
      if (withdrawal.payment_method === 'pix') {
        console.log('[Process Withdrawal] PIX payment - manual approval');
        
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', withdrawalId);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Resgate aprovado! Agora você deve processar o PIX manualmente usando os dados fornecidos.',
            requiresManual: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para transferência bancária, tentar usar Pagar.me
      console.log('[Process Withdrawal] Creating recipient on Pagar.me');

      // Criar Basic Auth header (secret_key + ":" em base64)
      const basicAuth = btoa(`${pagarmeKey}:`);

      // 1. Criar recipient no Pagar.me (se ainda não existe)
      let recipientId = withdrawal.pagarme_recipient_id;

      if (!recipientId) {
        const recipientPayload = {
          type: 'individual',
          name: withdrawal.bank_account.holder_name,
          email: withdrawal.bank_account.email || 'user@example.com',
          document: withdrawal.bank_account.document,
          default_bank_account: {
            holder_name: withdrawal.bank_account.holder_name,
            holder_type: withdrawal.bank_account.holder_type || 'individual',
            holder_document: withdrawal.bank_account.document,
            bank: withdrawal.bank_account.bank_code,
            branch_number: withdrawal.bank_account.branch,
            branch_check_digit: withdrawal.bank_account.branch_check_digit || '0',
            account_number: withdrawal.bank_account.account,
            account_check_digit: withdrawal.bank_account.account_check_digit,
            type: withdrawal.bank_account.account_type || 'checking'
          },
          transfer_settings: {
            transfer_enabled: true,
            transfer_interval: 'Daily',
            transfer_day: 0
          },
          automatic_anticipation_settings: {
            enabled: false
          }
        };

        console.log('[Process Withdrawal] Recipient payload:', JSON.stringify(recipientPayload, null, 2));
      
      const recipientResponse = await fetch('https://api.pagar.me/core/v5/recipients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(recipientPayload)
      });

        if (!recipientResponse.ok) {
          const errorData = await recipientResponse.text();
          console.error('[Process Withdrawal] Pagar.me recipient error:', errorData);
          console.error('[Process Withdrawal] Response status:', recipientResponse.status);
          
          // Se o erro é relacionado a permissões Split/PSP, atualizar withdrawal com status especial
          if (errorData.includes('split') || errorData.includes('recipient') || errorData.includes('action_forbidden')) {
            console.log('[Process Withdrawal] Split/PSP not available - marking for manual processing');
            
            await supabase
              .from('withdrawals')
              .update({
                status: 'pending_manual',
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString(),
                rejection_reason: 'Transferência automática indisponível. Será processada manualmente pela equipe.'
              })
              .eq('id', withdrawalId);
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                requiresManual: true,
                message: 'Erro de permissão do Pagar.me. SOLUÇÃO: 1) Acesse o dashboard do Pagar.me, 2) Vá em Configurações > API, 3) REGENERE sua chave API (a chave atual pode ter sido criada antes do Split ser ativado), 4) Atualize a chave no sistema, 5) Tente novamente. Se o erro persistir, contate o suporte do Pagar.me.' 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          throw new Error(`Failed to create recipient: ${errorData}`);
        }

        const recipientData = await recipientResponse.json();
        recipientId = recipientData.id;

        console.log('[Process Withdrawal] Recipient created:', recipientId);
      }

      // 2. Criar transferência no Pagar.me
      console.log('[Process Withdrawal] Creating transfer on Pagar.me');

      const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);

      const transferPayload = {
        amount: amountInCents,
        recipient_id: recipientId,
        metadata: {
          withdrawal_id: withdrawalId,
          project_id: withdrawal.project_id
        }
      };

      const transferResponse = await fetch('https://api.pagar.me/core/v5/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(transferPayload)
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.text();
        console.error('[Process Withdrawal] Pagar.me transfer error:', errorData);
        throw new Error(`Failed to create transfer: ${errorData}`);
      }

      const transferData = await transferResponse.json();

      console.log('[Process Withdrawal] Transfer created:', transferData.id);

      // 3. Atualizar withdrawal com status aprovado
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          pagarme_recipient_id: recipientId,
          pagarme_transfer_id: transferData.id
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Withdrawal approved and transfer created',
          transfer_id: transferData.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('[Process Withdrawal] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
