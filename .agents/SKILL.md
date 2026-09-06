# Cocpit Design System — Agent Skill

## 0. What this skill is

This file is the **source of truth** for how any UI in the **Cocpit** product must look and behave. It was extracted directly from Cocpit's Figma-exported CSS specification (dark-mode/default theme). Every value below — unless explicitly marked `PROPOSAL` or `Not currently defined` — comes verbatim from that source.

When you (the AI coding/design agent) are asked to design, build, review, or extend any Cocpit UI, you must act like an experienced Cocpit product designer/developer extending an existing, shipped product — not like a generic AI generating a new design system.

**Non-negotiable priorities:**

```
CONSISTENCY   > CREATIVITY
REUSE         > REINVENT
EXACT TOKENS  > GUESSED VALUES
EXISTING UI   > NEW COMPONENTS
SEMANTIC NAME > RAW HEX/PX
EXISTING STATE> INVENTED STATE
```

**Internal behavior loop — always in this order:**

```
UNDERSTAND → INSPECT → REUSE → MAP TOKENS → MAP STATES → DESIGN → VALIDATE → IMPLEMENT
```

Never: `UNDERSTAND → INVENT → IMPLEMENT`.

---

## 1. Notes on the source (read before using anything below)

The raw file is a Figma "dev mode" CSS export. Two things in it are **Figma authoring artifacts, not design tokens**, and must never be reproduced in real UI:

- The outer canvas wrapper (`background: #444444; border: 1px solid rgba(255,255,255,0.1); width: 3095px; height: 1891px;`) — this is the Figma page/canvas background behind all component specimens. **Ignore it.**
- Every component's `border: 1px dashed #8A38F5; border-radius: 5px;` wrapper — this is Figma's "spec callout" box drawn around each component to label it for documentation. **It is not a Cocpit border style.** Never apply a dashed purple border to real UI.
- All `position: absolute/relative`, `left`, `top`, `width` (of these outer spec frames) values tied to the two artifacts above are canvas coordinates, not layout rules, and must be discarded per the Figma Export Rule.

Everything else — colors, typography, spacing *inside* components, radii, borders, shadows, icon treatment, and states — is real and authoritative.

One naming note to preserve: the source's own component labels are sometimes inconsistent (e.g., the layer named `textarea` is structurally a rounded filter/tag pill, not a multi-line text field; `Property 1=disbaled` / `Property 1=enabaled` are the source's own typos for "default" and "selected/active" on Chips). This skill preserves the source's exact values while flagging the label mismatch so you don't get confused when asked for an actual multi-line textarea (which is **not currently defined** in the source — see §10.14).

---

## 2. Semantic Color Tokens

All colors below are documented in the source under the group **"Dark mode (default)"**. Cocpit ships dark-mode-first; treat this as the base/only theme unless a light-mode spec is supplied later.

| TOKEN | Value | Purpose | Used by |
|---|---|---|---|
| `PAGE_BACKGROUND` (Black / Page) | `#030303` | The app's root/canvas background | Page background, disabled toggle-off track, disabled radio dot fill |
| `CARD_BACKGROUND` (Black-1 / card) | `#1A1A20` | Default surface for buttons, cards, checkboxes, chips, panels | Primary/secondary button backgrounds, checkbox default fill, chip default fill, textarea/pill default fill |
| `POPOVER_BACKGROUND` (Black-2 / popover) | `#222228` | Elevated/overlay surface, hover surface | Button hover background, toggle default-off track, checkbox/radio hover halo, textarea/pill hover fill |
| `TEXT_PRIMARY` | `#FFECE6` | Primary text, headings, active/enabled labels, active icons | Headings, body text, enabled button labels, active nav icons, filled input text |
| `TEXT_SECONDARY` | `#B8ADA8` | Secondary text, inactive nav/sidebar labels, loading-state icon/text | Sidebar inactive labels, unselected nav icons, loading spinners/icons, unselected sub-tab label |
| `TEXT_MUTED` | `#726B67` | Muted/placeholder/disabled text | Input placeholders, disabled button/text/icon, category headers ("Core", "Work"), timestamps' companion muted labels |
| `ACCENT` (Accent / indication) | `#EC6229` | Cocpit's single brand accent — primary action color, active/selected indication | Emphasis button fill, active tab indicator, focus rings/borders, toggle-on track, checkbox-checked fill, radio-selected ring+dot, active filter dot, "See more" link |
| `ACCENT_HOVER` (Dark accent — hover for emphasis button) | `#D95624` | Hover state exclusively for the accent-filled ("emphasis") button | Primary emphasis button hover fill |
| `BORDER` | `#2C2C33` | Default hairline border/divider | Secondary button border, input underline (default/hover/disabled), disabled component borders, mobile bottom-nav top divider |
| `DANGER` | `#E5484D` | Error state | Error input underline, error text/label, error textarea/pill border |
| `SUCCESS` (valid) | `#3FB950` | Success state | Success input underline, success text/label |

**Glow/emphasis effect color:** the accent's soft glow shadow uses the *text-primary* tint at low opacity — `rgba(255, 236, 230, 0.24)` for the light-emitting "active indicator" glow behind accent dots (see §6 Shadows). This is not a separate token, it's an effect built from `TEXT_PRIMARY` at 24% opacity.

### Hover/Focus color rule (do not deviate)
- Wherever the source defines an exact hover or focus value, use that **exact** hex. Never substitute a "similar" orange, blue, or gray.
  - Emphasis (accent) button hover → exactly `#D95624`, never `#F97316`, `#FF6B35`, `#E85D04`, etc.
  - Focus indication color is always `ACCENT` (`#EC6229`), applied as a **border**, never a generic blue outline.

---

## 3. Typography System

**Font family:** `'DM Sans'` — the only typeface in the source. Do not substitute another font family for any Cocpit surface unless explicitly instructed.

Semantic type styles found in the source (name in source comment → spec):

| SEMANTIC STYLE | Weight | Size | Line-height | Source label / typical use |
|---|---|---|---|---|
| `DISPLAY_METRIC` | 700 | 24px | 32px | Large numeric stat (e.g. the "156" metric number) |
| `BODY` (Main body) | 400 | 16px | 24px | Standard body/paragraph text, search placeholder, nav bar labels |
| `BODY_EMPHASIS` (Main body 1 — "Tabs, emphasized text") | 500 | 16px | 24px | Button labels, tab labels |
| `LABEL` ("Lable" — Form labels, tab labels, filter chips) | 500 | 16px | 21px | Sidebar item labels, form field labels |
| `SECONDARY_BODY` (Secondary body text) | 400 | 14px | 20px | Input field text, avatar name labels |
| `VALUE` ("The key data point in a row — a name, stat, price, main field") | 500 | 12px | 16px | Filter/dropdown labels, chip/pill labels, sub-tab labels |
| `SMALL_BODY` (Input/placeholder/helper) | 400 | 12px | 16px | Placeholder text, helper text, link text, error/success helper strings |
| `MICRO` (Badges, tags, dense table headers) | 500 | 10px | 13px | Sidebar section headers ("Core", "Work", "Insights", "Account"), "See more" link |
| `META` (timestamps/minor metadata) | 400 | 10px | 12px | Timestamps, profile meta lines (role, location, "6 days ago") |

**Not currently defined in the source:** a dedicated `HEADING`/`H1–H6` scale, `CAPTION` distinct from `META`, and letter-spacing values. If a screen needs page-level headings, propose new sizes only per the New Token Rule (§14) — do not invent them silently.

---

## 4. Spacing Scale

Recurring spacing/padding/gap values observed across every component (treat as the spacing scale — prefer these over arbitrary numbers):

`4, 6, 8, 10, 12, 16, 20, 24px`

Typical usage:
- **4px** — icon-to-label gap in compact controls (filter row, tag row)
- **6–8px** — vertical button padding; gap between icon and label in most buttons/tabs
- **8px** — sidebar item internal padding component (top/bottom), nav icon padding
- **10px** — generic auto-layout filler gap in several buttons (loading/secondary states)
- **12px** — horizontal button/tab/input padding; sidebar horizontal padding; gap between sidebar sections
- **16px** — sidebar outer horizontal padding; gap in theme switcher
- **20px** — component-to-component gap inside dashed spec frames (structural, ignood for real layout); mobile nav search-bar gap
- **24px** — sidebar section gap; nav icon corner radius reference; mobile bottom-nav top padding

---

## 5. Border Radius Tokens

| TOKEN | Value | Used by |
|---|---|---|
| `RADIUS_XS` | 4px | Checkbox corners, small square org/brand logo thumbnails |
| `RADIUS_SM` | 6px | Small dropdown/menu frame ("Sub tabs" container) |
| `RADIUS_MD` | 8px | Bordered square icon button (mobile nav "add" button) |
| `RADIUS_LG` | 16px | Filter/tag pill ("textarea"-labeled chip component) |
| `RADIUS_XL` | 24px | Circular nav icon button, sidebar panel container |
| `RADIUS_PILL` | 100px / 9999px | Buttons (all variants), chips, toggle track, checkbox check-thumb *(note: checkbox body itself uses 4px, only its internal state visuals are square)*, radio ring, sidebar tabs, avatar |

Do not invent intermediate radii (e.g. 10px, 12px, 20px) unless the source shows them for that exact component.

---

## 6. Borders & Shadows

**Border widths:**
- `1px` — standard hairline (BORDER token), input underlines, secondary button border
- `1.5px` — radio ring, active underline-tab indicator line — used specifically for emphasis/selection indicators that need to read as slightly heavier than a hairline

**Shadows / effects:**

| Effect | Value | Purpose |
|---|---|---|
| `SHADOW_TAB` | `drop-shadow(0px 2px 4px rgba(255, 236, 230, 0.08))` | Subtle warm lift under pill-style tab/filter/button groups |
| `SHADOW_OVERLAY` | `drop-shadow(0px 1px 2px rgba(99, 102, 241, 0.08))` | Subtle glow on the search/metrics overlay card |
| `GLOW_INDICATOR` | `0px -2px 4px rgba(255,236,230,0.24), 0px 2px 4px rgba(255,236,230,0.24)` | Soft bidirectional glow behind small accent "active" dots (notification dot, active sub-tab dot, active filter dot) |
| `SHADOW_AVATAR` | `0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)` | Standard elevation under avatar/logo thumbnails |

Do not apply generic Tailwind shadow utilities (`shadow-md`, `shadow-lg`, etc.) — use these exact values, expressed as custom CSS/box-shadow or matched Tailwind arbitrary values.

---

## 7. Icon Styling

- Icon sizes in use: **16px** (inside buttons/inputs — add icon, eye icon), **20px** (nav bar, sidebar, mobile nav icons), **24px** (icon-button hit containers, avatar-adjacent icon frames).
- Icons are implemented as single-color vector shapes (`background:` fill on a mask, not `<img>`/multi-tone icon sets). Icon color always equals the semantic text color of that state (e.g., a muted button → muted icon; a primary/enabled button → primary icon).
- Small status/notification dots are **4px** (filter row indicator), **6px** (active sub-tab indicator), or **8px** (radio selected dot) — always solid `ACCENT` fill, and the 6–8px "active" dots carry the `GLOW_INDICATOR` shadow.

---

## 8. Component Inventory

For each component: purpose, structure, and the **exact** state values from the source. States shown are **only** the states the source actually defines for that component — do not add extra states.

### 8.1 Primary Button
**Purpose:** Neutral-weight primary action (dark, non-accent fill).
**Structure:** pill (`RADIUS_PILL`), height 36px, padding `6px 12px`, `BODY_EMPHASIS` label, `SHADOW_TAB`.

| State | Background | Text | Border |
|---|---|---|---|
| Enabled | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY` | none |
| Hover | `POPOVER_BACKGROUND #222228` | `TEXT_PRIMARY` | none |
| Focus | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY` | 1px `ACCENT` |
| Loading | `CARD_BACKGROUND #1A1A20` | icon: `TEXT_SECONDARY` | none |
| Disabled | `CARD_BACKGROUND #1A1A20` | `TEXT_MUTED` | none |

### 8.2 Primary Emphasis Button
**Purpose:** The single highest-emphasis CTA — the only button that uses the accent fill.
**Structure:** identical geometry to 8.1.

| State | Background | Text | Border |
|---|---|---|---|
| Enabled | `ACCENT #EC6229` | `TEXT_PRIMARY` | none |
| Hover | `ACCENT_HOVER #D95624` | `TEXT_PRIMARY` | none |
| Focus | `ACCENT #EC6229` | `TEXT_PRIMARY` | 1px `BORDER #2C2C33` |
| Loading | `CARD_BACKGROUND #1A1A20` | icon: `TEXT_SECONDARY` | none |
| Disabled | `CARD_BACKGROUND #1A1A20` | `TEXT_MUTED` | none |

> Rule: Loading and Disabled always fall back to the neutral `CARD_BACKGROUND`, even for the emphasis button — never gray-out/desaturate the accent color itself.

### 8.3 Secondary Button
**Purpose:** Lower-emphasis action, outline-only by default.

| State | Background | Text | Border |
|---|---|---|---|
| Enabled | transparent | `TEXT_PRIMARY` | 1px `BORDER #2C2C33` |
| Hover | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY` | 1px `BORDER #2C2C33` |
| Focus | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY` | 1px `ACCENT #EC6229` |
| Loading | transparent | icon: `TEXT_SECONDARY` | 1px `BORDER #2C2C33` |
| Disabled | transparent | `TEXT_MUTED` | 1px `BORDER #2C2C33` |

### 8.4 Primary Button with Icon
Same states/colors as 8.1, plus a 16px icon (order: label, then icon), gap 4px, width auto (~85px in spec). Icon color mirrors label color per state (muted↔muted, secondary↔secondary, primary↔primary).

### 8.5 Secondary Button with Icon
Same states/colors as 8.3, icon-before-label, gap 10px.

### 8.6 Link (text link)
**Purpose:** Inline/navigation text link. No background or border box — only underline changes.

| State | Text | Underline |
|---|---|---|
| Default | `TEXT_SECONDARY #B8ADA8` | none |
| Hover | `TEXT_PRIMARY #FFECE6` | 1px bottom border, `TEXT_PRIMARY` |
| Focus | `TEXT_PRIMARY #FFECE6` | 1px bottom border, `ACCENT #EC6229` |
| Disabled | `TEXT_MUTED #726B67` | none |

Typography: `SMALL_BODY` (400/12/16).

### 8.7 Input Field (text-only)
**Purpose:** Standard single-line text input. Underline style (no full border box, no fill).
Padding `8px 0`, typography `SECONDARY_BODY` (400/14/20).

| State | Underline (border-bottom) | Text |
|---|---|---|
| Placeholder | 1px `BORDER #2C2C33` | `TEXT_MUTED` |
| Filled | 1px `BORDER #2C2C33` | `TEXT_PRIMARY` |
| Hover | 1px `BORDER #2C2C33` | `TEXT_PRIMARY` |
| Focus | 1px `ACCENT #EC6229` | `TEXT_PRIMARY` |
| Disabled | 1px `BORDER #2C2C33` | `TEXT_MUTED` |

### 8.8 Input Field with Icon (e.g., password/eye toggle)
Same states/colors as 8.7 plus a trailing 16px icon whose color always matches the input text color for that state.

### 8.9 Input with Error / Success (icon variant)
Adds a status underline + helper text below the field:

| State | Underline | Helper text | Helper color |
|---|---|---|---|
| Error | 1px `DANGER #E5484D` | "*Error" | `DANGER #E5484D` |
| Success | 1px `SUCCESS #3FB950` | "*Success" | `SUCCESS #3FB950` |

Field text remains `TEXT_PRIMARY` in both cases; only the underline and helper text change color. Icon stays `TEXT_PRIMARY`.

### 8.10 Input with Note
Same base states as 8.7, plus a persistent helper "Note" line below the field. **The note text is always `TEXT_MUTED`, regardless of the field's own state** (including Focus/Error) — never recolor the note.

### 8.11 Input with Icon, Error/Success, and Note
Combines 8.8 + 8.9 + 8.10: icon + status underline + status label + a separate muted note, laid out side-by-side (status label and note share a row, `justify-content: space-between`).

### 8.12 Filter/Tag Pill ("textarea" in source layer names — see §1)
**Purpose:** Rounded selectable pill used for filter chips / quick-select tags (e.g. "Most viewed", "Open"). *Not a multi-line textarea component — no multi-line textarea is currently defined; see §14.*
Padding `6px 12px`, radius `RADIUS_LG (16px)`, typography `VALUE` (500/12/16).

| State | Background | Border | Text |
|---|---|---|---|
| Default | `CARD_BACKGROUND #1A1A20` | 1px `BORDER #2C2C33` | `TEXT_MUTED` |
| Filled/Selected | `CARD_BACKGROUND #1A1A20` | 1px `BORDER #2C2C33` | `TEXT_PRIMARY` |
| Hover | `POPOVER_BACKGROUND #222228` | 1px `BORDER #2C2C33` | `TEXT_PRIMARY` |
| Focus | `CARD_BACKGROUND #1A1A20` | 1px `ACCENT #EC6229` | `TEXT_PRIMARY` |
| Disabled | `PAGE_BACKGROUND #030303` | 1px `BORDER #2C2C33` | `TEXT_MUTED` |
| Error | `CARD_BACKGROUND #1A1A20` | 1px `DANGER #E5484D` | `TEXT_PRIMARY` |

### 8.13 Toggle (switch)
Track 44×24px, knob 18×18px, both fully pill-radius.

| State | Track | Knob |
|---|---|---|
| Off | `POPOVER_BACKGROUND #222228` | `TEXT_SECONDARY #B8ADA8` |
| On | `ACCENT #EC6229` | `PAGE_BACKGROUND #030303` |
| Focus (shown on) | `POPOVER_BACKGROUND #222228` + 1px `ACCENT` border | `TEXT_PRIMARY #FFECE6` |
| Hover — off | `BORDER #2C2C33` | `TEXT_PRIMARY #FFECE6` |
| Hover — on | `ACCENT #EC6229` | `TEXT_PRIMARY #FFECE6` |
| Disabled — off | `PAGE_BACKGROUND #030303` | `TEXT_MUTED #726B67` |
| Disabled — on | `TEXT_MUTED #726B67` | `PAGE_BACKGROUND #030303` |

### 8.14 Checkbox
24×24px box, `RADIUS_XS (4px)`. Hover shows a 36×36px `POPOVER_BACKGROUND` halo behind the box.

| State | Box fill | Box border | Check icon |
|---|---|---|---|
| Unchecked | `CARD_BACKGROUND #1A1A20` | 1px `BORDER #2C2C33` | — |
| Checked | `ACCENT #EC6229` | none | `PAGE_BACKGROUND #030303` |
| Disabled — unchecked | `PAGE_BACKGROUND #030303` | 1px `BORDER #2C2C33` | — |
| Disabled — checked | `TEXT_MUTED #726B67` | none | `PAGE_BACKGROUND #030303` |
| Hover — unchecked | `CARD_BACKGROUND #1A1A20` (+ popover halo) | 1px `TEXT_SECONDARY #B8ADA8` | — |
| Hover — checked | `ACCENT #EC6229` (+ popover halo) | none | `PAGE_BACKGROUND #030303` |

### 8.15 Radio Button
24×24px, fully circular, 1.5px ring. Hover shows the same 36×36px popover halo pattern as checkbox.

| State | Ring | Center dot |
|---|---|---|
| Unselected | 1.5px `TEXT_MUTED #726B67` | none |
| Selected | 1.5px `ACCENT #EC6229` | `ACCENT #EC6229`, 8px |
| Disabled — unselected | 1.5px `BORDER #2C2C33` | none |
| Disabled — selected | 1.5px `TEXT_MUTED #726B67` | `PAGE_BACKGROUND #030303`, 8px |
| Hover — unselected | 1.5px `TEXT_SECONDARY #B8ADA8` (+ popover halo) | none |
| Hover — selected | 1.5px `ACCENT #EC6229` (+ popover halo) | `ACCENT #EC6229`, 8px |

### 8.16 Sidebar Tab / Nav Item
Pill, padding `6px 12px`, gap 8px, typography `BODY` (400/16/24).

| State | Background | Icon | Label |
|---|---|---|---|
| Unselected | transparent | `TEXT_SECONDARY #B8ADA8` | `TEXT_SECONDARY #B8ADA8` |
| Selected | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY #FFECE6` | `TEXT_PRIMARY #FFECE6` |

### 8.17 Nav Bar Icon Button (circular)
40×40px, `RADIUS_XL (24px)`, padding 8px. Carries an optional 6px `ACCENT` notification dot (top-right, with `GLOW_INDICATOR`).

| State | Background | Icon |
|---|---|---|
| Unselected/Default | transparent | `TEXT_PRIMARY #FFECE6` |
| Hover | `CARD_BACKGROUND #1A1A20` | `TEXT_PRIMARY #FFECE6` |

*Not currently defined in the source:* a dedicated "selected/active" fill for this control beyond hover — if a screen needs a persistent active nav-icon state, treat it as a `PROPOSAL` (reuse the Hover background as the closest existing pattern) rather than inventing a new color.

### 8.18 Filter Row Item (dropdown-style label + chevron)
Auto-layout row, padding `6px 12px`, gap 4px, `SHADOW_TAB`. Structure: small 4px status dot → `VALUE`-style label (`TEXT_PRIMARY`) → 16px chevron icon (rotated 90°, `TEXT_PRIMARY` stroke).
- Status dot is neutral (no fill defined = inactive) by default, and `ACCENT #EC6229` with `GLOW_INDICATOR` when that filter is active/applied.

### 8.19 Sub Tabs (underline / dot indicator tab group)
Two indicator styles seen in the source for the same "sub tabs" family — use whichever matches the existing screen you're extending:
- **Underline style:** label (`VALUE`/`TEXT_PRIMARY`) with a full-width 1.5px `ACCENT` bottom line to mark the active tab.
- **Dot style:** label (`VALUE`/`TEXT_PRIMARY`) with a 6px `ACCENT` dot (with `GLOW_INDICATOR`) placed alongside/below to mark the active tab.
Inactive tabs in both styles: label color drops to `TEXT_SECONDARY`, no line/dot.

### 8.20 Chips
Pill, padding `6px 8px`, typography `SMALL_BODY` (400/12/16).

| State | Background | Border | Text |
|---|---|---|---|
| Default (source: "disbaled") | `CARD_BACKGROUND #1A1A20` | none | `TEXT_SECONDARY #B8ADA8` |
| Selected/Active (source: "enabaled") | `CARD_BACKGROUND #1A1A20` | 1px `ACCENT #EC6229` | `TEXT_PRIMARY #FFECE6` |

### 8.21 Search Field
Distinct from standard inputs: full-width, `justify-content: space-between`, padding `6px 12px`, bottom border is **`TEXT_PRIMARY #FFECE6`** (not the standard `BORDER` gray) — this is a deliberate, brighter divider reserved for the search affordance. Placeholder text `TEXT_MUTED`, search icon `TEXT_PRIMARY`. Typography `BODY` (400/16/24), centered.

### 8.22 Theme Switcher (segmented sun/moon control)
Pill, padding `8px 12px`, gap 16px, two 20px icons (moon, sun).

| Active mode | Moon icon | Sun icon |
|---|---|---|
| Dark (Default) | `ACCENT #EC6229` | `TEXT_SECONDARY #B8ADA8` |
| Light (Variant2) | `TEXT_SECONDARY #B8ADA8` | `ACCENT #EC6229` |

The active option (matching current theme) is always rendered in `ACCENT`; the inactive option is `TEXT_SECONDARY`.

### 8.23 Avatar / Logo Thumbnail
20–24px image fill.
- User avatars: `RADIUS_PILL` (fully round).
- Org/brand logo thumbnails: `RADIUS_XS` (4px, square-ish).
- Both carry `SHADOW_AVATAR`.

### 8.24 Metric / Stat Display
Large number in `DISPLAY_METRIC` (700/24/32, `TEXT_PRIMARY`), centered, with a small delta row beneath: 10×6px accent triangle icon + percentage text in `SMALL_BODY`/`ACCENT` (e.g. "24%"). Container carries `SHADOW_OVERLAY` and `RADIUS_XL (24px)` when presented as a floating overlay card.

### 8.25 Sidebar (full panel)
Fixed width 213px (content 180px + 16.5px padding each side), padding `20px 16px`, gap 24px between sections, `RADIUS_XL (24px)`, `backdrop-filter: blur(20px)`.
Internal structure:
- Section header: `MICRO` style, `TEXT_MUTED`, e.g. "Core", "Work", "Insights", "Account".
- Section body: stacked **Sidebar Tab** items (§8.16), gap 8–12px.
- Workspace/org switcher rows: 20px logo/avatar + `SECONDARY_BODY`/`TEXT_PRIMARY` label, same pill row treatment.
- "See more" affordance: `MICRO` style in `ACCENT` color, centered.

### 8.26 Mobile Bottom Navigation
Two documented variants — reuse the one matching context, don't merge them:
- **Icon-only bar:** height 48px, padding `8px 24px`, gap 15px, `1px BORDER #2C2C33` top divider. Icons 20px, default color `TEXT_PRIMARY`. One slot may be a bordered square "add" button: 44×32px, `RADIUS_MD (8px)`, 1px `BORDER`, `ACCENT`-colored icon.
- **Search + icons bar:** height 52px, padding `8px 16px`, gap 20px. Contains the standard Search Field (§8.21, flexed to fill) plus trailing 20px icons (`TEXT_PRIMARY`).

---

## 9. Global State Matrix

Only states actually documented per component are listed (blank = not defined in source for that component — do not fabricate it).

| Component | Default | Hover | Focus | Active/Selected | Disabled | Loading | Error | Success |
|---|---|---|---|---|---|---|---|---|
| Primary Button | `#1A1A20` bg / primary text | `#222228` bg | `#1A1A20` bg, `#EC6229` border | — | `#1A1A20` bg, muted text | `#1A1A20` bg, secondary icon | — | — |
| Primary Emphasis Button | `#EC6229` bg | `#D95624` bg | `#EC6229` bg, `#2C2C33` border | — | `#1A1A20` bg, muted text | `#1A1A20` bg, secondary icon | — | — |
| Secondary Button | transparent, `#2C2C33` border | `#1A1A20` bg, `#2C2C33` border | `#1A1A20` bg, `#EC6229` border | — | transparent, muted text | transparent, secondary icon | — | — |
| Link | secondary text | primary text + underline | primary text + accent underline | — | muted text | — | — | — |
| Input (text) | muted placeholder, `#2C2C33` underline | primary text, `#2C2C33` underline | primary text, `#EC6229` underline | filled = primary text | muted text, `#2C2C33` underline | — | `#E5484D` underline | `#3FB950` underline |
| Filter/Tag Pill | `#1A1A20` bg, muted text | `#222228` bg, primary text | `#1A1A20` bg, `#EC6229` border | filled = primary text, `#2C2C33` border | `#030303` bg, muted text | — | `#E5484D` border | — |
| Toggle | off: `#222228` track | off-hover: `#2C2C33` track / on-hover: `#EC6229` track, primary knob | `#222228` track, `#EC6229` border | on: `#EC6229` track | off: `#030303` track, muted knob / on: `#726B67` track | — | — | — |
| Checkbox | `#1A1A20` bg, `#2C2C33` border | `#B8ADA8` border (+popover halo) / checked: `#EC6229` (+halo) | — | checked: `#EC6229` bg | unchecked: `#030303` bg / checked: `#726B67` bg | — | — | — |
| Radio | `#726B67` ring | `#B8ADA8` ring (+halo) / selected-hover: `#EC6229` ring (+halo) | — | `#EC6229` ring + dot | `#2C2C33` ring / selected: `#726B67` ring | — | — | — |
| Sidebar Tab | secondary icon/text | — | — | `#1A1A20` bg, primary icon/text | — | — | — | — |
| Nav Icon Button | primary icon | `#1A1A20` bg | — | — | — | — | — | — |
| Chips | `#1A1A20` bg, secondary text | — | — | `#1A1A20` bg, `#EC6229` border, primary text | — | — | — | — |

---

## 10. Absolute rules (hover / focus / disabled / new tokens)

1. **Never invent a hover color.** If the source gives one, use it exactly (e.g., emphasis button hover is `#D95624`, full stop).
2. **Never use a generic focus ring.** Cocpit's focus treatment is always a **1px (or 1.5px for radios) `ACCENT #EC6229` border/underline/ring** on the component itself — never `outline: 2px solid blue` or a browser default.
3. **Never invent disabled colors.** Disabled states reuse `TEXT_MUTED`, `BORDER`, `PAGE_BACKGROUND`, or `CARD_BACKGROUND` exactly as shown per component — Cocpit does not use opacity-based disabling anywhere in the source, so don't apply `opacity: 0.5` as a shortcut.
4. **Never use raw/generic utility colors** (`bg-blue-500`, `text-gray-400`, `bg-orange-500`, `text-white`, `bg-black`, etc.) unless they are explicitly mapped, in your project's config, to one of the tokens in §2.
5. **If a value isn't in the source, say so.** Respond with "Not currently defined in the Cocpit design system," then: (a) find the closest existing component, (b) find the closest semantic token, (c) if a genuinely new value is required, label it clearly:

```
TOKEN:
VALUE:
PURPOSE:
USED BY:
WHY EXISTING TOKEN IS NOT SUFFICIENT:
```

Never present a proposed/invented value as if it already exists in Cocpit.

---

## 11. Component Reuse & Design Hierarchy

Before building anything new, check in this exact order:

1. Existing exact Cocpit component (§8)
2. Existing component variant (e.g., Primary vs. Primary Emphasis vs. Secondary button)
3. Existing component state (Hover/Focus/Disabled/Loading/Error/Success)
4. Existing semantic token (§2–§7)
5. Existing typography style (§3)
6. Existing spacing/radius pattern (§4–§5)
7. Closest existing Cocpit pattern (even if from a different component family)
8. Minimal new extension — only as a last resort, and only as a labeled `PROPOSAL`

Never create `CustomButton`, `NewInput`, `ModernCard`, etc. when an existing component (§8) already solves the requirement. If asked for "a button," check §8.1–8.5 first. If asked for "an input," check §8.7–8.12 first. If asked for "navigation," check §8.16–8.19, §8.25–8.26 first.

---

## 12. Responsive Behavior

The source documents two explicit navigation contexts:
- **Desktop:** the full Sidebar (§8.25), fixed 213px width, persistent.
- **Mobile:** the Sidebar is replaced by a Mobile Bottom Navigation (§8.26), in one of its two documented layouts (icon-only bar, or search+icons bar).

Rule: **Do not invent a separate visual language for mobile.** Colors, typography, component identity, state treatment, and icon language stay identical between breakpoints. Only these adapt:
- Layout direction (sidebar column → bottom row)
- Navigation pattern (persistent sidebar → bottom tab bar)
- Element sizing/spacing to fit the smaller viewport (use the same spacing scale, §4, just choose smaller values from it — e.g. 8/16/20 instead of 16/20/24)

Tablet breakpoint behavior is **not currently defined** in the source — when needed, propose an intermediate step between the sidebar and bottom-nav patterns and label it a `PROPOSAL`.

---

## 13. Implementation Rules (codebase behavior)

Before writing any code:
1. Inspect the existing codebase for CSS variables, Tailwind theme config, shared UI components (`Button`, `Input`, `Toggle`, `Checkbox`, `Radio`, `Chip`, `Sidebar`, `NavBar`, etc.).
2. If the project already defines tokens (e.g. `--color-accent`, `--radius-pill`), **use them** — do not create parallel tokens like `--cocpit-orange` or `--brand-orange`.
3. If the project already has a `Button`/`Input`/etc. component, extend/reuse it via props/variants instead of writing a new component from scratch.
4. Map every value you use back to a token in this file. If you can't, stop and apply the No-Guessing Rule (§10.5).

---

## 14. Workflows

### 14.1 "Design a new screen"
1. Understand the user's requirement.
2. Identify the page type (dashboard, form, list, settings, profile, etc.).
3. Identify which existing Cocpit components (§8) can be reused.
4. Identify which interaction states are required (hover/focus/disabled/loading/error/success — only the ones that make sense for that component per §9).
5. Map every visual choice to an existing token (§2–§7).
6. Design the layout using the spacing scale (§4) and existing navigation patterns (§8.16, §8.25, §8.26).
7. Validate against §16 (Final Validation Checklist).
8. Only then implement.

### 14.2 Design Review
1. Do **not** immediately redesign anything.
2. Audit: colors, typography, spacing, components, states, borders, radius, shadows, icons, responsive behavior, accessibility.
3. Log violations in this format:

```
DESIGN SYSTEM VIOLATION
Component:
Current:
Expected:
Reason:
Fix:
```

4. Only propose fixes that map back to §2–§10 tokens/components — never a "nicer" alternative that isn't in Cocpit.

---

## 15. Accessibility (within the existing visual language)

- Preserve the Cocpit focus treatment (`ACCENT` border/underline, §10.2) as the *only* focus indicator — it already satisfies "visible focus," just make sure it's never suppressed (`outline: none` without this replacement is not acceptable).
- Status must never be color-only: pair `DANGER`/`SUCCESS` colors with the existing helper-text pattern (§8.9) — the source already does this ("*Error"/"*Success" strings), so continue it rather than relying on border color alone.
- Use semantic HTML (`<button>`, `<input>`, `<label>`, `role="switch"` for toggles, `role="radio"`/`role="checkbox"` where custom-styled) under the custom visuals.
- Disabled components must be truly non-interactive (`disabled`/`aria-disabled`), not merely styled to look muted.
- Keep hit targets at least as large as the documented control size (e.g. the 36–40px button/icon-button heights, the 36px hover halo on checkbox/radio) even where the visible glyph is smaller.

---

## 16. Final Validation Checklist

**Colors**
- [ ] Correct page background (`#030303`)
- [ ] Correct card background (`#1A1A20`)
- [ ] Correct popover background (`#222228`)
- [ ] Correct primary/secondary/muted text
- [ ] Correct accent (`#EC6229`) and accent-hover (`#D95624`, emphasis button only)
- [ ] Correct border (`#2C2C33`)

**Typography**
- [ ] `DM Sans` throughout
- [ ] Correct semantic style from §3 (not an arbitrary size/weight)
- [ ] Correct line-height per style

**Components**
- [ ] Existing components from §8 reused, not recreated
- [ ] Correct variant chosen (e.g. Primary vs. Emphasis vs. Secondary)
- [ ] No dashed purple borders or gray canvas backgrounds leaked from the source spec sheet into real UI

**States**
- [ ] Default / Hover / Focus / Active / Selected / Disabled / Loading / Error / Success — only the ones the source defines for that component (§9)
- [ ] Focus is always the `ACCENT` border treatment, never a generic outline
- [ ] Disabled never uses opacity as a shortcut

**Layout**
- [ ] Spacing values drawn from §4 scale
- [ ] Radius values drawn from §5 (no arbitrary radii)
- [ ] Shadows drawn from §6 (no default Tailwind shadow utilities)
- [ ] Responsive nav pattern matches §12 (sidebar ↔ bottom nav, same visual language)

**Visual Consistency**
- [ ] No random/generic Tailwind colors
- [ ] No generic SaaS/Material/Bootstrap/Linear/Notion visual patterns
- [ ] Looks like it was designed by the same team that built the rest of Cocpit
