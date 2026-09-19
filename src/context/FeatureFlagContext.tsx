"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";

type FeatureFlags = Record<string, boolean>;

const MODULE_DEPENDENCY_MAP: Record<string, string> = {
  // Jobs Sub-features -> Jobs Parent Module
  saved_jobs: "enableJobsModule",
  enableSavedJobs: "enableJobsModule",
  enableJobApplications: "enableJobsModule",
  enableApplicationTracking: "enableJobsModule",
  enableJobOffers: "enableJobsModule",
  enableMyListings: "enableJobsModule",
  enableJobCreation: "enableJobsModule",
  enableAiJobDescription: "enableJobsModule",
  jobs_board: "enableJobsModule",
  enableJobsBoard: "enableJobsModule",

  // Feed Sub-features -> Feed Parent Module
  enablePostCreation: "enableFeedModule",
  enableFeedPostInteractions: "enableFeedModule",
  channel_thoughts_enabled: "enableFeedModule",
  enableTrendingNow: "enableFeedModule",
  enablePostReporting: "enableFeedModule",
  enableNotInterested: "enableFeedModule",
  enableAiPostEnhancement: "enableFeedModule",
  enableMediaUploads: "enableFeedModule",
  feed_access: "enableFeedModule",
  enableFeedAccess: "enableFeedModule",

  // Networking Sub-features -> Networking Parent Module
  enableConnectionSuggestions: "enableNetworkingModule",
  enableConnectionManagement: "enableNetworkingModule",
  enableUserFollowing: "enableNetworkingModule",
  connections_tab: "enableNetworkingModule",
  enableConnectionsTab: "enableNetworkingModule",

  // Messaging Sub-features -> Messaging Parent Module
  enableMessageRequests: "enableMessagingModule",
  enableNewChatCreation: "enableMessagingModule",
  enableGroupChats: "enableMessagingModule",
  messaging: "enableMessagingModule",
  enableMessaging: "enableMessagingModule",

  // Profile Sub-features -> Profile Parent Module
  enableProfileEditing: "enableProfileModule",
  enableResumeParsing: "enableProfileModule",
  enableCoverImageUpload: "enableProfileModule",
  enableProfileSkills: "enableProfileModule",
  enableProfileEducation: "enableProfileModule",
  enableProfileExperience: "enableProfileModule",
  enableContactInfo: "enableProfileModule",
  enableProfileSharing: "enableProfileModule",
  enableLivingResumeDownload: "enableProfileModule",
  profile_tab: "enableProfileModule",
  enableProfileTab: "enableProfileModule",

  // AI Sub-features -> AI Parent Module
  enableAIChatHistory: "enableAIModule",
  enableAIProjects: "enableAIModule",
  ai_tab: "enableAIModule",
  enableAITab: "enableAIModule",

  // Organizations Sub-features -> Organizations Parent Module
  enableOrgCreation: "enableOrganizationsModule",
  enableOrganizations: "enableOrganizationsModule",

  // Search Sub-features
  global_search: "enableGlobalSearch",
  enableGlobalSearch: "enableGlobalSearch",

  // Analytics Sub-features
  analytics_tab: "enableAnalyticsModule",
  enableAnalyticsTab: "enableAnalyticsModule",

  // Settings & Privacy Sub-features
  settings_privacy: "enableSettingsModule",
  enableSettingsModule: "enableSettingsModule",

  // Notifications Sub-features
  notifications: "enableNotificationsModule",
  enableNotificationsModule: "enableNotificationsModule",

  // Auth & Onboarding Sub-features
  auth: "enableAuthModule",
  enableAuthModule: "enableAuthModule",
  onboarding: "enableOnboardingModule",
  enableOnboardingModule: "enableOnboardingModule",
};

interface FeatureFlagContextProps {
  flags: FeatureFlags;
  isLoading: boolean;
  error: string | null;
  isFeatureActive: (flagKey: string) => boolean;
  refreshFlags: () => Promise<void>;
  handleRealtimeUpdate: (updatedFlags: FeatureFlags) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextProps>({
  flags: {},
  isLoading: true,
  error: null,
  isFeatureActive: () => true,
  refreshFlags: async () => {},
  handleRealtimeUpdate: () => {},
});

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const response = await api.get('/config');
      const data = response.data;
      if (data && data.features) {
        console.log("🚩 [FeatureFlags] Loaded flags:", data.features);
        setFlags(data.features);
        setError(null);
      }
    } catch (err: any) {
      console.error("🚩 [FeatureFlags] Failed to fetch feature flags:", err);
      setError(err.message || "Failed to load config");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRealtimeUpdate = useCallback((updatedFlags: FeatureFlags) => {
    console.log("🚩 [FeatureFlags] Received real-time flag update:", updatedFlags);
    setFlags(prevFlags => ({
      ...prevFlags,
      ...updatedFlags
    }));
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isValueFalse = (val: any): boolean => {
    return val === false || val === "false" || val === 0 || val === "0";
  };

  const isFeatureActive = useCallback((flagKey: string): boolean => {
    // 1. Check parent module dependency
    const parentModule = MODULE_DEPENDENCY_MAP[flagKey];
    if (parentModule) {
      const parentSnake = parentModule.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (
        isValueFalse(flags[parentModule]) ||
        isValueFalse(flags[parentModule.toLowerCase()]) ||
        isValueFalse(flags[parentSnake])
      ) {
        return false;
      }
    }

    // 2. Check explicit flag key (camelCase, lowerCase, snake_case)
    const childSnake = flagKey.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (
      isValueFalse(flags[flagKey]) ||
      isValueFalse(flags[flagKey.toLowerCase()]) ||
      isValueFalse(flags[childSnake])
    ) {
      return false;
    }

    return true;
  }, [flags]);

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, error, isFeatureActive, refreshFlags: fetchFlags, handleRealtimeUpdate }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);
