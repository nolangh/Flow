/**
 * Adaptly paywall integration.
 *
 * TO ACTIVATE:
 *  1. Install the Adaptly SDK: add it via your package manager once you have access.
 *     If the SDK name is "react-native-adaptly", run: npx expo install react-native-adaptly
 *  2. Add your Adaptly API key to Replit Secrets as: EXPO_PUBLIC_ADAPTLY_KEY
 *  3. Uncomment the SDK import below and remove the stub implementations.
 *
 * Tier product IDs (register these in your Adaptly / App Store Connect dashboard):
 *   Personal monthly : flow_personal_monthly   annual : flow_personal_annual
 *   Family   monthly : flow_family_monthly      annual : flow_family_annual
 *   Power    monthly : flow_power_monthly       annual : flow_power_annual
 */

// import Adaptly from "react-native-adaptly"; // <-- uncomment when SDK is installed

const ADAPTLY_KEY = process.env.EXPO_PUBLIC_ADAPTLY_KEY ?? "";
export const adaptlyConfigured = ADAPTLY_KEY.length > 10;

export const PREMIUM_ENTITLEMENT_ID = "flow_premium";

export interface PremiumStatus {
  isActive: boolean;
  tier?: "personal" | "family" | "power";
  expiresAt?: string;
  productId?: string;
}

export async function initAdaptly(userId: string): Promise<void> {
  if (!adaptlyConfigured) return;
  // await Adaptly.activate(ADAPTLY_KEY);
  // await Adaptly.identify(userId);
  console.log("[Adaptly] init stub — SDK not yet installed");
}

export async function getPremiumStatus(): Promise<PremiumStatus> {
  if (!adaptlyConfigured) return { isActive: false };
  // const info = await Adaptly.getCustomerInfo();
  // const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  // const productId = entitlement?.productIdentifier ?? "";
  // const tier = productId.includes("family") ? "family" : productId.includes("power") ? "power" : "personal";
  // return { isActive: !!entitlement, tier, expiresAt: entitlement?.expiresDate, productId };
  return { isActive: false };
}

/**
 * Present the Adaptly paywall for a specific placement.
 * @param placement  Paywall placement ID from your Adaptly dashboard.
 * @param productId  Optional product ID to pre-select a specific tier/billing period.
 */
export async function showPaywall(placement = "main", productId?: string): Promise<boolean> {
  if (!adaptlyConfigured) {
    console.warn("[Adaptly] Cannot show paywall — SDK not configured.");
    return false;
  }
  // const result = await Adaptly.showPaywall({ placement, productId });
  // return result.purchased;
  return false;
}

export async function restorePurchases(): Promise<PremiumStatus> {
  if (!adaptlyConfigured) return { isActive: false };
  // await Adaptly.restorePurchases();
  // return getPremiumStatus();
  return { isActive: false };
}
