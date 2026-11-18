/**
 * Utility functions and constants for conversation muting lifecycle
 */

export interface MuteOption {
  label: string;
  hours: number | null;
}

export const MUTE_OPTIONS: MuteOption[] = [
  { label: "For 1 hours", hours: 1 },
  { label: "For 8 hours", hours: 8 },
  { label: "For 24 hours", hours: 24 },
  { label: "Until I turn it back on", hours: null },
];

/**
 * Pure function to check if a conversation is actively muted.
 * Evaluates both the `is_muted` boolean and `muted_until` expiration timestamp.
 */
export function isChatMuted(
  chat?: { is_muted?: boolean; muted_until?: string | null } | null
): boolean {
  if (!chat || !chat.is_muted) return false;
  if (chat.muted_until) {
    const expiry = new Date(chat.muted_until).getTime();
    if (!Number.isNaN(expiry) && expiry <= Date.now()) {
      return false;
    }
  }
  return true;
}

/**
 * Returns remaining milliseconds until mute expiration,
 * or null if chat is not muted or is muted indefinitely.
 */
export function getMuteRemainingMs(mutedUntil?: string | null): number | null {
  if (!mutedUntil) return null;
  const expiry = new Date(mutedUntil).getTime();
  if (Number.isNaN(expiry)) return null;
  const remaining = expiry - Date.now();
  return remaining > 0 ? remaining : null;
}

/**
 * User-facing toast feedback upon muting.
 */
export function formatMuteToastMessage(
  hours: number | null,
  isGroup: boolean = false
): string {
  const entity = isGroup ? "Group" : "Chat";
  if (hours === null || hours === undefined) {
    return `${entity} muted until you turn it back on`;
  }
  return `${entity} muted for ${hours === 1 ? "1 hour" : `${hours} hours`}`;
}
