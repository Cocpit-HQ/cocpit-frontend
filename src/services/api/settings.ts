import api from "@/lib/axios";

export interface NotificationPreferences {
  all: boolean;
  posts: boolean;
  jobs: boolean;
  messages: boolean;
  emails: boolean;
  // Organization specific fields mapping to DB:
  // messages_chat_enabled, messages_jobs_enabled
  messageChats?: boolean;
  messageJobs?: boolean;
}

const getActorHeaders = (companyId?: string) => {
  if (companyId) {
    return {
      "x-actor-type": "ORGANIZATION",
      "x-actor-id": companyId
    };
  }
  return {};
};

export const getNotificationPreferences = async (companyId?: string): Promise<NotificationPreferences> => {
  const response = await api.get("/settings/notifications", {
    headers: getActorHeaders(companyId)
  });
  // Map backend naming to frontend naming if necessary, assuming backend returns camelCase or we just use it directly
  return response.data;
};

export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>,
  companyId?: string
): Promise<{ success: boolean }> => {
  const response = await api.put("/settings/notifications", preferences, {
    headers: getActorHeaders(companyId)
  });
  return response.data;
};

// --- Privacy Settings ---

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  tagPermission: 'everyone' | 'connections' | 'followers' | 'noone' | 'followers_only' | 'no_one';
  // Organization specific fields:
  followingVisibility?: 'everyone' | 'followers_only' | 'no_one';
  followersVisibility?: 'everyone' | 'followers_only' | 'no_one';
  messagePermission?: 'everyone' | 'followers_only' | 'no_one';
}

export const getPrivacySettings = async (companyId?: string): Promise<PrivacySettings> => {
  const response = await api.get("/settings/privacy", {
    headers: getActorHeaders(companyId)
  });
  return response.data;
};

export const updatePrivacySettings = async (
  settings: Partial<PrivacySettings>,
  companyId?: string
): Promise<{ success: boolean }> => {
  const response = await api.put("/settings/privacy", settings, {
    headers: getActorHeaders(companyId)
  });
  return response.data;
};

// --- Active Sessions ---

export interface ActiveSession {
  id: string | number;
  type: 'phone' | 'laptop';
  device: string;
  location: string;
  createdAt: string;
  isCurrent: boolean;
}

export const getActiveSessions = async (): Promise<ActiveSession[]> => {
  const response = await api.get("/user/sessions");
  return response.data;
};

export const logoutSession = async (id: string | number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/user/sessions/${id}`);
  return response.data;
};

export const logoutOtherSessions = async (): Promise<{ success: boolean }> => {
  const response = await api.delete("/user/sessions/others");
  return response.data;
};

// --- Organization Specific Critical Actions ---

export const deactivateOrganization = async (orgId: string): Promise<{ success: boolean }> => {
  const response = await api.patch(`/organizations/${orgId}/deactivate`);
  return response.data;
};

export const reactivateOrganization = async (orgId: string): Promise<{ success: boolean }> => {
  const response = await api.patch(`/organizations/${orgId}/reactivate`);
  return response.data;
};

// --- Unified Deletion ---

export const requestAccountDeletionOtp = async (companyId?: string): Promise<{ success: boolean, message?: string }> => {
  const response = await api.post("/user/account/delete-otp", {}, {
    headers: getActorHeaders(companyId)
  });
  return response.data;
};

export const confirmAccountDeletion = async (otp: string, companyId?: string): Promise<{ success: boolean, message?: string }> => {
  const response = await api.delete("/user/account", {
    headers: getActorHeaders(companyId),
    data: { otp } // Delete requests require body to be passed via `data` config in Axios
  });
  return response.data;
};
