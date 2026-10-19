# Development Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=your_api_key_here

# Authentication (if using NextAuth)
AUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://cocpit-frontend-staging.up.railway.app/

# Upload Service (optional)
NEXT_PUBLIC_UPLOAD_SERVICE_URL=https://upload.example.com

# Development
DEBUG=false
NODE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at [https://cocpit-frontend-staging.up.railway.app/](https://cocpit-frontend-staging.up.railway.app/)

## Development Workflow

### 1. Create a New Feature

**Step 1**: Create feature folder structure

```bash
# For a new feature called "hashtags"
mkdir -p src/components/features/hashtags
mkdir -p src/types/models
touch src/types/models/hashtag.ts
```

**Step 2**: Define types

```typescript
// src/types/models/hashtag.ts
export interface Hashtag {
  id: string;
  name: string;
  count: number;
}
```

**Step 3**: Create API service

```typescript
// src/lib/api/services/hashtags.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const hashtagsService = {
  getTrending: () => apiClient.get("/hashtags/trending"),
};
```

**Step 4**: Create component

```typescript
// src/components/features/hashtags/HashtagList.tsx
import { useFetch } from "@/hooks";
import { hashtagsService } from "@/lib/api/services/hashtags.service";

export function HashtagList() {
  const { data: hashtags, isLoading } = useFetch(() => hashtagsService.getTrending());

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {hashtags?.map((tag) => (
        <div key={tag.id}>{tag.name}</div>
      ))}
    </div>
  );
}
```

### 2. Add New API Endpoint

1. Update `src/lib/api/endpoints.ts`
2. Create/update service in `src/lib/api/services/`
3. Use in components with hooks

### 3. Create Form Component

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name required"),
});

type FormInputs = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormInputs) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Project Structure

See `ARCHITECTURE.md` for detailed project structure and patterns.

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database (if applicable)
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma studio      # Open Prisma Studio
```

## Debugging

### VS Code Debugging

1. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run-script", "dev"]
    }
  ]
}
```

2. Add breakpoints and press F5 to debug

### Console Logging

```typescript
// Use explicit logging in development
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

## Performance Tips

1. **Code Splitting**: Use `next/dynamic` for lazy loading components
2. **Image Optimization**: Use `next/image` for images
3. **API Caching**: Implement proper cache headers
4. **Bundle Analysis**: Use `@next/bundle-analyzer`

## Troubleshooting

### Types Not Found

**Error**: `Cannot find module '@/types'`

**Solution**: 
- Ensure files exist in `src/types/`
- Check tsconfig.json paths configuration
- Restart TypeScript server (Ctrl+Shift+P in VS Code → "TypeScript: Restart TS Server")

### API Requests Failing

**Error**: `CORS error` or `404 Not Found`

**Solution**:
- Check API_URL in `.env.local`
- Verify endpoint path matches API
- Check API is running

### Styles Not Applying

**Error**: Tailwind classes not showing

**Solution**:
- Ensure `globals.css` is imported in `layout.tsx`
- Check file paths in `tailwind.config.ts` content array
- Rebuild with `npm run dev`

## Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All external APIs accessible from production
- [ ] Database migrations applied (if applicable)

### Vercel Deployment

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

See [Vercel Documentation](https://vercel.com/docs) for more details.

## Getting Help

1. Check `ARCHITECTURE.md` for patterns and structure
2. Review existing components for examples
3. Check console for error messages
4. Ask team lead

---

**Need help?** Refer to `ARCHITECTURE.md` for detailed project guidelines.
