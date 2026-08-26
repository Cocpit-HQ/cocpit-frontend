# Design System Migration Map
## Cocpit Frontend — Old vs New CSS Coverage

This file tracks **which features/files** currently use the old `globals.css` system
and which are **migrated to or built with** the new `newGlobal.css` design system.

> [!IMPORTANT]
> **Never import both files in the same component.**
> New components must import `newGlobal.css`. Old components remain on `globals.css`.
> Migration is incremental — update this map when you migrate a feature.

---

## How the Two Files Co-Exist

```
src/app/
├── globals.css      ← OLD — DO NOT MODIFY. Legacy components read from here.
└── newGlobal.css    ← NEW — All new UI builds from here. Exact copy of globals.css
                              + typography scale, motion tokens, spacing, DM Sans font.
```

**Both files are loaded via `layout.tsx`:**
```tsx
// src/app/layout.tsx
import './globals.css';      // loaded first — legacy base
import './newGlobal.css';    // loaded second — new tokens override/extend
```

> [!NOTE]
> Since `newGlobal.css` is an exact copy of `globals.css` with only additions (no removals),
> loading both is safe. New `--ds-*` and `--motion-*` tokens don't conflict with anything.
> When the designer provides the color palette, colors will only be updated in `newGlobal.css`.

---

## What's New in `newGlobal.css` (Not in `globals.css`)

| Token/Class | Description | Status |
|---|---|---|
| `@import DM Sans` | Designer-specified font family | ✅ Added |
| `--text-title-*` | 40px/48px bold — page titles | ✅ Added |
| `--text-body-main-*` | 16px/24px — body text scale | ✅ Added |
| `--text-secondary-*` | 14px/20px — secondary text scale | ✅ Added |
| `--text-small-*` | 12px/16px — small text scale | ✅ Added |
| `--text-meta-*` | 10px/12px — metadata scale | ✅ Added |
| `--motion-quick` | 120ms ease-out | ✅ Added |
| `--motion-normal` | 200ms ease-out | ✅ Added |
| `--motion-slow` | 320ms ease-out | ✅ Added |
| `--motion-exit` | 200ms ease-in | ✅ Added |
| `--space-1` to `--space-6` | 4/8/12/16/20/24px spacing scale | ✅ Added |
| `--radius-input` | 6px — inputs & buttons | ✅ Added |
| `--radius-card-new` | 8px — new cards | ✅ Added |
| `--radius-tooltip` | 4px — tooltips | ✅ Added |
| `--container-max` | 1200px | ✅ Added |
| `--color-ds-*` | New design system color tokens (10 tokens) | ✅ Added |
| `--space-7` | 32px spacing | ✅ Added |
| `--space-8` | 40px spacing | ✅ Added |
| `--container-margin-web` | 40px web grid margin | ✅ Added |
| `--container-margin-mobile` | 16px mobile grid margin | ✅ Added |
| `.ds-text-title` | Typography utility class | ✅ Added |
| `.ds-text-body` to `.ds-text-meta-1` | All 11 typography utilities | ✅ Added |
| `.ds-skeleton` | Skeleton loading with shimmer | ✅ Added |
| `.ds-focus-ring` | Orange keyboard focus outline | ✅ Added |
| `.ds-disabled` | 40% opacity, no-pointer | ✅ Added |
| `.ds-btn` | Standard 36px button (16px text, 20px icon, 6px 16px pad) | ✅ Added |
| `.ds-sidebar-tab` | Standard 36px sidebar tab (16px text, 20px icon) | ✅ Added |
| `.ds-input` | Standard 36px input (12px text, 16px icon, 10px 12px pad) | ✅ Added |
| `.ds-select` | Standard 36px select trigger (12px text, 16px icon) | ✅ Added |
| `.ds-form-field` | Form field column container | ✅ Added |
| `.ds-supporting-area` | Reserved supporting area to prevent layout shift | ✅ Added |
| `.ds-icon-16` / `.ds-icon-14` / `.ds-icon-12` / `.ds-icon-10` | Typography-to-icon scale classes (20/18/16/14px) | ✅ Added |
| `.ds-touch-target` | Minimum 40px hit area for mobile / thumbs | ✅ Added |
| `ds-animate-modal-in/out` | Modal entrance/exit animations | ✅ Added |
| `ds-animate-dropdown` | Dropdown open animation | ✅ Added |
| `ds-animate-sheet-up` | Bottom sheet slide-up | ✅ Added |
| `ds-animate-toast` | Toast entrance | ✅ Added |
| `ds-animate-tick` | Checkbox tick animation | ✅ Added |
| `@media prefers-reduced-motion` | Accessibility: disables all animations | ✅ Added |

### ✅ Designer Color Palette — Confirmed & Applied

**Dark Mode (default):** `#030303` bg · `#1A1A20` surface-1 · `#222228` surface-2 · `#FFECE6` text primary · `#B8ADA8` text secondary · `#726B67` text muted · `#2C2C33` border · `#EC6229` accent · `#E5484D` error · `#3FB950` success · `#F0A500` warning

**Light Mode:** `#FFF9F6` bg · `#FFFFFF` surface-1 · `#F3EDE9` surface-2 · `#121217` text primary · `#5C5A57` text secondary · `#8F8B87` text muted · `#E4DDD8` border · `#EC6229` accent · `#D6393E` error · `#2E883C` success · `#886800` warning

---

## Feature Migration Status

### 🔴 Old System (`globals.css`) — Not Yet Migrated

These features currently use hardcoded colors/classes from `globals.css`.
Do **not** change them until explicitly asked — they work as-is.

| Feature | Key Files | Notes |
|---|---|---|
| **Feed / Posts** | `src/features/feed/` | Uses `skill-chip`, `feed-card-*`, `bg-[#EEF2FF]` |
| **Profile** | `src/features/profile/` | Uses `entity-placeholder`, `add-button-chip`, `stats-button` |
| **Settings** | `src/features/settings/` | Uses dark mode overrides from `globals.css` |
| **Chat** | `src/features/chat/` | Uses `chat-bubble-received-bg`, `chat-active-item-bg` |
| **Navigation/Header** | `src/components/` | Uses `sidebar-*` tokens, `profile-identity-chip` |
| **Article Editor** | Wherever `.article-editor` is used | Has its own canonical typography block |
| **Authentication** | `src/app/(auth)/` | Uses `bg-onboard`, gradient helpers |
| **Notifications** | Wherever `notification-popover-custom` is used | Dark mode override |

---

### 🟡 In Progress — Being Built with New System

| Feature | Key Files | Using |
|---|---|---|
| *(None yet — add here as work begins)* | | |

---

### 🟢 New System (`newGlobal.css`) — Migrated or New Builds

| Feature | Key Files | Classes Used |
|---|---|---|
| **Login / Auth Home** | `src/app/page.tsx`, `src/features/auth/components/LoginForm.tsx`, `src/features/auth/components/AuthSidebarLinks.tsx` | DM Sans, `--ds-*` dark palette, underline inputs, pill buttons |

---

## Rules for Using This Map

1. **Before starting a UI task** — check this map to see if the feature is on old or new system.
2. **When building NEW components** — always use `newGlobal.css` tokens and `ds-*` classes.
3. **When migrating an OLD component** — update its row from 🔴 to 🟢 after completion.
4. **When adding a new token to `newGlobal.css`** — add it to the "What's New" table above.
5. **Never mix systems** in a single component — pick one and be consistent.

---

## Quick Reference: Class Naming Convention

| System | Prefix | Example |
|---|---|---|
| **New design system** | `ds-` | `ds-text-body`, `ds-skeleton`, `ds-animate-modal-in` |
| **Legacy (globals.css)** | no prefix | `skill-chip`, `feed-card-shell`, `entity-placeholder` |
| **Tailwind** | Tailwind utilities | `bg-company-bg`, `text-company-text`, `flex`, `gap-4` |

---

## Typography Quick Reference (DM Sans)

| Class | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `ds-text-title` | 40px | 700 | 48px | Login/page titles |
| `ds-text-body` | 16px | 400 | 24px | Main body text |
| `ds-text-body-1` | 16px | 500 | 24px | Tabs, emphasized |
| `ds-text-body-2` | 16px | 600 | 24px | Buttons, strong UI |
| `ds-text-secondary` | 14px | 400 | 20px | Secondary text |
| `ds-text-secondary-1` | 14px | 500 | 20px | Emphasized secondary |
| `ds-text-secondary-2` | 14px | 600 | 20px | Strong secondary |
| `ds-text-small` | 12px | 400 | 16px | Input/placeholder/helper |
| `ds-text-small-1` | 12px | 500 | 16px | Labels |
| `ds-text-small-2` | 12px | 600 | 16px | Strong labels |
| `ds-text-meta` | 10px | 400 | 12px | Timestamps/metadata |
| `ds-text-meta-1` | 10px | 500 | 12px | Emphasized metadata |

---

## Motion Quick Reference

| Token | Value | Use for |
|---|---|---|
| `var(--motion-quick)` | 120ms ease-out | Toggle, checkbox, hover |
| `var(--motion-normal)` | 200ms ease-out | Dropdown, tab switch, cards |
| `var(--motion-slow)` | 320ms ease-out | Modal, sheet, page transitions |
| `var(--motion-exit)` | 200ms ease-in | Closing/dismiss animations |
