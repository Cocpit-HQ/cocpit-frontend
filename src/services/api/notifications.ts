import api from "@/lib/axios";
import { Notification } from "@/types/social";

export const getNotifications = async (companyId?: string): Promise<Notification[]> => {
    const params = companyId ? { companyId } : {};
    const response = await api.get("/notifications", { params });
    return response.data;
};

export const markNotificationAsRead = async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async (companyId?: string) => {
    const response = await api.patch("/notifications/read-all", { companyId });
    return response.data;
};
