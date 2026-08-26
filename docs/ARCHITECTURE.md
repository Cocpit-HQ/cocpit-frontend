# COCPIT Frontend - Architecture & Development Guide

A modern, scalable social media platform built with Next.js 16, TypeScript, and Tailwind CSS.

## 📋 Project Structure Overview

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages (login, signup, forgot-password)
│   ├── (main)/            # Protected app pages (feed, explore, profile, messages, notifications)
│   ├── api/               # API routes (backend endpoints)
│   ├── globals.css        # Global styles with Tailwind and custom animations
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/            # React components
│   ├── auth/              # Auth-related components
│   ├── common/            # Reusable common components
│   ├── features/          # Feature-specific components
│   │   ├── posts/         # Post creation, display, interactions
│   │   ├── profile/       # User profile components
│   │   ├── messages/      # Messaging components
│   │   ├── notifications/ # Notification components
│   │   └── explore/       # Explore/discover components
│   ├── layout/            # Layout components (header, sidebar, etc.)
│   ├── ui/                # shadcn/ui components
│   ├── providers.tsx      # Context providers setup
│   └── NavLink.tsx        # Navigation link component
│
├── lib/                   # Utility functions and libraries
│   ├── api/               # API client and services
│   │   ├── client.ts      # Axios client instance with interceptors
│   │   ├── endpoints.ts   # API endpoint definitions
│   │   └── services/      # API services by feature
│   │       ├── auth.service.ts
│   │       ├── users.service.ts
│   │       ├── messages.service.ts
│   │       └── notifications.service.ts
│   ├── store/             # State management (Zustand, Redux, etc.)
│   ├── utils.ts           # General utility functions
│   └── validators.ts      # Form validation functions
│
├── hooks/                 # Custom React hooks
│   ├── use-auth.ts        # Authentication state management
│   ├── use-fetch.ts       # Generic data fetching hook
│   ├── use-debounce.ts    # Debounce utility hook
│   ├── use-toast.ts       # Toast notifications hook
│   ├── use-mobile.ts      # Mobile detection hook
│   └── index.ts           # Export all hooks
│
├── types/                 # TypeScript type definitions
│   ├── api.ts             # API response types
│   ├── common.ts          # Common/shared types
│   ├── entities.ts        # Main entity types
│   ├── models/
│   │   ├── user.ts        # User entity types
│   │   ├── post.ts        # Post entity types
│   │   ├── message.ts     # Message entity types
│   │   └── notification.ts # Notification entity types
│   └── index.ts           # Type exports
│
├── config/                # Configuration files
│   ├── site.config.ts     # Routes, patterns, API config, constants
│   └── env.ts             # Environment variables with validation
│
├── constants/             # Application constants
│   ├── messages.ts        # UI messages, errors, validation messages
│   └── enums.ts           # Enums and constant values
│
└── App.css, index.css     # Additional global styles

```

## 🚀 Getting Started

### Installation

```bash
npm install
# or
yarn install
```

### Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 File Organization Best Practices

### When Adding New Features

1. **Create Feature Folder Structure**
   - Add new feature in `components/features/[feature-name]/`
   - Create API service in `lib/api/services/[feature].service.ts`
   - Add types in `types/models/[feature].ts`
   - Add routes in `app/(main)/[feature-name]/`

2. **Example: Adding a "Stories" Feature**
   ```
   components/features/stories/
   ├── StoryCreate.tsx
   ├── StoryViewer.tsx
   ├── StoryList.tsx
   └── index.ts
   
   lib/api/services/stories.service.ts
   types/models/story.ts
   app/(main)/stories/
   └── page.tsx
   ```

3. **File Naming Conventions**
   - Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
   - Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
   - Hooks: `use-kebab-case.ts` (e.g., `use-fetch.ts`)
   - Types: Same as utilities (e.g., `user.ts`)

## 🔧 Core Patterns

### API Integration Pattern

```typescript
// 1. Define types in types/models/[entity].ts
export interface Post {
  id: string;
  content: string;
  // ...
}

// 2. Create service in lib/api/services/posts.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const postsService = {
  create: async (data) => apiClient.post(API_ENDPOINTS.POSTS.CREATE, data),
  getFeed: async () => apiClient.get(API_ENDPOINTS.POSTS.GET_FEED),
};

// 3. Use in components with custom hooks
import { useFetch } from "@/hooks";
import { postsService } from "@/lib/api/services/posts.service";

export function Feed() {
  const { data: posts, isLoading } = useFetch(() => postsService.getFeed());
  // ...
}
```

### Form Handling Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validators } from "@/lib/validators";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormInputs = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormInputs) => {
    // Handle login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### State Management Pattern

Use the `useAuth` hook for auth state:

```typescript
import { useAuth } from "@/hooks";

export function AuthButton() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated && user) {
    return <button onClick={logout}>Logout {user.username}</button>;
  }

  return <button onClick={() => login(credentials)}>Login</button>;
}
```

## 🎨 Component Structure

### Layout Components

```
components/layout/
├── Header.tsx       # Top navigation
├── Sidebar.tsx      # Left sidebar
├── Footer.tsx       # Footer
└── MainLayout.tsx   # Main layout wrapper
```

### Feature Components Structure

Each feature follows this pattern:

```
components/features/[feature]/
├── [Feature].tsx         # Main container component
├── [Feature]Card.tsx     # Card/item component
├── [Feature]Modal.tsx    # Modal/dialog component
└── index.ts             # Barrel export
```

## 🔒 Authentication & Authorization

### Authentication Flow

1. User submits login credentials
2. `authService.login()` calls API endpoint
3. Server returns auth token
4. Token stored in localStorage
5. Token included in all API requests via `apiClient` interceptor
6. Protected routes check `useAuth()` state

### Protected Routes Example

```typescript
import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";

export function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingSpinner />;

  return <div>{/* Protected content */}</div>;
}
```

## 📊 Data Flow

### Request Flow

```
Component (useHook) 
  → useAuth/useFetch Hook 
  → Service (auth.service, posts.service, etc.) 
  → API Client (client.ts) 
  → API Server
```

### Response Flow

```
API Server 
  → API Client (handles errors via interceptors) 
  → Service (returns ApiResponse<T>) 
  → Hook (updates state) 
  → Component (re-renders with data)
```

## 🔗 API Integration

### Adding New API Endpoint

1. **Add endpoint in `lib/api/endpoints.ts`**
   ```typescript
   STORIES: {
     CREATE: "/stories",
     GET_ALL: "/stories",
     DELETE: (id) => `/stories/${id}`,
   }
   ```

2. **Create service in `lib/api/services/stories.service.ts`**
   ```typescript
   export const storiesService = {
     create: (data) => apiClient.post(API_ENDPOINTS.STORIES.CREATE, data),
   };
   ```

3. **Define types in `types/models/story.ts`**
   ```typescript
   export interface Story {
     id: string;
     content: string;
     expiresAt: string;
   }
   ```

4. **Use in component**
   ```typescript
   const { mutate } = useMutation((data) => storiesService.create(data));
   ```

## 🧪 Testing Guidelines

(To be implemented based on project needs)

## 🔐 Security Best Practices

1. **Authentication**
   - Always use HTTPS in production
   - Store tokens securely (consider httpOnly cookies)
   - Validate tokens on each request

2. **Data Validation**
   - Use Zod schemas for input validation
   - Validate on both client and server
   - Never trust user input

3. **Environment Variables**
   - Keep API keys in `.env.local`
   - Use `NEXT_PUBLIC_` prefix only for non-sensitive vars
   - Validate required env vars on app start

## 📝 Code Style & Conventions

### TypeScript

- Always explicitly type function parameters and returns
- Use interfaces for object types
- Avoid `any` type
- Use strict mode

### React

- Use functional components and hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

### CSS

- Use Tailwind classes primarily
- Keep CSS in separate files when needed
- Use CSS variables for custom colors from globals.css
- Follow naming convention: kebab-case for classes

## 🚀 Deployment

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in production values
3. Run `npm run build`
4. Deploy to Vercel, Netlify, or your hosting

### Pre-deployment Checklist

- [ ] All types are properly defined
- [ ] No `any` types in code
- [ ] All API endpoints are configured
- [ ] Environment variables are set
- [ ] Tests pass (when implemented)
- [ ] Build succeeds without errors

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Axios Documentation](https://axios-http.com)
- [Zod Documentation](https://zod.dev)

## 🤝 Team Guidelines

### Before Starting Development

1. Check the architecture guide above
2. Review existing patterns in the codebase
3. Create feature branch: `feature/feature-name`
4. Follow file structure conventions

### Code Review Checklist

- [ ] Follows project structure
- [ ] Proper TypeScript typing
- [ ] Uses existing services/utilities
- [ ] Error handling implemented
- [ ] No console errors/warnings
- [ ] Responsive design (mobile-friendly)
- [ ] Accessibility considered

### Common Issues & Solutions

**Issue**: Type not found in `@/types`
- **Solution**: Make sure to export type from appropriate file in `types/` folder

**Issue**: API endpoint not working
- **Solution**: Check `API_ENDPOINTS` in `lib/api/endpoints.ts` and ensure service calls correct endpoint

**Issue**: Styles not applying
- **Solution**: Ensure Tailwind config includes content paths and CSS is imported properly

## 📞 Support & Questions

Contact the team lead or check the project documentation for questions.

---

**Last Updated**: December 12, 2025  
**Project Version**: 0.1.0
