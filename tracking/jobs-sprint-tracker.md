# Jobs State Management Sprint Tracker

> **Date:** Refactoring Sprint Day 1
> **Focus:** State Layer — Zustand Store + URL Sync + Hook Migration + Let Variables Removal

---

## Sprint Goal

Centralize and stabilize the state management in the Jobs feature. Replace buggy module-level variables (`let` arrays) in `jobs.service.ts` with a reactive Zustand store, fix tab persistence on refresh via URL search parameters, and synchronize states across page navigation.

---

## Sprint Tasks — State Management Implementation

### Task 1 — Create Zustand Job Store
**Module:** `src/store/`
**Priority:** 🔴 CRITICAL — blocks all hook migrations

- [x] **1.1** Create new store file: [job.store.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/store/job.store.ts)
- [x] **1.2** Define UI state type interfaces (`JobsUIState`) for tabs, saved/applied IDs, offer responses, and filters
- [x] **1.3** Implement store actions: `addSavedId`, `removeSavedId`, `addAppliedId`, `removeAppliedId`, `setOfferResponse`, and `toggleFollowCompany`
- [x] **1.4** Implement filter mutation actions: `setFilterValue`, `setMultipleFilters`, and `resetFilters`
- [x] **1.5** Verify store exports without any compiler warnings or TypeScript errors

**Status:** ✅ Complete
**Completion:** 5 / 5 subtasks

---

### Task 2 — URL-Based Tab Persistence
**Module:** `src/features/jobs/`
**Priority:** 🔴 CRITICAL — resolves the tab-reset-on-refresh bug

- [x] **2.1** Modify [JobsPage.tsx](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/pages/JobsPage.tsx): read `tab` from URL search parameters on load
- [x] **2.2** Modify [JobsPage.tsx](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/pages/JobsPage.tsx): update URL with `?tab={tabId}` using Next.js router on tab switch
- [x] **2.3** Modify [JobOffersPage.tsx](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/pages/JobOffersPage.tsx): replace `jobsService.setActiveTab` click handler with router redirection to `?tab=Offers`
- [x] **2.4** Modify [useJobs.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobs.ts): read current tab from the Zustand store instead of local `useState`
- [ ] **2.5** Test page reload: navigate to "My applications", refresh, and confirm the active tab remains "My applications"

**Status:** ⏳ In Progress
**Completion:** 4 / 5 subtasks

---

### Task 3 — Migrate Hook States to Zustand
**Module:** `src/features/jobs/hooks/`
**Priority:** 🔴 CRITICAL — binds hooks reactively to store changes

- [x] **3.1** Modify [useJobs.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobs.ts): bind filter state and actions directly to Zustand store actions
- [x] **3.2** Modify [useJobs.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobs.ts): bind application stats state to Zustand store actions
- [x] **3.3** Modify [useJobs.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobs.ts): modify `toggleSave`, `applyToJob`, and `withdrawJob` to trigger state adjustments on the store
- [x] **3.4** Modify [useJobDetail.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobDetail.ts): bind saved, applied, and followed states to store selectors
- [x] **3.5** Modify [useJobDetail.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobDetail.ts): coordinate API success responses to dispatch updates to the Zustand store
- [x] **3.6** Modify [useJobOffers.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/hooks/useJobOffers.ts): update store offer status collections when accepting or declining is confirmed

**Status:** ✅ Complete
**Completion:** 6 / 6 subtasks

---

### Task 4 — Clean up API Service Layer (Remove Module Let State)
**Module:** `src/features/jobs/services/`
**Priority:** 🔴 CRITICAL — enforces single source of truth

- [x] **4.1** Delete the 7 global `let` state variables inside [jobs.service.ts](file:///c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/features/jobs/services/jobs.service.ts)
- [x] **4.2** Delete duplicate getters, setters, and in-memory seeding methods from the service file
- [x] **4.3** Update `getJobs` and `getJobById` to fetch raw items, returning them to the hooks for state assignment
- [x] **4.4** Verify the service layer acts as a pure API layer with zero side effects or state storage
- [x] **4.5** Test execution flow: compile the frontend and verify all page views render correctly

**Status:** ✅ Complete
**Completion:** 5 / 5 subtasks

---

### Task 5 — Page and Local Persistence Updates (Optional)
**Module:** `src/features/jobs/`
**Priority:** 🟡 OPTIONAL — clean code improvement

- [x] **5.1** Evaluate scroll preservation logic: decided to retain `sessionStorage` for page scroll coordinates to prevent render-cycle clashes and preserve scroll across page refreshes.
- [x] **5.2** Verify `JobDetailPage` uses `coming_from_job_detail` sessionStorage flag correctly.
- [x] **5.3** Verify `JobsPage` correctly captures and restores scroll positions using `sessionStorage` (verified working!).

**Status:** ✅ Complete
**Completion:** 3 / 3 subtasks

---

## EOD Integration Checkpoint

**Time:** Sprint Completion
**Run by:** Developer

**Checklist:**

- [ ] Stays on correct tab when refreshing (Explore, My applications, Offers, Saved)
- [ ] Saving a job on JobDetailPage immediately fills the bookmark in JobsPage without refresh
- [ ] Applying to a job on JobDetailPage immediately registers the item in "My applications"
- [ ] Filters persist across navigation (apply filter → view job details → go back → filter remains)
- [ ] Removing/withdrawing applications works correctly, updating status lists dynamically
- [x] All module-level `let` variables are deleted from `jobs.service.ts`
- [x] Build succeeds with zero TypeScript errors or linter breaks in the Jobs features folder

**Checkpoint Status:** ⏳ Pending

---

## Handoff Notes

> **Sprint Status:** In Progress
> **Completed:** 23 / 24 subtasks

**Current Blockers:**
- None

**Immediate Next Actions:**
- Run local browser testing to verify checkpoints 96, 97, 98, 99, 100, then mark sprint complete.
