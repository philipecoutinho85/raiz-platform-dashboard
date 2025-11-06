import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  type: 'new_admin' | '2fa_disabled' | 'new_device' | 'high_value_release';
  adminEmail: string;
  adminName: string;
  details?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, adminEmail, adminName, details }: AlertRequest = await req.json();

    let subject = "";
    let message = "";

    switch (type) {
      case 'new_admin':
        subject = "🔐 Novo Administrador Criado - Raiz Token";
        message = `
          <h2>Novo Administrador Criado</h2>
          <p>Um novo administrador foi adicionado ao sistema:</p>
          <ul>
            <li><strong>Nome:</strong> ${adminName}</li>
            <li><strong>E-mail:</strong> ${adminEmail}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
          </ul>
          <p>Se você não reconhece esta ação, entre em contato com a equipe de segurança imediatamente.</p>
        `;
        break;

      case '2fa_disabled':
        subject = "⚠️ Alerta: 2FA Desativado - Raiz Token";
        message = `
          <h2>Autenticação de Dois Fatores Desativada</h2>
          <p>O 2FA foi desativado para o administrador:</p>
          <ul>
            <li><strong>Nome:</strong> ${adminName}</li>
            <li><strong>E-mail:</strong> ${adminEmail}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
          </ul>
          <p><strong>Atenção:</strong> Esta ação reduz a segurança da conta. Se você não autorizou esta mudança, reative o 2FA imediatamente.</p>
        `;
        break;

      case 'new_device':
        subject = "🔔 Novo Login Detectado - Raiz Token";
        message = `
          <h2>Login de Novo Dispositivo/IP</h2>
          <p>Um login de administrador foi detectado de um novo dispositivo:</p>
          <ul>
            <li><strong>Nome:</strong> ${adminName}</li>
            <li><strong>E-mail:</strong> ${adminEmail}</li>
            <li><strong>IP:</strong> ${details?.ipAddress || 'Não disponível'}</li>
            <li><strong>Dispositivo:</strong> ${details?.userAgent || 'Não disponível'}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
          </ul>
          <p>Se este login não foi você, altere sua senha imediatamente e entre em contato com a equipe de segurança.</p>
        `;
        break;

      case 'high_value_release':
        subject = "💰 Alerta: Liberação de Alto Valor - Raiz Token";
        message = `
          <h2>Liberação de Valores Acima do Limiar</h2>
          <p>Uma liberação de valores foi realizada:</p>
          <ul>
            <li><strong>Administrador:</strong> ${adminName}</li>
            <li><strong>Valor:</strong> R$ ${details?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
            <li><strong>Projeto:</strong> ${details?.projectTitle || 'Não especificado'}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
          </ul>
          <p>Esta notificação é enviada automaticamente para todas as liberações acima de R$ ${details?.threshold?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '10.000,00'}.</p>
        `;
        break;
    }

    // Buscar todos os admins para notificar
    const { data: admins } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('email')
        .in('id', admins.map(a => a.user_id));

      // Aqui você integraria com um serviço de e-mail como Resend
      // Por enquanto, apenas log
      console.log('Alertas enviados para:', profiles?.map(p => p.email));
      console.log('Assunto:', subject);
      console.log('Mensagem:', message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Alerta processado" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao processar alerta:", error);
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
