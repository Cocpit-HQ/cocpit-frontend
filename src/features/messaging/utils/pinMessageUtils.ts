/**
 * Persistent pinning management for messages within conversations.
 * Ensures only 1 message can be pinned per conversation at a time.
 * If another message is pinned in that conversation, it replaces the currently pinned message.
 */

const PINNED_MSG_KEY_PREFIX = "cocpit_pinned_msg_";

function getStorageKey(
  conversationId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): string | null {
  if (!conversationId) return null;
  const pType = profileType || "USER";
  const pId = profileId || "me";
  return `${PINNED_MSG_KEY_PREFIX}${pType}_${pId}_${String(conversationId)}`;
}

export function getPinnedMessageId(
  conversationId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): string | null {
  if (typeof window === "undefined" || !conversationId) return null;
  try {
    const directKey = `${PINNED_MSG_KEY_PREFIX}${String(conversationId)}`;
    const directVal = localStorage.getItem(directKey);
    if (directVal) return directVal;

    const pType = profileType || "USER";
    const pId = profileId || "me";
    const legacyKey = `${PINNED_MSG_KEY_PREFIX}${pType}_${pId}_${String(conversationId)}`;
    return localStorage.getItem(legacyKey);
  } catch {
    return null;
  }
}

export function setPinnedMessageId(
  conversationId: string | number | null,
  messageId: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): void {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    const directKey = `${PINNED_MSG_KEY_PREFIX}${String(conversationId)}`;
    const pType = profileType || "USER";
    const pId = profileId || "me";
    const legacyKey = `${PINNED_MSG_KEY_PREFIX}${pType}_${pId}_${String(conversationId)}`;
    if (messageId) {
      localStorage.setItem(directKey, String(messageId));
      localStorage.setItem(legacyKey, String(messageId));
    } else {
      localStorage.removeItem(directKey);
      localStorage.removeItem(legacyKey);
    }
  } catch {}
}

export function isMessagePinned(
  conversationId?: string | number | null,
  messageId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): boolean {
  if (!conversationId || !messageId) return false;
  const pinnedId = getPinnedMessageId(conversationId, profileType, profileId);
  return Boolean(pinnedId && String(pinnedId) === String(messageId));
}
