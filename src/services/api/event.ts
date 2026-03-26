import api from "@/lib/axios";
import { CreateEventResponse, BackendEvent, EventCard, EventTicket, RegisterEventResponse, RegisterEventPayload, ValidateEventTicketPayload, ValidateEventTicketResponse } from "@/types/event";
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper";

// Public: Get all events (with filters)
export interface PaginatedEvents {
    items: BackendEvent[];
    nextCursor?: string;
    hasMore: boolean;
}

type EventFilters = Record<string, string | number | boolean | null | undefined>;

export const getAllEvents = async (filters?: EventFilters): Promise<PaginatedEvents> => {
    const query = filters
        ? `?${new URLSearchParams(
            Object.entries(filters)
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => [key, String(value)])
        ).toString()}`
        : "";
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

// Protected: Get Ticket
export const getTicket = async (id: number | string): Promise<EventTicket> => {
    const response = await api.get<EventTicket>(`/events/${id}/ticket`);
    return response.data;
};

export const validateEventTicket = async (
    id: number | string,
    payload: ValidateEventTicketPayload
): Promise<ValidateEventTicketResponse> => {
    const response = await api.post<ValidateEventTicketResponse>(`/events/${id}/tickets/validate`, payload);
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
export async function getMyCreatedEvents(companyId?: string): Promise<BackendEvent[]> {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
    const response = await api.get<BackendEvent[]>(`/events/me/events/created${query}`);
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

// ─── Participants ───────────────────────────────────────────────────────────────

export interface Participant {
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    registered_at?: string;
    checked_in_at?: string;
}

export interface EventParticipants {
    registered: Participant[];
    attended: Participant[];
}

export async function getEventParticipants(id: number | string): Promise<EventParticipants> {
    const response = await api.get<EventParticipants>(`/events/${id}/participants`);
    return response.data;
}
