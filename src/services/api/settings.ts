import api from "@/lib/axios";

export interface NotificationPreferences {
  all: boolean;
  posts: boolean;
  jobs: boolean;
  messages: boolean;
  emails: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get("/user/notifications/preferences");
  return response.data;
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<{ success: boolean }> => {
  const response = await api.put("/user/notifications/preferences", preferences);
  return response.data;
};

// --- Privacy Settings ---

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  tagPermission: 'everyone' | 'connections' | 'followers' | 'noone';
}

export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  const response = await api.get("/user/privacy");
  return response.data;
};

export const updatePrivacySettings = async (
  settings: Partial<PrivacySettings>
): Promise<{ success: boolean }> => {
  const response = await api.put("/user/privacy", settings);
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
