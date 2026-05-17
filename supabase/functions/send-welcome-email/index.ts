import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "raiztoken.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

const getClientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const assertRateLimit = async (
  scope: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number
) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc("check_function_rate_limit", {
    p_scope: scope,
    p_identifier: identifier,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    throw new Error("Rate limit unavailable");
  }

  if (data !== true) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!MAILGUN_API_KEY) {
      console.error("MAILGUN_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Mailgun API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, fullName } = (await req.json()) as WelcomeEmailRequest;
    const safeEmail = String(email || "").trim().toLowerCase();
    const safeFullName = String(fullName || "Apoiador").trim().slice(0, 120);

    if (!isValidEmail(safeEmail)) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIp = getClientIp(req);
    await assertRateLimit("send-welcome-email:ip", clientIp, 10, 60 * 60);
    await assertRateLimit("send-welcome-email:email", safeEmail, 2, 24 * 60 * 60);

    console.log("Sending welcome email");

    const formData = new FormData();
    formData.append("from", "Raiz Token <tato@raiztoken.com.br>");
    formData.append("to", safeEmail);
    formData.append("subject", "Voce acaba de dar um passo para fazer a diferenca");
    formData.append("template", "boas-vindas-novos-usuarios");
    formData.append("v:name", safeFullName || "Apoiador");

    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Mailgun error: ${response.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send welcome email",
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    console.log("Welcome email sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
        mailgunResponse: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending welcome email:", message);
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: message.includes("Muitas tentativas") ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
