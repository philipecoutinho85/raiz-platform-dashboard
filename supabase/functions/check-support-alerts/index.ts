import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "sandbox.mailgun.org"; // Update with your domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thresholds
const NPS_THRESHOLD = 3.0; // Alert if NPS drops below this
const UNANSWERED_THRESHOLD = 5; // Alert if more than X tickets unanswered
const UNANSWERED_HOURS = 2; // Consider unanswered if no response after X hours

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    console.log("Checking support alerts...");

    // 1. Check NPS Score (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: ratedConversations } = await supabase
      .from('support_conversations')
      .select('rating')
      .not('rating', 'is', null)
      .gte('rated_at', thirtyDaysAgo.toISOString());

    if (ratedConversations && ratedConversations.length >= 5) {
      const avgRating = ratedConversations.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedConversations.length;
      
      if (avgRating < NPS_THRESHOLD) {
        alerts.push({
          type: 'low_nps',
          message: `NPS médio caiu para ${avgRating.toFixed(1)}/5.0 (limite: ${NPS_THRESHOLD})`,
          severity: 'high'
        });
      }
    }

    // 2. Check unanswered tickets
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - UNANSWERED_HOURS);

    const { data: unansweredTickets, count } = await supabase
      .from('support_conversations')
      .select('id, ticket_number, subject, created_at', { count: 'exact' })
      .eq('status', 'novo')
      .is('first_response_at', null)
      .lt('created_at', hoursAgo.toISOString());

    if (count && count >= UNANSWERED_THRESHOLD) {
      alerts.push({
        type: 'unanswered_tickets',
        message: `${count} chamados sem resposta há mais de ${UNANSWERED_HOURS} horas`,
        severity: 'high'
      });
    } else if (count && count > 0) {
      alerts.push({
        type: 'unanswered_tickets',
        message: `${count} chamado(s) aguardando primeira resposta`,
        severity: 'medium'
      });
    }

    // 3. Check for reopened tickets (negative feedback)
    const { data: recentReopened, count: reopenedCount } = await supabase
      .from('support_conversations')
      .select('id', { count: 'exact' })
      .eq('status', 'novo')
      .not('rating', 'is', null)
      .gte('updated_at', thirtyDaysAgo.toISOString());

    if (reopenedCount && reopenedCount > 0) {
      alerts.push({
        type: 'reopened_tickets',
        message: `${reopenedCount} chamado(s) reaberto(s) por insatisfação`,
        severity: 'medium'
      });
    }

    // 4. Check for SLA breaches
    const { count: slaBreached } = await supabase
      .from('support_conversations')
      .select('id', { count: 'exact' })
      .in('status', ['novo', 'em_andamento'])
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (slaBreached && slaBreached > 0) {
      alerts.push({
        type: 'sla_breach',
        message: `${slaBreached} chamado(s) ultrapassaram 24h sem resolução`,
        severity: 'high'
      });
    }

    // Store alerts in database
    if (alerts.length > 0) {
      // Get admin users
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      // Create notifications for each admin
      for (const alert of alerts) {
        for (const admin of admins || []) {
          await supabase.from('notifications').insert({
            user_id: admin.user_id,
            type: 'support_alert',
            title: `Alerta de Suporte: ${alert.type === 'low_nps' ? 'NPS Baixo' : 
                    alert.type === 'unanswered_tickets' ? 'Chamados Pendentes' :
                    alert.type === 'reopened_tickets' ? 'Chamados Reabertos' : 'SLA'}`,
            message: alert.message,
            related_id: null
          });
        }

        // Also create financial alert for tracking
        await supabase.rpc('create_financial_alert', {
          p_alert_type: `support_${alert.type}`,
          p_title: `Alerta de Suporte`,
          p_message: alert.message,
          p_severity: alert.severity
        });
      }

      console.log(`Created ${alerts.length} support alerts`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_created: alerts.length,
        alerts 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error checking support alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
