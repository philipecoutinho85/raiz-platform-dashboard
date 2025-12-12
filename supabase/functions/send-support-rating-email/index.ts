import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "sandbox" + ".mailgun.org"; // Update with your domain
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RatingEmailRequest {
  conversationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ticketNumber: string;
  subject: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { conversationId, userId, userEmail, userName, ticketNumber, subject }: RatingEmailRequest = await req.json();

    console.log(`Sending rating email for conversation ${conversationId} to ${userEmail}`);

    // Generate rating URL with token
    const ratingToken = crypto.randomUUID();
    const baseUrl = "https://raiztoken.com.br";
    
    // Store rating token in database for verification
    await supabase
      .from('support_conversations')
      .update({ 
        rating_token: ratingToken,
        rating_sent_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    const ratingUrl = `${baseUrl}/avaliar-suporte?token=${ratingToken}&id=${conversationId}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avalie nosso atendimento</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Seu atendimento foi resolvido!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Olá, <strong>${userName}</strong>!</p>
    
    <p>O chamado <strong>#${ticketNumber}</strong> sobre "<em>${subject}</em>" foi marcado como resolvido pela nossa equipe.</p>
    
    <p>Gostaríamos muito de saber sua opinião sobre o atendimento. Sua avaliação nos ajuda a melhorar!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin-bottom: 15px; font-weight: 600;">Como você avalia nosso atendimento?</p>
      
      <div style="display: inline-block;">
        <a href="${ratingUrl}&rating=1" style="display: inline-block; padding: 15px; margin: 5px; text-decoration: none; font-size: 24px;">😞</a>
        <a href="${ratingUrl}&rating=2" style="display: inline-block; padding: 15px; margin: 5px; text-decoration: none; font-size: 24px;">😐</a>
        <a href="${ratingUrl}&rating=3" style="display: inline-block; padding: 15px; margin: 5px; text-decoration: none; font-size: 24px;">🙂</a>
        <a href="${ratingUrl}&rating=4" style="display: inline-block; padding: 15px; margin: 5px; text-decoration: none; font-size: 24px;">😊</a>
        <a href="${ratingUrl}&rating=5" style="display: inline-block; padding: 15px; margin: 5px; text-decoration: none; font-size: 24px;">🤩</a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Clique em um emoji para avaliar</p>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⚠️ Problema não resolvido?</strong><br>
        <a href="${ratingUrl}&reopen=true" style="color: #d97706;">Clique aqui para reabrir seu chamado</a>
      </p>
    </div>
  </div>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">Este e-mail foi enviado pela Raiz Token.</p>
    <p style="margin: 5px 0 0 0;">Para gerenciar suas preferências de privacidade, acesse sua conta.</p>
    <p style="margin: 5px 0 0 0;">Consulte a <a href="${baseUrl}/privacy" style="color: #10b981;">Política de Privacidade</a></p>
  </div>
</body>
</html>
    `;

    // Send email via Mailgun
    const formData = new FormData();
    formData.append("from", "Raiz Token Suporte <suporte@raiztoken.com.br>");
    formData.append("to", userEmail);
    formData.append("subject", `Avalie seu atendimento - Chamado #${ticketNumber}`);
    formData.append("html", htmlContent);

    const mailgunResponse = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error("Mailgun error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`Rating email sent successfully to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Rating email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending rating email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
