import api from "@/lib/axios";
import { Notification } from "@/types/social";

export const getNotifications = async (orgId?: string): Promise<Notification[]> => {
    try {
        const params = orgId ? { orgId, companyId: orgId } : {};
        const response = await api.get("/notifications", { params });
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 403) {
            return [];
        }
        throw error;
    }
};

export const markNotificationAsRead = async (id: string, orgId?: string) => {
    try {
        const payload = orgId ? { orgId, companyId: orgId } : {};
        const response = await api.patch(`/notifications/${id}/read`, payload);
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const markAllNotificationsRead = async (orgId?: string) => {
    const params = orgId ? { orgId, companyId: orgId } : {};
    const response = await api.patch("/notifications/read-all", {}, { params });
    return response.data;
};

export const deleteNotification = async (id: string, orgId?: string) => {
    const params = orgId ? { orgId, companyId: orgId } : {};
    const response = await api.delete(`/notifications/${id}`, { params });
    return response.data;
};

export const deleteNotifications = async (ids: string[], orgId?: string, tab?: string) => {
    const response = await api.delete(`/notifications/bulk`, { data: { ids, orgId, companyId: orgId, tab } });
    return response.data;
};
