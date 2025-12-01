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

    console.log('[Sync Past Withdrawals] Starting sync...');
    console.log('[Sync Past Withdrawals] API key type:', pagarmeKey.startsWith('sk_test') ? 'SANDBOX' : pagarmeKey.startsWith('sk_') ? 'PRODUCTION' : 'UNKNOWN');

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar autenticação admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Only admins can sync past withdrawals');
    }

    // Buscar withdrawals aprovados sem pagarme_transfer_id
    const { data: withdrawals, error: fetchError } = await supabase
      .from('withdrawals')
      .select(`
        *, 
        projects(
          title, 
          user_id,
          profiles:user_id (nome, sobrenome, email)
        )
      `)
      .eq('status', 'approved')
      .is('pagarme_transfer_id', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch withdrawals: ${fetchError.message}`);
    }

    if (!withdrawals || withdrawals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum resgate pendente de sincronização encontrado.',
          synced: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Sync Past Withdrawals] Found ${withdrawals.length} withdrawals to sync`);

    const basicAuth = btoa(`${pagarmeKey}:`);
    const results = {
      synced: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Processar cada withdrawal
    for (const withdrawal of withdrawals) {
      try {
        console.log(`[Sync Past Withdrawals] Processing withdrawal ${withdrawal.id}`);

        const projectData = withdrawal.projects as any;
        const creatorProfile = projectData?.profiles;
        const creatorName = creatorProfile ? `${creatorProfile.nome} ${creatorProfile.sobrenome}` : 'Criador';
        const creatorEmail = creatorProfile?.email || 'sem-email@raiztoken.com.br';
        
        const bankAccount = withdrawal.bank_account as any;

        // Pular se for PIX (não suportado nesta sincronização)
        if (withdrawal.payment_method === 'pix') {
          console.log(`[Sync Past Withdrawals] Skipping PIX withdrawal ${withdrawal.id}`);
          continue;
        }

        // 1. Criar recipient se necessário
        let recipientId = withdrawal.pagarme_recipient_id;

        if (!recipientId) {
          const cpfClean = bankAccount.cpf?.replace(/\D/g, '') || bankAccount.document?.replace(/\D/g, '');
          const accountType = bankAccount.account_type === 'Conta Corrente' ? 'checking' : 'savings';
          
          const agencyParts = bankAccount.agency?.split('-') || ['0', '0'];
          const branchNumber = agencyParts[0];
          const branchCheckDigit = agencyParts[1] || '0';
          
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
              plataforma: 'Raiz Token',
              withdrawal_id: withdrawal.id,
              project_id: withdrawal.project_id,
              project_title: projectData?.title || 'Projeto',
              creator_name: creatorName,
              creator_email: creatorEmail,
              user_id: withdrawal.user_id,
              tipo_transacao: 'resgate_projeto_retroativo'
            }
          };

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
            console.error(`[Sync Past Withdrawals] Failed to create recipient for ${withdrawal.id}:`, errorData);
            
            results.failed++;
            results.errors.push({
              withdrawal_id: withdrawal.id,
              error: 'Failed to create recipient',
              details: errorData
            });
            continue;
          }

          const recipientData = await recipientResponse.json();
          recipientId = recipientData.id;
          console.log(`[Sync Past Withdrawals] Recipient created: ${recipientId}`);
        }

        // 2. Criar transfer
        const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);

        const transferPayload = {
          amount: amountInCents,
          recipient_id: recipientId,
          metadata: {
            plataforma: 'Raiz Token',
            withdrawal_id: withdrawal.id,
            project_id: withdrawal.project_id,
            project_title: projectData?.title || 'Projeto',
            creator_name: creatorName,
            creator_email: creatorEmail,
            user_id: withdrawal.user_id,
            amount_reais: withdrawal.net_amount.toString(),
            tipo_transacao: 'resgate_projeto_retroativo',
            descricao: `Resgate do projeto "${projectData?.title}" - Criador: ${creatorName} (Sincronização retroativa)`
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
          console.error(`[Sync Past Withdrawals] Failed to create transfer for ${withdrawal.id}:`, errorData);
          
          results.failed++;
          results.errors.push({
            withdrawal_id: withdrawal.id,
            error: 'Failed to create transfer',
            details: errorData
          });
          continue;
        }

        const transferData = await transferResponse.json();
        console.log(`[Sync Past Withdrawals] Transfer created: ${transferData.id}`);

        // 3. Atualizar registro no Supabase
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            pagarme_recipient_id: recipientId,
            pagarme_transfer_id: transferData.id
          })
          .eq('id', withdrawal.id);

        if (updateError) {
          console.error(`[Sync Past Withdrawals] Failed to update withdrawal ${withdrawal.id}:`, updateError);
          results.failed++;
          results.errors.push({
            withdrawal_id: withdrawal.id,
            error: 'Failed to update database',
            details: updateError.message
          });
          continue;
        }

        results.synced++;
        console.log(`[Sync Past Withdrawals] Successfully synced withdrawal ${withdrawal.id}`);

      } catch (error: any) {
        console.error(`[Sync Past Withdrawals] Error processing withdrawal ${withdrawal.id}:`, error);
        results.failed++;
        results.errors.push({
          withdrawal_id: withdrawal.id,
          error: error.message
        });
      }
    }

    console.log('[Sync Past Withdrawals] Sync completed:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sincronização concluída: ${results.synced} resgates sincronizados, ${results.failed} falharam.`,
        synced: results.synced,
        failed: results.failed,
        errors: results.errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Sync Past Withdrawals] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
