/**
 * Authentication Service
 * API calls related to user authentication
 */

import { apiClient, type ApiResponse } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { logout as nextAuthLogout } from "../../logout";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: any;
}

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
  },

  signup: async (data: SignupRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
  },

  logout: async (): Promise<void> => {
    await nextAuthLogout();
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },

  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  },

  resendVerification: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<void>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
  },
};
