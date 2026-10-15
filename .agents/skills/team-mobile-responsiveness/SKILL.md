---
name: team-mobile-responsiveness
description: >
  Mobile responsiveness guidelines for the Team section (org-team feature) of the Cocpit platform.
  Use this skill whenever modifying any page or component inside `src/features/org-team/` to ensure
  all mobile UI changes are correctly scoped with Tailwind breakpoints, preserving the desktop layout
  entirely. Covers ManageTeamPage, RoleDetailsPage, TeamHomePage, TeamActivityLogPage, RoleCard,
  MemberList, MemberRow, TeamTabs, ActivityLogTable, and ActivityLogFilters.
---

# Team Section — Mobile Responsiveness Guideline

## 1. Project Context

### Routes
| URL | Page Component | Feature File |
|-----|---------------|-------------|
| `/team` | `ManageTeamPage` | `src/features/org-team/pages/ManageTeamPage.tsx` |
| `/team/role/[roleId]` | `RoleDetailsPage` | `src/features/org-team/pages/RoleDetailsPage.tsx` |

### Breakpoint System (Tailwind)
This project uses Tailwind CSS. The breakpoints that matter for the Team section:

| Prefix | Min-width | Usage in Team |
|--------|-----------|--------------|
| *(none)* | 0px | **Mobile-first base styles** — this is where mobile layout lives |
| `sm:` | 640px | Tablet tweaks (rarely used; prefer `md:`) |
| `md:` | 768px | Mid-tablet — used for back-button visibility in RoleDetailsPage |
| `lg:` | 1024px | **Desktop layout** — ALL desktop-only styles use `lg:` |

> **Golden Rule**: Never modify a class that is `lg:` prefixed when targeting mobile fixes.
> Only add or change unprefixed, `sm:`, or `md:` classes to fix mobile.

---

## 2. Layout Shell

### Mobile Navigation Bar
The app renders a bottom tab bar on mobile (visible below `lg`). It contains 4 icons: Home, Team, +, Profile.
- The Team section content must **not overlap** the bottom nav bar.
- Always keep `pb-16` (or `pb-[64px]`) on the outermost page wrapper on mobile so content does not hide behind the bottom bar.

### Sidebar
The left sidebar (`Sidebar.tsx`) is **desktop-only** (`lg:` classes). It is `220px` wide.
- On mobile the sidebar is hidden — never add sidebar-compensating padding (`md:pr-[253px]`) inside mobile classes.
- The existing `md:pr-[253px]` in `ManageTeamPage` is a desktop-targeting pattern using md: intentionally — do not replicate this pattern for purely mobile adjustments.

### Page Wrapper Pattern (ManageTeamPage)
```tsx
// EXISTING — do not break this
<div className="w-full h-full min-h-[calc(100vh-120px)] bg-ds-bg text-ds-text-primary
  flex flex-col items-center
  sm:-mt-[40px]          // tablet top offset
  pt-[20px] pb-16        // mobile padding (top + bottom clearance above nav bar)
  px-0                   // mobile: no horizontal padding on outer wrapper
  md:px-4 md:pr-[253px]  // desktop: adds right offset for sidebar
  select-text">
  <div className="w-full max-w-[780px] flex flex-col gap-5 items-start
    px-4 lg:px-0">        // mobile: 16px side padding; desktop: none
```

**Key takeaway**: The inner content wrapper uses `px-4` for mobile horizontal padding and removes it on desktop with `lg:px-0`.

---

## 3. Component-by-Component Guidelines

### 3.1 TeamTabs (`components/TeamTabs.tsx`)
**Current state**: Simple horizontal flex row — works on all sizes.

**Mobile rules**:
- Tabs ("Roles", "Activity logs") render inline horizontally. Do NOT stack them vertically on mobile.
- The "Create role" button sits on the same row via `flex-wrap justify-between` in `ManageTeamPage`. On small screens it wraps to a new line — this is intentional and correct.
- Tab underline indicator uses `border-t-[1.5px] border-ds-accent` at `absolute bottom-0` — do not alter this for mobile; it works as-is.

### 3.2 RoleCard (`components/roles/RoleCard.tsx`)
**Current dual-layout pattern**:
```
Mobile  (< lg): Two-row card layout
  Row 1: [color dot] [role name] ..... [3-dot menu button]
  Row 2: [X Members] [avatar stack]

Desktop (>= lg): Single horizontal row
  [color dot + name | 200px] [X Members | 120px] [avatar stack | 120px] [permissions | flex-1] [3-dot menu]
```

**Mobile-specific classes to know**:
- Outer card: `flex flex-col lg:flex-row` — mobile stacks rows, desktop is horizontal.
- Top row: `flex items-center justify-between lg:justify-start lg:w-[200px]`
- Bottom row wrapper: `flex items-center gap-4 lg:contents` — mobile: normal flex; desktop: `contents` dissolves wrapper so children join the parent flex row.
- Permissions section: `hidden lg:flex` — **always hidden on mobile**. Do NOT show permissions on mobile.
- Desktop menu: `hidden lg:flex` — desktop only.
- Mobile menu: `lg:hidden` — mobile/tablet only.

**Mobile menu dropdown** (mobileMenuRef):
- Positioned `absolute right-0 top-[40px]`
- Width `w-[111px]`, padding `p-[12px]`, `rounded-[16px]`, `border border-ds-border`
- z-index: `z-30` when open
- Contains: "Add member", "Edit role", "Delete role" (conditional)

**Rules when editing RoleCard**:
1. Any new data column to show → show it on mobile in the bottom row only; never add it to the hidden `lg:flex` permission block.
2. New action in the menu → add it to **both** `mobileMenuRef` dropdown and `desktopMenuRef` dropdown.
3. Do not change `lg:contents` on the bottom row wrapper — it is load-bearing for the desktop layout.
4. Avatar stack uses `-space-x-2` overlap — keep this on both breakpoints.

### 3.3 RoleList (`components/roles/RoleList.tsx`)
- Simply maps `RoleCard` items in a `flex flex-col gap-4` container. No breakpoint logic — safe to leave as-is.

### 3.4 TeamEmptyState (`components/TeamEmptyState.tsx`)
- Small component, no breakpoint logic. Center-aligned on all breakpoints.

### 3.5 MemberList (`components/members/MemberList.tsx`)
**Current state**: Fully responsive already.
- Header row: `flex h-9 w-full items-center justify-between`
- "Invite member" button: `w-[160px] h-[36px]` — fixed width, shrinks properly on small screens via `shrink-0`.
- Member rows use `MemberRow` which is a horizontal flex with `min-w-0` + `truncate` — safe on mobile.
- Pending invites section: uses same `flex justify-between` pattern.

**Mobile rules**:
- If "All members" label + count + "Invite member" button overflow on very small screens, allow the header row to wrap (`flex-wrap`) — add `flex-wrap gap-2` only if needed, do not change fixed heights.
- The "Withdraw Invitation" button uses `shrink-0` so it never wraps mid-row. Preserve this.

### 3.6 MemberRow (`components/members/MemberRow.tsx`)
- Layout: `flex min-h-14 w-full items-center justify-between gap-2 py-2`
- Avatar + name/email section: `flex min-w-0 items-center gap-2` with inner `truncate` on text spans
- Action area (Owner badge / Remove button): `flex items-center shrink-0`

**Mobile rules**:
- **Never remove `min-w-0`** from the left section — without it, long names overflow the container on mobile.
- **Never remove `truncate`** from name and email spans.
- The `min-h-14` ensures touch targets meet 56px minimum. Do not reduce this on mobile.

### 3.7 RoleDetailsPage (`pages/RoleDetailsPage.tsx`)
**Back button pattern** (dual back buttons):
```tsx
// Desktop back — absolutely positioned top-left
<div className="absolute left-[40px] top-[40px] hidden md:block">...</div>

// Mobile back — inline in flow
<div className="md:hidden flex items-center mb-1">...</div>
```
- The absolute-positioned back button is `hidden md:block` (hidden on mobile, visible on tablet+).
- The inline back button is `md:hidden` (visible only on mobile).
- Do NOT merge these two — both are needed to handle the layout correctly at different sizes.

**Page wrapper**:
```tsx
<div className="w-full min-h-screen bg-ds-bg text-ds-text-primary pt-4 md:pt-[60px] pb-16 relative font-['DM_Sans',sans-serif]">
  <main className="mx-auto flex w-full max-w-[800px] flex-col gap-4 md:gap-5 px-4 md:px-0">
```
- `pt-4 md:pt-[60px]`: 16px top padding on mobile matching CreateRoleModal; 60px on desktop.
- `pb-16`: clearance for the mobile bottom nav bar.
- `px-4 md:px-0`: mobile gets 16px side padding; tablet+ removes it (page is centered with `max-w-[800px]`).

**Sub-tabs (Members | Team activity)**:
- `flex h-9 w-full items-center gap-6` — always horizontal, no wrapping needed (only 2 tabs).
- Active tab: `border-b-[1.5px] border-ds-accent`

**Mobile rules for RoleDetailsPage**:
1. Role header (`flex w-full h-6 items-center justify-between`) — role color dot is `w-4 h-4 md:w-6 md:h-6` (16px on mobile, 24px on desktop). Name truncates naturally.
2. Description block uses `min-h-10` with `border-l-2 pl-2` — do not add `hidden` on mobile; description is shown on all breakpoints.
3. `DeleteIcon` button is always visible (not breakpoint-gated for non-system roles). Keep it.
4. Sub-tabs use `gap-[12px] md:gap-6` and `px-2 md:px-3`.
5. MemberList header invite button: on mobile, renders as a standalone 20x20 `+` icon button (`AddIcon size={20}`) matching Figma Frame 2609717; on desktop, expands to the full pill button (`Invite member`).
6. MemberRow action button: on mobile, displays `"Remove"` (`width: 53px`); on desktop, displays `"Remove member"`.
7. InviteMemberModal:

   - Mobile (`< md`): bottom-up sheet (`bg-[#030303] rounded-t-[8px]` with `createPortal(..., document.body)` and `useBodyScrollLock`).
     - Drag handle pill (`50px × 4px`, `#726B67`).
     - Title: `"Invite members"` (`Poppins` 18px 500, `#FFECE6`).
     - Search bar: `w-full h-[40px] border-b border-[#FFECE6]`, placeholder `#726B67`, icon `#FFECE6`.
     - Member candidates list: `h-[176px] overflow-y-auto` with 32×32 circular avatars, 14px name, 12px `#B8ADA8` headline, and 24×24 checkboxes (`bg-[#1A1A20] border border-[#2C2C33]` unchecked, `bg-[#EC6229]` checked).
     - Action buttons: centered `w-full` row with `"Invite"` (`77×36px`, `#EC6229`, `rounded-[100px]`) and `"Cancel"` (`77×36px`, `border border-[#2C2C33]`, `rounded-[100px]`).
   - Desktop (`>= md`): centered dialog `442×338px` with `rounded-[16px]`.

### 3.8 TeamActivityLogPage / ActivityLogFilters
**Compact variant** (used in both `TeamActivityLogPage` and `RoleDetailsPage`):
```tsx
<div className="flex flex-row items-center p-0 gap-[12px] md:gap-[16px] w-full max-w-[800px] h-[40px] mb-2">
  {/* Search input — flex-1 with border-b and magnifying glass on right */}
  {/* Mobile filter button (< md) — 20x20 icon button opening bottom-up filter modal */}
  {/* Desktop filter pills (>= md) — RoleDropdown pills */}
</div>

```
**Mobile Bottom-Up Filter Modal Pattern ("public more")**:
- On screens `< md`, filter pills are hidden (`hidden md:flex`) and replaced by a 20×20px filter icon button.
- Tapping the filter icon triggers a bottom-up sheet modal (`bg-[#030303] rounded-t-[8px]` with dark backdrop):
  1. Centered drag handle pill (`50px × 2px`, `#726B67` / `text-ds-text-muted`) in a 20px container (`Frame 2608582`).
  2. Header with `"Filter"` title (`16px font-medium`, left, `#FFECE6`) and `"Clear"` button (`14px font-normal`, right, danger `#E5484D`) (`Frame 2609314`).
  3. Filter selector rows for `"Roles"`, `"Member"`, and `"Date range"` with pill trigger buttons (`36px` height, `100px` radius, `px-3 py-1.5`):
     - Collapsed: `bg-transparent` with `chevron-down` pointing down.
     - Expanded: `bg-ds-surface-1` (`#1A1A20`) with `chevron-down` rotated 180° pointing up.
  4. Inline expandable options list (`Frame 2609950`): tapping a filter trigger naturally expands the bottom-up modal upwards and renders the options list directly inline inside the section (unboxed, without card background, border, or checkmarks).
  5. 4+ scroll threshold: the options list container has `padding: 6px 12px; gap: 12px; max-h-[128px] overflow-y-auto [&::-webkit-scrollbar]:hidden`, perfectly fitting 4 items at 20px height and enabling hidden scrolling for 4+ items.
  6. Selecting an option updates the active filter, highlights the active item with `text-ds-accent`, and collapses the accordion.
  7. Lock screen & Portal: Rendered via `createPortal(..., document.body)` and controlled by `useBodyScrollLock(isMobileFilterOpen)` to freeze background scrolling and ensure the bottom sheet sits flush against the device viewport edge with `overscroll-contain`.
- If filters are active, the mobile filter button displays an orange badge indicator.

**ActivityLogRow**:
- Row height: `min-h-[48px] py-2 md:py-3 gap-2 md:gap-3` matching Figma `Frame 2609539`.
- Timestamp: uses compact format on mobile (`2d`, `1h`, `33m`, `8m`) via `md:hidden`, and full format (`2 days ago`) via `hidden md:inline`.

---

## 4. Spacing & Sizing Tokens

Use these exact values that are already established in the team section:

| Token | Value | Usage |
|-------|-------|-------|
| Mobile side padding | `px-4` | Applied on inner content wrapper |
| Bottom nav clearance | `pb-16` | All page wrappers |
| Top header clearance | `pt-[60px]` | RoleDetailsPage; `pt-[20px]` in ManageTeamPage |
| Touch target minimum | `min-h-14` (56px) | MemberRow, action buttons |
| Card hover padding | `px-4 py-3` | RoleCard mobile |
| Gap between role cards | `gap-4` | RoleList |
| Tab gap | `gap-6` | TeamTabs, RoleDetailsPage sub-tabs |

---

## 5. What NOT to Do on Mobile

1. **Never change `lg:` prefixed classes** when fixing mobile — desktop layout is locked.
2. **Never add horizontal scrolling** to page wrappers (`overflow-x-hidden` is the baseline).
3. **Never hide permissions** any differently — they are already `hidden lg:flex` and correct.
4. **Never stack tabs** (Roles / Activity logs) vertically — they must always be horizontal.
5. **Never remove `min-w-0` or `truncate`** from text inside flex children — these prevent overflow.
6. **Never add `position: absolute`** for mobile-only elements without also adding appropriate `z-index`.
7. **Never reduce `min-h-14`** on member rows — touch target compliance.
8. **Never add padding/margin that compensates for the sidebar** on mobile — the sidebar is hidden.

---

## 6. Adding a New Mobile Feature — Checklist

When a new UI element is added to the team section, verify:

- [ ] Base (mobile) styles defined first, desktop variants added with `lg:` prefix
- [ ] Text content inside flex children has `min-w-0` on parent + `truncate` on the text element
- [ ] Buttons/tap targets are at least `min-h-[44px]` (or `min-h-14` = 56px for row items)
- [ ] `pb-16` still present on page outer wrapper
- [ ] If the element has a context menu, added to **both** `mobileMenuRef` and `desktopMenuRef` in `RoleCard`
- [ ] No new `md:pr-[253px]` (sidebar compensation) on mobile-visible wrappers
- [ ] Tested at 375px width (iPhone SE) and 390px width (iPhone 14)
- [ ] Desktop layout at 1280px width unaffected

---

## 7. File Map Reference

```
src/features/org-team/
├── pages/
│   ├── ManageTeamPage.tsx        ← /team route, tabs + modals
│   ├── RoleDetailsPage.tsx       ← /team/role/[id], members + activity
│   ├── TeamHomePage.tsx          ← Roles tab content
│   └── TeamActivityLogPage.tsx   ← Activity logs tab content
├── components/
│   ├── TeamTabs.tsx              ← Roles | Activity logs tab switcher
│   ├── TeamEmptyState.tsx        ← Empty roles state
│   ├── roles/
│   │   ├── RoleCard.tsx          ← DUAL-LAYOUT: mobile 2-row / desktop 1-row
│   │   ├── RoleList.tsx          ← Maps RoleCard
│   │   ├── CreateRoleModal.tsx   ← Modal (breakpoint-independent)
│   │   ├── EditRoleModal.tsx     ← Modal (breakpoint-independent)
│   │   └── DeleteRoleConfirm.tsx ← Confirm dialog (breakpoint-independent)
│   ├── members/
│   │   ├── MemberList.tsx        ← All members + pending invites list
│   │   ├── MemberRow.tsx         ← Single member row (truncation-safe)
│   │   ├── InviteMemberModal.tsx ← Modal (breakpoint-independent)
│   │   ├── RemoveMemberConfirm.tsx
│   │   └── WithdrawInviteConfirm.tsx
│   ├── activity/
│   │   ├── ActivityLogFilters.tsx← compact variant used on mobile
│   │   ├── ActivityLogTable.tsx  ← Infinite scroll list
│   │   ├── ActivityLogRow.tsx    ← Single log entry
│   │   ├── ActivityLogEmptyState.tsx
│   │   └── RoleDropdown.tsx      ← Pill dropdown (used in filters)
│   └── permissions/              ← Permission-related, desktop only
└── hooks/ services/ types/ utils/
```

---

## 8. Reference: Current Mobile UI (Screenshot)

The mobile view shows:
- **Black background** (`bg-ds-bg` = black in dark mode)
- **Top search bar** with search icon, chat icon, and user avatar (part of global header, NOT team-specific)
- **"Roles" | "Activity logs" tabs** with underline indicator on active tab + "Create role" pill button on the right
- **Role cards** in 2-row format:
  - Row 1: colored dot + role name (left) + 3-dot menu icon (right, only for non-Admin roles)
  - Row 2: "X Member(s)" count + overlapping avatar stack
- **Bottom navigation bar**: Home | Team (people icon, highlighted orange) | + (create) | Profile
- No sidebar visible on mobile — it is completely hidden

---

## 9. Image-Based Spec Workflow

When the user provides images to guide a mobile change, they will **always** share exactly two images in this order:

| Image # | What it shows | How to use it |
|---------|--------------|---------------|
| **Image 1** | **Current view** — what the component looks like on mobile right now | Use as the "before" baseline. Identify what needs fixing or adjusting. |
| **Image 2** | **Expected look** — the target design for that specific page/component | Use as the "after" reference. Implement exactly what this shows on mobile. |

### Workflow steps after receiving the two images

1. **Compare images side by side** — identify every visual difference (layout, spacing, colors, font sizes, element order, visibility).
2. **Map each difference to a component file** using the File Map in Section 7.
3. **List planned changes before coding** — briefly state which component, which element, and what class change.
4. **Apply changes only to mobile breakpoint classes** (unprefixed, `sm:`, `md:`) — NEVER alter `lg:` classes.
5. **Use ds-* tokens instead of raw hex** — see Section 10 for the translation table.
6. **Verify desktop is untouched** — mentally step through each changed component at `lg:` and confirm the desktop layout is identical to before.

### The user will also provide layer CSS (raw styles)

Along with the two images the user will paste raw CSS from a design tool (e.g., Figma "Copy as CSS" or browser DevTools "Copy styles"). This CSS will contain:
- **Raw hex color codes** (e.g., `#EC6229`, `#FFECE6`, `#2C2C33`)
- **Raw pixel values** for font-size, line-height, font-weight, padding, border-radius
- **Raw RGBA values** for semi-transparent colors

> **IMPORTANT**: Do NOT copy these raw values directly into the component code.
> Always translate them to the project's semantic `ds-*` CSS variables and Tailwind utility classes.
> See Section 10 for the complete translation table.

---

## 10. Design Token Translation Guide

### 10.1 Color Translation

When you see a raw hex or RGBA in the layer CSS, map it to the nearest `ds-*` variable and use the corresponding Tailwind class. The table below covers **all tokens defined in `src/app/newGlobal.css`**.

#### Backgrounds & Surfaces

| Raw hex value (dark theme) | DS variable | Tailwind class |
|---------------------------|-------------|----------------|
| `#030303` | `--ds-bg` | `bg-ds-bg` |
| `#1A1A20` | `--ds-surface-1` | `bg-ds-surface-1` |
| `#222228` | `--ds-surface-2` | `bg-ds-surface-2` |

> Light theme equivalents: `#FFF9F6` → `bg-ds-bg`, `#FFFFFF` → `bg-ds-surface-1`, `#F3EDE9` → `bg-ds-surface-2`

#### Text Colors

| Raw hex (dark) | DS variable | Tailwind class | When to use |
|----------------|-------------|----------------|-------------|
| `#FFECE6` | `--ds-text-primary` | `text-ds-text-primary` | Main readable text |
| `#B8ADA8` | `--ds-text-secondary` | `text-ds-text-secondary` | Supporting / secondary labels |
| `#726B67` | `--ds-text-muted` | `text-ds-text-muted` | Placeholders, timestamps, disabled hints |

> Light theme equivalents: `#121217` → primary, `#5C5A57` → secondary, `#8F8B87` → muted

#### Borders

| Raw hex | DS variable | Tailwind class |
|---------|-------------|----------------|
| `#2C2C33` | `--ds-border` | `border-ds-border` |

#### Accent / Interactive

| Raw hex | DS variable | Tailwind class | Allowed uses |
|---------|-------------|----------------|-------------|
| `#EC6229` | `--ds-accent` | `text-ds-accent`, `border-ds-accent`, `bg-ds-accent` | Active tab underline, focus ring, selected state indicator, CTAs |

> **Orange rule**: `#EC6229` / `ds-accent` is ONLY for interactive states. Never use it for decorative backgrounds or informational text.

#### Semantic Colors

| Raw hex | DS variable | Tailwind class | Use for |
|---------|-------------|----------------|---------|
| `#E5484D` | `--ds-error` | `text-ds-error` | Errors, destructive actions |
| `#3FB950` | `--ds-success` | `text-ds-success` | Success confirmations |
| `#F0A500` | `--ds-warning` | `text-ds-warning` | Warnings |

---

### 10.2 Typography Translation

When the layer CSS shows raw font properties, map them to `ds-text-*` utility classes (defined in `newGlobal.css`) or the equivalent Tailwind inline classes.

| Raw CSS values | DS utility class | Notes |
|----------------|-----------------|-------|
| `font-size: 40px; line-height: 48px; font-weight: 700` | `ds-text-title` | Page/login titles only |
| `font-size: 16px; line-height: 24px; font-weight: 400` | `ds-text-body` | Main body text |
| `font-size: 16px; line-height: 24px; font-weight: 500` | `ds-text-body-1` | Tabs, emphasized text |
| `font-size: 16px; line-height: 24px; font-weight: 600` | `ds-text-body-2` | Buttons, strong UI |
| `font-size: 14px; line-height: 20px; font-weight: 400` | `ds-text-secondary` | Secondary body text |
| `font-size: 14px; line-height: 20px; font-weight: 500` | `ds-text-secondary-1` | Emphasized secondary |
| `font-size: 14px; line-height: 20px; font-weight: 600` | `ds-text-secondary-2` | Strong secondary |
| `font-size: 12px; line-height: 16px; font-weight: 400` | `ds-text-small` | Helper text, placeholders |
| `font-size: 12px; line-height: 16px; font-weight: 500` | `ds-text-small-1` | Labels |
| `font-size: 12px; line-height: 16px; font-weight: 600` | `ds-text-small-2` | Strong labels |
| `font-size: 10px; line-height: 12px; font-weight: 400` | `ds-text-meta` | Timestamps, meta info |
| `font-size: 10px; line-height: 12px; font-weight: 500` | `ds-text-meta-1` | Emphasized meta |

> **Font family rule**: All text in new team components uses `font-family: 'DM Sans'`. In Tailwind this is already the default `font-sans`. If a component has inline `font-['DM_Sans',sans-serif]` you can leave it — it resolves to the same family.

---

### 10.3 Spacing Translation

| Raw pixel value | DS spacing variable | Tailwind equivalent |
|-----------------|--------------------|--------------------|
| `4px` | `--space-1` | `p-1`, `gap-1`, `m-1` |
| `8px` | `--space-2` | `p-2`, `gap-2`, `m-2` |
| `12px` | `--space-3` | `p-3`, `gap-3`, `m-3` |
| `16px` | `--space-4` | `p-4`, `gap-4`, `m-4` |
| `20px` | `--space-5` | `p-5`, `gap-5`, `m-5` |
| `24px` | `--space-6` | `p-6`, `gap-6`, `m-6` |
| `32px` | `--space-7` | `p-8`, `gap-8`, `m-8` |
| `40px` | `--space-8` | `p-10`, `gap-10`, `m-10` |

---

### 10.4 Border Radius Translation

| Raw value | DS variable | Tailwind approximation | Use for |
|-----------|-------------|----------------------|---------|
| `4px` | `--radius-tooltip` | `rounded-[4px]` | Tooltips |
| `6px` | `--radius-input` / `--radius-button` | `rounded-[6px]` | Inputs, buttons |
| `8px` | `--radius-card-new` | `rounded-[8px]` | Cards, role cards |
| `16px` | *(dropdown menus in team)* | `rounded-[16px]` | Context menu dropdowns |
| `9999px` | *(full pill)* | `rounded-full` | Pill buttons, avatar chips |

---

### 10.5 Motion / Transition Translation

| Raw value | DS token | Usage |
|-----------|----------|-------|
| `120ms ease-out` | `--motion-quick` | `transition-[var(--motion-quick)]` — hover feedback, toggle flip |
| `200ms ease-out` | `--motion-normal` | `transition-[var(--motion-normal)]` — dropdowns, tab switch |
| `320ms ease-out` | `--motion-slow` | `transition-[var(--motion-slow)]` — modals, sheet slide |

---

### 10.6 Icon Size Translation

| Raw icon size in layer CSS | DS utility class |
|---------------------------|-----------------|
| `20px × 20px` | `ds-icon-16` |
| `18px × 18px` | `ds-icon-14` |
| `16px × 16px` | `ds-icon-12` |
| `14px × 14px` | `ds-icon-10` |

---

### 10.7 Quick Decision Tree — "Which token should I use?"

```
Received raw hex from layer CSS?
├── Is it a background?
│   ├── Page/screen background     → bg-ds-bg
│   ├── Card/panel surface         → bg-ds-surface-1
│   └── Elevated overlay/tooltip   → bg-ds-surface-2
├── Is it a text color?
│   ├── Main content text          → text-ds-text-primary
│   ├── Supporting label           → text-ds-text-secondary
│   └── Placeholder / timestamp    → text-ds-text-muted
├── Is it a border?
│   └── Any divider/outline        → border-ds-border
├── Is it orange (#EC6229)?
│   ├── Active state / CTA         → border-ds-accent or text-ds-accent
│   └── Decorative use?            → ⛔ STOP — accent is not for decoration
└── Is it a semantic state?
    ├── Error                      → text-ds-error
    ├── Success                    → text-ds-success
    └── Warning                    → text-ds-warning
```
