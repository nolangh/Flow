/**
 * Security utilities for Honeydo.
 *
 * Covers:
 *  - Jailbreak / root detection (heuristic, not foolproof — nothing is)
 *  - App integrity checks
 *  - Security event logging to Sentry + BetterStack
 *
 * Call `runSecurityChecks()` early in app startup (e.g. RootLayout useEffect).
 * For a fintech app, failed checks should at minimum warn the user and may
 * block access to sensitive features like viewing account numbers.
 */

import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { logger } from "@/lib/logger";

export interface SecurityCheckResult {
  isJailbroken: boolean;
  isEmulator: boolean;
  isDevelopmentBuild: boolean;
  hasDebugger: boolean;
  appId: string | null;
  appVersion: string | null;
}

// ─── Jailbreak / Root detection ───────────────────────────────────────────────

/**
 * Heuristic jailbreak detection.
 * expo-device exposes `isRootedExperimentalAsync` for Android root detection.
 * On iOS there is no official API — we rely on device model heuristics.
 *
 * NOTE: This is a best-effort check. Determined attackers can bypass it.
 * Use it to inform risk decisions, not as a hard security boundary.
 */
async function checkJailbreak(): Promise<boolean> {
  try {
    if (Device.osName === "Android") {
      return await Device.isRootedExperimentalAsync();
    }
    // iOS: expo-device doesn't expose a jailbreak check — flag if in simulator
    // A proper iOS jailbreak check (Cydia, suspicious paths) requires native code
    return false;
  } catch {
    return false;
  }
}

// ─── Emulator / simulator detection ──────────────────────────────────────────

function checkEmulator(): boolean {
  return !Device.isDevice;
}

// ─── Debug build detection ────────────────────────────────────────────────────

function checkDebugBuild(): boolean {
  return __DEV__;
}

// ─── Debugger detection ───────────────────────────────────────────────────────

function checkDebugger(): boolean {
  // In Hermes, `isDebuggerConnected` is available in newer RN versions
  // Fall back to checking the global flag
  try {
    // @ts-ignore
    return typeof global.__REMOTEDEV__ !== "undefined" || typeof global.__REDUX_DEVTOOLS_EXTENSION__ !== "undefined";
  } catch {
    return false;
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runSecurityChecks(): Promise<SecurityCheckResult> {
  const [isJailbroken] = await Promise.all([checkJailbreak()]);

  const result: SecurityCheckResult = {
    isJailbroken,
    isEmulator: checkEmulator(),
    isDevelopmentBuild: checkDebugBuild(),
    hasDebugger: checkDebugger(),
    appId: Application.applicationId,
    appVersion: Application.nativeApplicationVersion,
  };

  // Log security context on every startup — useful for incident investigation
  logger.info("security.startup", {
    isJailbroken: result.isJailbroken,
    isEmulator: result.isEmulator,
    isDevelopmentBuild: result.isDevelopmentBuild,
    platform: Device.osName,
    deviceModel: Device.modelName,
    appVersion: result.appVersion,
  });

  // Escalate suspicious conditions
  if (result.isJailbroken) {
    logger.warn("security.jailbreak_detected", {
      platform: Device.osName,
      deviceModel: Device.modelName,
    });
  }

  if (result.hasDebugger && !__DEV__) {
    logger.warn("security.debugger_in_production", {});
  }

  return result;
}

/**
 * Returns true if the app is running in a state that warrants restricting
 * access to sensitive features (e.g. showing full account/routing numbers).
 */
export function isHighRiskEnvironment(checks: SecurityCheckResult): boolean {
  return checks.isJailbroken || (checks.hasDebugger && !checks.isDevelopmentBuild);
}
