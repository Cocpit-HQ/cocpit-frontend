import api from "@/lib/axios";
import { Notification } from "@/types/social";

export const getNotifications = async (companyId?: string): Promise<Notification[]> => {
    try {
        const params = companyId ? { companyId } : {};
        const response = await api.get("/notifications", { params });
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 403) {
            return [];
        }
        throw error;
    }
};

export const markNotificationAsRead = async (id: string, companyId?: string) => {
    const response = await api.patch(`/notifications/${id}/read`, { companyId });
    return response.data;
};

export const markAllNotificationsRead = async (companyId?: string) => {
    const params = companyId ? { companyId } : {};
    const response = await api.patch("/notifications/read-all", {}, { params });
    return response.data;
};

export const deleteNotification = async (id: string, companyId?: string) => {
    const response = await api.delete(`/notifications/${id}`, { params: { companyId } });
    return response.data;
};

export const deleteNotifications = async (ids: string[], companyId?: string, tab?: string) => {
    const response = await api.delete(`/notifications/bulk`, { data: { ids, companyId, tab } });
    return response.data;
};
