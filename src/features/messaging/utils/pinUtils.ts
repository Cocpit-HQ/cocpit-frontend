/**
 * Persistent pinning management for conversations.
 * Ensures the single-pinned conversation is remembered across background refetches.
 */

const PINNED_CHAT_KEY_PREFIX = "cocpit_pinned_conv_";

export function getPinnedChatId(profileType?: string | null, profileId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const key = `${PINNED_CHAT_KEY_PREFIX}${profileType || "USER"}_${profileId || "me"}`;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setPinnedChatId(
  chatId: string | null,
  profileType?: string | null,
  profileId?: string | null
): void {
  if (typeof window === "undefined") return;
  const key = `${PINNED_CHAT_KEY_PREFIX}${profileType || "USER"}_${profileId || "me"}`;
  try {
    if (chatId) {
      localStorage.setItem(key, String(chatId));
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
}

export function isChatPinned(
  chatId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): boolean {
  if (!chatId) return false;
  const pinnedId = getPinnedChatId(profileType, profileId);
  return Boolean(pinnedId && String(pinnedId) === String(chatId));
}
