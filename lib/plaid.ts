import { supabase } from "./supabase";

/**
 * Request a Plaid Link token from our Supabase Edge Function.
 * The Edge Function calls the Plaid /link/token/create endpoint server-side
 * so the Plaid client_secret never touches the client.
 */
export async function createLinkToken(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("plaid-link-token", {
    body: { user_id: userId },
  });

  if (error) throw new Error(`Link token error: ${error.message}`);
  return data.link_token as string;
}

/**
 * Exchange a public token (from Plaid Link) for a permanent access token.
 * Stored securely in Supabase — never exposed to the client after this call.
 */
export async function exchangePublicToken(
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<void> {
  const { error } = await supabase.functions.invoke("plaid-exchange-token", {
    body: { public_token: publicToken, institution_id: institutionId, institution_name: institutionName },
  });

  if (error) throw new Error(`Token exchange error: ${error.message}`);
}

/**
 * Trigger an on-demand transaction sync for the current household.
 * The Edge Function dispatches a Trigger.dev task.
 */
export async function triggerTransactionSync(householdId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("plaid-sync-transactions", {
    body: { household_id: householdId },
  });

  if (error) throw new Error(`Sync error: ${error.message}`);
}
