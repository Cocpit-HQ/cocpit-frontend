import api from "@/lib/axios";
import { Notification } from "@/types/social";

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get("/notifications");
    return response.data;
};

export const markNotificationAsRead = async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    // Not implemented in backend yet based on routes, but documented in plan.
    // Uncomment when backend supports it
    // const response = await api.patch("/notifications/read-all");
    // return response.data;
    return Promise.resolve();
};
