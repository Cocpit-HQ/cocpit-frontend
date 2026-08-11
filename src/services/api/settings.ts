import api from "@/lib/axios";

export interface NotificationPreferences {
  all: boolean;
  posts: boolean;
  jobs: boolean;
  messages: boolean;
  emails: boolean;
  push: boolean;
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
  const prefs = response.data?.preferences || response.data || {};
  return {
    all: prefs.all_notifications ?? prefs.all ?? true,
    posts: prefs.post_notifications ?? prefs.posts ?? true,
    jobs: prefs.job_alerts ?? prefs.jobs ?? true,
    messages: prefs.message_notifications ?? prefs.messages ?? true,
    emails: prefs.email_notifications ?? prefs.emails ?? true,
    push: prefs.push_notifications ?? prefs.push ?? true,
    messageChats: prefs.messages_chat_enabled ?? prefs.messageChats ?? true,
    messageJobs: prefs.messages_jobs_enabled ?? prefs.messageJobs ?? true,
  };
};

export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>,
  companyId?: string
): Promise<{ success: boolean }> => {
  const payload: Record<string, any> = {};
  if (preferences.all !== undefined) payload.all_notifications = preferences.all;
  if (preferences.posts !== undefined) payload.post_notifications = preferences.posts;
  if (preferences.jobs !== undefined) payload.job_alerts = preferences.jobs;
  if (preferences.messages !== undefined) payload.message_notifications = preferences.messages;
  if (preferences.emails !== undefined) payload.email_notifications = preferences.emails;
  if (preferences.push !== undefined) payload.push_notifications = preferences.push;
  if (preferences.messageChats !== undefined) payload.messages_chat_enabled = preferences.messageChats;
  if (preferences.messageJobs !== undefined) payload.messages_jobs_enabled = preferences.messageJobs;

  const response = await api.put("/settings/notifications", payload, {
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
  const raw = response.data?.privacy || response.data || {};
  return {
    showEmail: raw.showEmail ?? raw.show_email ?? false,
    showPhone: raw.showPhone ?? raw.show_phone ?? false,
    tagPermission: raw.tagPermission ?? raw.tag_permission ?? 'everyone',
    followingVisibility: raw.followingVisibility ?? raw.following_visibility ?? 'everyone',
    followersVisibility: raw.followersVisibility ?? raw.followers_visibility ?? 'everyone',
    messagePermission: raw.messagePermission ?? raw.message_permission ?? 'everyone',
  };
};

export const updatePrivacySettings = async (
  settings: Partial<PrivacySettings>,
  companyId?: string
): Promise<{ success: boolean }> => {
  const payload = {
    ...settings,
    show_email: settings.showEmail,
    show_phone: settings.showPhone,
    tag_permission: settings.tagPermission,
    following_visibility: settings.followingVisibility,
    followers_visibility: settings.followersVisibility,
    message_permission: settings.messagePermission,
  };
  const response = await api.put("/settings/privacy", payload, {
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

export const sendDeactivateOrgOTP = async (orgId: string): Promise<{ success: boolean; email_masked?: string; cooldown_seconds?: number }> => {
  const response = await api.post(`/organizations/${orgId}/deactivate/send-otp`);
  return response.data;
};

export const validateDeactivateOrgOTP = async (orgId: string, otp: string): Promise<{ success: boolean }> => {
  const response = await api.post(`/organizations/${orgId}/deactivate/validate-otp`, { otp });
  return response.data;
};

export const deactivateOrganization = async (orgId: string, otp?: string): Promise<{ success: boolean }> => {
  const response = await api.patch(`/organizations/${orgId}/deactivate`, { otp });
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


// --- Identity Verification ---

export const verifyIdentity = async (
  formData: FormData,
  companyId?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/settings/account/verify-identity", formData, {
    headers: {
      ...getActorHeaders(companyId),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
