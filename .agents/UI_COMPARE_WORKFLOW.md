# UI Gap Analysis & Implementation Plan Workflow

> **THIS FILE IS AN INSTRUCTION TO THE AGENT.**
> Every time the user provides a prompt with **two images** for UI comparison, the agent MUST follow this exact workflow before writing a single line of code.

---

## Standard Image Convention

| Position | Meaning |
|---|---|
| **Image 1 (first / left)** | Current State — what the UI looks like right now in the app |
| **Image 2 (second / right)** | Expected / Target State — what the UI should look like after changes |

> Never assume the order. If the user deviates from this convention, they will say so explicitly.
> Always label your observations as **Current** and **Expected** in your gap report.

---

## Mandatory Agent Workflow

### Step 0 — Acknowledge Images
Before doing anything else, acknowledge that you have received both images and confirm which is Current and which is Expected.

---

### Step 1 — Visual Gap Analysis
Carefully compare both images across every visual dimension. Document every difference in a structured gap table.

**Analyze these dimensions:**

| Dimension | What to look for |
|---|---|
| **Layout & Position** | Alignment, centering, anchoring, absolute/relative positioning of elements |
| **Spacing** | Padding, margin, gap between elements (map to design tokens: 4/8/12/16/20/24/32/40px) |
| **Typography** | Font size, weight, line height, color — map to .ds-text-* scale |
| **Component Sizing** | Heights, widths, border radius, fill vs. fixed behavior |
| **Colors & Tokens** | Surface, text, accent, border values — map to --ds-* tokens |
| **Logo / Brand** | Position (top-left, bottom-right, centered), size, visibility |
| **Navigation / Header** | Presence, position, mobile-specific adjustments |
| **Buttons / CTAs** | Width (full vs. content), height, radius, position in layout |
| **Icons** | Size, alignment, spacing relative to text |
| **Responsive Behavior** | Mobile-specific layout shifts, padding adjustments, sheet vs. modal behavior |
| **Missing Elements** | Anything present in Expected but absent in Current (and vice versa) |

---

### Step 2 — Structured Gap Report
Format all findings as a gap table:

```
## Gap Report: [Screen / Component Name]

| # | Element | Current State | Expected State | Severity |
|---|---|---|---|---|
| 1 | Logo position | Bottom-right corner | Top-left corner | HIGH |
| 2 | Continue button | Fixed width, centered | Full-width, bottom-pinned | HIGH |
| 3 | Heading font size | Too small (mobile) | Larger, matches ds-text-title | MEDIUM |
| 4 | Section spacing | 12px between sections | 24px between sections | MEDIUM |
| 5 | "Or" divider width | Short, centered | Full-width line | LOW |
```

Severity:
- HIGH — Immediately visible, layout-breaking, or brand-critical
- MEDIUM — Noticeable but not blocking; affects polish
- LOW — Minor refinement, subtle detail

---

### Step 3 — Implementation Plan
After the gap report, produce a scoped implementation plan referencing the actual codebase files.

```
## Implementation Plan: [Screen / Component Name]

### Files to Modify
- src/path/to/Component.tsx — [what changes]
- src/path/to/styles.css — [what changes]

### Change Breakdown (ordered by severity)

#### HIGH Priority
1. [Element name]: Exact CSS/Tailwind change
2. [Element name]: Exact change

#### MEDIUM Priority
3. [Element name]: Exact change

#### LOW Priority
4. [Element name]: Exact change

### Design Token Validation
- All spacing uses approved tokens (4/8/12/16/20/24/32/40px)
- Typography mapped to .ds-text-* scale
- Colors use --ds-* variables (no raw hex in TSX)
- Mobile breakpoint < 640px rules applied correctly
- Orange #EC6229 used only in approved contexts
```

---

### Step 4 — Stop and Request Approval
Do NOT implement changes until the user explicitly approves the plan.

Use this exact closing message after presenting the gap report + plan:

"Gap report and implementation plan are ready above. Please review and let me know if you would like to proceed, adjust scope, or reprioritize any items."

---

### Step 5 — Execute (After Approval)
Once the user approves:
1. Work through changes in HIGH → MEDIUM → LOW priority order.
2. After each group of changes, call out what was done.
3. After all changes, cross-reference the Section 13 Checklist in AGENTS.md before marking the task complete.

---

## Hard Rules

1. Never skip the Gap Report. Even for "obvious" single-element changes.
2. Never implement before approval. Even if you are confident in the fix.
3. Never introduce arbitrary values. Map every spacing, color, and typography change to the design token system in AGENTS.md.
4. Never commit to git without explicit user permission (per AGENTS.md Rule 13).
5. Mobile-first for auth/onboarding flows. When images show mobile screens, always default to mobile-first implementation (< 640px breakpoint).

---

## Codebase Reference

| Area | Path |
|---|---|
| Design tokens | src/app/newGlobal.css |
| Auth / Onboarding screens | src/app/(auth)/ |
| Shared components | src/components/ |
| Global rules | .agents/AGENTS.md |

---

## Example Invocation

User says:
"Check image 1 (current) and image 2 (expected) — the logo position is wrong on mobile"

Agent response structure:
1. Acknowledge images + confirm Current vs Expected
2. Run full Gap Analysis across all dimensions
3. Present Gap Report table
4. Present Implementation Plan with file references
5. Stop — await approval
6. Execute only after explicit "proceed" / "yes" / approval from user
