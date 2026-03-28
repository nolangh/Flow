/**
 * Adaptly paywall integration.
 *
 * TO ACTIVATE:
 *  1. Install the Adaptly SDK: add it via your package manager once you have access.
 *     If the SDK name is "react-native-adaptly", run: npx expo install react-native-adaptly
 *  2. Add your Adaptly API key to Replit Secrets as: EXPO_PUBLIC_ADAPTLY_KEY
 *  3. Uncomment the SDK import below and remove the stub implementations.
 *
 * NOTE: If the exact SDK package name differs, update the import path below.
 * Common pattern for mobile paywall SDKs (Adapty, RevenueCat, etc.) is similar.
 */

// import Adaptly from "react-native-adaptly"; // <-- uncomment when SDK is installed

const ADAPTLY_KEY = process.env.EXPO_PUBLIC_ADAPTLY_KEY ?? "";
export const adaptlyConfigured = ADAPTLY_KEY.length > 10;

/** Entitlement ID for the Flow Premium product — update to match your Adaptly dashboard. */
export const PREMIUM_ENTITLEMENT_ID = "flow_premium";

/** Product ID for monthly subscription — update to match your Adaptly dashboard. */
export const MONTHLY_PRODUCT_ID = "flow_premium_monthly";

/** Product ID for annual subscription — update to match your Adaptly dashboard. */
export const ANNUAL_PRODUCT_ID = "flow_premium_annual";

export interface PremiumStatus {
  isActive: boolean;
  expiresAt?: string;
  productId?: string;
}

/**
 * Initialize Adaptly. Call once on app startup (e.g. in your root layout).
 */
export async function initAdaptly(userId: string): Promise<void> {
  if (!adaptlyConfigured) return;
  // TODO: replace stub with real SDK call:
  // await Adaptly.activate(ADAPTLY_KEY);
  // await Adaptly.identify(userId);
  console.log("[Adaptly] init stub — SDK not yet installed");
}

/**
 * Check if the current user has an active premium subscription.
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  if (!adaptlyConfigured) return { isActive: false };
  // TODO: replace stub with real SDK call:
  // const info = await Adaptly.getCustomerInfo();
  // const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  // return { isActive: !!entitlement, expiresAt: entitlement?.expiresDate, productId: entitlement?.productIdentifier };
  return { isActive: false };
}

/**
 * Present the Adaptly paywall for a specific placement.
 * @param placement  Paywall placement ID from your Adaptly dashboard (e.g. "main", "analysis").
 */
export async function showPaywall(placement = "main"): Promise<boolean> {
  if (!adaptlyConfigured) {
    console.warn("[Adaptly] Cannot show paywall — SDK not configured.");
    return false;
  }
  // TODO: replace stub with real SDK call:
  // const result = await Adaptly.showPaywall({ placement });
  // return result.purchased;
  return false;
}

/**
 * Restore previous purchases (required by App Store guidelines).
 */
export async function restorePurchases(): Promise<PremiumStatus> {
  if (!adaptlyConfigured) return { isActive: false };
  // TODO: replace stub with real SDK call:
  // await Adaptly.restorePurchases();
  // return getPremiumStatus();
  return { isActive: false };
}
