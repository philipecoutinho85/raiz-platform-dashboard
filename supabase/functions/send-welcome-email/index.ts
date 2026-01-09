import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
const MAILGUN_DOMAIN = 'raiztoken.com.br';

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILGUN_API_KEY) {
      console.error('MAILGUN_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Mailgun API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email to: ${email}, name: ${fullName}`);

    // Prepare form data for Mailgun API
    const formData = new FormData();
    formData.append('from', 'Raiz Token <tato@raiztoken.com.br>');
    formData.append('to', email);
    formData.append('subject', 'Você acaba de dar um passo para fazer a diferença');
    formData.append('template', 'boas-vindas-novos-usuarios');
    
    // Add template variables if needed
    formData.append('v:name', fullName || 'Apoiador');

    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    const responseText = await response.text();
    console.log(`Mailgun response status: ${response.status}`);
    console.log(`Mailgun response: ${responseText}`);

    if (!response.ok) {
      console.error(`Mailgun error: ${response.status} - ${responseText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send welcome email',
          details: responseText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    console.log(`Welcome email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        mailgunResponse: result 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
