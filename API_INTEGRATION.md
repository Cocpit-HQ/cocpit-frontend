# API Integration Guide

This document outlines the standard practices for API integration in the project.

## 1. Overview

The project distinguishes clearly between **Real API** interactions and **Mock Data**.

*   **Real API**: Interactions that communicate with the backend server.
*   **Mock Data**: Static data or fake async functions used for UI development and testing when the backend is not ready.

## 2. Folder Structure

### `src/services/api/` (REAL)
Contains modules that interact with the real backend.
*   **Purpose**: Single source of truth for backend communication.
*   **Rules**:
    *   Must use the configured `axios` instances.
    *   Must NOT return hardcoded static data (unless explicitly temporary).

### `src/services/mock/` (MOCK)
Contains mock data and fake API functions.
*   **Purpose**: Enable UI development without backend dependencies.
*   **Rules**:
    *   Must NEVER hit the real backend.
    *   Should match the expected shape of real API responses.

### `src/lib/axios.ts`
Configuration for the Axios HTTP client.
*   **Exports**:
    *   `default` (authenticated): Automatically attaches `Authorization: Bearer <token>` from the NextAuth session. Handles 401 token refresh.
    *   `publicApi` (unauthenticated): For public endpoints like `register`, `login`.

### `src/lib/auth.ts`
NextAuth configuration. Handles the session strategy, JWT callbacks, and provider setup.

## 3. Authentication Flow

1.  **Register**:
    *   User submits form.
    *   Frontend calls `register(data)` from `src/services/api/auth.ts`.
    *   Service uses `publicApi` to POST to `/auth/register`.
2.  **Login**:
    *   User submits credentials.
    *   Frontend calls `login(credentials)` from `src/services/api/auth.ts`.
    *   Service calls NextAuth `signIn`.
    *   NextAuth calls Backend `/auth/login`.
    *   Backend returns Access & Refresh tokens.
    *   NextAuth stores tokens in HttpOnly cookie (encrypted JWT).
3.  **Session Usage**:
    *   `useSession()` in components provides access to user profile.
    *   `src/lib/axios.ts` interceptor reads the session and attaches the Access Token to requests.
4.  **Token Refresh**:
    *   If Backend returns 401, `src/lib/axios.ts` attempts to refresh the token via server-side session update.
    *   If refresh fails, user is logged out.
5.  **Logout**:
    *   Frontend calls `logout()`.
    *   Service calls Backend `/auth/logout` (to invalidate token) AND NextAuth `signOut` (to clear browser session).

## 4. Token Handling

*   **Storage**: Tokens are stored securely in HttpOnly cookies managed by NextAuth.
*   **Access**:
    *   **Client-side**: `useSession()` hook (does NOT expose refresh token).
    *   **Server-side**: `getServerSession(authOptions)`.
*   **DO NOT**: Store tokens in `localStorage`.

## 5. Axios Strategy

Always import from `@/lib/axios`.

```typescript
import api, { publicApi } from "@/lib/axios";

// Authenticated Request (Default)
const getUser = () => api.get("/users/me");

// Public Request
const register = (data) => publicApi.post("/auth/register", data);
```

## 6. Common Mistakes to Avoid

*   ❌ **Using `localStorage` for auth**: Do not read/write tokens manually.
*   ❌ **Creating new Axios instances**: Always use the shared instances in `src/lib/axios.ts`.
*   ❌ **Mixing Real and Mock**: Do not import `src/services/mock` inside `src/services/api`.
*   ❌ **Bypassing Services**: Do not call `api.get` directly in components. Create a function in `src/services/api/` and import that.

## 7. How to Add a New API

1.  **Identify the Domain**: E.g., `jobs`, `events`.
2.  **Create Service File**: `src/services/api/jobs.ts`.
3.  **Define Functions**:
    ```typescript
    import api from "@/lib/axios";

    export const getJobs = async () => {
      const response = await api.get("/jobs");
      return response.data;
    };
    ```
4.  **Use in Component**:
    ```typescript
    import { getJobs } from "@/services/api/jobs";
    // ... inside useEffect or useQuery
    ```
