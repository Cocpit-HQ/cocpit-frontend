# 📱 Cocpit Mobile Responsiveness Guide — AI Agent Instructions

> **Purpose**: This document serves as the **primary instruction set** for AI agents tasked with making any page or section of the Cocpit frontend mobile-compatible. Always read and apply ALL rules in this document before making any code changes.

---
⚡ HARD RULES (Read First — Full Detail Below)
These are the non-negotiables. Everything else in this doc is elaboration.

Never alter desktop rendering. Any change must be invisible at md: (768px) and above. Prefer responsive utilities on shared markup (w-full md:w-[232px]); duplicate into md:hidden / hidden md:flex halves only when the mobile and desktop structures genuinely differ. Don't duplicate what one responsive class can handle.
Never touch fixed positioning of the shell. Sidebar (fixed left-0 w-[232px] z-40), HomeHeader (sticky top-0 z-50), MobileBottomNav (fixed bottom-0 z-40 md:hidden), and the md:ml-[232px] content offset stay exactly as-is.
Respect the z-index ladder: content < nav/sidebar z-40 < header z-50 < bottom sheets/drawers z-[80] (backdrop z-[79]) < modals z-[100]+. Never insert an intermediate layer without auditing all of them.
Preserve pb-16 on scrollable content (clears the bottom nav) and account for the ~48px sticky header. Content must never hide behind either.
No hardcoded pixel widths on mobile. Screens run 320–428px. Use w-full, %, max-w-*. Fixed pixel widths belong only behind md:.
Design tokens only. Existing colors (--primary, --card, etc. or the established hex values), font-poppins, and matching dark: variants. No new arbitrary colors.
Touch targets ≥ 44×44px. Expand hit area with p-2 -m-2 rather than resizing the visual.
Filters/side panels → bottom sheet or full-screen on mobile, never a sidebar. MobileJobFilters.tsx is the reference implementation.
Test both isCompany modes (useActiveProfile()) on every page — user and company layouts must both work.
No !important, no touch-action: none on scrollables, no bare 100vh (use dvh), no scroll-lock without cleanup.


If a change can't satisfy #1, stop and report rather than proceeding.


🗺️ Mobile UI Reference Images — Tool-Agnostic
This guide ships with mobile mockups for the Jobs section. Do not assume a specific tool name or file path — environments differ (local path, uploaded attachment, workspace directory, or none available).
Step 1: Locate the reference before using it
Resolve the image(s) in this priority order, stopping at the first that works:

Uploaded to the conversation — check the attachments/uploads context for a file matching the mockups (e.g. anything named like *mobile*ui*, job*mockup*, per-screen images).
A path or URL provided in this session — if the user or an earlier message gave one, use whatever read/view tool your environment exposes to open it. The tool may be view, view_file, read_file, an image-preview call, or similar — use what's actually available, don't hardcode a name.
A known workspace/assets directory — search the repo (e.g. assets/, docs/, public/mockups/) for the mockup files.

Step 2: If no image is reachable — say so, don't fabricate
If none of the above resolves, do not invent observations about the mockups. Instead:

State plainly that the reference image isn't accessible in this environment.
Ask the user to attach it, or proceed using the written per-page descriptions in the Page-by-Page Checklist below (which are self-sufficient — every mockup's key layout is described in text).
Never claim to have "reviewed the image" when you haven't.

Step 3: Reading the mockups

Prefer per-screen images if available. If the mockups exist only as one composite canvas with all screens side-by-side, parsing "which phone is the create-job step 3" is error-prone. When possible, ask for or work from individual screen exports named by feature (job-detail-header.png, create-job-step2.png).
If you only have the composite, describe what you can see honestly, flag low confidence on spatial guesses, and cross-check every observation against the written checklist for that page before acting on it.

Step 4: Map to code and report before changing anything
Regardless of image source, follow the standard workflow: identify affected files → audit existing breakpoint splits → report findings and proposed changes → wait for approval.

Why tool-agnostic: a mandatory step tied to one hard-coded local path (c:\Users\...) and one assumed tool name silently fails the moment the agent runs anywhere else. The written checklists are the source of truth; the images are a helpful supplement, not a hard dependency.

## 🔒 ABSOLUTE CONSTRAINTS — NEVER VIOLATE THESE

These rules are **non-negotiable** and must be respected 100% of the time, regardless of how straightforward a fix seems:

### 1. Desktop Layout is Sacred
- **DO NOT** modify, reorder, remove, or restructure any JSX/CSS that renders on `md:` breakpoint and above.
- Desktop components use **absolute/fixed positioning**, explicit pixel widths, and hardcoded layouts — these must remain **exactly as they are**.
- If you need to adjust something for mobile, always add **new mobile-only markup** inside `md:hidden` wrappers, or adjust existing mobile-only sections using `md:hidden` / `sm:block` etc.
- If the component already has a `hidden md:flex` (desktop) and a `flex md:hidden` (mobile) split, only modify the mobile half.

### 2. CSS Class Discipline
- **Never remove** existing Tailwind classes from desktop-targeted elements.
- Desktop-specific classes use the prefix: `md:`, `lg:`, `xl:`.
- Mobile-specific classes have **no breakpoint prefix** (e.g. `flex`, `block`, `hidden`) unless they are being overridden by a larger breakpoint.
- When adding mobile layout classes to an **existing element that has no breakpoint split yet**, always pair them with a `md:` override to restore desktop behavior:
  ```tsx
  // CORRECT — restoring desktop after mobile override
  className="w-full md:w-[232px]"

  // WRONG — this would affect desktop too
  className="w-full"
  ```

### 3. No `position: absolute` / `position: fixed` Changes for Desktop
- The sidebar (`.sidebar`) is `fixed left-0 top-0 w-[232px] h-screen z-40` — this must **never** change.
- The main content wrapper uses `md:ml-[232px]` to compensate — do not remove this.
- The `MobileBottomNav` is `fixed bottom-0 inset-x-0 z-40 md:hidden` — do not change `fixed`, `bottom-0`, or `z-40`.
- The `HomeHeader` is `sticky top-0 z-50` — do not change these properties.

### 4. Theme & Design Token Consistency + Dark Mode
- **Never use hardcoded hex values (`#FFFFFF`)**. All colors MUST use semantic Tailwind classes (`bg-background`, `text-company-text`, etc.).
- If a mobile mockup requires a new color, you must add it to `globals.css` and `tailwind.config.ts`. Do not inline it in the `.tsx` file.
- Every mobile addition **must carry the correct `dark:` Tailwind variant** matching the same element's desktop dark-mode style.
- The app has **two separate dark mode palettes** (User vs. Company).
- **Refer to [DARK_MODE_GUIDE.md](./DARK_MODE_GUIDE.md) for the complete list of tokens and the strict instructions for adding new global colors.**
- Font family must always be `font-poppins` / `var(--font-poppins)`.

### 5. z-index Hierarchy — Never Break Stacking
| Layer | z-index | Component |
|---|---|---|
| Mobile Bottom Nav | `z-40` | `MobileBottomNav` |
| Sidebar | `z-40` | `DarkSidebar` |
| Header | `z-50` | `HomeHeader` |
| Mobile Drawers / Bottom Sheets | `z-[80]` | Any new mobile panels |
| Modals | `z-[100]+` | All modals |
| FAB (Create Post) | `z-40` | Floating action button |

---

## 🏗️ Project Architecture Overview (For Context)

```
src/
├── app/(authenticated)/(dashboard)/
│   ├── layout.tsx          ← Wraps everything in AppShell
│   └── jobs/               ← Jobs route group
│       ├── page.tsx         ← Delegates to JobsPage feature
│       └── [id]/page.tsx    ← Job detail
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     ← Root layout: sidebar + header + mobile nav
│   │   ├── DarkSidebar.tsx  ← Desktop-only sidebar (hidden on mobile)
│   │   ├── MobileBottomNav.tsx ← Mobile-only bottom nav (md:hidden)
│   │   └── sidebar.css      ← Sidebar styles (desktop only)
│   ├── home/
│   │   └── HomeHeader.tsx   ← Top header; has separate desktop/mobile halves
│   └── jobs/                ← Job-specific components
│
├── features/jobs/
│   ├── pages/
│   │   ├── JobsPage.tsx     ← Main jobs listing page (LARGEST, ~48KB)
│   │   ├── JobDetailPage.tsx ← Individual job detail (~37KB)
│   │   └── JobOffersPage.tsx ← Job offers page
│   └── components/          ← Reusable job components
│
└── app/globals.css          ← CSS variables and global styles
```

### Key Breakpoints (Tailwind Default)
| Prefix | Min-width | Meaning |
|---|---|---|
| *(none)* | 0px | Mobile first |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablet — **this is the desktop/mobile split point** |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

> ⚠️ The entire app uses **`md:` as the breakpoint** that separates mobile from desktop. The sidebar appears at `md`, bottom nav disappears at `md`.

### Mobile Layout Structure (What the user sees on phones)
```
┌─────────────────────────────────┐
│  HomeHeader (sticky, z-50)      │  ← `md:hidden` half renders on mobile
│  [search bar + notification icon]│
├─────────────────────────────────┤
│                                 │
│  Page Content (main)            │  ← children from AppShell
│  (has pb-16 to clear bottom nav)│
│                                 │
├─────────────────────────────────┤
│  MobileBottomNav (fixed bottom) │  ← Feed | Jobs | AI | Events | Profile
└─────────────────────────────────┘
```

---

## 📐 Standard Patterns for Mobile Responsiveness

### Pattern 1: Conditional Rendering (Desktop vs Mobile Variants)
```tsx
{/* Desktop version */}
<div className="hidden md:flex ...desktop classes...">
  <DesktopComponent />
</div>

{/* Mobile version */}
<div className="flex md:hidden ...mobile classes...">
  <MobileComponent />
</div>
```

### Pattern 2: Responsive Sidebar/Panel → Bottom Sheet on Mobile
If a page has a left or right sidebar panel:
- **Desktop**: Keep `absolute`/`fixed` or flex-adjacent panel as-is.
- **Mobile**: Convert to a slide-up **bottom sheet** or a full-screen **drawer** triggered by a button.
- Use `useState` to control `isOpen` + CSS `translate-y` for slide animation.

```tsx
// Bottom sheet template
<div className={`fixed inset-x-0 bottom-0 z-[80] bg-background rounded-t-2xl transition-transform duration-300 md:hidden ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
  {/* panel content */}
</div>
{/* Backdrop */}
{isOpen && <div className="fixed inset-0 z-[79] bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
```

### Pattern 3: Multi-column Grid → Single Column Stack
```tsx
// Desktop: 3 columns; Mobile: 1 column stack
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
```

### Pattern 4: Fixed-width Elements → Full Width on Mobile
```tsx
// Desktop keeps its fixed width, mobile goes full width
<div className="w-full md:w-[420px]">
```

### Pattern 5: Horizontal Scroll for Tag/Filter Lists
When a horizontal list of chips/filters doesn't fit on mobile:
```tsx
<div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:flex-wrap">
```

### Pattern 6: Sticky Action Bars for Mobile Forms
Instead of showing action buttons inline on mobile, stick them at the bottom:
```tsx
<div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border md:hidden">
  <button className="w-full h-12 ...">Submit</button>
</div>
```
> Note: `bottom-16` (64px) clears the `MobileBottomNav`.

### Pattern 7: Header-aware Content Offset
The `HomeHeader` is sticky and ~48px tall on mobile. Modals or full-screen overlays must account for this:
```tsx
// Full screen mobile overlay
<div className="fixed inset-0 top-[48px] bg-background z-[60] md:hidden overflow-y-auto">
```

---

## 🗺️ Mobile UI Reference Image — `JOB_section_Mobile_Ui.png`

**File path**: `c:\Users\user2\Desktop\test\JOB_section_Mobile_Ui.png`

This is a **large composite image** showing ALL mobile screens for the Jobs section laid out side by side on a dark canvas. When you are working on a specific page/feature, identify the corresponding phone mockup(s) in this image.

### How to Read the Image
The image is organized roughly in **clusters by feature area**, reading left-to-right and top-to-bottom:

| Approximate Region | What's Shown |
|---|---|
| **Top-left cluster (small specs)** | Individual UI element close-ups / component specs |
| **Left large column (top)** | Main job listing screens, `Find Jobs` search bar, All Jobs tab |
| **Left large column (bottom)** | Job listing empty states, no results screens |
| **Center-left column** | Job detail page: header, company, description, status timeline, applicants list |
| **Center column** | Job detail variants: map/location section, company overview panel, application status |
| **Center-right column** | Create Job wizard (multi-step: role → type → location → salary → description → preview) |
| **Right cluster (top)** | Job Offers page, identity verification required modal |
| **Right cluster (bottom)** | Apply Job flow, submission confirmation, empty offer states |
| **Far-right small cluster** | Toast notifications, confirmation dialogs, small modal specs |
| **Bottom row** | Company dashboard: my job listings, applicant views, review/shortlist modals |

### How to Use the Image When Given a Specific Page

1. **Parse the user's page name** to identify the cluster (use table above).
2. **View the image** using the `view_file` tool at path `c:\Users\user2\Desktop\test\JOB_section_Mobile_Ui.png`.
3. **Describe what you see** for the relevant cluster: column structure, component positions, button placements.
4. **Map image observations to code**: identify which files need changes.
5. **Report and propose** before making any changes.

### Example Agent Response Template
```
I've reviewed the mobile UI image for [Page Name].

In the image, the [Page Name] screens show:
- [Observation 1 — e.g. "A sticky top search bar with job title + location inputs stacked vertically"]
- [Observation 2 — e.g. "Job cards span full width with company logo left-aligned"]
- [Observation 3 — e.g. "An 'Apply' button fixed at the bottom above the nav bar"]

Current code status:
- [File]: [what works / what is missing / what needs to be added]

Proposed changes:
1. [Specific change with file and rationale]
2. ...
```

---

## 📋 Page-by-Page Checklist — Jobs Section

### Page 1: `/jobs` — Main Jobs Listing Page
**Primary file**: `src/features/jobs/pages/JobsPage.tsx`  
**Supporting**: `src/components/jobs/JobCard.tsx`, `src/components/jobs/JobFiltersSidebar.tsx`, `src/components/jobs/MobileJobFilters.tsx`, `src/components/jobs/JobTabs.tsx`, `src/components/jobs/JobSearchBar.tsx`

**Image cluster**: Left column — largest group of phone screens

**What the image shows**:
- Top: sticky search bar (job title input + location input side-by-side or stacked, + "Find Jobs" button)
- Below: horizontal tab bar (All Jobs / My Jobs / Saved / Offers) with horizontal scroll if needed
- Cards: Full-width job cards stacked vertically with company logo, title, location badge, salary, tags
- Bottom right: "Filter" button that opens a bottom sheet
- Company users: "Post a job" FAB visible

**Mobile Checklist**:
- [ ] `JobFiltersSidebar` hidden on mobile (`hidden md:flex`) — replaced by `MobileJobFilters` bottom sheet
- [ ] Job cards render full-width with no fixed pixel widths
- [ ] Tab bar (`JobTabs`) uses horizontal scroll (`overflow-x-auto no-scrollbar`) if tabs overflow
- [ ] `HomeHeader` job search UI (desktop: two pill inputs + button) → on mobile: handled separately (see Edge Case 8)
- [ ] "Filter" FAB / button is thumb-reachable (bottom-right or inline)
- [ ] "Load more" / pagination button is full-width
- [ ] Job story cards (if any) scroll horizontally

---

### Page 2: `/jobs/[id]` — Job Detail Page
**Primary file**: `src/features/jobs/pages/JobDetailPage.tsx`  
**Supporting**: `src/features/jobs/components/JobDetailHeader.tsx`, `src/features/jobs/components/JobDetailBody.tsx`

**Image cluster**: Center-left column

**What the image shows**:
- Top: Back arrow (top-left) + "Jobs" text, then company logo + job title + company name
- Body: scrollable — description, requirements, benefits, location map section, company mini-card
- Application timeline: horizontal stepper showing stages (Applied → Shortlisted → Interview → Offer)
- Bottom: Sticky action bar at `bottom-16` with "Apply Now" + "Save" buttons (full-width on mobile)
- Identity verification required screen: shown as full-page blocker

**Mobile Checklist**:
- [ ] Header stacks vertically: logo → title → company name → badges (type/location/salary)
- [ ] Description text is full-width with readable font size (min 14px)
- [ ] No side panels — all content is vertically stacked
- [ ] Application timeline uses horizontal scroll or vertical list on narrow screens
- [ ] "Apply" / "Quick Apply" button sticky at `bottom-16` (above mobile nav)
- [ ] Back navigation: `← Jobs` at top-left of the screen
- [ ] Map section: collapses to static image or hides behind "View map" button on mobile
- [ ] Identity verification blocker screen is full-screen with centered illustration + CTA

---

### Page 3: Create Job Wizard (Company Mode)
**Primary files**: `src/features/jobs/components/create-job/` directory  
**Also**: `src/components/jobs/CreateJobModal.tsx`, `src/components/jobs/JobDetailsStep.tsx`, `src/components/jobs/JobDescriptionStep.tsx`

**Image cluster**: Center-right — multi-step wizard flow

**What the image shows**:
- Each step fills the entire phone screen
- Step 1: "What role are you hiring for?" — single full-width input + "Next" button at bottom
- Step 2: "What type of position?" — large tap targets (radio-like cards) for Full-time / Part-time / etc.
- Step 3: "What is the preferred working mode?" — similar card-tap selection (Remote / On-site / Hybrid)
- Step 4: "Where will this role be located?" — location search input
- Step 5: Salary range — slider or input fields
- Step 6: Job description — rich text area
- Step 7: Preview / Publish confirmation
- Navigation: "Back" at top-left, "Next" sticky at `bottom-16`, progress indicator at top-center

**Mobile Checklist**:
- [ ] Each step is full-screen (not a modal overlay within desktop layout)
- [ ] Selection cards (type/mode) are minimum `h-16` for thumb-friendly tapping
- [ ] All inputs full-width
- [ ] "Next" and "Back" buttons accessible — "Next" at bottom, "Back" at top-left
- [ ] Progress dots/steps visible at top-center
- [ ] Salary slider has large drag handle (min 44×44px touch target)
- [ ] Rich text editor scrolls within a bounded container (not full page height)

---

### Page 4: Job Offers Page
**Primary file**: `src/features/jobs/pages/JobOffersPage.tsx`  
**Supporting**: `src/features/jobs/components/OfferCard.tsx`, `src/features/jobs/components/OfferDeadlineBadge.tsx`

**Image cluster**: Right cluster (upper portion)

**What the image shows**:
- Header: "Send job & find talent" title + sub-text
- Offer cards: full-width cards with company logo, job title, offer details, deadline badge
- Accept / Decline buttons at card bottom — full-width or side-by-side
- Empty state: centered illustration + "No job offers yet" text
- Identity verification required: special CTA shown if user isn't verified

**Mobile Checklist**:
- [ ] Offer cards full-width
- [ ] Deadline badge (`OfferDeadlineBadge`) renders correctly at small sizes (no clipping)
- [ ] Accept/Decline buttons minimum `h-11` (44px)
- [ ] Empty state illustration: `max-w-[200px] mx-auto`
- [ ] Verification required state: full-screen friendly layout

---

### Page 5: Company Dashboard — Job Posts & Applicants
**Primary files**: `src/components/jobs/dashboard/JobPostsList.tsx`, `src/components/jobs/dashboard/JobApplicantsView.tsx`  
**Supporting**: `src/components/jobs/dashboard/DashboardStats.tsx`, `src/components/jobs/dashboard/ApplicantDetailsModal.tsx`

**Image cluster**: Bottom row of the image

**What the image shows**:
- Tab bar: "All Applicants" / "Shortlisted" / "In Progress" / "Hired" — horizontally scrollable
- Applicant cards: Avatar + name + role + status badge — full-width cards
- Applicant detail: opens as bottom sheet or full-screen overlay (not a desktop modal)
- Stats row: 3–4 stat cards arranged in a 2×2 grid on mobile
- Resume preview: full-screen overlay on mobile

**Mobile Checklist**:
- [ ] Stats cards (`DashboardStats`): `grid-cols-2` on mobile (not `grid-cols-4`)
- [ ] Applicant list: single-column cards, no table layout
- [ ] `ApplicantDetailsModal`: renders as bottom sheet or full-screen on mobile
- [ ] Tab bar: horizontally scrollable with `overflow-x-auto no-scrollbar`
- [ ] "Shortlist" / "Reject" actions: full-width buttons or bottom action bar on mobile

---

## ⚠️ Edge Cases to Handle

### Edge Case 1: Modals on Mobile
- All modals that use `fixed inset-0` must NOT cover the mobile header area unless intentional. Use `top-[48px]` if content should remain visible behind it.
- Modal backdrops must sit between content and the modal: use `z-[79]` for backdrop, `z-[80]` for panel.
- On mobile, **convert side-panel modals to full-screen overlays or bottom sheets**.
- Always ensure modal close button is reachable (top-right, minimum 44px touch target).
- Never let a modal be taller than `calc(100vh - 48px - 64px)` (header height + bottom nav height).

### Edge Case 2: Forms with Virtual Keyboards
- When the soft keyboard appears on mobile, `fixed` bottom elements (action bars) may get pushed up or hidden. Use `position: sticky` inside scrollable containers instead of `fixed` for in-form buttons.
- Add `scroll-padding-bottom: 80px` to scrollable form containers so the focused input isn't hidden behind the keyboard.
- Consider using `inputMode` attribute (`inputMode="numeric"` for salary, `inputMode="url"` for URLs) for better keyboard type on mobile.

### Edge Case 3: Long Text Overflow
- Job titles can be very long. Always add `truncate` (single line) or `line-clamp-2` (two lines) on mobile cards.
- Company names: `truncate` with `max-w-[...]` or `flex-1 min-w-0`.
- Salary ranges with long currency strings: allow text wrapping with `break-words`.
- Tag lists: use horizontal scroll (`overflow-x-auto`) with `flex-nowrap`, not `flex-wrap` (which creates unpredictable heights).

### Edge Case 4: Horizontal Scrollable Sections
- Always add `no-scrollbar` class (defined in `globals.css`) when using `overflow-x-auto`.
- Add `pb-1` to scrollable containers so box shadows aren't clipped at the bottom.
- For better UX, add a gradient fade at the right edge using `::after` pseudo-element or an overlay `div` to hint at scrollability.
- Ensure touch scroll works: never add `touch-action: none` to horizontally scrollable containers.

### Edge Case 5: Touch Targets
- Every interactive element (buttons, links, cards, icons) must have a minimum **44×44px** touch target per Apple/Google HIG.
- Expand hit area without changing visual size:
  ```tsx
  <button className="p-2 -m-2">  {/* padding expands touch area, negative margin keeps visual size */}
    <Icon className="w-5 h-5" />
  </button>
  ```
- Card items that are clickable should have the entire card as the tap target (wrap in `<Link>` or use `cursor-pointer` + `onClick`).

### Edge Case 6: Image Aspect Ratios
- Company logos in cards: constrain to `w-12 h-12` or `w-16 h-16` on mobile. Always `object-cover` or `object-contain` explicitly.
- Banner/hero images: use `aspect-video` (16:9) or `aspect-[3/1]` on mobile to maintain proportion.
- User avatars: fixed size, never percentage-based width.
- SVG illustrations: `max-w-full` + `h-auto` to prevent overflow.

### Edge Case 7: Z-index Conflicts
If adding a new mobile bottom sheet or drawer:
- Overlay backdrop: `z-[79]`
- Panel itself: `z-[80]`
- This ensures it sits above the bottom nav (`z-40`) and header (`z-50`) but below app-level modals (`z-[100]+`).
- Check: does any existing element have an intermediate z-index that could leak through?

### Edge Case 8: HomeHeader on Jobs Page
- On the `/jobs` route, `HomeHeader.tsx` renders a **special job search UI** on desktop (two pill inputs: "Job title, keywords" + "City or remote" + "Find jobs" button). This is inside `hidden md:flex`.
- On mobile, the header shows the generic search bar. The job-specific search needs a mobile treatment — either:
  - **Option A**: Show two stacked full-width inputs in a mobile-specific block at the top of `JobsPage.tsx` content area.
  - **Option B**: Add a collapsed "search" icon in the mobile header that expands into a full-screen search overlay.
- **DO NOT remove** the desktop job search logic in `HomeHeader`. Only add mobile-specific handling.

### Edge Case 9: Company Mode vs. User Mode
- Many pages conditionally render different content based on `isCompany` from `useActiveProfile()`.
- When making a page mobile-responsive, test BOTH modes:
  - Regular user: sees job listings, apply buttons, saved jobs
  - Company user: sees post job, applicants, analytics, dashboard
- Both modes must be fully functional and properly laid out on mobile.

### Edge Case 10: iOS Safe Area (Notch / Home Indicator)
- On iOS devices, the bottom home indicator occupies ~34px. The `MobileBottomNav` should use `pb-safe` or `padding-bottom: env(safe-area-inset-bottom)`.
- Sticky bottom action bars should account for this:
  ```tsx
  style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
  ```
- The `HomeHeader` on devices with notches: verify it renders correctly below the status bar.

### Edge Case 11: Pagination / Infinite Scroll on Mobile
- "Load more" buttons must be full-width and at least `h-12` (48px).
- If using `IntersectionObserver` for infinite scroll, use `rootMargin: "200px"` (fire early) since mobile users scroll quickly.
- Show a spinner/skeleton below the last item while loading — not a full-page loader.
- Preserve scroll position when navigating back from job detail to the list.

### Edge Case 12: Empty States
- Empty state illustrations: `max-w-[200px] mx-auto mb-4`
- Centered layout: `flex flex-col items-center justify-center text-center`
- Do NOT let SVG illustrations break out of their container or cause horizontal scroll.
- Empty state CTA button: full-width or centered with `min-w-[160px]`.

### Edge Case 13: Skeleton Loaders
- Skeleton widths with fixed pixel values (`w-[300px]`) must become `w-full` on mobile.
- Skeleton heights should match the real rendered content height.
- Multiple skeleton cards should stack in the same column layout as the real cards.

### Edge Case 14: Filter / Sort on Mobile
- **Never show a sidebar filter on mobile.** Always use a bottom sheet or a separate modal.
- Use `MobileJobFilters.tsx` as the **reference implementation** for any new mobile filter bottom sheet.
- Applied filter count badge: show on the "Filters" button (e.g. `"Filters (3)"`).
- Filter chips showing applied filters: horizontal scroll row above the list.
- Sort dropdown: convert to a bottom sheet with radio list on mobile.

### Edge Case 15: Multi-step Wizard Navigation (Back/Next)
- On mobile, "Back" should be in the **top-left** (arrow icon or "← Back" text), not a footer button.
- "Next" / "Continue" should be a full-width button at `bottom-16`.
- Step indicator (dots or numbered steps) should be centered in the area below the header.
- Swiping left/right to navigate steps is a bonus — not required, but use `touch-action: pan-y` to prevent interfering with vertical scroll.

---

## 🛠️ Workflow: When a Specific Page is Mentioned

Follow this **exact step-by-step workflow** every time:

### Step 1: Identify the Page
- Parse the user's request to identify which route/page they mean.
- Use the page-by-page checklist above to find relevant component files.

### Step 2: Read the Mobile UI Image
```
view_file: c:\Users\user2\Desktop\test\JOB_section_Mobile_Ui.png
```
- Locate the cluster for the mentioned page (use the cluster map above).
- Note: component placement, card styles, button positions, tab arrangement, drawer behaviors.

### Step 3: Audit the Current Code
- Read the relevant page component files.
- Search for: `hidden md:`, `md:hidden`, `md:flex`, `md:block` — to understand existing breakpoint splits.
- Search for: fixed pixel widths, `absolute`, `fixed` positioning — to understand what must NOT change.
- Identify gaps: what renders on desktop only? What has no mobile fallback?

### Step 4: Report Findings to User
Format your report as:

```
## Analysis: [Page Name] Mobile Compatibility

### What I Found in the Mobile UI Image
[Describe what the image shows for this page's phone mockups]

### Current Code Status

**Already Mobile-Friendly** ✅
- [Component/section]: [why it works]

**Needs Work** ❌
- [Component/section]: [specific issue, file name, approximate line]

### Proposed Changes
1. **[Change 1]** — `[filename.tsx]`
   - [What will change, why, how it preserves desktop]

2. **[Change 2]** — `[filename.tsx]`
   - [What will change...]

### Desktop Impact Assessment
All proposed changes use `md:hidden` wrappers and mobile-only class prefixes.
The following desktop styles will NOT be touched: [list key desktop-only elements]
```

### Step 5: Wait for Approval
- Do NOT start coding until the user confirms the plan.

### Step 6: Implement Changes
- Work file by file.
- Add mobile styles with proper `md:` overrides.
- Keep desktop JSX structurally intact.
- Test mental model: "If I set viewport to 1024px, does everything look exactly the same as before?"

### Step 7: Summarize Changes
After implementation, summarize:
- Files changed
- What mobile behavior was added
- What desktop behavior was preserved
- Any remaining issues or follow-up needed

---

## 🌙 Dark Mode Compliance — Mobile Additions Must Match These Palettes

> Source: `darkmodeguideline.md`. Every mobile component or class added must use the correct dark-mode mapping for its context (user vs. company). A mobile change that looks fine in light mode but breaks dark mode is **not done**.

### How Dark Mode Works in This Codebase
- Toggle mechanism: `[data-theme="dark"]` or `[data-theme="navy"]` on the root element.
- Tailwind syntax: `dark:bg-[#0B0F19]`, `dark:text-[#F9FAFB]`, etc.
- **Light mode defaults are never disrupted** — always add `dark:` on top, never replace the base class.
- Shared components (used by both User and Company UIs) **must use conditional rendering** based on `isCompany` / `isCompanyMode`:
  ```tsx
  // Shared component — conditional dark palette
  className={`text-black ${isCompany ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
  ```
- **Company styles must never bleed into user UI and vice versa.**

---

### 🟣 User Mode — Dark Palette

| Token / Role | Light Mode | Dark Mode |
|---|---|---|
| Background / White | `#FFFFFF` | `#0B0F19` |
| Text / Black | `#000000` | `#F9FAFB` |
| Secondary text | `#6B7280` | `#9CA3AF` |
| Error red | `#FF6B6B` | `#F87171` |
| Success green | `#22C55E` | `#4ADE80` |
| Warning yellow | `#FBBF24` | `#F59E0B` |
| Grey | `#DADADA` | `#2E3445` |
| Primary | `#6366F1` | `#818CF8` |
| Subtle | `#C7D2FE` | `#5B66D6` |
| Ultra light | `#EEF2FF` | `#1C2340` |
| Light | `#E0E7FF` | `#252E54` |
| Button | `#A5B4FC` | `#6D79F4` |
| Button 2 | `#818CF8` | `#818CF8` |
| Hover | `#4F46E5` | `#6366F1` |
| Button 3 | `#4338CA` | `#5B57D8` |
| Strong | `#3730A3` | `#4C4DBF` |
| Deep accent | `#312E81` | `#40449A` |

---

### 🔵 Company Mode — Dark Palette

| Token / Role | Light Mode | Dark Mode |
|---|---|---|
| Text / Black | `#000000` | `#FFFFFF` |
| Background / White | `#FFFFFF` | `#0F1115` |
| Secondary | `#6B7280` | `#A1A8B3` |
| Grey | `#E0E0E7` | `#2A2D35` |
| Primary | `#1A73E8` | `#4D9CFF` |
| Primary dark | `#0D47A1` | `#82B8FF` |
| Light primary | `#E8F1FF` | `#16365F` |
| Ultra light | `#F2F7FF` | `#121B2B` |
| Light | `#EFF4FF` | `#1A2435` |
| Success | `#22C55E` | `#4ADE80` |
| Warning | `#F59E0B` | `#FBBF24` |
| Error | `#EF4444` | `#F87171` |
| Light green | `#DCFCE7` | `#123B23` |
| Light yellow | `#FEF3C7` | `#4A3A10` |
| Light red | `#FEE2E2` | `#4A1C1C` |

---

### Dark Mode Implementation Checklist (Per Component)

When adding or touching any mobile element, run through these:

- [ ] **Identify context**: Is this element in a User page, a Company page, or a **shared** component used by both?
- [ ] **Apply the right palette**: Use the User table for user-only pages; the Company table for company-only pages; `isCompany` conditional for shared components.
- [ ] **Background classes**: Every `bg-[#FFFFFF]` or `bg-white` element must have `dark:bg-[#0B0F19]` (user) or `dark:bg-[#0F1115]` (company).
- [ ] **Text classes**: Every `text-black` / `text-[#000000]` must have `dark:text-[#F9FAFB]` (user) or `dark:text-[#FFFFFF]` (company).
- [ ] **Secondary/muted text**: `text-[#6B7280]` → `dark:text-[#9CA3AF]` (user) or `dark:text-[#A1A8B3]` (company).
- [ ] **Primary accent** (user): `text-[#6366F1]` → `dark:text-[#818CF8]`; `bg-[#6366F1]` → `dark:bg-[#818CF8]`.
- [ ] **Primary accent** (company): `text-[#1A73E8]` → `dark:text-[#4D9CFF]`.
- [ ] **Hover backgrounds** (user): `hover:bg-[#EEF2FF]` → `dark:hover:bg-[#1C2340]`.
- [ ] **Light tinted containers** (user): `bg-[#E0E7FF]` → `dark:bg-[#252E54]`.
- [ ] **Light tinted containers** (company): `bg-[#E8F1FF]` → `dark:bg-[#16365F]`.
- [ ] **Borders**: Match border color tokens — never add a border color that doesn't have a dark variant.
- [ ] **Bottom sheets / drawers**: Background must be `bg-background` (CSS var, auto dark) or an explicit dark variant — never raw `bg-white`.
- [ ] **Modals on mobile**: Confirm modal background, text, and border all have dark variants.
- [ ] **Shared components with both modes**: Used `isCompany` conditional for the dark class — not a single hardcoded dark color.
- [ ] **Tested in dark mode visually**: Toggle `[data-theme="dark"]` and confirm no white flash, no invisible text, no broken borders.

---

## 🧪 Verification Checklist (Run After Every Mobile Change)

After making changes, verify ALL of these before declaring done:

**Layout & Behavior**
- [ ] Desktop layout at `md:` and above is **pixel-perfect identical** to before
- [ ] No horizontal scroll on mobile at 375px viewport width (iPhone SE / iPhone 14 size)
- [ ] No content hidden behind `HomeHeader` (first visible content starts below the sticky header)
- [ ] No content hidden behind `MobileBottomNav` (last visible content has `pb-16`)
- [ ] All interactive elements have minimum **44×44px** touch targets
- [ ] Text is readable (minimum `text-sm` / 14px) on mobile
- [ ] Modals/drawers do NOT overlap the `MobileBottomNav` unintentionally
- [ ] Z-index hierarchy is intact (header above content, modals above header, bottom sheet above nav)
- [ ] `pb-16` (bottom padding for mobile nav) is preserved on scrollable content areas
- [ ] Company mode (`isCompany === true`) renders correctly on mobile
- [ ] User mode (`isCompany === false`) renders correctly on mobile
- [ ] Empty states are properly centered and don't cause horizontal scroll
- [ ] Skeleton loaders match the mobile card layout

**Dark Mode**
- [ ] You have strictly followed [DARK_MODE_GUIDE.md](./DARK_MODE_GUIDE.md) for all new classes and tokens.
- [ ] No raw `bg-white` or `text-black` exists without a `dark:` override.
- [ ] You verified if the component is used in User mode, Company mode, or both, and applied tokens accordingly.

---

## 📁 Key Files Quick Reference

| File | Purpose | Can Touch for Mobile? |
|---|---|---|
| `src/components/layout/AppShell.tsx` | Root layout shell | Only for mobile-specific layout additions |
| `src/components/layout/MobileBottomNav.tsx` | Mobile bottom navigation | Rarely — only to add new nav items |
| `src/components/layout/DarkSidebar.tsx` | Desktop sidebar | **NEVER** |
| `src/components/layout/sidebar.css` | Sidebar CSS | **NEVER** |
| `src/components/home/HomeHeader.tsx` | Top header | Mobile half only (search ~line 768–993) |
| `src/features/jobs/pages/JobsPage.tsx` | Main jobs listing | Primary target for jobs listing mobile |
| `src/features/jobs/pages/JobDetailPage.tsx` | Job detail view | Primary target for detail page mobile |
| `src/features/jobs/pages/JobOffersPage.tsx` | Job offers | Primary target for offers mobile |
| `src/features/jobs/components/JobCard.tsx` | Job card | Ensure full-width, no fixed pixel widths |
| `src/features/jobs/components/JobFilters.tsx` | Desktop filter sidebar | Do NOT break desktop — add mobile variant |
| `src/components/jobs/MobileJobFilters.tsx` | Mobile filter bottom sheet | **Reference implementation** |
| `src/components/jobs/dashboard/JobApplicantsView.tsx` | Applicant management | Convert table to cards on mobile |
| `src/app/globals.css` | CSS variables & global styles | Add utility classes only, never remove existing |
| `tailwind.config.ts` | Tailwind configuration | Only to add custom breakpoints if critical |

---

## 💡 Useful Utilities Already in the Codebase

From `globals.css`:
- `no-scrollbar` — hides scrollbar while keeping scroll behavior
- CSS variables for all colors: `--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--border`, etc.
- Dark mode toggled via `[data-theme="dark"]` or `[data-theme="navy"]` on `<html>` or `<body>`

From `tailwind.config.ts`:
- Custom shadow tokens: `shadow-indigo-xs`, `shadow-indigo-sm`
- Custom border radii: `rounded-card` (24px), `rounded-feed-card` (24px), `rounded-3xl` (24px)
- Font: `font-poppins` maps to the custom Poppins font family

---

## 🚫 Anti-Patterns — Things to NEVER Do

**Layout**
1. ❌ **Don't use `!important`** to override desktop styles — always use breakpoint prefixes properly.
2. ❌ **Don't change `position: fixed`** on the sidebar, header, or bottom nav.
3. ❌ **Don't use `vw` or `vh`** for widths/heights inside flexbox/grid containers — use percentages or `w-full`.
4. ❌ **Don't hardcode pixel widths** for mobile layouts — screens vary from 320px to 428px. Use `w-full`, percentages, `max-w-*`.
5. ❌ **Don't change the z-index hierarchy** without auditing all stacking layers first.
6. ❌ **Don't add `overflow: hidden` to `<body>` or `<html>`** for scroll locking without a cleanup mechanism — always restore it when modal/drawer closes.
7. ❌ **Don't remove `pb-16`** from the main content scrollable area — this clears the mobile bottom nav.
8. ❌ **Don't test only in Chrome DevTools** — check real iOS Safari for CSS compatibility (`backdrop-filter`, `position: sticky`, `env()`, `-webkit-` prefixes).
9. ❌ **Don't nest two `overflow-y-auto` scroll containers** on mobile — terrible UX.
10. ❌ **Don't forget the `HomeHeader` offset** — sticky header is ~48px tall on mobile; don't position content that would be hidden behind it.
11. ❌ **Don't add `touch-action: none`** to any scrollable area — this breaks native scroll.
12. ❌ **Don't use `min-height: 100vh`** without `dvh` fallback — on iOS, `100vh` includes the browser chrome and causes overflow.

**Dark Mode**
13. ❌ **Don't guess Dark Mode tokens**. Always refer to [DARK_MODE_GUIDE.md](./DARK_MODE_GUIDE.md) and never use hardcoded hex values in `.tsx` files.
14. ❌ **Don't apply the wrong palette for the context** — applying User dark colors to a Company component (or vice versa) is a theming bug, not a cosmetic issue.
15. ❌ **Don't use a single hardcoded dark class in shared components** — shared components must use `isCompany` (or equivalent context) to select the correct palette branch.
16. ❌ **Don't assume the CSS variable covers it** — some elements use hardcoded hex values that bypass CSS variables entirely. Use the explicit `dark:` classes from [DARK_MODE_GUIDE.md](./DARK_MODE_GUIDE.md).
17. ❌ **Don't skip dark mode testing because "it looked fine before"** — adding a new mobile element to an existing component can introduce new un-themed colors even if the component worked before.
18. ❌ **Don't let Company primary color appear in User UI or vice versa** — primary colors are intentionally different between modes and must stay isolated.

---

*Reference image: `JOB_section_Mobile_Ui.png` located at `c:\Users\user2\Desktop\test\JOB_section_Mobile_Ui.png`*  
*Last updated: 2026-07-15*
