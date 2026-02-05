import { signIn } from "next-auth/react";
import api, { publicApi } from "@/lib/axios";
import { logout as libLogout } from "@/lib/logout";
import { z } from "zod";
import { registrationSchema } from "@/lib/validators";

// 1. Register (Public)
export const register = async (userData: z.infer<typeof registrationSchema>) => {
  const response = await publicApi.post("/auth/register", userData);
  return response.data;
};

// 2. Login (NextAuth)
export const login = async (credentials: Record<string, string>) => {
  const result = await signIn("credentials", {
    redirect: false,
    ...credentials,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  return result;
};

export const logout = async () => {
  await libLogout();
};

// --- Session Management ---

export const getSessions = async () => {
  const response = await api.get("/auth/sessions");
  return response.data;
};

export const logoutSession = async (sessionId: string, password?: string) => {
  const response = await api.delete(`/auth/sessions/${sessionId}`, {
    data: { password }
  });
  return response.data;
};

export const logoutAllOtherSessions = async (password?: string) => {
  const response = await api.delete("/auth/sessions", {
    data: { password }
  });
  return response.data;
};
