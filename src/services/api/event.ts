import api from "@/lib/axios";
import { CreateEventResponse, BackendEvent, EventCard, RegisterEventResponse, RegisterEventPayload } from "@/types/event";
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper";

// Legacy fetch - verified it's used by other parts of the app
export const getAllEvents = async (filters?: any): Promise<BackendEvent[]> => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    const response = await api.get(`/events${query}`);
    // Handle case where backend might wrap the array or return it directly
    return Array.isArray(response.data) ? response.data : [];
};

// Legacy fetch
export const getEventById = async (id: number | string): Promise<BackendEvent> => {
    const response = await api.get<BackendEvent>(`/events/${id}`);
    return response.data;
};

export const registerForEvent = async (id: number | string, payload: RegisterEventPayload): Promise<RegisterEventResponse> => {
    const response = await api.post<RegisterEventResponse>(`/events/${id}/register`, payload);
    return response.data;
};

export const unregisterFromEvent = async (id: number | string) => {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
}

// NEW: Strict backend integration
export async function createEvent(formData: FormData): Promise<CreateEventResponse> {
    const response = await api.post("/events", formData);
    return response.data;
}

export async function getMyCreatedEvents(): Promise<BackendEvent[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/created");
    // Ensure response.data is an array
    return Array.isArray(response.data) ? response.data : [];
}

export async function getMyRegisteredEvents(): Promise<EventCard[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/registered");
    const events = Array.isArray(response.data) ? response.data : [];
    return events.map(mapBackendEventToEventCard);
}

export async function getMySavedEvents(): Promise<EventCard[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/saved");
    const events = Array.isArray(response.data) ? response.data : [];
    return events.map(mapBackendEventToEventCard);
}

export async function saveEvent(id: number | string): Promise<void> {
    await api.post(`/events/${id}/save`);
}

export async function unsaveEvent(id: number | string): Promise<void> {
    await api.delete(`/events/${id}/save`);
}
