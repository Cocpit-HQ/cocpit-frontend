import api from "@/lib/axios";

export interface DashboardStats {
  overview: {
    totalViews: number;
    searchAppearances: number;
    totalConnections: number;
    totalImpressions: number;
  };
}

export interface ProfileViewCountResponse {
  profileOwnerId: string;
  profileType: string;
  totalViews: number;
}

/**
 * Get dashboard statistics for the current actor
 */
export const getDashboardStats = async (actorId?: string, actorType?: 'user' | 'organization'): Promise<DashboardStats> => {
  const headers: Record<string, string> = {};
  if (actorId && actorType) {
    headers["x-actor-id"] = actorId;
    headers["x-actor-type"] = actorType;
  }

  const response = await api.get("/dashboard/stats", { headers });
  return response.data.data;
};

/**
 * Record a profile view
 */
export const recordProfileView = async (profileOwnerId: string, profileType: 'user' | 'organization'): Promise<void> => {
  await api.post("/dashboard/view", { profileOwnerId, profileType });
};

/**
 * Get profile view count for a specific profile
 */
export const getProfileViewCount = async (profileOwnerId: string, profileType: string): Promise<ProfileViewCountResponse> => {
  const response = await api.get(`/dashboard/${profileType}/${profileOwnerId}/views`);
  return response.data.data;
};
