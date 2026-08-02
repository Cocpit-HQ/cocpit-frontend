import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS UI STORE
// ═══════════════════════════════════════════════════════════════════════
//
// This mirrors the pattern used in `src/store/job.store.ts` for the Jobs
// feature, applied to every tab under `src/features/settings/tabs/*`.
//
// WHY ZUSTAND HERE (and not React Context / prop-drilling / useState):
// The Settings sidebar (`SettingsSidebar.tsx`) renders each tab as its own
// route (`/settings/account`, `/settings/privacy`, ...). Every one of those
// route components previously kept its own local `useState` for things like
// "which modal is open" or "which sub-tab is active". That works, but it
// means state resets on every navigation, can't be read/set from outside
// the page (e.g. a sidebar badge, a breadcrumb, a keyboard shortcut), and
// scatters the same kind of state (open/closed, selected id, active pill)
// across 8+ files with 8 different shapes. Zustand gives all of that a
// single, typed, importable source of truth — exactly like `useJobStore`
// centralizes `activeCandidateTab`, `selectedJobId`, modal flags, etc. for
// the Jobs feature.
//
// WHY *NOT* PUT SERVER DATA HERE:
// Zustand only owns UI state — what the user is looking at right now
// (open modal, active pill, selected row id). Anything that comes from the
// API (account info, privacy settings, sessions, saved folders, activity
// logs, blocked users, reports...) belongs in TanStack Query, because Query
// already gives us caching, background refetch, loading/error state, and
// mutation rollback for free. See `useJobs.ts` for the reference: the
// *active tab* lives in `useJobStore`, but the *data for that tab* is a
// `useQuery`/`useInfiniteQuery` whose `queryKey` includes the active tab
// and whose `enabled` flag is gated on it, e.g.:
//
//   const { activeTab } = useSettingsStore();
//   useQuery({
//     queryKey: ['activityLogs', activeTab],   // tab is part of the cache key
//     queryFn: () => getActivityLogs(activeTab),
//     enabled: !!activeTab,                    // only fetch the tab in view
//   });
//
// That's what "use tanstack for the tab parameter" means in practice: the
// Zustand slice below is only ever the *parameter* (which tab / which id is
// selected); a `useQuery` next to it in each page is what actually fetches
// and caches the data for that parameter. `useAccountSettings.ts`,
// `usePrivacySettings.ts`, `useActiveSessions.ts` and `useSavedFolders.ts`
// already follow this — `ActivitySettingsPage`, `BlockedSettingsPage` and
// `ReportsSettingsPage` currently fetch with raw `useEffect` + `useState`
// and are the next candidates to move onto `useQuery` the same way.
//
// WHY NO `persist` MIDDLEWARE (unlike `job.store.ts`):
// The Create-Job wizard persists to `sessionStorage` because losing that
// state on refresh would lose a half-written job draft. Nothing here is
// like that — an open "delete account" modal or a "which pill is active"
// selection SHOULD reset on refresh/navigation, so this store intentionally
// stays in-memory only.
// ═══════════════════════════════════════════════════════════════════════

// ─── Account tab (`AccountSettingsPage`) ────────────────────────────────
export type AccountModal = 'logout' | 'delete' | null;

// ─── Privacy tab (`PrivacySettingsPage`) ────────────────────────────────
export type PrivacyLogoutTarget = 'single' | 'all' | null;

// ─── Your activity tab (`ActivitySettingsPage`) ─────────────────────────
export type ActivityTab = 'Likes' | 'Comments' | 'Tags';

// ─── Account status tab (`ReportsSettingsPage`) ─────────────────────────
export type ReportsTab = 'reports' | 'actions';

// ─── Support tab (`SupportSettingsPage`) ────────────────────────────────
export type SupportView = 'main' | 'help' | 'contact';

export interface SettingsUIState {
  // ─── Account slice ─────────────────────────────────────────
  // Replaces `const [activeModal, setActiveModal] = useState<string|null>(null)`
  // in AccountSettingsPage.tsx. 'logout' | 'delete' | null instead of a raw
  // string keeps every call site type-checked against the two modals that
  // actually exist on this page.
  account: {
    activeModal: AccountModal;
  };

  // ─── Privacy slice ─────────────────────────────────────────
  // PrivacySettingsPage reuses the same LogoutModal as Account, but needs
  // two extra bits: which mode ('single' device vs 'all' other devices) and
  // which session row triggered it. Grouped together because they're always
  // set/cleared as a pair.
  privacy: {
    logoutTarget: PrivacyLogoutTarget;
    sessionToLogout: string | number | null;
  };

  // ─── Saved posts slice ─────────────────────────────────────
  saved: {
    isCreateFolderModalOpen: boolean;
  };

  // ─── Blocked accounts slice ─────────────────────────────────
  // Only the id is kept here; the row's display data (name/avatar/date)
  // stays with whatever TanStack Query cache holds the blocked list, so we
  // never have two divergent copies of the same server object.
  blocked: {
    userToUnblockId: string | number | null;
  };

  // ─── Your activity slice ────────────────────────────────────
  // This is the "tab parameter" the header comment above refers to: the
  // page passes `activity.activeTab` into a query key so switching pills
  // is a cache lookup, not a manual refetch.
  activity: {
    activeTab: ActivityTab;
  };

  // ─── Account status (reports) slice ─────────────────────────
  reports: {
    activeTab: ReportsTab;
    selectedReportId: number | null;
    selectedActionId: string | null;
  };

  // ─── Support slice ─────────────────────────────────────────
  support: {
    view: SupportView;
  };

  // ─── Actions ─────────────────────────────────────────────────
  setAccountModal: (modal: AccountModal) => void;

  openPrivacyLogout: (target: Exclude<PrivacyLogoutTarget, null>, sessionId?: string | number | null) => void;
  closePrivacyLogout: () => void;

  setSavedCreateFolderModalOpen: (open: boolean) => void;

  setBlockedUserToUnblock: (id: string | number | null) => void;

  setActivityTab: (tab: ActivityTab) => void;

  setReportsTab: (tab: ReportsTab) => void;
  selectReport: (id: number | null) => void;
  selectAction: (id: string | null) => void;

  setSupportView: (view: SupportView) => void;

  // Resets every slice back to its default. Call this from the settings
  // layout's unmount (or a "Cancel"/logout flow) so a stale modal/tab from
  // a previous visit can never leak into the next one.
  resetSettingsUI: () => void;
}

const initialState: Omit<
  SettingsUIState,
  | 'setAccountModal'
  | 'openPrivacyLogout'
  | 'closePrivacyLogout'
  | 'setSavedCreateFolderModalOpen'
  | 'setBlockedUserToUnblock'
  | 'setActivityTab'
  | 'setReportsTab'
  | 'selectReport'
  | 'selectAction'
  | 'setSupportView'
  | 'resetSettingsUI'
> = {
  account: {
    activeModal: null,
  },
  privacy: {
    logoutTarget: null,
    sessionToLogout: null,
  },
  saved: {
    isCreateFolderModalOpen: false,
  },
  blocked: {
    userToUnblockId: null,
  },
  activity: {
    activeTab: 'Likes',
  },
  reports: {
    activeTab: 'reports',
    selectedReportId: null,
    selectedActionId: null,
  },
  support: {
    view: 'main',
  },
};

export const useSettingsStore = create<SettingsUIState>()((set) => ({
  ...initialState,

  // ─── Account actions ─────────────────────────────────────────
  setAccountModal: (modal) =>
    set((state) => ({ account: { ...state.account, activeModal: modal } })),

  // ─── Privacy actions ─────────────────────────────────────────
  // A single setter for both fields keeps "open the modal in mode X for
  // session Y" atomic — there's no in-between render where one is set and
  // the other isn't, which is what caused the two separate `useState`
  // calls in the original page to need careful ordering.
  openPrivacyLogout: (target, sessionId = null) =>
    set((state) => ({
      privacy: { ...state.privacy, logoutTarget: target, sessionToLogout: sessionId },
    })),
  closePrivacyLogout: () =>
    set((state) => ({
      privacy: { ...state.privacy, logoutTarget: null, sessionToLogout: null },
    })),

  // ─── Saved posts actions ─────────────────────────────────────
  setSavedCreateFolderModalOpen: (open) =>
    set((state) => ({ saved: { ...state.saved, isCreateFolderModalOpen: open } })),

  // ─── Blocked accounts actions ─────────────────────────────────
  setBlockedUserToUnblock: (id) =>
    set((state) => ({ blocked: { ...state.blocked, userToUnblockId: id } })),

  // ─── Activity actions ─────────────────────────────────────────
  setActivityTab: (tab) =>
    set((state) => ({ activity: { ...state.activity, activeTab: tab } })),

  // ─── Reports actions ─────────────────────────────────────────
  setReportsTab: (tab) =>
    set((state) => ({
      reports: { ...state.reports, activeTab: tab, selectedReportId: null, selectedActionId: null },
    })),
  selectReport: (id) =>
    set((state) => ({ reports: { ...state.reports, selectedReportId: id } })),
  selectAction: (id) =>
    set((state) => ({ reports: { ...state.reports, selectedActionId: id } })),

  // ─── Support actions ─────────────────────────────────────────
  setSupportView: (view) => set((state) => ({ support: { ...state.support, view } })),

  // ─── Reset ─────────────────────────────────────────────────────
  resetSettingsUI: () => set({ ...initialState }),
}));
