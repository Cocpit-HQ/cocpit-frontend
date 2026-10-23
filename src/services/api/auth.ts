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
    viewer_role_data?: { name: string; permissions: string[]; priority: number; is_owner?: boolean; color?: string; description?: string } | null;
  };
  organizations: Array<Company & {
    role?: string;
    viewer_role_data?: { name: string; permissions: string[]; priority: number; is_owner?: boolean; color?: string; description?: string } | null;
  }>;
  source: "default_user" | "cookie" | "explicit_user" | "explicit_organization";
}

// 1. Request OTP (Public)
export const requestOTP = async (
  email: string,
  purpose: "signup" | "password_reset" = "signup",
  isResend: boolean = false
) => {
  const response = await publicApi.post("/auth/request-otp", { email, purpose, isResend });
  return response.data;
};

// 1.5 Verify OTP (Public - Check only)
export const verifyOTP = async (email: string, otp: string, purpose: string = "signup") => {
  const response = await publicApi.post("/auth/verify-otp", { email, otp, purpose });
  return response.data;
};

// 1.75 Cancel OTP (Public)
export const cancelOTP = async (email: string, purpose: string = "signup") => {
  const response = await publicApi.post("/auth/cancel-otp", { email, purpose });
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

export const resetPassword = async (
  email: string,
  newPassword: string,
  otp: string,
  logoutOtherDevices?: boolean
) => {
  const response = await publicApi.post("/auth/reset-password", {
    email,
    newPassword,
    otp,
    ...(typeof logoutOtherDevices === "boolean"
      ? { logoutOtherDevices, logoutOthers: logoutOtherDevices }
      : {}),
  });
  return response.data;
};

export const requestPasswordResetLink = async () => {
  const response = await api.post("/auth/forgot-password-link");
  return response.data;
};

export const verifyResetToken = async (token: string) => {
  const response = await publicApi.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
  return response.data;
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string,
  logoutOtherDevices?: boolean
) => {
  const response = await publicApi.post("/auth/reset-password-token", {
    token,
    newPassword,
    ...(typeof logoutOtherDevices === "boolean"
      ? { logoutOtherDevices, logoutOthers: logoutOtherDevices }
      : {}),
  });
  return response.data;
};

export const getResetLinkStatus = async () => {
  const response = await api.get("/auth/reset-link-status");
  return response.data as { hasActiveLink: boolean; remainingSeconds: number };
};

export const validateResetPassword = async (payload: {
  email?: string;
  token?: string;
  password: string;
}) => {
  const response = await publicApi.post("/auth/validate-password", payload);
  return response.data as { isSamePassword: boolean; message?: string };
};

