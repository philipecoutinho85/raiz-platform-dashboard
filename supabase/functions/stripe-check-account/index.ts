import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CHECK-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);

    if (!profile.stripe_account_id) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          verified: false,
          status: 'not_connected',
          balance: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    logStep("Account retrieved", { accountId: account.id, chargesEnabled: account.charges_enabled });

    const isVerified = account.charges_enabled && account.payouts_enabled;
    let status = 'pending';
    if (isVerified) {
      status = 'active';
    } else if (account.requirements?.currently_due?.length) {
      status = 'incomplete';
    }

    // Get balance from Stripe
    let balance = 0;
    if (isVerified) {
      try {
        const stripeBalance = await stripe.balance.retrieve({
          stripeAccount: profile.stripe_account_id
        });
        // Sum available balance in BRL
        balance = stripeBalance.available
          .filter(b => b.currency === 'brl')
          .reduce((sum, b) => sum + b.amount, 0);
        logStep("Balance retrieved", { balance });
      } catch (e) {
        logStep("Balance error (might be new account)", { error: e });
      }
    }

    // Update profile if status changed
    if (profile.stripe_account_status !== status || profile.stripe_onboarding_complete !== isVerified) {
      await supabase
        .from('profiles')
        .update({ 
          stripe_account_status: status,
          stripe_onboarding_complete: isVerified
        })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        verified: isVerified,
        status,
        balance,
        requirements: account.requirements?.currently_due || [],
        accountId: profile.stripe_account_id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
