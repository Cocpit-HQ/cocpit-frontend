# Company Onboarding — Execution Tracker

> **Date:** July 1, 2026
> **Branch:** `feature/CompanyOnboarding`
> **Focus:** Static UI Design Pages for Company Onboarding Flow

---

## Goal

Build all static UI pages for the Company Onboarding flow matching Figma designs. Pages: Choose Organization → Stage 1: Identity → Stage 2: Presence → Stage 3: Verification.

---

## Task 1 — Folder Structure & Scaffolding
**Module:** `src/features/company-onboarding/`
**Priority:** 🔴 CRITICAL

- [x] **1.1** Create folder structure: `features/company-onboarding/{components,components/steps,constants,types,store,hooks,utils}`
- [x] **1.2** Create `types/company-onboarding.types.ts` — all TypeScript interfaces
- [x] **1.3** Create `constants/onboarding.constants.ts` — stage config, industry options, size options
- [x] **1.4** Create `utils/company-onboarding.utils.ts` — validation helpers
- [x] **1.5** Create `index.ts` — barrel exports

**Status:** ✅ Completed

---

## Task 2 — Zustand Store
**Module:** `src/features/company-onboarding/store/`
**Priority:** 🔴 CRITICAL

- [x] **2.1** Create `company-onboarding.store.ts` — state interface with all fields
- [x] **2.2** Implement navigation actions: `setCurrentStage`, `goNext`, `goBack`
- [x] **2.3** Implement field actions: `updateField`, `setOrganizationType`, `setLogo`
- [x] **2.4** Implement document actions: `addDocument`, `removeDocument`, `updateDocument`
- [x] **2.5** Implement `resetStore` action

**Status:** ✅ Completed

---

## Task 3 — Shared UI Components
**Module:** `src/features/company-onboarding/components/`
**Priority:** 🔴 CRITICAL

- [x] **3.1** Create `StageProgressBar.tsx` — 3-stage stepper with Tailwind (React.memo)
- [x] **3.2** Create `StageNavigationButtons.tsx` — Back/Next/Cancel/Publish with Tailwind (React.memo)
- [x] **3.3** Create `CompanyOnboardingPage.tsx` — master container with AnimatePresence + Tailwind

**Status:** ✅ Completed

---

## Task 4 — Route Setup
**Module:** `src/app/company-onboarding/`
**Priority:** 🟠 HIGH

- [x] **4.1** Create `src/app/company-onboarding/page.tsx` — thin route importing `CompanyOnboardingPage`
- [x] **4.2** Verify route loads at `/company-onboarding`

**Status:** ✅ Completed

---

## Task 5 — Page 0: Choose Organization
**Module:** `src/features/company-onboarding/components/steps/`
**Priority:** 🔴 CRITICAL

- [x] **5.1** Create `ChooseOrganization.tsx` with Tailwind styling
- [x] **5.2** Build UI: title, subtitle, two illustrated cards (Company / Institute) with "Or" divider
- [x] **5.3** Implement click handler → set org type in store → navigate to Stage 1
- [x] **5.4** Wrap with `React.memo`, apply `useCallback` for click handlers
- [x] **5.5** Style to match Figma: centered layout, card hover effects, illustrations

**Status:** ✅ Completed

---

## Task 6 — Stage 1: Identity
**Module:** `src/features/company-onboarding/components/steps/`
**Priority:** 🔴 CRITICAL

- [x] **6.1** Create `Stage1Identity.tsx` with Tailwind styling
- [x] **6.2** Build left column: Organization Name *, Founded Year, Industry Selection dropdown
- [x] **6.3** Build right column: Logo upload card (empty state + filled state with "Change" link)
- [x] **6.4** Implement validation: Next Step disabled until Organization Name filled
- [x] **6.5** Wire all fields to Zustand store with selective selectors
- [x] **6.6** Apply `React.memo`, `useMemo` (validation), `useCallback` (onChange handlers)
- [x] **6.7** Style to match Figma: two-column layout, dashed upload border, blue hint text

**Status:** ✅ Completed

---

## Task 7 — Stage 2: Presence
**Module:** `src/features/company-onboarding/components/steps/`
**Priority:** 🔴 CRITICAL

- [x] **7.1** Create `Stage2Presence.tsx` with Tailwind styling
- [x] **7.2** Build row 1: Official Email (+ Verify btn) | Phone Number (country flag + Verify btn)
- [x] **7.3** Build row 2: Website input | Organization Size dropdown
- [x] **7.4** Build HQ Location section: blue header, Country dropdown, City dropdown
- [x] **7.5** Build map preview area (static map placeholder)
- [x] **7.6** Build Headline input + Description textarea
- [x] **7.7** Wire all fields to Zustand store
- [x] **7.8** Apply `React.memo`, `useMemo` (validation), `useCallback` (handlers)
- [x] **7.9** Style to match Figma: two-column grid, blue section headers, map container

**Status:** ✅ Completed

---

## Task 8 — Stage 3: Verification
**Module:** `src/features/company-onboarding/components/steps/`
**Priority:** 🔴 CRITICAL

- [x] **8.1** Create `Stage3Verification.tsx` with Tailwind styling
- [x] **8.2** Build left side: Country of Operation dropdown
- [x] **8.3** Build Documents section: blue "DOCUMENTS" header, "+" button, upload areas, delete (trash) button
- [x] **8.4** Build right side: Profile Preview card (logo, verified badge, tagline, partner count, "Did you know?" info box)
- [x] **8.5** Wire all fields to Zustand store
- [x] **8.6** Apply `React.memo`, `useMemo` (preview data), `useCallback` (doc upload/remove)
- [x] **8.7** Style to match Figma: two-column layout, preview card styling, blue info box

**Status:** ✅ Completed

---

## Task 9 — Animations & Transitions
**Module:** `src/features/company-onboarding/components/`
**Priority:** 🟡 MEDIUM

- [ ] **9.1** Add Framer Motion slide transitions between stages
- [ ] **9.2** Add fade-in for progress bar stage changes
- [ ] **9.3** Add upload feedback animations (logo + documents)
- [ ] **9.4** Add button hover/press micro-interactions

**Status:** ⬜ Not Started

---

## Task 10 — Polish & Verification
**Priority:** 🟠 HIGH

- [x] **10.1** Responsive layout check (mobile + desktop)
- [x] **10.2** Visual comparison against all Figma pages
- [x] **10.3** TypeScript check: `npx tsc --noEmit`
- [x] **10.4** Build check: `npm run build`
- [x] **10.5** Full flow walkthrough: Page 0 → Stage 1 → Stage 2 → Stage 3

**Status:** ✅ Completed

---

## EOD Integration Checkpoint

**Checklist:**

- [x] All 4 pages render correctly at `/company-onboarding`
- [x] Stage progress bar updates across all stages
- [x] Navigation (Next/Back/Cancel) works across all stages
- [x] Form state persists when navigating back and forth
- [x] No TypeScript errors
- [x] Build succeeds

**Checkpoint Status:** ✅ Completed
