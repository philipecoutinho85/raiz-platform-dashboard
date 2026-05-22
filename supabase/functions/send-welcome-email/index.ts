import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://raiztoken.com.br",
  "https://www.raiztoken.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://raiztoken.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "raiztoken.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface WelcomeEmailRequest {
  email?: string;
  fullName?: string;
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
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (data !== true) {
    throw new Error("RATE_LIMITED");
  }
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    if (!MAILGUN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("Required environment variable not configured");
      return new Response(
        JSON.stringify({ error: "Email service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    const user = userData?.user;

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as WelcomeEmailRequest;
    const safeEmail = String(body.email || user.email || "").trim().toLowerCase();
    const safeFullName = String(body.fullName || user.user_metadata?.full_name || "Apoiador").trim().slice(0, 120);

    if (!isValidEmail(safeEmail) || safeEmail !== String(user.email).toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Invalid email target" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIp = getClientIp(req);
    await assertRateLimit("send-welcome-email:ip", clientIp, 5, 60 * 60);
    await assertRateLimit("send-welcome-email:user", user.id, 1, 24 * 60 * 60);
    await assertRateLimit("send-welcome-email:email", safeEmail, 1, 24 * 60 * 60);

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

    if (!response.ok) {
      console.error(`Mailgun error: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send welcome email" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending welcome email:", message);

    const status = message === "RATE_LIMITED" ? 429 : 500;
    const publicMessage = message === "RATE_LIMITED"
      ? "Muitas tentativas. Aguarde e tente novamente."
      : "Email service unavailable";

    return new Response(
      JSON.stringify({ success: false, error: publicMessage }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
