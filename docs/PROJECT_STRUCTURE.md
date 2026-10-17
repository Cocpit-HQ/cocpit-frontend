# COCPIT Frontend - Clean Project Structure

## Current Organized Structure

```
src/
├── app/                           # Next.js pages and API routes
│   ├── (auth)/                   # Auth page group
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   └── forgot-password/      # Password recovery
│   ├── globals.css               # Global styles & Tailwind setup
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                    # Reusable React components
│   ├── auth/                     # Auth-related components
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── BrandPanel.tsx
│   │   ├── FloatingOrbs.tsx
│   │   └── HandshakeAnimation.tsx
│   ├── ui/                       # shadcn/ui components (pre-built)
│   ├── NavLink.tsx               # Navigation link component
│   └── providers.tsx             # Context providers setup
│
├── lib/                          # Utilities and libraries
│   ├── api/                      # API client and services
│   │   ├── client.ts             # Axios HTTP client with interceptors
│   │   ├── endpoints.ts          # API endpoint definitions
│   │   └── services/             # API service layer (add as needed)
│   │       └── auth.service.ts   # Authentication API calls
│   ├── store/                    # State management (Zustand, Redux, etc.)
│   ├── utils.ts                  # General utility functions
│   └── validators.ts             # Form validation helpers
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication state & logic
│   ├── use-fetch.ts              # Generic data fetching
│   ├── use-debounce.ts           # Debounce utility
│   ├── use-toast.ts              # Toast notifications
│   ├── use-mobile.tsx            # Mobile detection
│   └── index.ts                  # Export all hooks
│
├── types/                        # TypeScript definitions
│   ├── api.ts                    # API response types
│   ├── common.ts                 # Shared types
│   ├── entities.ts               # Main entity types
│   ├── custom.d.ts               # Module declarations
│   ├── models/
│   │   └── user.ts               # User entity type
│   └── index.ts                  # Type exports
│
├── config/                       # Configuration
│   ├── site.config.ts            # Routes, patterns, API config
│   └── env.ts                    # Environment variables
│
├── constants/                    # App constants
│   ├── messages.ts               # UI messages & validation
│   └── enums.ts                  # Enums & constant values
│
└── App.css                       # App-specific styles
```

## Adding New Features

When adding a feature (e.g., "posts"), follow this pattern:

### 1. Create User Type (if needed)
```typescript
// src/types/models/user.ts already exists - extend as needed
```

### 2. Create API Service
```typescript
// src/lib/api/services/posts.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const postsService = {
  create: (data) => apiClient.post(API_ENDPOINTS.POSTS.CREATE, data),
  getFeed: () => apiClient.get(API_ENDPOINTS.POSTS.GET_FEED),
};
```

### 3. Create Components (in components folder)
```
src/components/posts/
├── PostCreate.tsx
├── PostCard.tsx
├── PostList.tsx
└── index.ts  (barrel export)
```

### 4. Add Pages (in app folder)
```
src/app/(main)/posts/
├── page.tsx
└── [id]/
    └── page.tsx
```

### 5. Add Endpoints (update as features grow)
Update `src/lib/api/endpoints.ts` with new endpoints.

## Key Principles

✅ **Keep structure organized** - Add folders only when needed
✅ **Services handle API calls** - Components use hooks that call services
✅ **Types first** - Define types before implementing features
✅ **Reusable components** - Keep components in `components/` folder
✅ **Config-driven** - Use `config/` for constants and settings
✅ **No dead files** - Remove files as features are added

## Current Ready-to-Use Files

- ✅ Auth components (login, signup, forgot password)
- ✅ Auth service & hooks
- ✅ API client with interceptors
- ✅ Type system (user, API responses, common types)
- ✅ Form validation helpers
- ✅ Custom hooks (auth, fetch, debounce, toast, mobile)
- ✅ Global styles with Tailwind v4 + animations
- ✅ Config system (routes, env, constants)

## Next Steps

1. **Start building features** - Use the structure above
2. **Add services** - Create `src/lib/api/services/[feature].service.ts` as needed
3. **Create components** - Add feature components to `src/components/`
4. **Add pages** - Create routes in `src/app/`
5. **Update types** - Add models to `src/types/models/` as needed

---

**Project is now clean and ready for feature development!**
