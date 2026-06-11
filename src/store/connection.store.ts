// src/store/connection.store.ts
// Zustand store for Connection section UI state.
// Holds tab state and optimistic request removal tracking.

import { create } from 'zustand';
import type { ConnectionTab } from '@/features/connection/types';

interface ConnectionUIState {
  // ─── Tab ──────────────────────────────────────────────────────────────────
  activeTab:    ConnectionTab;
  setActiveTab: (tab: ConnectionTab) => void;

  // ─── Optimistic removals ──────────────────────────────────────────────────
  // When user accepts/declines/undoes, we add the id here to hide the card
  // immediately. On error, we remove the id to restore the card.
  removedRequestIds: string[];
  removeRequest:     (id: string) => void;
  restoreRequest:    (id: string) => void;
  clearRemovedRequests: () => void;

  // ─── Followed suggestions ─────────────────────────────────────────────────
  // Track followed user IDs for instant Follow → Following UI toggle
  followedUserIds: Set<string>;
  setFollowed:     (userId: string) => void;
  clearFollowed:   () => void;
}

export const useConnectionStore = create<ConnectionUIState>((set) => ({
  // Tab
  activeTab:    'received',
  setActiveTab: (tab) =>
    set(() => ({
      activeTab:         tab,
      removedRequestIds: [], // reset optimistic state on tab switch
    })),

  // Optimistic removals
  removedRequestIds: [],
  removeRequest:  (id) =>
    set((s) => ({ removedRequestIds: [...s.removedRequestIds, id] })),
  restoreRequest: (id) =>
    set((s) => ({ removedRequestIds: s.removedRequestIds.filter((r) => r !== id) })),
  clearRemovedRequests: () => set({ removedRequestIds: [] }),

  // Followed users
  followedUserIds: new Set(),
  setFollowed:  (userId) =>
    set((s) => ({ followedUserIds: new Set([...s.followedUserIds, userId]) })),
  clearFollowed: () => set({ followedUserIds: new Set() }),
}));
