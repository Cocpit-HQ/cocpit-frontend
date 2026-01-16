import api from "@/lib/axios";
import { EventCard } from "@/types/events";

export const getAllEvents = async (filters?: any): Promise<EventCard[]> => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    const response = await api.get(`/events${query}`);
    return response.data;
};

export const getEventById = async (id: number | string): Promise<EventCard> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
};

export const registerForEvent = async (id: number | string) => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
};
