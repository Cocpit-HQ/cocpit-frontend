import api from "@/lib/axios";
import { CreateEventResponse, BackendEvent, EventCard, RegisterEventResponse, RegisterEventPayload } from "@/types/event";
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper";

// Public: Get all events (with filters)
export interface PaginatedEvents {
    items: BackendEvent[];
    nextCursor?: string;
    hasMore: boolean;
}

export const getAllEvents = async (filters?: any): Promise<PaginatedEvents> => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    const response = await api.get(`/events${query}`);
    // Handle both old (array) and new (paginated) responses if unsure, but we know backend changed.
    // However, TypeScript might complain if we don't return exactly PaginatedEvents.
    if (Array.isArray(response.data)) {
        // Fallback for old API if something goes wrong
        return { items: response.data, hasMore: false };
    }
    return response.data;
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

// Protected: Update Event
export async function updateEvent(id: number | string, formData: FormData): Promise<BackendEvent> {
    const response = await api.put<BackendEvent>(`/events/${id}`, formData);
    return response.data;
}

// Protected: Delete Event
export async function deleteEvent(id: number | string): Promise<void> {
    await api.delete(`/events/${id}`);
}

// Protected: Get My Created Events
export async function getMyCreatedEvents(_companyId?: string): Promise<BackendEvent[]> {
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
