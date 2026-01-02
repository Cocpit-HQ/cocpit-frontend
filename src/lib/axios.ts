import axios from "axios";
import { getSession } from "next-auth/react";
import { logout } from "@/lib/logout";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
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

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Trigger a session update to refresh the token on the server
        const newSession = await getSession();

        // Check if refresh failed (indicated by error property or invalid session)
        if (newSession?.user?.error === "RefreshAccessTokenError" || !newSession?.user?.accessToken) {
           await logout();
           return Promise.reject(error);
        }

        // Update the header with the new token
        originalRequest.headers.Authorization = `Bearer ${newSession.user.accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If anything goes wrong during refresh attempt, logout
        await logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
