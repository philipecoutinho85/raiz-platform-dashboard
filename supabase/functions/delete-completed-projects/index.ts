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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('[Delete Completed Projects] Starting check...');

    // Calcular data de 20 dias atrás no horário de Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60; // -3 horas em minutos
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
    
    // Subtrair 20 dias
    const twentyDaysAgo = new Date(brasiliaTime.getTime() - (20 * 24 * 60 * 60 * 1000));
    const twentyDaysAgoISO = twentyDaysAgo.toISOString();
    
    console.log(`[Delete Completed Projects] Current time in Brasilia: ${brasiliaTime.toISOString()}`);
    console.log(`[Delete Completed Projects] Checking projects completed before: ${twentyDaysAgoISO}`);

    // Buscar projetos que atingiram 100% da meta há mais de 20 dias
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, user_id, goal, custom_goal, raised_amount, deadline, status, created_at, updated_at')
      .eq('status', 'approved')
      .lt('updated_at', twentyDaysAgoISO);

    if (projectsError) {
      console.error('[Delete Completed Projects] Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Filtrar projetos que atingiram 100% da meta
    const completedProjects = (allProjects || []).filter(p => {
      const effectiveGoal = p.custom_goal && p.custom_goal > 0 ? p.custom_goal : p.goal;
      const raised = Number(p.raised_amount) || 0;
      const goal = Number(effectiveGoal) || 0;
      return p.status === 'approved' && raised >= goal;
    });

    console.log(`[Delete Completed Projects] Found ${completedProjects.length} completed projects older than 20 days`);

    if (completedProjects.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No completed projects found older than 20 days', 
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deletedCount = 0;

    for (const project of completedProjects) {
      console.log(`[Delete Completed Projects] Deleting project: ${project.title} (${project.id})`);

      try {
        // Notificar o criador antes de excluir
        await supabase
          .from('notifications')
          .insert({
            user_id: project.user_id,
            type: 'project_auto_deleted',
            title: 'Projeto Excluído Automaticamente',
            message: `Seu projeto "${project.title}" foi excluído automaticamente após 20 dias de conclusão, conforme política da plataforma. Parabéns pelo sucesso do projeto!`,
            related_id: project.id
          });

        // Notificar apoiadores
        const { data: contributors } = await supabase
          .from('project_contributions')
          .select('user_id')
          .eq('project_id', project.id)
          .eq('status', 'completed');

        if (contributors && contributors.length > 0) {
          const uniqueContributors = [...new Set(contributors.map(c => c.user_id))];
          
          for (const userId of uniqueContributors) {
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'project_auto_deleted',
                title: 'Projeto Concluído Foi Arquivado',
                message: `O projeto "${project.title}" que você apoiou foi arquivado após 20 dias de conclusão bem-sucedida. Obrigado por fazer parte desta realização!`,
                related_id: project.id
              });
          }
        }

        // Excluir o projeto (triggers do banco cuidam do resto)
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (deleteError) {
          console.error(`[Delete Completed Projects] Error deleting project ${project.id}:`, deleteError);
          continue;
        }

        deletedCount++;
        console.log(`[Delete Completed Projects] Successfully deleted project ${project.id}`);
      } catch (error) {
        console.error(`[Delete Completed Projects] Error processing project ${project.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Completed projects deleted successfully',
        processed: deletedCount,
        total: completedProjects.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[Delete Completed Projects] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
