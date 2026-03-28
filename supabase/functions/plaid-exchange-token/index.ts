/**
 * plaid-exchange-token
 *
 * Exchanges a Plaid public_token for a permanent access_token,
 * then fetches and stores all linked accounts in Supabase.
 *
 * Deploy: supabase functions deploy plaid-exchange-token
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLAID_BASE = `https://${Deno.env.get("PLAID_ENV") ?? "sandbox"}.plaid.com`;
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify user JWT
    const authSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for writes (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { public_token, institution_id, institution_name } = await req.json();

    // 1. Exchange public_token → access_token
    const exchangeRes = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token,
      }),
    });

    const exchangeData = await exchangeRes.json();
    if (!exchangeRes.ok) {
      return new Response(JSON.stringify({ error: exchangeData.error_message ?? "Exchange failed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token, item_id } = exchangeData;

    // 2. Get the user's household
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return new Response(JSON.stringify({ error: "No household found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Store plaid_item (upsert in case they're re-linking)
    const { data: plaidItem, error: itemError } = await supabase
      .from("plaid_items")
      .upsert({
        household_id: profile.household_id,
        user_id: user.id,
        plaid_item_id: item_id,
        institution_id: institution_id ?? null,
        institution_name: institution_name ?? null,
        access_token_ref: access_token, // stored server-side, never sent to client
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "plaid_item_id" })
      .select()
      .single();

    if (itemError) {
      console.error("Item insert error:", itemError);
      return new Response(JSON.stringify({ error: itemError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch accounts from Plaid
    const accountsRes = await fetch(`${PLAID_BASE}/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
      }),
    });

    const accountsData = await accountsRes.json();
    if (!accountsRes.ok) {
      console.error("Accounts fetch error:", accountsData);
    } else {
      // 5. Upsert accounts into plaid_accounts
      const accounts = (accountsData.accounts ?? []).map((a: any) => ({
        household_id: profile.household_id,
        plaid_item_id: plaidItem.id,
        plaid_account_id: a.account_id,
        name: a.name,
        official_name: a.official_name ?? null,
        type: a.type,
        subtype: a.subtype ?? null,
        mask: a.mask ?? null,
        current_balance: a.balances?.current ?? null,
        available_balance: a.balances?.available ?? null,
        iso_currency: a.balances?.iso_currency_code ?? "USD",
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      if (accounts.length > 0) {
        await supabase
          .from("plaid_accounts")
          .upsert(accounts, { onConflict: "plaid_account_id" });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
