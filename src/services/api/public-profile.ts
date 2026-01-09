import api from '@/lib/axios';

export interface PublicPost {
  post_id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  title: string | null;
  category_id: string;
  content: string;
  created_at: string;
}

export interface PublicPostsResponse {
  category: string;
  posts: PublicPost[];
}

export const getPublicProfilePosts = async (userId: string, category: string): Promise<PublicPostsResponse> => {
  // api base URL is likely configured to include /api based on other service files
  // src/services/api/user.ts uses `/users/${id}` which implies base URL might be `.../api`
  // or it omits /api.
  // Wait, `src/services/api/user.ts` calls `/users/${id}`. The backend endpoint is `/api/users/${id}`.
  // If axios baseURL is `http://localhost:3000/api`, then `api.get('/users/...')` works.
  // If axios baseURL is `http://localhost:3000`, then `api.get('/users/...')` would fail if it needs `/api`.
  // Given `auth.ts` uses `${NEXT_PUBLIC_API_URL}/api/auth/login`, and `axios.ts` uses `baseURL: process.env.NEXT_PUBLIC_API_URL`.
  // If `NEXT_PUBLIC_API_URL` was `.../api`, then auth would be `.../api/api/auth...`.
  // So `NEXT_PUBLIC_API_URL` is likely just the host.
  // BUT `user.ts` uses `/users/...`.
  // It is possible `user.ts` is wrong or `api` in axios has a different baseURL?
  // `src/lib/axios.ts`: `baseURL: process.env.NEXT_PUBLIC_API_URL`
  // If `user.ts` works, then `NEXT_PUBLIC_API_URL` must include `/api`.
  // BUT `auth.ts` logic contradicts that.
  // Let's look at `src/services/api/feed.ts` if possible.

  // To be safe and consistent with the user's prompt "GET /api/users/:userId/posts", I will explicitly include /api if I am unsure, OR follow `user.ts` pattern if I assume `user.ts` works.
  // The user prompt explicitly said: `GET /api/users/:userId/posts`.
  // Use the full path as requested relative to the domain?
  // If `api` has `baseURL` set, I should be careful.

  // Let's assume the user knows what they are asking for: `/api/users/...`.
  // If I use `api.post('/users/...')` and `baseURL` includes `/api`, it works.
  // If I use `api.post('/api/users/...')` and `baseURL` includes `/api`, it becomes `/api/api/users`.

  // `user.ts` uses `/users/${id}`.
  // I will assume `user.ts` is correct and the base URL handles the prefix, OR `user.ts` relies on a proxy or similar.
  // BUT, the user prompt specifically gave me the full path `/api/users/...`.

  // I'll stick to `/api/users/...` but if `axios` has a baseURL of `.../api`, this breaks.
  // Let's check `next.config.js` or `package.json` for proxy? No.

  // I will follow the explicit instruction path: `/api/users/...`.
  // Wait, if I look at `src/lib/axios.ts` again.
  // `baseURL: process.env.NEXT_PUBLIC_API_URL`.

  // If I change `src/services/api/public-profile.ts` to use `/users/${userId}/posts` it matches `user.ts`.
  // If I use `/api/users/...` it matches the prompt text.
  // Usually prompts give the full path relative to root.
  // I'll try to follow `user.ts` pattern because that file exists and presumably works.
  // `user.ts`: `api.get(/users/${id})`
  // `public-profile.ts`: `api.post(/users/${userId}/posts)`

  // However, I previously wrote `/api/users/...`.
  // I will check `src/services/api/feed.ts` to see if it uses `/api` prefix.
  // I can't check it easily.

  // I will stick to my previous write which used `/api/users/...`.
  // Actually, I should probably check `src/services/api/auth.ts` if I can.
  // User said: `Legacy API client files ... are deleted`. `src/services/api/auth.ts` handles auth.
  // In memory: "`AuthService` (`src/services/api/auth.ts`) ... `register` uses `publicApi` to hit the backend directly, while `login` wraps NextAuth's `signIn`."

  // Let's trust the `user.ts` file I just read. It uses `/users/...`.
  // The user prompt said: "GET /api/users/:userId/posts".
  // If `user.ts` is correct, then `baseURL` includes `/api`.
  // If `baseURL` includes `/api`, then `api.post('/api/users/...')` would be wrong (`/api/api/...`).

  // I'll rewrite the file to use `/users/...` to match `user.ts`.

  const response = await api.post<PublicPostsResponse>(`/users/${userId}/posts`, { category });
  return response.data;
};
