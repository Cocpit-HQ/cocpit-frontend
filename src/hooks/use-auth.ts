/**
 * useAuth Hook
 * Manage authentication state and actions
 */

"use client";

import { useCallback, useState } from "react";
import { authService, type LoginRequest, type SignupRequest } from "@/lib/api/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types/entities";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);
  const { toast } = useToast();

  const login = useCallback(async (data: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.login(data);
      const payload = response.data;
      if (response.success && payload) {
        setState((prev) => ({
          ...prev,
          user: payload.user,
          isAuthenticated: true,
          isLoading: false,
        }));
        // Store token
        if (payload.token) localStorage.setItem("authToken", payload.token);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || "Login failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const signup = useCallback(async (data: SignupRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.signup(data);
      const payload = response.data;
      if (response.success && payload) {
        setState((prev) => ({
          ...prev,
          user: payload.user,
          isAuthenticated: true,
          isLoading: false,
        }));
        if (payload.token) localStorage.setItem("authToken", payload.token);
        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || "Signup failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
      setState(initialState);
      localStorage.removeItem("authToken");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      const errorMessage = error?.error?.message || "Logout failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  return {
    ...state,
    login,
    signup,
    logout,
  };
}
