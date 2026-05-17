import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "raiztoken.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  category: string;
  title: string;
  message: string;
  hasAttachment?: boolean;
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
    throw new Error("Rate limit unavailable");
  }

  if (data !== true) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }
};

const sendMailgunEmail = async (
  to: string,
  subject: string,
  html: string,
  replyTo?: string
) => {
  const formData = new FormData();
  formData.append("from", "Raiz Token <noreply@raiztoken.com.br>");
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
    const errorText = await response.text();
    console.error("Mailgun error response:", errorText);
    throw new Error(`Mailgun API error: ${response.status}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!MAILGUN_API_KEY) {
      throw new Error("MAILGUN_API_KEY nao configurada");
    }

    const payload = (await req.json()) as ContactEmailRequest;
    const safeName = String(payload.name || "").trim().slice(0, 120);
    const safeEmail = String(payload.email || "").trim().toLowerCase();
    const safeCategory = String(payload.category || "").trim();
    const safeTitle = String(payload.title || "").trim().slice(0, 160);
    const safeMessage = String(payload.message || "").trim().slice(0, 5000);

    if (!safeName || !isValidEmail(safeEmail) || !categoryNames[safeCategory] || !safeTitle || safeMessage.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid contact payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const clientIp = getClientIp(req);
    await assertRateLimit("send-contact-email:ip", clientIp, 5, 60 * 60);
    await assertRateLimit("send-contact-email:email", safeEmail, 3, 60 * 60);

    const categoryDisplay = categoryNames[safeCategory];
    const escapedName = escapeHtml(safeName);
    const escapedEmail = escapeHtml(safeEmail);
    const escapedTitle = escapeHtml(safeTitle);
    const escapedMessage = escapeHtml(safeMessage);

    console.log("Recebendo mensagem de contato:", {
      category: safeCategory,
      hasAttachment: !!payload.hasAttachment,
    });

    const supportEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B7355;">Nova Mensagem de Contato</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nome:</strong> ${escapedName}</p>
          <p><strong>E-mail:</strong> ${escapedEmail}</p>
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

    try {
      const emailResponse = await sendMailgunEmail(
        "raiztoken@gmail.com",
        `[${categoryDisplay}] ${safeTitle}`,
        supportEmailHtml,
        safeEmail
      );
      console.log("Email para suporte enviado com sucesso:", { id: emailResponse?.id });
    } catch (supportError) {
      console.error("ERRO ao enviar email para suporte:", supportError instanceof Error ? supportError.message : "unknown");
    }

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

    await sendMailgunEmail(safeEmail, "Recebemos sua mensagem!", confirmationEmailHtml);
    console.log("Email de confirmacao enviado");

    return new Response(JSON.stringify({ success: true, message: "Emails enviados com sucesso" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro ao enviar email de contato:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("Muitas tentativas") ? 429 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
