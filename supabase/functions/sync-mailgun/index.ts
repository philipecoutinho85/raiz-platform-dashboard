import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAILGUN_DOMAIN = 'raiztoken.com.br';
const LISTS = {
  autor: `autores@${MAILGUN_DOMAIN}`,
  apoiador: `apoiadores@${MAILGUN_DOMAIN}`,
  ambos: [`autores@${MAILGUN_DOMAIN}`, `apoiadores@${MAILGUN_DOMAIN}`],
};

interface SyncRequest {
  userId: string;
  email: string;
  fullName: string;
  userType: 'autor' | 'apoiador' | 'ambos';
}

async function addToMailgunList(
  apiKey: string,
  listAddress: string,
  email: string,
  name: string
): Promise<{ success: boolean; response?: any; error?: string }> {
  const url = `https://api.mailgun.net/v3/lists/${listAddress}/members`;
  
  const formData = new URLSearchParams();
  formData.append('address', email);
  formData.append('name', name);
  formData.append('subscribed', 'true');
  formData.append('upsert', 'true'); // Update if exists
  
  try {
    console.log(`Adding ${email} to list ${listAddress}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`api:${apiKey}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error(`Mailgun error: ${response.status}`, responseData);
      return { 
        success: false, 
        error: responseData.message || `HTTP ${response.status}` 
      };
    }
    
    console.log(`Successfully added ${email} to ${listAddress}`, responseData);
    return { success: true, response: responseData };
    
  } catch (error) {
    console.error(`Failed to add to Mailgun:`, error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY not configured');
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { userId, email, fullName, userType }: SyncRequest = await req.json();
    
    console.log(`Sync request received: userId=${userId}, email=${email}, userType=${userType}`);
    
    if (!email || !userType) {
      throw new Error('Missing required fields: email and userType');
    }
    
    // Determine which lists to add to
    const listsToSync: string[] = [];
    if (userType === 'ambos') {
      listsToSync.push(...LISTS.ambos);
    } else if (userType === 'autor' || userType === 'apoiador') {
      const list = LISTS[userType];
      if (typeof list === 'string') {
        listsToSync.push(list);
      }
    }
    
    if (listsToSync.length === 0) {
      throw new Error(`Invalid userType: ${userType}`);
    }
    
    const results: Array<{
      listId: string;
      success: boolean;
      error?: string;
    }> = [];
    
    // Add to each list
    for (const listAddress of listsToSync) {
      const result = await addToMailgunList(
        MAILGUN_API_KEY,
        listAddress,
        email,
        fullName || 'Usuário Raiz Token'
      );
      
      results.push({
        listId: listAddress,
        success: result.success,
        error: result.error,
      });
      
      // Log to database
      const { error: logError } = await supabase
        .from('mailgun_sync_log')
        .insert({
          user_id: userId || null,
          email: email,
          full_name: fullName || null,
          list_id: listAddress,
          action: 'add_member',
          status: result.success ? 'success' : 'error',
          error_message: result.error || null,
          mailgun_response: result.response ? result.response : null,
          user_type: userType,
        });
      
      if (logError) {
        console.error('Failed to log sync:', logError);
      }
    }
    
    // Update profile with mailgun sync status
    if (userId) {
      const successfulLists = results
        .filter(r => r.success)
        .map(r => r.listId);
      
      if (successfulLists.length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            mailgun_synced: true,
            mailgun_list_ids: successfulLists,
            user_type: userType,
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Failed to update profile:', updateError);
        }
      }
    }
    
    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);
    
    console.log(`Sync completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    
    return new Response(
      JSON.stringify({
        success: allSuccess,
        partialSuccess: !allSuccess && anySuccess,
        results: results,
        message: allSuccess 
          ? `Synced to ${results.length} list(s) successfully` 
          : anySuccess 
            ? 'Partial sync completed with some errors'
            : 'Sync failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allSuccess ? 200 : anySuccess ? 207 : 500,
      }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
