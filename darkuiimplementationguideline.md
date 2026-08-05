# Dark UI Implementation Guidelines

This document outlines the rules and best practices for implementing dark mode across the application, specifically for both User and Company/Institution interfaces.

## 1. Do Not Alter Light Mode 
- **Rule**: Keep the current light mode implementations completely untouched.
- **Solution**: Instead of replacing existing hardcoded light mode classes (e.g., `bg-white`, `text-black`), strictly *append* the `dark:` variants (e.g., `dark:bg-[var(--company-card)]`, `dark:text-[var(--company-text)]`) to the class list.

## 2. Avoid Hardcoded Hex Values in Dark Mode
- **Rule**: Never use static hex codes for dark mode overrides.
- **Solution**: Always use semantic Tailwind variables (e.g., `dark:bg-background`, `dark:text-foreground`) or standard Tailwind color utilities coupled with the `dark:` prefix.

## 3. Utilize Semantic CSS Variables
- Core CSS variables are defined in `globals.css` under `:root`, `[data-theme="light"]`, and `[data-theme="dark"]`.
- The application automatically switches these variables based on the active theme.
- For company-specific UI, use the `--company-*` variables.

## 4. Theming by Profile (User vs. Company)
- When building components shared between User and Company profiles, conditionally apply the relevant dark mode semantic tokens.
- **Example**: 
  Instead of: `className={isCompany ? 'text-[#1A73E8]' : 'text-[#6366F1]'}`
  Use: `className={isCompany ? 'text-[#1A73E8] dark:text-[var(--company-primary)]' : 'text-[#6366F1] dark:text-primary'}`.

## 4. Background and Elevation
- **Light Mode**: Often relies on shadows (e.g., `shadow-sm`) to create elevation and depth.
- **Dark Mode**: Shadows are less visible. Use lighter background shades (`bg-card` vs `bg-background`) or subtle borders (`border-border`) to establish hierarchy and separate elements.
- Ensure company settings use `--company-bg` for the main background and `--company-card` for elevated containers.

## 5. Text Contrast
- Ensure all text meets accessibility contrast standards. 
- Primary text should use `text-foreground` (or `text-company-text`).
- Secondary, descriptive text should use `text-muted-foreground` (or `text-company-secondary`).

## 6. Interactive States
- Hover, active, and focus states must also adapt to dark mode. 
- Use the `dark:hover:*` utility classes or semantic hover tokens to ensure interactive elements remain visible and visually distinct in dark mode.
