import api from "@/lib/axios";
import { Connection, ConnectionRequest, Follower, Following } from "@/types/social";

// --- Follows ---

export const followUser = async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
};

export const unfollowUser = async (userId: string) => {
    const response = await api.delete(`/users/${userId}/unfollow`);
    return response.data;
};

export const getFollowers = async (userId: string): Promise<Follower[]> => {
    const response = await api.get(`/users/${userId}/followers`);
    return response.data.followers; // Backend often wraps in { followers: [...] }
};

export const getFollowersCount = async (userId: string): Promise<{ count: number }> => {
    const response = await api.get(`/users/${userId}/followers/count`);
    return response.data;
};

// --- Connections ---

export const sendConnectionRequest = async (userId: string) => {
    const response = await api.post(`/users/${userId}/connect`);
    return response.data;
};

export const getPendingRequests = async (): Promise<ConnectionRequest[]> => {
    const response = await api.get("/connections/requests");
    return response.data; // Ensure backend returns array directly or adjust
};

export const handleConnectionRequest = async (requestId: string, action: 'accept' | 'reject') => {
    const response = await api.patch(`/connections/${requestId}`, { status: action });
    return response.data;
};

export const getMyConnections = async (): Promise<Connection[]> => {
    const response = await api.get("/my/connections");
    return response.data;
};

export const removeConnection = async (userId: string) => {
    const response = await api.delete(`/connections/user/${userId}`);
    return response.data;
};

export const cancelConnectionRequest = async (requestId: string) => {
    const response = await api.delete(`/connections/${requestId}`);
    return response.data;
};

export const getConnectionCount = async (userId: string): Promise<{ count: number }> => {
    const response = await api.get(`/users/${userId}/connections/count`);
    return response.data;
};
