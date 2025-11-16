import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  withdrawalId: string;
  email: string;
  userName: string;
  projectName: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { withdrawalId, email, userName, projectName, amount }: VerificationRequest = await req.json();
    
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY não configurada');
    }

    console.log('API Key presente:', mailgunApiKey ? `Sim (${mailgunApiKey.length} caracteres, inicia com: ${mailgunApiKey.substring(0, 8)}...)` : 'Não');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar código de 5 dígitos
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Salvar código no banco com validade de 4 minutos
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutos
    
    const { data: authData } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );

    if (!authData.user) {
      throw new Error('Usuário não autenticado');
    }

    const { error: dbError } = await supabase
      .from('withdrawal_verification_codes')
      .insert({
        withdrawal_id: withdrawalId,
        user_id: authData.user.id,
        code: code,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Erro ao salvar código:', dbError);
      throw new Error('Erro ao gerar código de verificação');
    }

    // Enviar email via Mailgun usando template
    const mailgunUrl = 'https://api.mailgun.net/v3/raiztoken.com.br/messages';
    
    console.log('Preparando envio de email...');
    console.log('URL:', mailgunUrl);
    console.log('Destinatário:', email);
    console.log('Template:', 'codigo-verificacao-resgate');
    
    const formData = new URLSearchParams();
    formData.append('from', 'Raiz Token <noreply@raiztoken.com.br>');
    formData.append('to', email);
    formData.append('subject', 'Código de Verificação - Resgate de Valores');
    formData.append('template', 'codigo-verificacao-resgate');
    formData.append('v:nome_usuario', userName);
    formData.append('v:valor_resgate', amount.toFixed(2));
    formData.append('v:nome_projeto', projectName);
    formData.append('v:codigo_verificacao', code);

    const authHeader = 'Basic ' + btoa('api:' + mailgunApiKey);
    console.log('Auth header length:', authHeader.length);
    console.log('Auth header starts with:', authHeader.substring(0, 20) + '...');

    const mailgunResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    console.log('Mailgun response status:', mailgunResponse.status);
    console.log('Mailgun response headers:', JSON.stringify([...mailgunResponse.headers.entries()]));

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error('Erro Mailgun (Status:', mailgunResponse.status, '):', errorText);
      console.error('Domínio usado: raiztoken.com.br');
      console.error('Template usado: codigo-verificacao-resgate');
      throw new Error(`Erro ao enviar email via Mailgun (${mailgunResponse.status}). Verifique: 1) Domínio verificado, 2) Template existe, 3) API key tem permissões`);
    }

    console.log('Email enviado com sucesso para:', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Código enviado com sucesso',
        expiresAt: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar solicitação'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
