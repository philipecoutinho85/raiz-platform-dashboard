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

    // Buscar withdrawal com dados do projeto (sem join direto com profiles)
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select(`
        *, 
        projects(title, user_id)
      `)
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) {
      console.error('[Process Withdrawal] Error fetching withdrawal:', withdrawalError);
      throw new Error(`Withdrawal not found: ${withdrawalError.message}`);
    }
    
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Extrair dados do projeto
    const projectData = withdrawal.projects as any;
    
    // Buscar perfil do criador separadamente
    let creatorName = 'Criador';
    let creatorEmail = 'sem-email@raiztoken.com.br';
    
    if (projectData?.user_id) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('nome, sobrenome, email')
        .eq('id', projectData.user_id)
        .maybeSingle();
      
      if (creatorProfile) {
        creatorName = `${creatorProfile.nome} ${creatorProfile.sobrenome}`;
        creatorEmail = creatorProfile.email || creatorEmail;
      }
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

      // Para PIX, criar pagamento PIX automático no Pagar.me
      if (withdrawal.payment_method === 'pix') {
        console.log('[Process Withdrawal] Creating automatic PIX payment via Pagar.me');
        
        const basicAuth = btoa(`${pagarmeKey}:`);
        const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);

        // Criar pagamento PIX no Pagar.me
        const pixPayload = {
          amount: amountInCents,
          payment_method: 'pix',
          pix: {
            expires_in: 86400, // 24 horas
            additional_information: [
              {
                name: 'Resgate de Projeto',
                value: `Projeto ID: ${withdrawal.project_id}`
              }
            ]
          },
          customer: {
            name: withdrawal.bank_account.holder_name,
            email: withdrawal.bank_account.email,
            document: withdrawal.bank_account.document,
            document_type: withdrawal.bank_account.document.length === 11 ? 'CPF' : 'CNPJ',
            type: 'individual'
          },
          metadata: {
            plataforma: 'Raiz Token',
            withdrawal_id: withdrawalId,
            project_id: withdrawal.project_id,
            project_title: projectData?.title || 'Projeto',
            creator_name: creatorName,
            creator_email: creatorEmail,
            user_id: withdrawal.user_id,
            pix_key: withdrawal.pix_key,
            pix_key_type: withdrawal.pix_key_type,
            amount_reais: withdrawal.net_amount.toString(),
            tipo_transacao: 'resgate_projeto_pix',
            descricao: `Resgate PIX do projeto "${projectData?.title}" - Criador: ${creatorName}`
          }
        };

        console.log('[Process Withdrawal] PIX payload:', JSON.stringify(pixPayload, null, 2));

        const pixResponse = await fetch('https://api.pagar.me/core/v5/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`
          },
          body: JSON.stringify({
            items: [{
              amount: amountInCents,
              description: `Resgate do projeto ${projectData?.title}`,
              quantity: 1,
              code: withdrawalId
            }],
            customer: pixPayload.customer,
            payments: [pixPayload],
            metadata: pixPayload.metadata
          })
        });

        if (!pixResponse.ok) {
          const errorData = await pixResponse.text();
          console.error('[Process Withdrawal] Pagar.me PIX error:', errorData);
          console.error('[Process Withdrawal] Response status:', pixResponse.status);
          
          // Marcar como pendente manual se houver erro
          await supabase
            .from('withdrawals')
            .update({
              status: 'pending_manual',
              reviewed_by: adminId,
              reviewed_at: new Date().toISOString(),
              rejection_reason: 'Erro ao processar PIX automático. Será processado manualmente.'
            })
            .eq('id', withdrawalId);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              requiresManual: true,
              message: 'Erro ao processar PIX. O resgate foi marcado para processamento manual.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        const pixData = await pixResponse.json();
        console.log('[Process Withdrawal] PIX payment created:', pixData.id);

        // Atualizar withdrawal com status aprovado e ID do Pagar.me
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            pagarme_transfer_id: pixData.id
          })
          .eq('id', withdrawalId);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Pagamento PIX criado automaticamente no Pagar.me! O pagamento será processado em breve.',
            pix_id: pixData.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para transferência bancária (TED), criar recipient e transfer no Pagar.me
      console.log('[Process Withdrawal] Creating TED recipient and transfer on Pagar.me');

      const bankAccount = withdrawal.bank_account as any;
      
      console.log('[Process Withdrawal] Bank account data:', {
        holder_name: bankAccount.holder_name,
        bank_code: bankAccount.bank_code,
        account_type: bankAccount.account_type,
        cpf: bankAccount.cpf?.substring(0, 3) + '***'
      });

      // Criar Basic Auth header (secret_key + ":" em base64)
      const basicAuth = btoa(`${pagarmeKey}:`);

      // 1. Criar recipient no Pagar.me (se ainda não existe)
      let recipientId = withdrawal.pagarme_recipient_id;

      if (!recipientId) {
        // Preparar dados bancários do JSONB
        const cpfClean = bankAccount.cpf?.replace(/\D/g, '') || bankAccount.document?.replace(/\D/g, '');
        const accountType = bankAccount.account_type === 'Conta Corrente' ? 'checking' : 'savings';
        
        // Extrair agência e dígito
        const agencyParts = bankAccount.agency?.split('-') || ['0', '0'];
        const branchNumber = agencyParts[0];
        const branchCheckDigit = agencyParts[1] || '0';
        
        // Extrair conta e dígito
        const accountParts = bankAccount.account?.split('-') || ['0', '0'];
        const accountNumber = accountParts[0];
        const accountCheckDigit = accountParts[1] || '0';

        const recipientPayload = {
          type: 'individual',
          name: bankAccount.name || bankAccount.holder_name,
          email: bankAccount.email || `user${Date.now()}@raiztoken.com.br`,
          document: cpfClean,
          default_bank_account: {
            holder_name: bankAccount.name || bankAccount.holder_name,
            holder_type: 'individual',
            holder_document: cpfClean,
            bank: bankAccount.bank || bankAccount.bank_code,
            branch_number: branchNumber,
            branch_check_digit: branchCheckDigit,
            account_number: accountNumber,
            account_check_digit: accountCheckDigit,
            type: accountType
          },
          transfer_settings: {
            transfer_enabled: true,
            transfer_interval: 'Daily',
            transfer_day: 0
          },
          automatic_anticipation_settings: {
            enabled: false
          },
          metadata: {
            // Metadados para identificação no dashboard Pagar.me
            plataforma: 'Raiz Token',
            withdrawal_id: withdrawalId,
            project_id: withdrawal.project_id,
            project_title: projectData?.title || 'Projeto',
            creator_name: creatorName,
            creator_email: creatorEmail,
            user_id: withdrawal.user_id,
            tipo_transacao: 'resgate_projeto'
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

      // REGRA: 1 token = R$1,00
      // net_amount já está em reais (conversão feita na criação do withdrawal)
      const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);
      
      console.log('[Process Withdrawal] Amount details:', {
        net_amount_reais: withdrawal.net_amount,
        amount_cents: amountInCents,
        conversion_rate: '1 token = R$1.00'
      });

      const transferPayload = {
        amount: amountInCents,
        recipient_id: recipientId,
        metadata: {
          // Metadados para identificação no dashboard Pagar.me
          plataforma: 'Raiz Token',
          withdrawal_id: withdrawalId,
          project_id: withdrawal.project_id,
          project_title: projectData?.title || 'Projeto',
          creator_name: creatorName,
          creator_email: creatorEmail,
          user_id: withdrawal.user_id,
          amount_reais: withdrawal.net_amount.toString(),
          tipo_transacao: 'resgate_projeto',
          descricao: `Resgate do projeto "${projectData?.title}" - Criador: ${creatorName}`
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
          message: '✅ Resgate aprovado! Recipient e transfer criados automaticamente no Pagar.me.',
          recipient_id: recipientId,
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
