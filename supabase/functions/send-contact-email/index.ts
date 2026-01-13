import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "raiztoken.com.br";

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
  hasAttachment: boolean;
}

const categoryNames: Record<string, string> = {
  apoio: "Apoio",
  projeto: "Projeto",
  perfil: "Perfil",
  saque: "Saque"
};

const sendMailgunEmail = async (
  to: string,
  subject: string,
  html: string,
  replyTo?: string
) => {
  const formData = new FormData();
  formData.append("from", "Raiz Token <contato@raiztoken.com.br>");
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
    throw new Error(`Mailgun API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILGUN_API_KEY) {
      throw new Error("MAILGUN_API_KEY não configurada");
    }

    const { name, email, category, title, message, hasAttachment }: ContactEmailRequest = await req.json();

    console.log("Recebendo mensagem de contato:", { name, email, category, title });

    const categoryDisplay = categoryNames[category] || category;

    // Enviar email para o suporte
    const supportEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B7355;">Nova Mensagem de Contato</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${categoryDisplay}</p>
          <p><strong>Título:</strong> ${title}</p>
          ${hasAttachment ? '<p><strong>Anexo:</strong> Sim</p>' : ''}
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #8B7355;">Mensagem:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <hr style="border: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Este email foi enviado através do formulário de contato do site Raiz Token.
        </p>
      </div>
    `;

    const emailResponse = await sendMailgunEmail(
      "contato@raiztoken.com.br",
      `[${categoryDisplay}] ${title}`,
      supportEmailHtml,
      email
    );

    console.log("Email para suporte enviado com sucesso:", emailResponse);

    // Enviar email de confirmação para o usuário
    const confirmationEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B7355;">Olá, ${name}!</h2>
        
        <p>Recebemos sua mensagem sobre <strong>${categoryDisplay}</strong> e agradecemos pelo contato.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Título:</strong> ${title}</p>
          <p style="color: #666; font-size: 14px; margin-top: 10px;">
            Nossa equipe irá analisar sua solicitação e retornaremos em breve.
          </p>
        </div>
        
        <p>Tempo de resposta estimado: até 24 horas.</p>
        
        <hr style="border: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Raiz Token - Conectando sonhos a apoiadores<br>
          Niterói, RJ - Brasil
        </p>
      </div>
    `;

    await sendMailgunEmail(
      email,
      "Recebemos sua mensagem!",
      confirmationEmailHtml
    );

    console.log("Email de confirmação enviado para:", email);

    return new Response(JSON.stringify({ success: true, message: "Emails enviados com sucesso" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de contato:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
