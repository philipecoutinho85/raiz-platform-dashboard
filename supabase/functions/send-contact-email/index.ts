import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN") || "raiztoken.com.br";
const CONTACT_EMAIL_FROM =
  Deno.env.get("CONTACT_EMAIL_FROM") || "Raiz Token <noreply@raiztoken.com.br>";
const CONTACT_EMAIL_TO = Deno.env.get("CONTACT_EMAIL_TO") || "raiztoken@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY");

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

interface ContactEmailRequest {
  name?: string;
  nome?: string;
  email: string;
  phone?: string;
  telefone?: string;
  category?: string;
  tipo?: string;
  title?: string;
  subject?: string;
  assunto?: string;
  message?: string;
  mensagem?: string;
  hasAttachment?: boolean;
  website?: string;
  cfTurnstileToken?: string;
}

const categoryNames: Record<string, string> = {
  apoio: "Apoio",
  projeto: "Projeto",
  perfil: "Perfil",
  saque: "Saque",
};

const getClientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

const verifyTurnstile = async (token: string | undefined, ip: string) => {
  if (!TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const formData = new FormData();
  formData.append("secret", TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  if (ip && ip !== "unknown") formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result?.success === true;
};

const sendMailgunEmail = async (
  to: string,
  subject: string,
  html: string,
  replyTo?: string
) => {
  if (!MAILGUN_API_KEY) {
    console.error("Contact email service not configured", {
      hasMailgunApiKey: Boolean(MAILGUN_API_KEY),
    });
    throw new Error("EMAIL_SERVICE_UNAVAILABLE");
  }

  const formData = new FormData();
  formData.append("from", CONTACT_EMAIL_FROM);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", html);
  if (replyTo) {
    formData.append("h:Reply-To", replyTo);
  }

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
    console.error("Mailgun send failed", { status: response.status });
    throw new Error("EMAIL_SEND_FAILED");
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!MAILGUN_API_KEY) {
      console.error("Contact email service not configured", {
        hasMailgunApiKey: Boolean(MAILGUN_API_KEY),
      });
      throw new Error("EMAIL_SERVICE_UNAVAILABLE");
    }

    const origin = req.headers.get("origin") || "";
    if (origin && !allowedOrigins.has(origin)) {
      return new Response(JSON.stringify({ success: false, error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let payload: ContactEmailRequest;
    try {
      payload = (await req.json()) as ContactEmailRequest;
    } catch (error) {
      console.error("Invalid contact JSON payload", error);
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (String(payload.website || "").trim().length > 0) {
      return new Response(JSON.stringify({ success: true, message: "Mensagem recebida" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeName = String(payload.name || payload.nome || "").trim().slice(0, 120);
    const safeEmail = String(payload.email || "").trim().toLowerCase();
    const safePhone = String(payload.phone || payload.telefone || "").trim().slice(0, 40);
    const safeCategory = String(payload.category || payload.tipo || "apoio").trim();
    const safeTitle = String(payload.title || payload.subject || payload.assunto || "").trim().slice(0, 160);
    const safeMessage = String(payload.message || payload.mensagem || "").trim().slice(0, 4000);

    if (!safeName || !isValidEmail(safeEmail) || !categoryNames[safeCategory] || !safeTitle || safeMessage.length < 5) {
      console.error("Invalid contact payload", {
        hasName: Boolean(safeName),
        validEmail: isValidEmail(safeEmail),
        category: safeCategory,
        hasTitle: Boolean(safeTitle),
        messageLength: safeMessage.length,
      });
      return new Response(JSON.stringify({ success: false, error: "Invalid contact payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const clientIp = getClientIp(req);
    await assertRateLimit("send-contact-email:ip", clientIp, 3, 60 * 60);
    await assertRateLimit("send-contact-email:email", safeEmail, 2, 24 * 60 * 60);

    const turnstileOk = await verifyTurnstile(payload.cfTurnstileToken, clientIp);
    if (!turnstileOk) {
      return new Response(JSON.stringify({ success: false, error: "Verification failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const categoryDisplay = categoryNames[safeCategory];
    const escapedName = escapeHtml(safeName);
    const escapedEmail = escapeHtml(safeEmail);
    const escapedPhone = escapeHtml(safePhone);
    const escapedTitle = escapeHtml(safeTitle);
    const escapedMessage = escapeHtml(safeMessage);

    const supportEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B7355;">Nova Mensagem de Contato</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nome:</strong> ${escapedName}</p>
          <p><strong>E-mail:</strong> ${escapedEmail}</p>
          ${safePhone ? `<p><strong>Telefone:</strong> ${escapedPhone}</p>` : ""}
          <p><strong>Assunto:</strong> ${categoryDisplay}</p>
          <p><strong>Titulo:</strong> ${escapedTitle}</p>
          ${payload.hasAttachment ? "<p><strong>Anexo:</strong> Sim</p>" : ""}
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #8B7355;">Mensagem:</h3>
          <p style="white-space: pre-wrap;">${escapedMessage}</p>
        </div>
        <hr style="border: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Este email foi enviado atraves do formulario de contato do site Raiz Token.
        </p>
      </div>
    `;

    const emailResponse = await sendMailgunEmail(
      CONTACT_EMAIL_TO,
      `[${categoryDisplay}] ${safeTitle}`,
      supportEmailHtml,
      safeEmail
    );
    console.log("Email para suporte enviado com sucesso:", { id: emailResponse?.id });

    const confirmationEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B7355;">Ola, ${escapedName}!</h2>
        <p>Recebemos sua mensagem sobre <strong>${categoryDisplay}</strong> e agradecemos pelo contato.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Titulo:</strong> ${escapedTitle}</p>
          <p style="color: #666; font-size: 14px; margin-top: 10px;">
            Nossa equipe ira analisar sua solicitacao e retornaremos em breve.
          </p>
        </div>
        <p>Tempo de resposta estimado: ate 24 horas.</p>
        <hr style="border: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Raiz Token - Conectando sonhos a apoiadores<br>
          Niteroi, RJ - Brasil
        </p>
      </div>
    `;

    try {
      await sendMailgunEmail(safeEmail, "Recebemos sua mensagem!", confirmationEmailHtml);
    } catch (confirmationError) {
      console.warn(
        "Falha ao enviar confirmacao ao usuario, mas contato foi recebido",
        confirmationError
      );
    }

    return new Response(JSON.stringify({ success: true, message: "Mensagem enviada com sucesso" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro ao enviar email de contato:", message);

    const status = message === "RATE_LIMITED" ? 429 : 500;
    const publicMessage = message === "RATE_LIMITED"
      ? "Muitas tentativas. Aguarde e tente novamente."
      : "Nao foi possivel enviar sua mensagem agora.";

    return new Response(JSON.stringify({ success: false, error: publicMessage }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
