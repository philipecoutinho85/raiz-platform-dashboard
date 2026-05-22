import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[RETRY-SCHEDULED-WITHDRAWALS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cronSecret = Deno.env.get("CRON_SECRET");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (cronSecret) {
      const providedSecret = req.headers.get("x-cron-secret");
      if (providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: exceptions, error: exceptionError } = await supabase
      .from("operational_exception_queue")
      .select("id, source_id, retry_count, next_retry_at, reason")
      .eq("source", "withdrawal")
      .eq("status", "retry_scheduled")
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(10);

    if (exceptionError) throw exceptionError;

    const results: Array<Record<string, unknown>> = [];

    for (const exception of exceptions || []) {
      const withdrawalId = exception.source_id;
      if (!withdrawalId) continue;

      logStep("Retrying withdrawal", {
        withdrawalId,
        exceptionId: exception.id,
        retryCount: exception.retry_count,
      });

      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("id, status")
        .eq("id", withdrawalId)
        .maybeSingle();

      if (withdrawalError) {
        results.push({ withdrawalId, ok: false, error: withdrawalError.message });
        continue;
      }

      if (!withdrawal || withdrawal.status !== "retry_scheduled") {
        await supabase.rpc("resolve_operational_exception", {
          p_source: "withdrawal",
          p_source_id: withdrawalId,
          p_reason: null,
        });

        results.push({ withdrawalId, ok: true, skipped: true, status: withdrawal?.status || null });
        continue;
      }

      const { error: resetError } = await supabase
        .from("withdrawals")
        .update({
          status: "pending",
          rejection_reason: null,
        })
        .eq("id", withdrawalId)
        .eq("status", "retry_scheduled");

      if (resetError) {
        results.push({ withdrawalId, ok: false, error: resetError.message });
        continue;
      }

      const { error: exceptionUpdateError } = await supabase
        .from("operational_exception_queue")
        .update({
          status: "open",
          updated_at: new Date().toISOString(),
          metadata: {
            last_retry_reset_at: new Date().toISOString(),
            previous_reason: exception.reason,
          },
        })
        .eq("id", exception.id);

      if (exceptionUpdateError) {
        logStep("Failed to update exception status after reset", {
          exceptionId: exception.id,
          error: exceptionUpdateError.message,
        });
      }

      results.push({ withdrawalId, ok: true, resetToPending: true });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });

    return new Response(JSON.stringify({ error: "Retry job failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
