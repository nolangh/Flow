/**
 * BetterStack logger for Honeydo.
 *
 * Set EXPO_PUBLIC_BETTERSTACK_TOKEN in your .env file to enable log shipping.
 * Logs are sent to https://in.logs.betterstack.com via the Logs ingest API.
 * When the token is absent (e.g. local dev without the env var) all calls
 * are no-ops so logging never crashes or blocks the app.
 */

const SOURCE_TOKEN = process.env.EXPO_PUBLIC_BETTERSTACK_TOKEN ?? "";
const INGEST_URL = "https://in.logs.betterstack.com";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

async function send(level: LogLevel, message: string, context?: LogContext) {
  if (!SOURCE_TOKEN) return;
  try {
    await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SOURCE_TOKEN}`,
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

export const logger = {
  debug: (message: string, context?: LogContext) => send("debug", message, context),
  info:  (message: string, context?: LogContext) => send("info",  message, context),
  warn:  (message: string, context?: LogContext) => send("warn",  message, context),
  error: (message: string, context?: LogContext) => send("error", message, context),

  /** Convenience: log an Error object with full stack trace */
  captureError: (error: unknown, context?: LogContext) => {
    const err = error instanceof Error ? error : new Error(String(error));
    return send("error", err.message, {
      ...context,
      stack: err.stack,
      errorName: err.name,
    });
  },
};
