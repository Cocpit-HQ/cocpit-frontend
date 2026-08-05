import axios from "axios";
import { hardLogout } from "@/lib/logout";
import { env } from "@/config/env";
import { getHybridSession, setInMemorySession, clearInMemorySession } from "@/lib/session-cache";

export { setInMemorySession, clearInMemorySession, getHybridSession };

// Public API client (No Auth)
export const publicApi = axios.create({
  baseURL: env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authenticated API client
const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    const session = await getHybridSession(false);

    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }

    // Safeguard: If the session already has an error, don't proceed with authenticated requests
    if (session?.user?.error === "RefreshAccessTokenError" || session?.user?.error === "SESSION_INVALID") {
      console.warn(`[Axios] Blocking request due to session error: ${session.user.error}`);
      await hardLogout("session_ended");
      return Promise.reject(new Error("SESSION_INVALID"));
    }

    // Set Content-Type to JSON for all requests except for FormData.
    // For FormData, the browser will automatically set the correct Content-Type with the boundary.
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT treat 401 as session expiration if it is a password or credential validation failure
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "";
    const isCredentialError = typeof errorMessage === "string" && (
      errorMessage.toLowerCase().includes("password") ||
      errorMessage.toLowerCase().includes("google account") ||
      errorMessage.toLowerCase().includes("credentials")
    );

    if (isCredentialError) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. Detect deterministic SESSION_INVALID signal from backend
        if (error.response?.data?.error === "SESSION_INVALID") {
          console.error("Critical: Session revoked or invalidated. Triggering hard logout.");
          await hardLogout("session_ended");
          return Promise.reject(error);
        }

        // 2. Trigger a session update to refresh the token on the server
        const newSession = await getHybridSession(true);

        // 3. Check if refresh failed (indicated by error property or invalid session)
        if (newSession?.user?.error === "RefreshAccessTokenError" || !newSession?.user?.accessToken) {
          console.warn("Refresh token expired or missing. Logging out...");
          await hardLogout("session_ended");
          return Promise.reject(error);
        }

        // 4. Update the header with the new token
        const newToken = newSession.user.accessToken;
        const oldToken = originalRequest.headers.Authorization?.split(" ")[1];

        if (newToken === oldToken) {
          console.warn("Token refresh returned same token for 401 response. Session likely revoked. Logging out.");
          await hardLogout("session_ended");
          return Promise.reject(error);
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // 5. Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If anything goes wrong during refresh attempt, logout
        console.error("Exception during token refresh handling:", refreshError);
        await hardLogout("session_ended");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
