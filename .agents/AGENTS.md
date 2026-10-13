# Cocpit Frontend — UI & Dev Design Rules

These rules apply to **every UI change** in the `cocpit-frontend` project without exception.

---

## 01. Responsive & Layout

### Breakpoints
- **Mobile**: `< 640px`
- **Tablet**: `640px – 1023px`
- **Desktop / Web**: `≥ 1024px`

> [!NOTE]
> Breakpoints define layout changes, not specific device types.
> Do not introduce additional breakpoints unless the layout genuinely requires one.

### Grid Systems
- **Web Grid (≥ 1024px)**:
  - **12 columns**
  - **40px margin** (`px-10` / `--container-margin-web`)
  - **16px gutter** (`gap-4` / `--grid-gutter`)
  - Max container width: `1200px` (`max-w-[1200px] mx-auto`)
  - Content must align to the grid.
  - Use Grid and Auto Layout rather than manually positioning elements.
- **Mobile Grid (< 640px)**:
  - **4 columns**
  - **16px margin** (`px-4` / `--container-margin-mobile`)
  - **16px gutter** (`gap-4`)

### Layout Behavior
- **Mobile**: Default to a single-column layout.
- **Tablet / Desktop**: Allow multiple columns where content and available space support them.
- Layouts should adapt naturally to available viewport space.
- Avoid creating separate layouts for every screen width.

### Spacing Scale
Use **only** the approved spacing scale:
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40px`
(`--space-1` through `--space-8` / Tailwind `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8`, `gap-10`).

- Use spacing tokens instead of arbitrary values.
- Closely related elements use smaller spacing (`4px` or `8px` or `12px`).
- Separate sections use larger spacing (`20px` or `32px` or `40px`).
- **Rule**: Do not introduce arbitrary spacing values without a design-system requirement.

---

## 02. Fixed vs Content-Driven Dimensions

Define dimensions where consistency is part of the component. Let content determine dimensions where content can vary.

### Use Defined / Standardized Dimensions for:
- Buttons (`36px` height)
- Inputs (`36px` height)
- Selects (`36px` height)
- Tabs (`36px` height)
- Icon buttons (`36px` or defined target)
- Other standardized controls

### Use Content-Driven Dimensions for:
- Cards
- Text areas
- Post / content areas
- Modals & sheets
- Toasts
- Empty states
- Dropdown panels
- Variable-length list items
- Other components containing unpredictable content

### Rules for Dimensions & Overflow:
1. **Auto / Hug Contents**: Use when dimensions depend on content.
2. **Fill Container**: Use when a component should occupy available space.
3. **No Forced Fixed Heights**: Do not use fixed heights to force variable content into a predetermined space.
4. **Natural Text Wrap**: Text should wrap naturally unless truncation is explicitly defined.
5. **No Clipping**: Never clip content to preserve a fixed height.
6. **No Compensatory Sizing**: Never use fixed dimensions to compensate for incorrect typography, padding, or spacing.

---

## 03. Component Sizing & Control Height

### Standard Control Height (Content + Padding = 36px)
Standard controls use content + padding, rather than an arbitrary hard-coded height:

| Component | Typography | Icon Size | Padding | Result Height |
|---|---|---|---|---|
| **Button** | `16px Medium / 24px LH` (`ds-text-body-1`) | `20px` (`ds-icon-16`) | `6px 16px` | **36px** (`.ds-btn`) |
| **Sidebar Tab** | `16px Medium / 24px LH` (`ds-text-body-1`) | `20px` (`ds-icon-16`) | `6px 16px` | **36px** (`.ds-sidebar-tab`) |
| **Input** | `12px Regular / 16px LH` (`ds-text-small`) | `16px` (`ds-icon-12`) | `10px 12px` | **36px** (`.ds-input`) |
| **Select** | `12px Regular / 16px LH` (`ds-text-small`) | `16px` (`ds-icon-12`) | `10px 12px` | **36px** (`.ds-select`) |

### Typography-to-Icon Sizing Scale
| Context Text Size | Icon Size | Utility Class |
|---|---|---|
| **16px** | **20px** | `.ds-icon-16` |
| **14px** | **18px** | `.ds-icon-14` |
| **12px** | **16px** | `.ds-icon-12` |
| **10px** | **14px** | `.ds-icon-10` |

- **Icon-to-text gap**: `8px` (`--space-2`).
- Icons must be **vertically centered** with the text.
- Standalone icons may use their own defined size where required.

---

## 04. Motion & Animation

### Duration & Speeds
| Speed | Duration | Typical Use | Token |
|---|---|---|---|
| **Quick** | `120ms` | Hover feedback, checkbox tick, radio, toggle, micro state changes | `--motion-quick` |
| **Normal** | `200ms` | Tabs switch, dropdowns, card expansion, standard transitions | `--motion-normal` |
| **Slow** | `320ms` | Modals appearing, sheets sliding up, larger spatial transitions | `--motion-slow` |
| **Exit** | `200ms` | Dismissals, closing animations | `--motion-exit` |

### Easing
- **Entrances**: `ease-out` (fast start, soft landing — Apple TV settle feel).
- **Exits**: `ease-in` (slightly sharper).
- **Continuous state changes**: `ease-in-out` where appropriate.

### Motion Principles
1. Keep transitions short and purposeful.
2. Prefer animating `transform` and `opacity` where possible.
3. Avoid unnecessary animation.
4. Don't delay user interaction because of animation.
5. Respect `prefers-reduced-motion` (remove or significantly reduce non-essential motion).

---

## 05. Interaction States

Not every component needs every state. Implement only states relevant to the component.

| State | Behavior & Requirements |
|---|---|
| **Default** | Normal resting state. |
| **Hover** | Relevant to pointer/desktop interaction. Provides immediate visual feedback (`var(--motion-quick)`). Must **not** change component dimensions. |
| **Focus** | Every keyboard-interactive element must have a visible focus outline (`2px solid var(--ds-accent)` / `.ds-focus-ring`). Must be distinguishable from hover/default. Never remove focus indicator without providing an equivalent designed state. |
| **Active / Pressed** | Indicates that an element is currently being activated. Immediate feedback. Must not cause layout shifts. |
| **Disabled** | Clearly communicates non-interactivity (`.ds-disabled`). Uses defined styling (`opacity: 0.4`, `pointer-events: none`). Must not appear interactive. **Do not rely on opacity alone** to communicate disabled state. |
| **Loading** | Clearly communicates that an action or content is processing.<br>• **Content loading** → use skeleton loading (`.ds-skeleton`) matching layout roughly.<br>• **Action loading** → inline loading feedback (e.g. "Saving...").<br>• Preserve component dimensions while loading. Prevent duplicate actions while processing. |
| **Error** | Identify affected component clearly. Place form errors close to the relevant field. Explain what is wrong and how to fix it. **Do not rely on color alone**. |
| **Success** | Use when an action has successfully completed. Concise feedback (`var(--ds-success)`). Don't use persistent success styling when temporary confirmation is sufficient. |

### State Stability
State changes must **not unexpectedly change component dimensions**.
*(e.g., Default → Focus → Error must keep the input's `36px` control height intact).*

---

## 06. Form Elements Specifications

### Button (`.ds-btn`)
- Use content + padding rather than fixed height.
- `16px Medium / 24px LH`, padding `6px 16px`, icon `20px`, icon gap `8px` → **36px visual height**.
- Width is content-driven unless explicitly defined as full-width.
- Do not clip long labels.
- Leading/trailing icons are optional.

### Input (`.ds-input`)
- Use content + padding rather than fixed height.
- `12px Regular / 16px LH`, padding `10px 12px`, icon `16px`, icon gap `8px` → **36px visual height**.
- Width should normally fill its available container (`w-full`).
- Leading/trailing icons are optional.
- Input text must not be vertically clipped.

### Supporting Content
- Supporting text, notes, and error messages sit **outside** the input control in the supporting area (`.ds-supporting-area`).
- The input itself remains `36px` regardless of state.

### Text Area
- Uses the same base styling, surface, and border as Input.
- Height is content-driven. Do not force variable text into a fixed height.
- Text wraps naturally.

### Select / Dropdown Trigger (`.ds-select`)
- Uses the same base dimensions, padding, and typography as Input (`36px` visual height).
- Trailing caret/icon: `16px`, icon gap: `8px`.
- Opening the dropdown must not change the trigger's dimensions.
- Dropdown content is content-driven.

### Checkbox
- Use defined visual control size from the design system.
- Interactive hit area should meet minimum `40px` target (`.ds-touch-target`).
- Label and control must remain vertically aligned.
- Clicking/tapping the label activates the checkbox.
- Supported states: Unchecked, Checked (filled orange `#EC6229` with white tick), Indeterminate, Disabled, Focus, Error.

### Radio
- Same interaction principles as Checkbox.
- Label must be clickable. Only one option in a group can be selected.
- Supported states: Unselected, Selected, Disabled, Focus, Error.

### Toggle / Switch
- Use for immediate on/off settings.
- Supported states: Off, On (track filled orange `#EC6229`), Disabled, Focus, Loading.
- State must be understandable without relying only on color.
- Tapping/clicking toggles the state.
- **Rule**: Don't use toggles for mutually exclusive choices or actions requiring confirmation.

---

## 07. Components & Surfaces

| Component | Specification |
|---|---|
| **Card** | Dimensions are content-driven. Avoid fixed heights. Use Auto Layout/natural content flow. Don't clip or overflow. Sits on `var(--ds-surface-1)`, `8px` radius (`--radius-card-new`), `1px solid var(--ds-border)`, **no shadow** (sits in page). |
| **Modal / Dialog** | Width/height content-driven within defined maximum dimensions. Sits centered on `var(--ds-surface-2)`, **has shadow** (floating), dimmed backdrop. Content area scrolls if it exceeds height. Mobile presents as bottom sheet (`.ds-animate-sheet-up`). Focus trap inside active modal, Escape key dismisses, returns focus on close. |
| **Dropdown Menu** | Floating panel on `var(--ds-surface-2)`, `6px` radius (`--radius-dropdown`). Height is content-driven. Items have breathing room and hover highlights. Must remain within viewport. Keyboard navigation supported. Selecting item closes menu. Opening does not shift layout. |
| **Tooltip** | Small dark chip near hovered element, tiny arrow, appears after a brief delay. Content is short and contextual. Not for essential info. Sits within viewport. |
| **Accordion** | Height is content-driven. Closed → hidden; Open → expands naturally with motion. Don't clip expanded content. Full keyboard/focus support. Single-open behavior only when specified. |
| **Pagination** | Content-driven page numbers in plain text. Active page gets orange underline (`#EC6229`), NOT a filled circle. Prev/Next controls disabled when no corresponding page exists. |
| **Navigation / Header** | Responsive adapt. Logo left, nav items flow left to right, actions (search, notifications, profile) right. No overlap or clipping at smaller widths. Keyboard accessible. |
| **Icon Button** | Defined control size (`36px` or `40px` hit area). Icon is centered. Must have an accessible name/label (`aria-label`). Don't rely on tooltip as the only accessible name. |
| **Lists (Tags/Pills)** | When displaying a series of tags, labels, or inline items (like permissions), **limit the display to a maximum of 3 items**. If there are more than 3, display the first 3 and append a truncation indicator pill (e.g. `...` or `+X more`) rather than allowing the list to grow unbounded. |

---

## 08. Feedback & Notifications

### Feedback Priority Hierarchy
Use the least intrusive feedback that successfully communicates the result:
$$\text{Inline feedback} \longrightarrow \text{Toast} \longrightarrow \text{Persistent notification} \longrightarrow \text{Modal / Confirmation}$$

### Feedback Types & Rules
- **Toast (`.ds-animate-toast`)**:
  - Use for short-lived, non-blocking feedback (e.g., "Saved successfully", "Link copied", "Action completed").
  - Content is short and concise. Width/height content-driven.
  - Automatically dismisses. Does not shift page layout.
  - Multiple toasts **stack rather than overlap**.
  - Important/critical errors must not rely only on a disappearing toast.
- **Inline Feedback**:
  - Place directly close to the relevant component.
  - Concise messages. Do not unnecessarily shift unrelated content.
  - Do not rely on color alone.
- **Error Feedback**:
  - **Form Errors**: Show close to affected field in the supporting area (`.ds-supporting-area`). Explain the problem and provide corrective guidance. Input control height remains `36px`.
  - **Global Errors**: For network/server failures affecting the entire page. Use appropriate persistent/retryable patterns.
- **Success Feedback**:
  - Least intrusive appropriate feedback (Minor → Toast; Field → Inline; Workflow → Persistent state).
  - Don't show confirmation when result is already obvious.
- **Loading Feedback**:
  - **Content Loading**: Use skeleton loading (`.ds-skeleton`) matching rough layout structure.
  - **Action Loading**: E.g., "Save" → "Saving...". Preserve button dimensions, prevent duplicate submissions.
- **Empty State**:
  - Structure: Icon/Illustration → Heading → Supporting text → Action CTA.
  - Explain why the space is empty and provide a clear next step.
  - Never just blank space or "No data" alone. Never show while loading. Never use as an error state.
- **Confirmation**:
  - For destructive or irreversible actions. Clearly communicate consequences.
  - Primary button = intended action; Cancel button = easy to find.
  - Do not overuse confirmation dialogs for routine reversible actions.

---

## 09. Form Layout Stability (Crucial System Rule)

Validation and supporting content must **not unexpectedly shift the form layout**.

### Field Structure:
```
Label (ds-text-small-1)
↓ (4px gap: --space-1)
Input / Select / Control (36px fixed visual height: .ds-input / .ds-select)
↓ (4px gap: --space-1)
Reserved Supporting Area (.ds-supporting-area — min-h-[16px])
  └─ Helper text / Note / Error message
```

### Stability Rules:
1. Control itself remains its defined `36px` height regardless of state.
2. Error/note content occupies the reserved supporting area (`.ds-supporting-area`).
3. Showing or hiding supporting content must **not** move surrounding form fields where reserved space is specified.
4. Never dynamically increase input height to accommodate an error.
5. Never allow validation to cause unexpected layout jumps.

---

## 10. Accessibility (A11y)

1. **Accessible Names**: All interactive elements (especially Icon Buttons) must have accessible labels (`aria-label`, `aria-labelledby`, or text content).
2. **Keyboard Navigation**: Full keyboard navigation support (Tab flow matches logical visual flow, left-to-right, top-to-bottom).
3. **Visible Focus**: Visible orange focus ring (`2px solid var(--ds-accent)` / `.ds-focus-ring`) on every interactive element when focused via keyboard.
4. **No Hover-Only Access**: Don't rely on hover as the only way to access information or functionality.
5. **Touch Targets**: Minimum `40px` interactive hit area on mobile (`.ds-touch-target`), even if visual control is smaller.
6. **Color Independence**: Never rely on color alone to communicate state, errors, or success. Always pair with icons/text.
7. **Contrast**: Orange text must appear only in bold or large contexts, not small body copy.
8. **Reduced Motion**: Respect `prefers-reduced-motion` at all times.

---

## 11. Implementation Principles

1. **Use the Design System**: Use existing design tokens and components whenever available. Never introduce one-off typography, color, spacing, radius, sizing, or motion values.
2. **Components**: Use reusable components with states/variants. Do not duplicate components for minor variations.
3. **Content-Aware**: Design and test for realistic variable content (**Short → Normal → Long**). Never clip or force content into fixed dimensions.
4. **Layout Stability**: State changes, loading, errors, and validation must preserve surrounding layout.
5. **Responsive**: Follow defined breakpoints and grids. Test across viewport widths, not just reference sizes.
6. **General Principle**:
   > *If the design system already defines the decision, use it. If the value depends on content, let the content determine it. If a new decision is needed, add it to the design system rather than making a one-off implementation.*

---

## 12. Design System Tokens & Palette Reference

### Single Source of Truth: `src/app/newGlobal.css`
- Do **not** modify `src/app/globals.css` without explicit permission.
- Never write raw hex values in `.tsx`/`.ts` files. Always use `--ds-*` or Tailwind semantic classes.

### Color Palette (Exact Hex Values)

| Role | Dark Mode (Default) | Light Mode | CSS Variable |
|---|---|---|---|
| **Background / Page** | `#030303` | `#FFF9F6` | `--ds-bg` / `bg-ds-bg` |
| **Surface-1 / Card** | `#1A1A20` | `#FFFFFF` | `--ds-surface-1` / `bg-ds-surface-1` |
| **Surface-2 / Popover** | `#222228` | `#F3EDE9` | `--ds-surface-2` / `bg-ds-surface-2` |
| **Text Primary** | `#FFECE6` | `#121217` | `--ds-text-primary` / `text-ds-text-primary` |
| **Text Secondary** | `#B8ADA8` | `#5C5A57` | `--ds-text-secondary` / `text-ds-text-secondary` |
| **Text Muted** | `#726B67` | `#8F8B87` | `--ds-text-muted` / `text-ds-text-muted` |
| **Border** | `#2C2C33` | `#E4DDD8` | `--ds-border` / `border-ds-border` |
| **Accent / Indication** | `#EC6229` | `#EC6229` | `--ds-accent` / `--ds-orange` |
| **Danger / Error** | `#E5484D` | `#D6393E` | `--ds-error` |
| **Success / Valid** | `#3FB950` | `#2E883C` | `--ds-success` |
| **Warning** | `#F0A500` | `#886800` | `--ds-warning` |

> [!WARNING]
> **Orange (`#EC6229`) Restriction**: Allowed ONLY for focus rings, checkbox checked, radio selected, toggle ON, active tab underline, active pagination underline, and input focus outline. **Never use orange for links, general text, or decorative backgrounds.**

### Typography Scale (DM Sans)
| Utility Class | Size | Weight | Line Height | Role / Use |
|---|---|---|---|---|
| `.ds-text-title` | `40px` | Bold (700) | `48px` | Login / page titles |
| `.ds-text-body` | `16px` | Regular (400) | `24px` | Main body text |
| `.ds-text-body-1` | `16px` | Medium (500) | `24px` | Tabs, emphasized text, buttons |
| `.ds-text-body-2` | `16px` | Semibold (600) | `24px` | Strong UI, prominent buttons |
| `.ds-text-secondary` | `14px` | Regular (400) | `20px` | Secondary body text |
| `.ds-text-secondary-1` | `14px` | Medium (500) | `20px` | Emphasized secondary text |
| `.ds-text-secondary-2` | `14px` | Semibold (600) | `20px` | Strong secondary text |
| `.ds-text-small` | `12px` | Regular (400) | `16px` | Input / placeholder / helper |
| `.ds-text-small-1` | `12px` | Medium (500) | `16px` | Labels |
| `.ds-text-small-2` | `12px` | Semibold (600) | `16px` | Strong labels |
| `.ds-text-meta` | `10px` | Regular (400) | `12px` | Timestamps / minor metadata |
| `.ds-text-meta-1` | `10px` | Medium (500) | `12px` | Emphasized metadata |

---

## 13. Final Design & Verification Checklist

Before marking any UI task complete, verify:

- [ ] Correct grid used (12-col Web with 40px margin / 4-col Mobile with 16px margin).
- [ ] Only approved spacing tokens used (`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40px`).
- [ ] Standard control heights maintained (`36px` for Buttons, Inputs, Selects, Tabs via content + padding).
- [ ] Typography-to-icon scale adhered to (`16→20`, `14→18`, `12→16`, `10→14` with `8px` gap).
- [ ] Form layout stability preserved (reserved `.ds-supporting-area` prevents jumping on error).
- [ ] Fixed vs content-driven dimensions respected (cards/modals hug content, no artificial height clipping).
- [ ] All relevant interaction states handled (Default, Hover, Focus, Active, Disabled, Loading, Error, Success).
- [ ] Variable content tested (**Short → Normal → Long** labels/descriptions).
- [ ] Responsive behavior verified at Mobile (`<640px`), Tablet (`640–1023px`), and Desktop (`≥1024px`).
- [ ] Accessible name on every interactive element & visible keyboard focus indicator.
- [ ] Zero hardcoded hex values in TSX/TS files.
- [ ] Orange (`#EC6229`) used **strictly** in approved contexts only.
- [ ] **Git commit permission**: Always ask the user for explicit approval before committing.
