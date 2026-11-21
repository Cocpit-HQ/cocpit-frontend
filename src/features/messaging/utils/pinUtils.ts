/**
 * Persistent multi-pinning management for conversations in the Chat List.
 * Remembers multiple pinned conversations and their timestamps across background refetches and reloads.
 */

const PINNED_CHAT_KEY_PREFIX = "cocpit_pinned_convs_";
const LEGACY_PINNED_CHAT_KEY_PREFIX = "cocpit_pinned_conv_";

function getStorageKey(prefix: string, profileType?: string | null, profileId?: string | null): string {
  return `${prefix}${profileType || "USER"}_${profileId || "me"}`;
}

/**
 * Returns a map of conversationId -> pinned_at ISO string for the active profile.
 */
export function getPinnedChatMap(
  profileType?: string | null,
  profileId?: string | null
): Record<string, string> {
  if (typeof window === "undefined") return {};
  const newKey = getStorageKey(PINNED_CHAT_KEY_PREFIX, profileType, profileId);
  const legacyKey = getStorageKey(LEGACY_PINNED_CHAT_KEY_PREFIX, profileType, profileId);

  try {
    const raw = localStorage.getItem(newKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
      if (Array.isArray(parsed)) {
        const migrated: Record<string, string> = {};
        parsed.forEach((id: string, index: number) => {
          // preserve array order as synthetic timestamp offsets
          migrated[String(id)] = new Date(Date.now() - (parsed.length - index) * 1000).toISOString();
        });
        return migrated;
      }
    }

    // Check legacy single-pinned key
    const legacyId = localStorage.getItem(legacyKey);
    if (legacyId) {
      const initialMap: Record<string, string> = {
        [String(legacyId)]: new Date().toISOString(),
      };
      try {
        localStorage.setItem(newKey, JSON.stringify(initialMap));
        localStorage.removeItem(legacyKey);
      } catch {}
      return initialMap;
    }
  } catch {
    return {};
  }

  return {};
}

/**
 * Checks whether a specific chat conversation is pinned.
 */
export function isChatPinned(
  chatId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): boolean {
  if (!chatId) return false;
  const map = getPinnedChatMap(profileType, profileId);
  return Boolean(map[String(chatId)]);
}

/**
 * Retrieves the pinned_at timestamp for a chat conversation, if pinned.
 */
export function getPinnedChatTimestamp(
  chatId?: string | number | null,
  profileType?: string | null,
  profileId?: string | null
): string | null {
  if (!chatId) return null;
  const map = getPinnedChatMap(profileType, profileId);
  return map[String(chatId)] || null;
}

/**
 * Sets or removes the pinned state of a specific chat conversation independently.
 */
export function setChatPinned(
  chatId: string | number,
  isPinned: boolean,
  profileType?: string | null,
  profileId?: string | null,
  pinnedAt?: string | null
): void {
  if (typeof window === "undefined" || !chatId) return;
  const newKey = getStorageKey(PINNED_CHAT_KEY_PREFIX, profileType, profileId);

  try {
    const map = { ...getPinnedChatMap(profileType, profileId) };
    const strId = String(chatId);

    if (isPinned) {
      map[strId] = pinnedAt || map[strId] || new Date().toISOString();
    } else {
      delete map[strId];
    }

    localStorage.setItem(newKey, JSON.stringify(map));
  } catch {}
}

/**
 * Synchronizes pinned chats from backend response into local storage cache.
 */
export function syncPinnedChatsFromBackend(
  chats: Array<{ id: string | number; is_pinned?: boolean; pinned_at?: string | null }>,
  profileType?: string | null,
  profileId?: string | null
): void {
  if (typeof window === "undefined" || !Array.isArray(chats)) return;
  const newKey = getStorageKey(PINNED_CHAT_KEY_PREFIX, profileType, profileId);

  try {
    const currentMap = { ...getPinnedChatMap(profileType, profileId) };
    let hasChanges = false;

    chats.forEach((c) => {
      const strId = String(c.id);
      if (c.is_pinned) {
        const timestamp = c.pinned_at || currentMap[strId] || new Date().toISOString();
        if (currentMap[strId] !== timestamp) {
          currentMap[strId] = timestamp;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem(newKey, JSON.stringify(currentMap));
    }
  } catch {}
}

// Backward compatibility helpers
export function getPinnedChatId(profileType?: string | null, profileId?: string | null): string | null {
  const map = getPinnedChatMap(profileType, profileId);
  const keys = Object.keys(map);
  return keys.length > 0 ? keys[0] : null;
}

export function setPinnedChatId(
  chatId: string | null,
  profileType?: string | null,
  profileId?: string | null
): void {
  if (chatId) {
    setChatPinned(chatId, true, profileType, profileId);
  }
}
