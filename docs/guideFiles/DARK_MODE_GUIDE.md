# 🌙 Dark Mode & Theming Guide — AI Agent Instructions

> **Purpose**: This is the single source of truth for implementing Dark Mode UI and managing colors. **Never use hardcoded hex values in `.tsx` files.**

---

## ⚡ HARD RULES (Read First)

1. **NO HARDCODED HEX VALUES**: You must strictly use Tailwind's semantic classes (e.g., `bg-background`, `text-company-text`, `border-border`) paired with the `dark:` variant modifier (e.g., `dark:bg-background`).
2. **Dual-Theme Awareness**: This app has **User** and **Company** profile modes, which have entirely different dark mode color palettes. Always check `const { isCompany } = useActiveProfile()` before applying dark classes to a shared component.
3. **Preserve Light Mode**: When making an element dark-mode compatible, only **APPEND** `dark:` variants. Never alter or remove the existing light mode classes (e.g., `bg-white`).
4. **Global Maintenance**: All colors must be centralized. If a design requires a new color not mapped in Tailwind, **add it to `globals.css` and `tailwind.config.ts`** — never inline it in a component.

---

## 🎨 1. Implementation Strategy

To add Dark Mode support to any component:

- **Step 1:** Leave the current light mode classes (`bg-white`, `text-[#000000]`) completely untouched.
- **Step 2:** Check if the component is used by the User, the Company, or both.
- **Step 3:** Append the appropriate `dark:` token from the tables below.

### Example (Shared Component):
```tsx
const { isCompany } = useActiveProfile();

// BAD: Hardcoding hex values
<div className={`bg-white ${isCompany ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>

// GOOD: Using semantic tokens
<div className={`bg-white ${isCompany ? 'dark:bg-company-bg' : 'dark:bg-background'}`}>
```

---

## 🙋 2. User Theme Tokens

When in standard User mode, use these Tailwind semantic variables. They map directly to standard Tailwind config names.

| Light Mode (Reference) | Dark Mode Target | Tailwind Utility (`dark:`) |
| :--- | :--- | :--- |
| Background (`#FFFFFF`) | `#0B0F19` | `dark:bg-background` |
| Surfaces/Cards (`#FFFFFF`) | `#1F2937` (approx) | `dark:bg-card` |
| Primary Text (`#000000`) | `#F9FAFB` | `dark:text-foreground` |
| Secondary Text (`#6B7280`) | `#9CA3AF` | `dark:text-muted-foreground` |
| Border (`#E5E7EB`) | `#374151` (approx) | `dark:border-border` |
| Primary Accent (`#6366F1`) | `#818CF8` | `dark:bg-primary` / `dark:text-primary` |
| Error (`#FF6B6B`) | `#F87171` | `dark:text-destructive` |

---

## 🏢 3. Company Theme Tokens

Company-specific semantic variables are prefixed with `company-` in `globals.css`. Use them to ensure the Company Dark Theme is applied correctly.

| Light Mode (Reference) | Dark Mode Target | Tailwind Utility (`dark:`) |
| :--- | :--- | :--- |
| Background (`#FFFFFF`) | `#0F1115` | `dark:bg-company-bg` |
| Card Surfaces (`#FFFFFF`) | `#121B2B` | `dark:bg-company-card` |
| Primary Text (`#000000`) | `#FFFFFF` | `dark:text-company-text` |
| Secondary Text (`#6B7280`) | `#A1A8B3` | `dark:text-company-secondary` |
| Borders (`#E0E0E7`) | `#2A2D35` | `dark:border-company-border` |
| Primary Link/Button (`#1A73E8`) | `#4D9CFF` | `dark:bg-company-primary` / `dark:text-company-primary` |
| Accent Banner (`#F2F7FF`) | `#121B2B` | `dark:bg-company-ultra-light` |
| Success (`#22C55E`) | `#4ADE80` | `dark:text-company-success` |
| Error (`#EF4444`) | `#F87171` | `dark:text-company-error` |
| Warning (`#F59E0B`) | `#FBBF24` | `dark:text-company-warning` |

---

## ⚙️ 4. How to Add a New Global Color

If a new UI mockup introduces a color that cannot be mapped to an existing token, **DO NOT** hardcode it. Follow this process to register it globally:

1. **Open `src/app/globals.css`**
2. **Add to Light Theme**: Inside the `:root` pseudo-class (or equivalent light theme selector), add the light mode hex variable:
   ```css
   --color-company-new-accent: #E8F1FF;
   ```
3. **Add to Dark Theme**: Inside the `[data-theme="dark"]` selector, add the dark mode equivalent:
   ```css
   --color-company-new-accent: #16365F;
   ```
4. **Register in Tailwind**: Look at the `@theme` or `@layer base` section at the top of `globals.css` (or `tailwind.config.ts`), and map the CSS variable to a Tailwind utility name:
   ```css
   --color-company-new-accent: var(--color-company-new-accent);
   ```
5. **Use it in components**: You can now safely use `bg-company-new-accent` or `dark:bg-company-new-accent`.
