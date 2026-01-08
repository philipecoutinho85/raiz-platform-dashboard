import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = "raiztoken.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EmailRequest {
  type: "request_confirmation" | "payment_confirmation";
  refundId: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCpfCnpj = (value: string) => {
  if (value.length === 11) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (value.length === 14) {
    return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value;
};

const getRequestConfirmationHtml = (refund: any, profile: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-weight: 600; color: #111827; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    .highlight { background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Solicitação Recebida</h1>
    <p style="margin: 10px 0 0;">Protocolo #${refund.id.substring(0, 8).toUpperCase()}</p>
  </div>
  <div class="content">
    <p>Olá, <strong>${profile.nome}</strong>!</p>
    <p>Recebemos sua solicitação de reembolso. Abaixo estão os detalhes:</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="label">Valor do Reembolso</span>
        <span class="value">${formatCurrency(refund.amount)}</span>
      </div>
      <div class="info-row">
        <span class="label">Data da Solicitação</span>
        <span class="value">${formatDate(refund.requested_at)}</span>
      </div>
      <div class="info-row">
        <span class="label">Protocolo</span>
        <span class="value">#${refund.id.substring(0, 8).toUpperCase()}</span>
      </div>
    </div>

    <h3>Dados Bancários Informados</h3>
    <div class="info-box">
      <div class="info-row">
        <span class="label">Titular</span>
        <span class="value">${refund.bank_account_holder}</span>
      </div>
      <div class="info-row">
        <span class="label">CPF/CNPJ</span>
        <span class="value">${formatCpfCnpj(refund.bank_cpf_cnpj)}</span>
      </div>
      <div class="info-row">
        <span class="label">Banco</span>
        <span class="value">${refund.bank_name}</span>
      </div>
      <div class="info-row">
        <span class="label">Agência</span>
        <span class="value">${refund.bank_account_agency}</span>
      </div>
      <div class="info-row">
        <span class="label">Conta</span>
        <span class="value">${refund.bank_account_number}</span>
      </div>
      <div class="info-row">
        <span class="label">Tipo</span>
        <span class="value">${refund.bank_account_type === "checking" ? "Conta Corrente" : "Conta Poupança"}</span>
      </div>
    </div>

    <div class="highlight">
      <strong>Prazo de análise: até 5 dias úteis</strong>
      <p style="margin: 5px 0 0; font-size: 14px;">Você receberá uma notificação quando houver atualização.</p>
    </div>

    <div class="footer">
      <p>Este é um e-mail automático. Não responda.</p>
      <p>© ${new Date().getFullYear()} Raiz Token. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

const getPaymentConfirmationHtml = (refund: any, profile: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-weight: 600; color: #111827; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    .success-box { background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #10B981; }
    .attachment-note { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">✓ Reembolso Realizado</h1>
    <p style="margin: 10px 0 0;">Protocolo #${refund.id.substring(0, 8).toUpperCase()}</p>
  </div>
  <div class="content">
    <p>Olá, <strong>${profile.nome}</strong>!</p>
    
    <div class="success-box">
      <h2 style="margin: 0; color: #059669;">Seu reembolso foi processado!</h2>
      <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${formatCurrency(refund.amount)}</p>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="label">Protocolo</span>
        <span class="value">#${refund.id.substring(0, 8).toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Data do Pagamento</span>
        <span class="value">${formatDate(refund.completed_at)}</span>
      </div>
    </div>

    <h3>Conta Creditada</h3>
    <div class="info-box">
      <div class="info-row">
        <span class="label">Titular</span>
        <span class="value">${refund.bank_account_holder}</span>
      </div>
      <div class="info-row">
        <span class="label">Banco</span>
        <span class="value">${refund.bank_name}</span>
      </div>
      <div class="info-row">
        <span class="label">Agência</span>
        <span class="value">${refund.bank_account_agency}</span>
      </div>
      <div class="info-row">
        <span class="label">Conta</span>
        <span class="value">${refund.bank_account_number}</span>
      </div>
    </div>

    <div class="attachment-note">
      <strong>📎 Comprovante anexo</strong>
      <p style="margin: 5px 0 0; font-size: 14px;">O comprovante de transferência está anexado a este e-mail.</p>
    </div>

    <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px;">
      <strong>Importante:</strong> O valor pode levar até 2 dias úteis para aparecer em sua conta, dependendo do banco.
    </p>

    <div class="footer">
      <p>Este é um e-mail automático. Não responda.</p>
      <p>© ${new Date().getFullYear()} Raiz Token. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, refundId }: EmailRequest = await req.json();

    if (!refundId) {
      throw new Error("refundId is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch refund request
    const { data: refund, error: refundError } = await supabase
      .from("refund_requests")
      .select("*")
      .eq("id", refundId)
      .single();

    if (refundError || !refund) {
      throw new Error("Refund request not found");
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nome, sobrenome, email")
      .eq("id", refund.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    let subject: string;
    let html: string;
    let attachmentData: { filename: string; content: Uint8Array } | null = null;

    if (type === "request_confirmation") {
      subject = `Solicitação de Reembolso Recebida #${refund.id.substring(0, 8).toUpperCase()}`;
      html = getRequestConfirmationHtml(refund, profile);
    } else if (type === "payment_confirmation") {
      subject = `Reembolso Realizado #${refund.id.substring(0, 8).toUpperCase()}`;
      html = getPaymentConfirmationHtml(refund, profile);

      // Download proof of payment for attachment
      if (refund.proof_of_payment_url) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("refund-proofs")
          .download(refund.proof_of_payment_url);

        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const fileName = refund.proof_of_payment_url.split("/").pop() || "comprovante";
          attachmentData = {
            filename: `comprovante_${refund.id.substring(0, 8)}_${fileName}`,
            content: new Uint8Array(arrayBuffer),
          };
        }
      }
    } else {
      throw new Error("Invalid email type");
    }

    // Send email via Mailgun
    const formData = new FormData();
    formData.append("from", "Raiz Token <noreply@raiztoken.com.br>");
    formData.append("to", profile.email);
    formData.append("subject", subject);
    formData.append("html", html);

    if (attachmentData) {
      const blob = new Blob([attachmentData.content]);
      formData.append("attachment", blob, attachmentData.filename);
    }

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

    const result = await mailgunResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-boleto-refund-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
