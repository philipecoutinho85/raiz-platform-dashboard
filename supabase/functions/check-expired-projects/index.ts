import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Check Expired Projects] Starting check...');

    // Obter data/hora atual em Brasília (UTC-3)
    // Subtrair 3 horas do horário UTC para obter o horário de Brasília
    const now = new Date();
    const brasiliaOffset = -3 * 60; // -3 horas em minutos
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
    const brasiliaISO = brasiliaTime.toISOString();
    
    console.log(`[Check Expired Projects] Current time in Brasilia: ${brasiliaISO}`);

    // Buscar projetos aprovados que venceram (excluindo os já cancelados)
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, user_id, goal, custom_goal, raised_amount, deadline, status')
      .eq('status', 'approved')
      .lt('deadline', brasiliaISO);

    if (projectsError) {
      console.error('[Check Expired Projects] Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Filtrar projetos que não atingiram a meta (usando meta efetiva: custom_goal ou goal)
    // IMPORTANTE: Projetos que atingiram 100% da meta NÃO podem ter reembolso
    const expiredProjects = (allProjects || []).filter(p => {
      const raised = Number(p.raised_amount) || 0;
      // Usar custom_goal se definido, senão goal
      const effectiveGoal = Number(p.custom_goal ?? p.goal) || 0;
      // Apenas projetos aprovados que NÃO atingiram a meta podem ter reembolso
      const reachedGoal = effectiveGoal > 0 && raised >= effectiveGoal;
      console.log(`[Check Expired Projects] Project ${p.id}: raised=${raised}, effectiveGoal=${effectiveGoal}, reachedGoal=${reachedGoal}`);
      return p.status === 'approved' && !reachedGoal;
    });

    console.log(`[Check Expired Projects] Found ${expiredProjects.length} expired projects without reaching goal`);

    if (expiredProjects.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired projects found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;

    for (const project of expiredProjects) {

      console.log(`[Check Expired Projects] Processing project: ${project.title} (${project.id})`);

      // Buscar apenas contribuições não estornadas (status = 'completed')
      const { data: contributions, error: contributionsError } = await supabase
        .from('project_contributions')
        .select('id, user_id, amount')
        .eq('project_id', project.id)
        .eq('status', 'completed');

      if (contributionsError) {
        console.error(`[Check Expired Projects] Error fetching contributions:`, contributionsError);
        continue;
      }

      console.log(`[Check Expired Projects] Found ${contributions?.length || 0} contributions to refund`);

      // Processar devolução para cada apoiador
      for (const contribution of contributions || []) {
        try {
          // VERIFICAR SE JÁ EXISTE UM REEMBOLSO PARA ESTA CONTRIBUIÇÃO
          const { data: existingRefund, error: refundCheckError } = await supabase
            .from('refunds')
            .select('id')
            .eq('contribution_id', contribution.id)
            .maybeSingle();

          if (refundCheckError) {
            console.error(`[Check Expired Projects] Error checking existing refund:`, refundCheckError);
            continue;
          }

          // Se já existe um reembolso, pular esta contribuição
          if (existingRefund) {
            console.log(`[Check Expired Projects] Refund already exists for contribution ${contribution.id}, skipping`);
            continue;
          }
          // Buscar saldo atual do usuário
          const { data: userTokens, error: tokensError } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', contribution.user_id)
            .single();

          if (tokensError) {
            console.error(`[Check Expired Projects] Error fetching user tokens:`, tokensError);
            continue;
          }

          const currentBalance = userTokens?.balance || 0;
          const newBalance = currentBalance + contribution.amount;

          // Atualizar saldo do usuário
          const { error: updateError } = await supabase
            .from('user_tokens')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', contribution.user_id);

          if (updateError) {
            console.error(`[Check Expired Projects] Error updating balance:`, updateError);
            continue;
          }

          // Criar registro de reembolso
          const { error: refundError } = await supabase
            .from('refunds')
            .insert({
              user_id: contribution.user_id,
              project_id: project.id,
              contribution_id: contribution.id,
              amount: contribution.amount,
              reason: 'Projeto expirou sem atingir a meta',
              status: 'completed',
              processed_at: new Date().toISOString()
            });

          if (refundError) {
            console.error(`[Check Expired Projects] Error creating refund record:`, refundError);
            continue;
          }

          // Criar transação de reembolso
          const { error: transactionError } = await supabase
            .from('token_transactions')
            .insert({
              user_id: contribution.user_id,
              amount: contribution.amount,
              transaction_type: 'refund',
              reference_id: project.id,
              description: `Reembolso automático: Projeto "${project.title}" não atingiu a meta`,
              balance_after: newBalance
            });

          if (transactionError) {
            console.error(`[Check Expired Projects] Error creating transaction:`, transactionError);
          }

          // Marcar contribuição como estornada
          const { error: updateContributionError } = await supabase
            .from('project_contributions')
            .update({ status: 'refunded' })
            .eq('id', contribution.id);

          if (updateContributionError) {
            console.error(`[Check Expired Projects] Error updating contribution status:`, updateContributionError);
          }

          // Criar notificação para o apoiador
          await supabase
            .from('notifications')
            .insert({
              user_id: contribution.user_id,
              type: 'refund_processed',
              title: 'Tokens Devolvidos',
              message: `Seus ${contribution.amount} tokens investidos no projeto "${project.title}" foram devolvidos à sua carteira. O projeto não atingiu a meta dentro do prazo estabelecido. Agradecemos seu apoio e esperamos contar com você em novos projetos! 💚`,
              related_id: project.id
            });

          console.log(`[Check Expired Projects] Refunded ${contribution.amount} tokens to user ${contribution.user_id}`);
        } catch (error) {
          console.error(`[Check Expired Projects] Error processing contribution:`, error);
        }
      }

      // Atualizar status do projeto para 'cancelled'
      await supabase
        .from('projects')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      // Notificar o criador do projeto (usar meta efetiva)
      const effectiveGoal = project.custom_goal ?? project.goal;
      await supabase
        .from('notifications')
        .insert({
          user_id: project.user_id,
          type: 'project_expired',
          title: 'Projeto Não Atingiu a Meta',
          message: `Seu projeto "${project.title}" não atingiu a meta de ${effectiveGoal} tokens dentro do prazo estabelecido. Todos os tokens dos apoiadores foram devolvidos automaticamente. Você pode criar um novo projeto com ajustes na estratégia.`,
          related_id: project.id
        });

      processedCount++;
      console.log(`[Check Expired Projects] Successfully processed project ${project.id}`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Expired projects processed successfully',
        processed: processedCount,
        total: expiredProjects.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[Check Expired Projects] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
