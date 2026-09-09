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

export const removeFollower = async (followerId: string) => {
    const response = await api.delete(`/users/followers/${followerId}`);
    return response.data;
};

export const followCompany = async (orgId: string) => {
    const response = await api.post(`/organizations/${orgId}/follow`);
    return response.data;
};

export const getFollowers = async (userId: string, search?: string): Promise<Follower[]> => {
    const params = search ? { search } : {};
    const response = await api.get(`/users/${userId}/followers`, { params });
    return response.data;
};

export const getFollowing = async (userId: string, search?: string): Promise<Following[]> => {
    const params = search ? { search } : {};
    const response = await api.get(`/users/${userId}/following`, { params });
    return response.data;
};

export const getFollowersCount = async (userId: string): Promise<{ count: number }> => {
    const response = await api.get(`/users/${userId}/followers/count`);
    return response.data;
};

// --- Connections ---

export const sendConnectionRequest = async (userId: string, message?: string) => {
    const response = await api.post(`/users/${userId}/connect`, { message });
    return response.data;
};

export const getRelationshipStatus = async (userId: string) => {
    const response = await api.get(`/users/${userId}/relationship`);
    return response.data;
};

export const getPendingRequests = async (): Promise<ConnectionRequest[]> => {
    const response = await api.get("/connections/requests");
    return response.data;
};

export const getConnectionRequestHistory = async (): Promise<ConnectionRequest[]> => {
    const response = await api.get("/connections/history");
    return response.data;
};

export const handleConnectionRequest = async (requestId: string, status: 'connected' | 'rejected' | 'blocked') => {
    const response = await api.patch(`/connections/${requestId}`, { status });
    return response.data;
};

export const getMyConnections = async (search?: string): Promise<Connection[]> => {
    const params = search ? { search } : {};
    const response = await api.get("/my/connections", { params });
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

export const getProfileStats = async (userId: string): Promise<{ followers_count: number; following_count: number; connections_count: number }> => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
};
