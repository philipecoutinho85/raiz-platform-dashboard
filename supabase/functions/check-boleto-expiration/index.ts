import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-BOLETO-EXPIRATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar boletos pendentes que vencem em 24 horas e ainda não receberam lembrete
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringBoletos, error: fetchError } = await supabase
      .from('token_purchases')
      .select('id, user_id, amount, expires_at, created_at')
      .eq('status', 'pending')
      .eq('payment_type', 'boleto')
      .eq('reminder_sent', false)
      .not('expires_at', 'is', null)
      .lte('expires_at', in24Hours.toISOString())
      .gt('expires_at', now.toISOString());

    if (fetchError) {
      logStep("Error fetching expiring boletos", { error: fetchError });
      throw fetchError;
    }

    logStep("Found expiring boletos", { count: expiringBoletos?.length || 0 });

    // Buscar boletos expirados para marcar como failed
    const { data: expiredBoletos, error: expiredError } = await supabase
      .from('token_purchases')
      .select('id, user_id, amount')
      .eq('status', 'pending')
      .eq('payment_type', 'boleto')
      .not('expires_at', 'is', null)
      .lt('expires_at', now.toISOString());

    if (expiredError) {
      logStep("Error fetching expired boletos", { error: expiredError });
    }

    // Marcar boletos expirados como failed
    if (expiredBoletos && expiredBoletos.length > 0) {
      logStep("Marking expired boletos as failed", { count: expiredBoletos.length });

      for (const boleto of expiredBoletos) {
        await supabase
          .from('token_purchases')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', boleto.id);

        // Criar notificação de expiração
        await supabase
          .from('notifications')
          .insert({
            user_id: boleto.user_id,
            type: 'boleto_expired',
            title: 'Boleto Expirado',
            message: `Seu boleto de ${boleto.amount} tokens expirou. Caso ainda deseje, faça uma nova compra.`,
            related_id: boleto.id
          });
      }

      logStep("Expired boletos processed", { count: expiredBoletos.length });
    }

    // Enviar lembretes para boletos próximos do vencimento
    if (expiringBoletos && expiringBoletos.length > 0) {
      for (const boleto of expiringBoletos) {
        // Criar notificação de lembrete
        const expiresAt = new Date(boleto.expires_at);
        const hoursRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

        await supabase
          .from('notifications')
          .insert({
            user_id: boleto.user_id,
            type: 'boleto_reminder',
            title: 'Boleto Próximo do Vencimento ⚠️',
            message: `Seu boleto de ${boleto.amount} tokens vence em ${hoursRemaining} horas. Pague agora para garantir seus tokens!`,
            related_id: boleto.id
          });

        // Marcar como lembrete enviado
        await supabase
          .from('token_purchases')
          .update({ reminder_sent: true })
          .eq('id', boleto.id);

        logStep("Reminder sent", { purchaseId: boleto.id, hoursRemaining });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: expiringBoletos?.length || 0,
        expired_processed: expiredBoletos?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});