/**
 * useAuth Hook
 * Manage authentication state and actions
 */

"use client";

import { useCallback, useState } from "react";
import { login, logout, register } from "@/services/api/auth";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const handleLogin = useCallback(async (data: Record<string, string>) => {
    try {
      await login(data);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const handleSignup = useCallback(async (data: any) => {
    try {
      await register(data);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };
}
