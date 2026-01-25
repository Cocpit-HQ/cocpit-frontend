import api from "@/lib/axios";
import { CreateEventResponse, BackendEvent, EventCard, RegisterEventResponse, RegisterEventPayload } from "@/types/event";
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper";

// Public: Get all events (with filters)
export const getAllEvents = async (filters?: any): Promise<BackendEvent[]> => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    const response = await api.get(`/events${query}`);
    return Array.isArray(response.data) ? response.data : [];
};

// Public: Get single event
export const getEventById = async (id: number | string): Promise<BackendEvent> => {
    const response = await api.get<BackendEvent>(`/events/${id}`);
    return response.data;
};

// Protected: Register
export const registerForEvent = async (id: number | string, payload: RegisterEventPayload): Promise<RegisterEventResponse> => {
    const response = await api.post<RegisterEventResponse>(`/events/${id}/register`, payload);
    return response.data;
};

// Protected: Unregister
export const unregisterFromEvent = async (id: number | string) => {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
}

// Protected: Create Event
export async function createEvent(formData: FormData): Promise<CreateEventResponse> {
    const response = await api.post("/events", formData);
    return response.data;
}

// Protected: Get My Created Events
export async function getMyCreatedEvents(): Promise<BackendEvent[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/created");
    return Array.isArray(response.data) ? response.data : [];
}

// Protected: Get My Registered Events
export async function getMyRegisteredEvents(): Promise<EventCard[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/registered");
    const events = Array.isArray(response.data) ? response.data : [];
    return events.map(mapBackendEventToEventCard);
}

// Protected: Get My Saved Events
export async function getMySavedEvents(): Promise<EventCard[]> {
    const response = await api.get<BackendEvent[]>("/events/me/events/saved");
    const events = Array.isArray(response.data) ? response.data : [];
    return events.map(mapBackendEventToEventCard);
}

// Protected: Save Event
export async function saveEvent(id: number | string): Promise<void> {
    await api.post(`/events/${id}/save`);
}

// Protected: Unsave Event
export async function unsaveEvent(id: number | string): Promise<void> {
    await api.delete(`/events/${id}/save`);
}
