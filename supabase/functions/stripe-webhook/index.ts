import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Função para calcular taxas do Stripe com base no método de pagamento
interface FeeConfig {
  percentage_fee: number;
  fixed_fee: number;
  additional_percentage: number;
}

const calculateStripeFees = (
  grossAmount: number, 
  paymentMethod: string,
  feeConfigs: FeeConfig[]
): { stripeFeePercentage: number; stripeFeeFixed: number; stripeFeeTotal: number } => {
  // Mapear método do Stripe para nosso padrão
  let configMethod = 'card_national'; // default
  
  if (paymentMethod === 'boleto') {
    configMethod = 'boleto';
  } else if (paymentMethod === 'pix') {
    configMethod = 'pix';
  } else if (paymentMethod === 'card') {
    // Para cartões, assumimos nacional por padrão
    // Em produção, verificar se é internacional pelo país do cartão
    configMethod = 'card_national';
  }

  // Buscar configuração (fallback para cartão nacional)
  const config = feeConfigs.find(c => c.payment_method === configMethod) || {
    percentage_fee: 0.0399,
    fixed_fee: 0.39,
    additional_percentage: 0
  };

  const totalPercentage = Number(config.percentage_fee) + Number(config.additional_percentage || 0);
  const stripeFeePercentage = totalPercentage;
  const stripeFeeFixed = Number(config.fixed_fee);
  const stripeFeeTotal = (grossAmount * totalPercentage) + stripeFeeFixed;

  return {
    stripeFeePercentage,
    stripeFeeFixed,
    stripeFeeTotal: Math.round(stripeFeeTotal * 100) / 100 // Arredondar para 2 casas
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    let event: Stripe.Event;

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, paymentStatus: session.payment_status });

        if (session.payment_status === 'paid') {
          const metadata = session.metadata || {};
          const projectId = metadata.project_id;
          const userId = metadata.user_id;

          if (projectId && userId) {
            // Get payment details from stripe_payments
            const { data: paymentRecord } = await supabase
              .from('stripe_payments')
              .select('id, amount, platform_fee, creator_amount')
              .eq('stripe_session_id', session.id)
              .single();

            // Update stripe_payments record
            await supabase
              .from('stripe_payments')
              .update({ 
                status: 'completed',
                stripe_payment_intent_id: session.payment_intent as string,
                completed_at: new Date().toISOString()
              })
              .eq('stripe_session_id', session.id);

            const amountCents = session.amount_total || 0;
            const grossAmount = amountCents / 100; // Converter centavos para reais
            const amountTokens = Math.floor(grossAmount);

            // Buscar configurações de taxa do Stripe
            const { data: feeConfigs } = await supabase
              .from('stripe_fee_config')
              .select('payment_method, percentage_fee, fixed_fee, additional_percentage')
              .eq('is_enabled', true);

            // Determinar método de pagamento
            let paymentMethod = 'card';
            if (session.payment_method_types?.includes('boleto')) {
              paymentMethod = 'boleto';
            } else if (session.payment_method_types?.includes('pix')) {
              paymentMethod = 'pix';
            }

            // Calcular taxas do Stripe
            const { stripeFeePercentage, stripeFeeFixed, stripeFeeTotal } = 
              calculateStripeFees(grossAmount, paymentMethod, feeConfigs || []);

            // Buscar projeto para obter taxa da plataforma e ID do criador
            const { data: project } = await supabase
              .from('projects')
              .select('raised_amount, backers_count, user_id, title, platform_fee_percentage')
              .eq('id', projectId)
              .single();

            if (project) {
              // Calcular taxas da plataforma
              const platformFeePercentage = Number(project.platform_fee_percentage || 10) / 100;
              const platformFeeAmount = grossAmount * platformFeePercentage;
              
              // Calcular valores líquidos
              const netAmountCreator = grossAmount - stripeFeeTotal - platformFeeAmount;
              const netAmountPlatform = platformFeeAmount;

              // Calcular período de carência (7 dias após o pagamento)
              const gracePeriodEndsAt = new Date();
              gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7);

              // Criar contribution record
              const { data: contribution } = await supabase
                .from('project_contributions')
                .insert({
                  user_id: userId,
                  project_id: projectId,
                  amount: amountTokens,
                  status: 'completed'
                })
                .select('id')
                .single();

              // Registrar no financial_ledger com todos os detalhes
              const { error: ledgerError } = await supabase
                .from('financial_ledger')
                .insert({
                  project_id: projectId,
                  contribution_id: contribution?.id,
                  supporter_id: userId,
                  creator_id: project.user_id,
                  gross_amount: grossAmount,
                  token_amount: amountTokens,
                  payment_method: paymentMethod === 'card' ? 'card_national' : paymentMethod,
                  stripe_fee_percentage: stripeFeePercentage,
                  stripe_fee_fixed: stripeFeeFixed,
                  stripe_fee_total: stripeFeeTotal,
                  platform_fee_percentage: platformFeePercentage,
                  platform_fee_amount: platformFeeAmount,
                  net_amount_creator: netAmountCreator,
                  net_amount_platform: netAmountPlatform,
                  financial_status: 'grace_period',
                  grace_period_ends_at: gracePeriodEndsAt.toISOString(),
                  stripe_session_id: session.id,
                  stripe_payment_intent_id: session.payment_intent as string
                });

              if (ledgerError) {
                logStep("Error creating ledger entry", { error: ledgerError.message });
              } else {
                logStep("Ledger entry created", { 
                  grossAmount, 
                  stripeFeeTotal, 
                  platformFeeAmount, 
                  netAmountCreator 
                });
              }

              // Criar movimentação no ledger
              await supabase
                .from('ledger_movements')
                .insert({
                  movement_type: 'payment_received',
                  amount: grossAmount,
                  from_entity: 'stripe',
                  to_entity: 'platform',
                  description: `Pagamento recebido - Projeto: ${project.title}`,
                  reference_type: 'contribution',
                  reference_id: contribution?.id,
                  metadata: {
                    project_id: projectId,
                    supporter_id: userId,
                    payment_method: paymentMethod,
                    stripe_fees: stripeFeeTotal,
                    platform_fee: platformFeeAmount
                  }
                });

              // Update project stats
              await supabase
                .from('projects')
                .update({
                  raised_amount: (project.raised_amount || 0) + amountTokens,
                  backers_count: (project.backers_count || 0) + 1
                })
                .eq('id', projectId);

              // Notify creator
              await supabase.from('notifications').insert({
                user_id: project.user_id,
                type: 'new_contribution',
                title: 'Nova contribuição recebida!',
                message: `Você recebeu uma contribuição de R$ ${amountTokens} no projeto "${project.title}"`,
                related_id: projectId
              });

              // Notify supporter
              await supabase.from('notifications').insert({
                user_id: userId,
                type: 'payment_success',
                title: 'Pagamento confirmado!',
                message: `Sua contribuição de R$ ${amountTokens} foi confirmada para o projeto "${project.title}"`,
                related_id: projectId
              });

              logStep("Payment processed", { 
                projectId, 
                userId, 
                grossAmount,
                stripeFees: stripeFeeTotal,
                platformFee: platformFeeAmount,
                netCreator: netAmountCreator
              });
            }
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const chargesEnabled = account.charges_enabled;
        const payoutsEnabled = account.payouts_enabled;
        const requirementsDue = account.requirements?.currently_due || [];
        const requirementsPastDue = account.requirements?.past_due || [];
        
        logStep("Account updated", { 
          accountId: account.id, 
          chargesEnabled, 
          payoutsEnabled,
          requirementsDue: requirementsDue.length,
          requirementsPastDue: requirementsPastDue.length
        });

        // Find user by stripe_account_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single();

        if (profile) {
          const isVerified = chargesEnabled && payoutsEnabled && 
            requirementsDue.length === 0 && requirementsPastDue.length === 0;
          
          let status = 'pending';
          if (isVerified) {
            status = 'active';
          } else if (chargesEnabled || payoutsEnabled) {
            status = 'restricted';
          }

          await supabase
            .from('profiles')
            .update({
              stripe_account_status: status,
              stripe_onboarding_complete: isVerified
            })
            .eq('id', profile.id);

          logStep("Profile updated", { userId: profile.id, status, isVerified });
        } else {
          logStep("No profile found for account", { accountId: account.id });
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout completed", { payoutId: payout.id, amount: payout.amount });
        
        // Update payout record
        await supabase
          .from('creator_payouts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout failed", { payoutId: payout.id });
        
        await supabase
          .from('creator_payouts')
          .update({ 
            status: 'failed',
            error_message: payout.failure_message || 'Payout failed'
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
