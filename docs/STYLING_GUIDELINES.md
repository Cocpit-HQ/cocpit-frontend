# Team Styling Guideline

## Hybrid Approach: CSS Modules + Tailwind + Design Tokens

We use a **mixed strategy** to balance stability and forward-looking development:

### 1. shadcn/ui Components (Tailwind-based)
- **Keep as-is.** Do not refactor shadcn/ui components; they use Tailwind classes.
- Tailwind is retained as a dependency to support these ~40 UI components.
- Example: `Button`, `Input`, `Label`, `Select`, etc. in `src/components/ui/`

### 2. Custom Components (CSS Modules + Design Tokens)
- **New custom components** use CSS Modules (`.module.css`) with design tokens.
- Example: `LoginFormNew` uses `LoginForm.module.css` with token-based styling.
- Approach: semantic class names (`.container`, `.field`, `.button`) + CSS custom properties.

### 3. Design Tokens (CSS Custom Properties)
- Tokens are inlined in `src/app/globals.css` under `:root`.
- Available to all components: `--color-primary`, `--space-4`, `--gradient-primary`, etc.
- CSS Modules import tokens via standard CSS variable syntax: `color: var(--color-primary);`

### 4. Global Styles
- `src/app/globals.css` houses design tokens, base resets, and animations.
- No large component styles in globals; component styles live in CSS Modules.

### 5. Migration Strategy
- **In scope:** Login page (uses CSS Modules via LoginFormNew + LoginForm.module.css).
- **Out of scope:** SignUp, ForgotPassword, and all shadcn pages (retain Tailwind).
- **Future:** Migrate only critical pages if they become maintenance bottlenecks.

## File Organization

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                  (re-exports LoginFormNew)
│   │   ├── LoginFormNew.tsx               (CSS Modules version)
│   │   ├── LoginForm.module.css           (styles for LoginFormNew)
│   │   ├── SignUpForm.tsx                 (Tailwind, not migrated)
│   │   ├── ForgotPasswordForm.tsx         (Tailwind, not migrated)
│   │   └── ...other auth components
│   ├── ui/                                (shadcn components with Tailwind)
│   │   └── *.tsx
│   └── ...other components
└── app/
    └── globals.css                        (design tokens + base styles)
```

## CSS Modules Naming Convention

- Use **kebab-case** for class names: `.form-container`, `.input-field`, `.btn-primary`.
- Prefer **semantic names** over presentational: `.login-form` not `.blue-box`.
- Keep modules focused on one component.

## Adding a New Custom Component

1. Create `src/components/MyComponent.tsx`
2. Create `src/components/MyComponent.module.css`
3. Import and use classes: `import styles from './MyComponent.module.css'`
4. Reference tokens in CSS: `color: var(--color-primary);`

Example:
```tsx
// MyComponent.tsx
import styles from './MyComponent.module.css';

export function MyComponent() {
  return <div className={styles.container}>Hello</div>;
}
```

```css
/* MyComponent.module.css */
.container {
  padding: var(--space-4);
  color: var(--color-foreground);
  background: var(--color-bg);
}
```

## When to Use What

| Scenario | Use |
|----------|-----|
| Styling existing shadcn/ui component | Tailwind classes (inline) |
| New form or card component | CSS Modules + tokens |
| Global animations or resets | `globals.css` |
| Color, spacing, typography constants | Design tokens in `globals.css` |

## Future Cleanup

- Only fully remove Tailwind if/when shadcn/ui is replaced or refactored.
- Keep `tailwindcss` and `@tailwindcss/postcss` as devDependencies for now.
- `postcss.config.mjs` must remain to support Tailwind processing.

## Questions?
- Check `LoginForm.module.css` and `LoginFormNew.tsx` for live examples.
- Refer to design tokens in `globals.css` (lines 3–26) for available token names.
