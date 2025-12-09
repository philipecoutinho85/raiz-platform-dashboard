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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { withdrawalId, action, rejectionReason } = await req.json();
    logStep("Processing", { withdrawalId, action });

    // Fetch withdrawal with project data
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select(`*, projects(title, user_id)`)
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) {
      logStep("Error fetching withdrawal", { error: withdrawalError });
      throw new Error(`Withdrawal not found: ${withdrawalError.message}`);
    }

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    const projectData = withdrawal.projects as any;

    // Fetch creator profile
    let creatorName = 'Criador';
    let creatorEmail = 'sem-email@raiztoken.com.br';

    if (projectData?.user_id) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('nome, sobrenome, email, stripe_account_id')
        .eq('id', projectData.user_id)
        .maybeSingle();

      if (creatorProfile) {
        creatorName = `${creatorProfile.nome} ${creatorProfile.sobrenome}`;
        creatorEmail = creatorProfile.email || creatorEmail;
      }
    }

    // Get admin user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const adminId = user?.id;

    if (action === 'reject') {
      logStep("Rejecting withdrawal");
      
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
        JSON.stringify({ success: true, message: 'Resgate rejeitado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process approval via Stripe
    if (action === 'approve') {
      logStep("Approving withdrawal via Stripe");

      // Get creator's Stripe account
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('id', withdrawal.user_id)
        .single();

      if (!creatorProfile?.stripe_account_id) {
        logStep("Creator doesn't have Stripe account configured");
        
        await supabase
          .from('withdrawals')
          .update({
            status: 'pending_manual',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: 'Criador não possui conta Stripe configurada. Configure a conta Stripe primeiro.'
          })
          .eq('id', withdrawalId);

        return new Response(
          JSON.stringify({
            success: false,
            requiresManual: true,
            message: 'O criador precisa configurar sua conta Stripe antes de receber pagamentos. Oriente-o a acessar "Meus Projetos" e configurar a conta.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (!creatorProfile.stripe_onboarding_complete) {
        logStep("Creator's Stripe onboarding not complete");
        
        await supabase
          .from('withdrawals')
          .update({
            status: 'pending_manual',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: 'Verificação da conta Stripe do criador ainda não está completa.'
          })
          .eq('id', withdrawalId);

        return new Response(
          JSON.stringify({
            success: false,
            requiresManual: true,
            message: 'O criador precisa completar a verificação da conta Stripe antes de receber pagamentos.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const amountInCents = Math.round(Number(withdrawal.net_amount) * 100);
      logStep("Creating Stripe payout", { 
        amount: withdrawal.net_amount, 
        amountInCents,
        stripeAccountId: creatorProfile.stripe_account_id 
      });

      try {
        // Check Stripe account balance
        const balance = await stripe.balance.retrieve({
          stripeAccount: creatorProfile.stripe_account_id
        });

        const availableBalance = balance.available.find(b => b.currency === 'brl')?.amount || 0;
        logStep("Stripe account balance", { availableBalance });

        if (availableBalance < amountInCents) {
          logStep("Insufficient balance in Stripe account");
          
          await supabase
            .from('withdrawals')
            .update({
              status: 'pending_manual',
              reviewed_by: adminId,
              reviewed_at: new Date().toISOString(),
              rejection_reason: `Saldo insuficiente na conta Stripe do criador. Disponível: R$ ${(availableBalance / 100).toFixed(2)}`
            })
            .eq('id', withdrawalId);

          return new Response(
            JSON.stringify({
              success: false,
              requiresManual: true,
              message: `Saldo insuficiente na conta Stripe do criador. Disponível: R$ ${(availableBalance / 100).toFixed(2)}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        // Create payout
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
          { stripeAccount: creatorProfile.stripe_account_id }
        );

        logStep("Stripe payout created", { payoutId: payout.id });

        // Update withdrawal status
        await supabase
          .from('withdrawals')
          .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            pagarme_transfer_id: payout.id // Reusing field for Stripe payout ID
          })
          .eq('id', withdrawalId);

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_approved',
            title: 'Resgate Aprovado! 💰',
            message: `Seu resgate de R$ ${withdrawal.net_amount.toFixed(2)} foi aprovado e será depositado em breve.`,
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
        logStep("Stripe error", { error: stripeError.message });
        
        await supabase
          .from('withdrawals')
          .update({
            status: 'pending_manual',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: `Erro Stripe: ${stripeError.message}`
          })
          .eq('id', withdrawalId);

        return new Response(
          JSON.stringify({
            success: false,
            requiresManual: true,
            message: `Erro ao processar pagamento via Stripe: ${stripeError.message}`
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
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
