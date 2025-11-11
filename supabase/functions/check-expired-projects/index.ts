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

    // Buscar projetos aprovados que venceram
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, user_id, goal, raised_amount, deadline')
      .eq('status', 'approved')
      .lt('deadline', new Date().toISOString().split('T')[0]);

    if (projectsError) {
      console.error('[Check Expired Projects] Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Filtrar projetos que não atingiram a meta (comparação em JS)
    const expiredProjects = (allProjects || []).filter(p => {
      const raised = Number(p.raised_amount) || 0;
      const goal = Number(p.goal) || 0;
      return raised < goal;
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
              message: `Seus ${contributionAmount} tokens investidos no projeto "${project.title}" foram devolvidos à sua carteira. O projeto não atingiu a meta dentro do prazo estabelecido. Agradecemos seu apoio e esperamos contar com você em novos projetos! 💚`,
              related_id: project.id
            });

          console.log(`[Check Expired Projects] Refunded ${contributionAmount} tokens to user ${contribution.user_id}`);
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

      // Notificar o criador do projeto
      await supabase
        .from('notifications')
        .insert({
          user_id: project.user_id,
          type: 'project_expired',
          title: 'Projeto Não Atingiu a Meta',
          message: `Seu projeto "${project.title}" não atingiu a meta de ${project.goal} tokens dentro do prazo estabelecido. Todos os tokens dos apoiadores foram devolvidos automaticamente. Você pode criar um novo projeto com ajustes na estratégia.`,
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
