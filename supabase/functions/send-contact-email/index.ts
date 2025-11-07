import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, title, message, hasAttachment }: ContactEmailRequest = await req.json();

    const categoryDisplay = categoryNames[category] || category;

    // Enviar email para o suporte
    const emailResponse = await resend.emails.send({
      from: "Raiz Token <onboarding@resend.dev>",
      to: ["contato@raiztoken.com.br"],
      replyTo: email,
      subject: `[${categoryDisplay}] ${title}`,
      html: `
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
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    // Enviar email de confirmação para o usuário
    await resend.emails.send({
      from: "Raiz Token <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua mensagem!",
      html: `
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
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
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
