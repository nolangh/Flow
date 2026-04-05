/**
 * Unified logger — ships to both Sentry (errors/crashes) and BetterStack (all levels).
 *
 * Required env vars:
 *   EXPO_PUBLIC_SENTRY_DSN          — Sentry project DSN
 *   EXPO_PUBLIC_BETTERSTACK_TOKEN   — BetterStack Logs source token
 *
 * When either token is absent the corresponding sink is silently skipped,
 * so the app works in local dev without any credentials configured.
 */

import * as Sentry from "@sentry/react-native";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
const BETTERSTACK_TOKEN = process.env.EXPO_PUBLIC_BETTERSTACK_TOKEN ?? "";
const BETTERSTACK_URL = "https://in.logs.betterstack.com";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

// ─── BetterStack sink ────────────────────────────────────────────────────────

async function sendToBetterStack(level: LogLevel, message: string, context?: LogContext) {
  if (!BETTERSTACK_TOKEN) return;
  try {
    await fetch(BETTERSTACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BETTERSTACK_TOKEN}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level,
        message,
        app: "honeydo",
        ...context,
      }),
    });
  } catch {
    // Logging must never crash the app
  }
}

// ─── Sentry sink ─────────────────────────────────────────────────────────────

function sendToSentry(level: LogLevel, message: string, error?: Error, context?: LogContext) {
  if (!SENTRY_DSN) return;

  if (context) {
    Sentry.setContext("log_context", context as Record<string, unknown>);
  }

  if (error) {
    Sentry.captureException(error, { level: level === "warn" ? "warning" : level });
  } else if (level === "warn" || level === "error") {
    Sentry.captureMessage(message, level === "warn" ? "warning" : "error");
  }
  // debug/info don't go to Sentry — keeps noise low
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function log(level: LogLevel, message: string, context?: LogContext) {
  void sendToBetterStack(level, message, context);
  if (level === "warn" || level === "error") {
    sendToSentry(level, message, undefined, context);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info:  (message: string, context?: LogContext) => log("info",  message, context),
  warn:  (message: string, context?: LogContext) => log("warn",  message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),

  /**
   * Capture an Error object — sends full stack to Sentry and BetterStack.
   * Use for caught exceptions: `logger.captureError(err, { screen: "Budget" })`
   */
  captureError: (error: unknown, context?: LogContext) => {
    const err = error instanceof Error ? error : new Error(String(error));
    void sendToBetterStack("error", err.message, {
      ...context,
      stack: err.stack,
      errorName: err.name,
    });
    sendToSentry("error", err.message, err, context);
  },

  /**
   * Associate the current user with future logs and Sentry events.
   * Call after login, clear after logout.
   */
  setUser: (user: { id: string; email?: string } | null) => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  },

  /**
   * Add a breadcrumb visible in Sentry's issue timeline.
   * Useful for key navigation events and user actions.
   */
  breadcrumb: (message: string, data?: Record<string, unknown>) => {
    Sentry.addBreadcrumb({ message, data, timestamp: Date.now() / 1000 });
  },
};
