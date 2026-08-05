"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export type PermissionOption = "everyone" | "connections" | "followers" | "noone";
export type VisibilityOption = "everyone" | "followers" | "noone";

export interface CompanyPrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  tagPermission: PermissionOption;
  followingVisibility: VisibilityOption;
  followersVisibility: VisibilityOption;
  messagePermission: VisibilityOption;
}

const MOCK_SETTINGS: CompanyPrivacySettings = {
  showEmail: true,
  showPhone: true,
  tagPermission: "everyone",
  followingVisibility: "everyone",
  followersVisibility: "everyone",
  messagePermission: "everyone",
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock hook for company privacy settings.
 * TODO: Replace mock with real API calls when backend is ready:
 *   GET  /organizations/:orgId/privacy
 *   PUT  /organizations/:orgId/privacy
 */
export function useCompanyPrivacySettings() {
  const [settings, setSettings] = useState<CompanyPrivacySettings>(MOCK_SETTINGS);
  const [isLoading] = useState(false);
  const [isError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSettings = useCallback(async (partial: Partial<CompanyPrivacySettings>) => {
    setIsUpdating(true);
    // Optimistic update
    setSettings((prev) => ({ ...prev, ...partial }));
    await delay(300);
    setIsUpdating(false);
  }, []);

  return {
    settings,
    isLoading,
    isError,
    updateSettings,
    isUpdating,
  };
}
