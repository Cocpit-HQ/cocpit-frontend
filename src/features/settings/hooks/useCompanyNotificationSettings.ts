"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface CompanyNotificationSettings {
  all: boolean;
  posts: boolean;
  jobs: boolean;
  messages: boolean;
  messageChats: boolean;
  messageJobs: boolean;
  emails: boolean;
}

const MOCK_SETTINGS: CompanyNotificationSettings = {
  all: true,
  posts: true,
  jobs: true,
  messages: true,
  messageChats: true,
  messageJobs: true,
  emails: true,
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock hook for company notification settings.
 * TODO: Replace mock with real API calls when backend is ready:
 *   GET  /organizations/:orgId/notification-preferences
 *   PUT  /organizations/:orgId/notification-preferences
 */
export function useCompanyNotificationSettings() {
  const [settings, setSettings] = useState<CompanyNotificationSettings>(MOCK_SETTINGS);
  const [isLoading] = useState(false);
  const [isError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSettings = useCallback(async (newSettings: CompanyNotificationSettings) => {
    setIsUpdating(true);
    // Optimistic update
    setSettings(newSettings);
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
