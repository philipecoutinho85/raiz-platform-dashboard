import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-WITHDRAWAL] ${step}${detailsStr}`);
};

const allowedAdminTypes = new Set(['master', 'financial']);
const processableStatuses = new Set(['pending', 'pending_manual', 'retry_scheduled']);

const addHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

async function recordWithdrawalException(
  supabase: any,
  params: {
    withdrawalId: string;
    userId?: string | null;
    projectId?: string | null;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    retryAt?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.rpc('record_operational_exception', {
    p_source: 'withdrawal',
    p_source_id: params.withdrawalId,
    p_user_id: params.userId || null,
    p_project_id: params.projectId || null,
    p_severity: params.severity || 'medium',
    p_reason: params.reason,
    p_next_retry_at: params.retryAt || null,
    p_metadata: params.metadata || {}
  });

  if (error) {
    logStep('Failed to record operational exception', { withdrawalId: params.withdrawalId, reason: params.reason, error: error.message });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let withdrawalIdForRecovery: string | null = null;

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logStep("Auth failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role, admin_type')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole || !allowedAdminTypes.has(adminRole.admin_type || '')) {
      logStep("Forbidden withdrawal processing attempt", {
        userId: user.id,
        adminType: adminRole?.admin_type ?? null,
        roleError: roleError?.message,
      });

      return new Response(
        JSON.stringify({ error: 'Forbidden: financial administrator role required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const adminId = user.id;
    const { withdrawalId, action, rejectionReason } = await req.json();
    withdrawalIdForRecovery = withdrawalId || null;

    if (!withdrawalId || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid withdrawal request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    logStep("Processing", { withdrawalId, action, adminId, adminType: adminRole.admin_type });

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select(`*, projects(title, user_id)`)
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      logStep("Error fetching withdrawal", { error: withdrawalError?.message });
      throw new Error('Withdrawal not found');
    }

    const projectData = withdrawal.projects as any;

    if (action === 'approve' && withdrawal.status === 'approved') {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyProcessed: true,
          message: 'Resgate ja estava aprovado',
          payout_id: withdrawal.pagarme_transfer_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reject' && withdrawal.status === 'rejected') {
      return new Response(
        JSON.stringify({ success: true, alreadyProcessed: true, message: 'Resgate ja estava rejeitado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawal.status === 'processing') {
      return new Response(
        JSON.stringify({ error: 'Resgate ja esta em processamento. Aguarde a conclusao.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    if (!processableStatuses.has(withdrawal.status)) {
      return new Response(
        JSON.stringify({ error: `Resgate nao pode ser processado no status atual: ${withdrawal.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    let creatorName = 'Criador';

    if (projectData?.user_id) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('nome, sobrenome')
        .eq('id', projectData.user_id)
        .maybeSingle();

      if (creatorProfile) {
        creatorName = `${creatorProfile.nome} ${creatorProfile.sobrenome}`.trim() || creatorName;
      }
    }

    if (action === 'reject') {
      const { data: rejectedWithdrawal, error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Resgate rejeitado pelo administrador'
        })
        .eq('id', withdrawalId)
        .in('status', Array.from(processableStatuses))
        .select('id')
        .maybeSingle();

      if (updateError) throw updateError;

      if (!rejectedWithdrawal) {
        return new Response(
          JSON.stringify({ error: 'Resgate ja foi processado por outra execucao' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      await supabase.rpc('resolve_operational_exception', {
        p_source: 'withdrawal',
        p_source_id: withdrawalId,
        p_reason: null
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Resgate rejeitado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      logStep("Locking withdrawal before Stripe payout");

      const { data: lockedWithdrawal, error: lockError } = await supabase
        .from('withdrawals')
        .update({
          status: 'processing',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', withdrawalId)
        .in('status', Array.from(processableStatuses))
        .select('id')
        .maybeSingle();

      if (lockError) throw lockError;

      if (!lockedWithdrawal) {
        return new Response(
          JSON.stringify({ error: 'Resgate ja esta sendo processado ou foi concluido por outra execucao.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('id', withdrawal.user_id)
        .single();

      if (!creatorProfile?.stripe_account_id) {
        await supabase
          .from('withdrawals')
          .update({
            status: 'requires_action',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: 'Criador precisa configurar a conta Stripe para automatizar o recebimento.'
          })
          .eq('id', withdrawalId)
          .eq('status', 'processing');

        await recordWithdrawalException(supabase, {
          withdrawalId,
          userId: withdrawal.user_id,
          projectId: withdrawal.project_id,
          severity: 'medium',
          reason: 'stripe_account_missing',
          metadata: { action_required_by: 'creator' }
        });

        await supabase
          .from('notifications')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_action_required',
            title: 'Ação necessária para receber o resgate',
            message: 'Configure sua conta Stripe para que o resgate seja processado automaticamente.',
            related_id: withdrawalId
          });

        return new Response(
          JSON.stringify({
            success: false,
            requiresAction: true,
            message: 'O criador precisa configurar a conta Stripe. O fluxo foi marcado como ação necessária, não como processo manual.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (!creatorProfile.stripe_onboarding_complete) {
        await supabase
          .from('withdrawals')
          .update({
            status: 'requires_action',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: 'Criador precisa concluir a verificação Stripe para automatizar o recebimento.'
          })
          .eq('id', withdrawalId)
          .eq('status', 'processing');

        await recordWithdrawalException(supabase, {
          withdrawalId,
          userId: withdrawal.user_id,
          projectId: withdrawal.project_id,
          severity: 'medium',
          reason: 'stripe_onboarding_incomplete',
          metadata: { action_required_by: 'creator' }
        });

        await supabase
          .from('notifications')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_action_required',
            title: 'Verificação Stripe pendente',
            message: 'Conclua a verificação da sua conta Stripe para que o resgate seja processado automaticamente.',
            related_id: withdrawalId
          });

        return new Response(
          JSON.stringify({
            success: false,
            requiresAction: true,
            message: 'O criador precisa concluir a verificação Stripe. O fluxo foi marcado como ação necessária.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);

      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: creatorProfile.stripe_account_id
        });

        const availableBalance = balance.available.find(b => b.currency === 'brl')?.amount || 0;
        logStep("Stripe account balance", { availableBalance, amountInCents });

        if (availableBalance < amountInCents) {
          const retryAt = addHours(12);
          
          await supabase
            .from('withdrawals')
            .update({
              status: 'retry_scheduled',
              reviewed_by: adminId,
              reviewed_at: new Date().toISOString(),
              rejection_reason: `Saldo Stripe temporariamente insuficiente. Nova tentativa agendada.`
            })
            .eq('id', withdrawalId)
            .eq('status', 'processing');

          await recordWithdrawalException(supabase, {
            withdrawalId,
            userId: withdrawal.user_id,
            projectId: withdrawal.project_id,
            severity: 'medium',
            reason: 'stripe_balance_insufficient_retry_scheduled',
            retryAt,
            metadata: { available_balance_cents: availableBalance, requested_amount_cents: amountInCents }
          });

          return new Response(
            JSON.stringify({
              success: false,
              retryScheduled: true,
              message: 'Saldo Stripe ainda não liberado. Nova tentativa automática foi agendada.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        const payout = await stripe.payouts.create(
          {
            amount: amountInCents,
            currency: 'brl',
            description: `Resgate do projeto "${projectData?.title}" - ${creatorName}`,
            metadata: {
              withdrawal_id: withdrawalId,
              project_id: withdrawal.project_id,
              creator_name: creatorName
            }
          },
          {
            stripeAccount: creatorProfile.stripe_account_id,
            idempotencyKey: `withdrawal-${withdrawalId}-approve`,
          }
        );

        const { data: updatedWithdrawal, error: approveUpdateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: null,
            pagarme_transfer_id: payout.id
          })
          .eq('id', withdrawalId)
          .eq('status', 'processing')
          .select('id')
          .maybeSingle();

        if (approveUpdateError) throw approveUpdateError;

        if (!updatedWithdrawal) {
          await recordWithdrawalException(supabase, {
            withdrawalId,
            userId: withdrawal.user_id,
            projectId: withdrawal.project_id,
            severity: 'high',
            reason: 'local_status_changed_after_stripe_payout',
            metadata: { payout_id: payout.id }
          });

          return new Response(
            JSON.stringify({
              success: true,
              alreadyProcessed: true,
              message: 'Pagamento criado com idempotencia Stripe; status local foi sinalizado para reconciliação.',
              payout_id: payout.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase.rpc('resolve_operational_exception', {
          p_source: 'withdrawal',
          p_source_id: withdrawalId,
          p_reason: null
        });

        await supabase
          .from('notifications')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_approved',
            title: 'Resgate Aprovado! 💰',
            message: `Seu resgate de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi aprovado e será depositado em breve.`,
            related_id: withdrawalId
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: '✅ Resgate aprovado! Pagamento processado via Stripe.',
            payout_id: payout.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (stripeError: any) {
        const retryAt = addHours(6);
        logStep("Stripe error", { error: stripeError.message, code: stripeError.code });
        
        await supabase
          .from('withdrawals')
          .update({
            status: 'retry_scheduled',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: `Falha temporária Stripe. Nova tentativa agendada. Código: ${stripeError.code || 'stripe_error'}`
          })
          .eq('id', withdrawalId)
          .eq('status', 'processing');

        await recordWithdrawalException(supabase, {
          withdrawalId,
          userId: withdrawal.user_id,
          projectId: withdrawal.project_id,
          severity: 'high',
          reason: 'stripe_payout_retry_scheduled',
          retryAt,
          metadata: { stripe_error_code: stripeError.code || null }
        });

        return new Response(
          JSON.stringify({
            success: false,
            retryScheduled: true,
            message: 'Falha temporária ao processar Stripe. Nova tentativa automática foi agendada.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message, withdrawalId: withdrawalIdForRecovery });
    return new Response(
      JSON.stringify({ error: 'Erro ao processar resgate. Verifique os logs administrativos.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
