// # State Management Guideline — `manage-team`
// 
// Reference pattern: `src/features/jobs/**` (specifically `useMyListings.ts` +
// `MyListingsDashboard.tsx`). This doc defines how state should be handled in
// every `manage-team` component, and the concrete fixes needed to cut down
// unnecessary re-renders and API calls.
// 
// ## 1. The rule that decides everything
// 
// | Kind of data | Where it lives | Why |
// |---|---|---|
// | Data from the API (roles, members, logs, invites) | **React Query** (`useQuery`/`useInfiniteQuery`) | Caching, dedupe, background refetch |
// | Derived from server data (filtered/sorted lists, counts) | **`useMemo`**, never a separate `useState` | Avoids a second render + stale-copy bugs |
// | Ephemeral UI (modal open/close, selected row, active tab, form inputs) | **`useState`** local to the component that owns it | Nothing else needs it, don't lift it |
// | UI state that must survive navigation or be shared across routes (e.g. multi-step wizard, "selected item" passed between two pages) | **Zustand store** (like `job.store.ts`) | Only when `useState` can't reach far enough |
// | Tab / filter / "which record is open" — state that should survive a page refresh or be shareable via link | **URL query params** (`router.replace`), same as `MyListingsDashboard` | `manage-team` doesn't do this today — Jobs does |
// 
// `manage-team` has **no store today** (no `team.store.ts`) — that's correct,
// keep it that way. Nothing in this feature currently needs cross-route
// persistence the way the job-creation wizard does. Only introduce a store if
// you add something like a multi-step "create role" wizard that must survive a
// refresh.
// 
// ### 1a. Cross-session changes: query invalidation doesn't reach other users' browsers
// 
// `invalidateQueries` only clears the cache in the browser that ran the
// mutation. If org member A accepts an invite, member B's (the admin's) browser
// has no way to hear about it unless something pushes to it.
// 
// ✅ **This is now solved via real-time, not polling.** The backend
// (`organization.members.controller.js#acceptTeamsInvite` /
// `#declineTeamsInvite` / `#removeMember`) emits
// `socketService.notifyOrg(orgId, "member_sync", { action: "ACCEPT" | "DECLINE" | "REMOVE", ... })`
// after commit. Every socket auto-joins its `org_<orgId>` rooms on connect
// (`sockets/index.js` → `notificationHandler.autoJoinCompanyRooms`), so any
// admin with the app open — on any page — receives the event immediately.
// 
// `SocketContext.tsx` listens for `member_sync` and invalidates:
// - `['team','members']`, `['team','roles']`, `['team','role']`, `['team','invites','pending']`
// - `['team','activity-logs']` — covers **both** Activity Log surfaces
//   (`TeamActivityLogPage` and `RoleDetailsPage`'s Activity tab, since both read
//   through `useActivityLogs`). No separate audit-log-wide socket event was
//   added for this — `member_sync` already fires for every action that shows up
//   in the log (invite accepted/declined, member removed), so piggybacking on it
//   was enough. A truly generic "new audit log row" event would have to hook
//   into `logAudit`, which is shared across unrelated modules (jobs, posts,
//   chat, …) — out of scope unless activity logs need to reflect *every* kind of
//   org event live, not just membership changes.
// 
// `useRoleDetails`/`useTeamMembers`/`useTeamRoles` no longer need
// `refetchInterval` polling (removed) — they now update the instant the event
// lands, same as any other query, wherever they happen to be mounted.
// 
// `useRemoveMember`'s own `onSuccess` still separately invalidates
// `['team','members']`/`['team','roles']` for the admin who *performed* the
// removal — that's the same-session path and is instant regardless of sockets.
// `member_sync` is what closes the gap for everyone else watching.
// 
// **Still not wired for real-time:** `withdrawInvite` and role
// edits/creates/deletes (`useCreateRole`/`useUpdateRole`/`useDeleteRole`). Same
// pattern applies if that's ever needed: backend emits `notifyOrg`/`notifyUser`
// with a `type`/event name → add a listener in `SocketContext.tsx` → invalidate
// the relevant `['team', ...]` keys. Don't reach for `refetchInterval` polling
// for cross-session sync unless a socket event genuinely isn't feasible — it's
// a stopgap, not the default.
// 
// ## 2. What Jobs does that Team should copy
// 
// From `useMyListings.ts` / `MyListingsDashboard.tsx`:
// 
// 1. **`useInfiniteQuery` with cursor pagination** instead of loading everything at once.
// 2. **`staleTime` on every query** so switching tabs doesn't refetch instantly.
// 3. **Tab/filter state mirrored into the URL** via `router.replace`, so refresh doesn't reset the view.
// 4. **`useCallback` on every handler passed down to a list/child component**, so children don't re-render just because the parent re-rendered.
// 5. **`refresh()` = `queryClient.invalidateQueries`**, never manual state patching after a mutation.
// 
// ## 3. Component-by-component plan
// 
// | File | Current state | Action |
// |---|---|---|
// | `hooks/useTeamRoles.ts`, `useTeamMembers.ts`, `useRoleDetails.ts` | `useQuery`, `staleTime: 3min` | Already matches Jobs pattern. Keep. |
// | `hooks/useActivityLogs.ts` | ✅ **Done** — now `useInfiniteQuery`, `staleTime: 1min`, cursor-paginated (`cursorCreatedAt`/`cursorLogId`, 20/page) | Backend (`organization.teams.controller.js#getActivityLogs`) already supported cursor pagination and wasn't being used — frontend was silently capped at page 1/20 rows. Mirrors `useMyListings` exactly. `ActivityLogTable` now drives the infinite-scroll sentinel via `useInView`, same as `ListingsTab`. |
// | `hooks/usePendingInvites.ts` | `useQuery`, **no `staleTime`** → refetches on every focus/mount | Add `staleTime: 1000 * 60 * 2` to match sibling hooks. Cuts avoidable API calls. |
// | `hooks/useCreateRole.ts`, `useUpdateRole.ts`, `useDeleteRole.ts`, `useInviteMember.ts`, `useRemoveMember.ts`, `useUpdateMemberRole.ts`, `useWithdrawInvite.ts` | `useMutation` + `invalidateQueries` on success | Matches Jobs pattern (`refresh()`). Keep. |
// | `components/members/InviteMemberModal.tsx` | `search` state fires `teamService.getInviteCandidates` on **every keystroke** | **Fix**: wrap `search` with the existing `useDebounce` hook (already used in `TeamActivityLogPage`) before it goes into the effect's dependency array. Biggest avoidable-API-call issue in the feature. |
// | `pages/RoleDetailsPage.tsx` — `logFilters` (used for `useActivityLogs`) | ✅ **Done** — `logFilters.search` now runs through `useDebounce` (300ms, same as `TeamActivityLogPage`) before it reaches the query key | Was inconsistent with `TeamActivityLogPage`. Now both pages debounce identically. |
// | `pages/TeamActivityLogPage.tsx` — `filters` | Already debounced (`useDebounce`, 300ms) + `useMemo` for derived options | Best-practice example in the feature already — reuse this exact pattern elsewhere. |
// | `pages/ManageTeamPage.tsx` — `activeTab`, `isCreateOpen`, `editTarget`, `deleteTarget`, `inviteTarget` | ✅ `activeTab` **done** — mirrored into `?tab=activity` via `router.replace`, same as `MyListingsDashboard`'s `view`/`subtab`. Modal-target state stays local `useState` (correct, don't URL-sync those). | ⬜ Still open: wrap `handleCreate`/`handleUpdate`/`handleDelete` in `useCallback` once the children they're passed to are memoized. |
// | `components/TeamTabs.tsx` | Pure/controlled, no internal state | Fine as-is — same shape as `ListingsTab`'s tab row. Parent persists `activeTab` to the URL (above). |
// | `pages/RoleDetailsPage.tsx` — `activeTab` ('members'/'activity') | ✅ **Done** — same `?tab=` URL-sync pattern as `ManageTeamPage`. Required adding a `<Suspense>` boundary in both route files (`team/page.tsx`, `team/role/[roleId]/page.tsx`) since `useSearchParams()` needs one — same convention already used by `jobs/page.tsx` and `messaging/page.tsx`. | Refresh (or a shared link with `?tab=activity`) now lands back on the correct sub-tab instead of resetting to Members. |
// | `components/roles/RoleList.tsx`, `RoleCard.tsx` | Pure props-in, no state; **not memoized** | Wrap `RoleCard` in `React.memo`. Any state change in `ManageTeamPage` (e.g. opening a modal) currently re-renders every `RoleCard` even though its props didn't change. Pair with `useCallback`-wrapped handlers in the parent — `React.memo` does nothing if a new closure is passed every render. |
// | `components/members/MemberList.tsx`, `MemberRow.tsx` | Same shape as RoleList/RoleCard | Same fix: `React.memo(MemberRow)` + `useCallback` for `onRemoveMember`/`onWithdrawInvitation` in the parent (`RoleDetailsPage`). |
// | `components/activity/ActivityLogTable.tsx`, `ActivityLogRow.tsx` | ✅ **Done** — `ActivityLogRow` wrapped in `React.memo`; `ActivityLogTable` now accepts `hasMore`/`isFetchingMore`/`loadMore` and renders the infinite-scroll sentinel | Rows no longer re-render on unrelated parent state changes; list no longer front-loads every log row at once. |
// | `components/activity/ActivityLogFilters.tsx`, `RoleDropdown.tsx` | Controlled, `RoleDropdown` has its own open/close `useState` | Fine — dropdown open state is correctly local, no change needed. |
// | `components/roles/CreateRoleModal.tsx`, `EditRoleModal.tsx`, `DeleteRoleConfirm.tsx`, `RemoveMemberConfirm.tsx`, `WithdrawInviteConfirm.tsx` | Local form/confirm state | Correct as local `useState` — modal-scoped, no change. |
// | `components/permissions/PermissionCheckList.tsx` | Controlled checklist, no independent state expected | Verify it takes `permissions`/`onChange` as props rather than mirroring props into local state. If it does mirror, drop that and let the parent modal own the single source of truth. |
// 
// ## 4. The three concrete fixes worth doing first
// 
// 1. ⬜ **Debounce `InviteMemberModal` search** — currently calls the API on every keystroke. *(not yet done)*
// 2. ✅ **Debounce `RoleDetailsPage`'s `logFilters.search`** — now in line with `TeamActivityLogPage`.
// 3. ⬜ `React.memo` **`RoleCard`** and **`MemberRow`** + `useCallback` the handlers their parents pass in (`ActivityLogRow` is already memoized). Stops the whole list re-rendering when an unrelated piece of parent state (like a modal `isOpen` flag) changes.
// 
// Also done ahead of schedule:
// - **Activity logs now use `useInfiniteQuery`** with real cursor pagination (backend already supported it, frontend just wasn't calling it), matching `useMyListings`/`ListingsTab` exactly.
// - **Real-time cross-session sync** via the `member_sync` socket event for invite accept/decline/remove — see §1a.
// - **URL-synced tabs** (`ManageTeamPage.activeTab`, `RoleDetailsPage.activeTab`) — refresh no longer drops back to the default tab.
