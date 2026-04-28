import { signIn } from "next-auth/react";
import api, { publicApi } from "@/lib/axios";
import { logout as libLogout } from "@/lib/logout";
import { z } from "zod";
import { registrationSchema } from "@/lib/validators";
import { Company } from "@/services/organization.service";

export interface ActorContextResponse {
  actor: {
    type: "USER" | "ORGANIZATION";
    id: string;
    slug?: string;
    name?: string;
    avatar_url?: string;
    entity_type?: "COMPANY" | "INSTITUTION";
    viewer_role_data?: { name: string; permissions: string[]; priority: number } | null;
  };
  organizations: Array<Company & {
    role?: string;
    viewer_role_data?: { name: string; permissions: string[]; priority: number } | null;
  }>;
  source: "default_user" | "cookie" | "explicit_user" | "explicit_organization";
}

// 1. Request OTP (Public)
export const requestOTP = async (email: string, purpose: "signup" | "password_reset" = "signup") => {
  const response = await publicApi.post("/auth/request-otp", { email, purpose });
  return response.data;
};

// 1.5 Verify OTP (Public - Check only)
export const verifyOTP = async (email: string, otp: string) => {
  const response = await publicApi.post("/auth/verify-otp", { email, otp });
  return response.data;
};

// 2. Register (Public)
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

// 3. Google Login (Public — sends idToken to backend for verification)
export const loginWithGoogle = async (idToken: string, accountType?: string) => {
  const response = await publicApi.post("/auth/google", {
    idToken,
    ...(accountType ? { accountType } : {}),
  });
  return response.data;
};

export const logout = async () => {
  await libLogout();
};

export const getActorContext = async (): Promise<ActorContextResponse> => {
  const response = await api.get("/auth/actor-context", {
    withCredentials: true,
  });
  return response.data;
};

export const setActorContext = async (payload: {
  type: "USER" | "ORGANIZATION";
  id?: string;
}): Promise<ActorContextResponse> => {
  const response = await api.post("/auth/actor-context", payload, {
    withCredentials: true,
  });
  return response.data;
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

// --- Password Reset ---

export const resetPassword = async (email: string, newPassword: string, otp: string) => {
  const response = await publicApi.post("/auth/reset-password", {
    email,
    newPassword,
    otp
  });
  return response.data;
};

