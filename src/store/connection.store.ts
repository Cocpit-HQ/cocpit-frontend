// src/store/connection.store.ts
// Zustand store for Connection section UI state.
// Holds tab state and optimistic request removal tracking.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionTab, InvitationSubTab } from '@/features/connection/types';

interface ConnectionUIState {
  // ─── Tab ──────────────────────────────────────────────────────────────────
  activeTab:    ConnectionTab;
  setActiveTab: (tab: ConnectionTab) => void;
  invitationSubTab: InvitationSubTab;
  setInvitationSubTab: (subTab: InvitationSubTab) => void;

  // ─── Optimistic removals ──────────────────────────────────────────────────
  // When user accepts/declines/undoes, we add the id here to hide the card
  // immediately. On error, we remove the id to restore the card.
  removedRequestIds: string[];
  removeRequest:     (id: string) => void;
  removeRequests:    (ids: string[]) => void;
  restoreRequest:    (id: string) => void;
  restoreRequests:   (ids: string[]) => void;
  clearRemovedRequests: () => void;

  // ─── Followed & Dismissed suggestions ──────────────────────────────────────
  // Track followed user IDs for instant Follow → Following UI toggle
  followedUserIds: Set<string>;
  setFollowed:     (userId: string) => void;
  clearFollowed:   () => void;
  dismissedSuggestionIds: Set<string>;
  dismissSuggestion:      (userId: string) => void;
}

export const useConnectionStore = create<ConnectionUIState>()(
  persist(
    (set) => ({
      // Tab
      activeTab:    'received',
      setActiveTab: (tab) =>
        set(() => ({
          activeTab:         tab,
          removedRequestIds: [], // reset optimistic state on tab switch
        })),
      invitationSubTab: 'teams',
      setInvitationSubTab: (subTab) => set({ invitationSubTab: subTab }),

      // Optimistic removals
      removedRequestIds: [],
      removeRequest:  (id) =>
        set((s) => ({ removedRequestIds: [...s.removedRequestIds, id] })),
      removeRequests: (ids) =>
        set((s) => ({ removedRequestIds: Array.from(new Set([...s.removedRequestIds, ...ids])) })),
      restoreRequest: (id) =>
        set((s) => ({ removedRequestIds: s.removedRequestIds.filter((r) => r !== id) })),
      restoreRequests: (ids) =>
        set((s) => ({ removedRequestIds: s.removedRequestIds.filter((r) => !ids.includes(r)) })),
      clearRemovedRequests: () => set({ removedRequestIds: [] }),

      // Followed & Dismissed users
      followedUserIds: new Set(),
      setFollowed:  (userId) =>
        set((s) => ({ followedUserIds: new Set([...s.followedUserIds, userId]) })),
      clearFollowed: () => set({ followedUserIds: new Set() }),
      dismissedSuggestionIds: new Set(),
      dismissSuggestion: (userId) =>
        set((s) => ({ dismissedSuggestionIds: new Set([...s.dismissedSuggestionIds, userId]) })),
    }),
    {
      name: 'connection-ui-store',
      partialize: (state) => ({
        dismissedSuggestionIds: Array.from(state.dismissedSuggestionIds),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        dismissedSuggestionIds: new Set(persistedState?.dismissedSuggestionIds || []),
      }),
    }
  )
);

