/**
 * plaid-sync-transactions
 *
 * Syncs the latest transactions and updated account balances for
 * every active Plaid item in the user's household.
 *
 * Uses Plaid's /transactions/sync endpoint (cursor-based, incremental).
 *
 * Deploy: supabase functions deploy plaid-sync-transactions
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

    // Service-role client for DB writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { household_id } = await req.json();

    // Fetch all active plaid items for this household
    const { data: items, error: itemsError } = await supabase
      .from("plaid_items")
      .select("id, plaid_item_id, access_token_ref, cursor, institution_name")
      .eq("household_id", household_id)
      .eq("status", "active");

    if (itemsError) {
      return new Response(JSON.stringify({ error: itemsError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary: string[] = [];

    for (const item of items ?? []) {
      try {
        let cursor = item.cursor ?? undefined;
        let added: any[] = [];
        let modified: any[] = [];
        let removed: any[] = [];
        let hasMore = true;

        // Page through all new transactions
        while (hasMore) {
          const syncRes = await fetch(`${PLAID_BASE}/transactions/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: PLAID_CLIENT_ID,
              secret: PLAID_SECRET,
              access_token: item.access_token_ref,
              cursor,
              count: 100,
            }),
          });

          const syncData = await syncRes.json();
          if (!syncRes.ok) {
            console.error(`Sync error for item ${item.id}:`, syncData);
            await supabase.from("plaid_items").update({
              status: "error",
              error_code: syncData.error_code ?? "SYNC_ERROR",
            }).eq("id", item.id);
            break;
          }

          added = added.concat(syncData.added ?? []);
          modified = modified.concat(syncData.modified ?? []);
          removed = removed.concat(syncData.removed ?? []);
          cursor = syncData.next_cursor;
          hasMore = syncData.has_more;
        }

        // Insert/update added transactions
        if (added.length > 0) {
          const rows = added.map((t: any) => ({
            household_id,
            plaid_transaction_id: t.transaction_id,
            name: t.name,
            merchant_name: t.merchant_name ?? null,
            amount: Math.abs(t.amount),
            type: t.amount > 0 ? "debit" : "credit",
            date: t.date,
            pending: t.pending ?? false,
            logo_url: t.logo_url ?? null,
            plaid_category: t.personal_finance_category
              ? [t.personal_finance_category.primary, t.personal_finance_category.detailed]
              : t.category ?? null,
            is_manual: false,
          }));

          await supabase
            .from("transactions")
            .upsert(rows, { onConflict: "plaid_transaction_id", ignoreDuplicates: false });
        }

        // Remove deleted transactions
        if (removed.length > 0) {
          const removedIds = removed.map((t: any) => t.transaction_id);
          await supabase
            .from("transactions")
            .delete()
            .in("plaid_transaction_id", removedIds);
        }

        // Refresh account balances
        const accountsRes = await fetch(`${PLAID_BASE}/accounts/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: item.access_token_ref,
          }),
        });

        if (accountsRes.ok) {
          const { accounts } = await accountsRes.json();
          for (const a of accounts ?? []) {
            await supabase
              .from("plaid_accounts")
              .update({
                current_balance: a.balances?.current ?? null,
                available_balance: a.balances?.available ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("plaid_account_id", a.account_id);
          }
        }

        // Save new cursor
        await supabase
          .from("plaid_items")
          .update({ cursor, updated_at: new Date().toISOString() })
          .eq("id", item.id);

        summary.push(`${item.institution_name ?? item.id}: +${added.length} added, ${modified.length} modified, ${removed.length} removed`);
      } catch (itemErr) {
        console.error(`Error syncing item ${item.id}:`, itemErr);
        summary.push(`${item.institution_name ?? item.id}: ERROR - ${String(itemErr)}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
