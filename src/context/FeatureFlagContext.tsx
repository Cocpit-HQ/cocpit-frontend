"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { publicApi } from "@/lib/axios";

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
  orgSettings: "enableOrganizationsModule",
  enableOrgSettings: "enableOrganizationsModule",
  enableOrgSettingsModule: "enableOrganizationsModule",
  orgAnalytics: "enableOrganizationsModule",
  enableOrgAnalytics: "enableOrganizationsModule",
  enableOrgAnalyticsModule: "enableOrganizationsModule",
  orgNotifications: "enableOrganizationsModule",
  enableOrgNotifications: "enableOrganizationsModule",
  enableOrgNotificationsModule: "enableOrganizationsModule",

  // Teams Sub-features -> Teams Parent Module
  teams: "enableTeamsModule",
  enableTeams: "enableTeamsModule",
  enableTeamsModule: "enableTeamsModule",
  enableTeamManagement: "enableTeamsModule",
  team_management: "enableTeamsModule",
  enable_teams: "enableTeamsModule",
  enable_teams_module: "enableTeamsModule",

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
  enableNotifications: "enableNotificationsModule",
  enableNotificationsModule: "enableNotificationsModule",
  enable_notifications: "enableNotificationsModule",
  enable_notifications_module: "enableNotificationsModule",

  // Auth & Onboarding Sub-features
  auth: "enableAuthModule",
  enableAuthModule: "enableAuthModule",
  onboarding: "enableOnboardingModule",
  enableOnboardingModule: "enableOnboardingModule",
};

const NOTIFICATION_KEYS = new Set([
  "notifications",
  "enableNotifications",
  "enableNotificationsModule",
  "enable_notifications",
  "enable_notifications_module",
]);

const TEAMS_KEYS = new Set([
  "teams",
  "enableTeams",
  "enableTeamsModule",
  "enable_teams",
  "enable_teams_module",
  "team_management",
  "enableTeamManagement",
]);

const ORG_SETTINGS_KEYS = new Set([
  "orgSettings",
  "enableOrgSettings",
  "enableOrgSettingsModule",
  "org_settings",
  "enable_org_settings",
  "enable_org_settings_module",
]);

const ORG_ANALYTICS_KEYS = new Set([
  "orgAnalytics",
  "enableOrgAnalytics",
  "enableOrgAnalyticsModule",
  "org_analytics",
  "enable_org_analytics",
  "enable_org_analytics_module",
]);

const ORG_NOTIFICATIONS_KEYS = new Set([
  "orgNotifications",
  "enableOrgNotifications",
  "enableOrgNotificationsModule",
  "org_notifications",
  "enable_org_notifications",
  "enable_org_notifications_module",
]);

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
    console.log("🚩 [FeatureFlags] fetchFlags called!");
    try {
      const response = await publicApi.get('/config');
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
    // Special handling for notifications aliases: if any notification flag is false, disable
    if (NOTIFICATION_KEYS.has(flagKey)) {
      for (const k of NOTIFICATION_KEYS) {
        if (isValueFalse(flags[k])) {
          return false;
        }
      }
    }

    // Special handling for teams aliases: if any teams flag is false, disable
    if (TEAMS_KEYS.has(flagKey)) {
      for (const k of TEAMS_KEYS) {
        if (isValueFalse(flags[k])) {
          return false;
        }
      }
    }

    // Special handling for org settings aliases: if any org settings flag is false, disable
    if (ORG_SETTINGS_KEYS.has(flagKey)) {
      for (const k of ORG_SETTINGS_KEYS) {
        if (isValueFalse(flags[k])) {
          return false;
        }
      }
    }

    // Special handling for org analytics aliases: if any org analytics flag is false, disable
    if (ORG_ANALYTICS_KEYS.has(flagKey)) {
      for (const k of ORG_ANALYTICS_KEYS) {
        if (isValueFalse(flags[k])) {
          return false;
        }
      }
    }

    // Special handling for org notifications aliases: if any org notifications flag is false, disable
    if (ORG_NOTIFICATIONS_KEYS.has(flagKey)) {
      for (const k of ORG_NOTIFICATIONS_KEYS) {
        if (isValueFalse(flags[k])) {
          return false;
        }
      }
    }

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
