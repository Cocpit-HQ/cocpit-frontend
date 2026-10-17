/**
 * Minimal server/edge-safe logger.
 *
 * - debug(): printed only in development, or when DEBUG_AUTH_LOGS=true.
 *   Production (Railway) log streams stay free of auth noise.
 * - warn()/error(): always printed.
 *
 * Never pass tokens, Set-Cookie headers or raw auth responses to any of these —
 * use describeToken() to log that a token exists without its value.
 */
const debugEnabled =
  process.env.NODE_ENV !== "production" || process.env.DEBUG_AUTH_LOGS === "true";

export const logger = {
  debug: (...args: unknown[]) => {
    if (debugEnabled) console.log(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/** "present (…a1b2)" / "missing" — safe to log. */
export function describeToken(token: string | null | undefined): string {
  if (!token) return "missing";
  return `present (…${token.slice(-4)})`;
}
