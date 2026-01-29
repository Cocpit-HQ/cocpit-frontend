
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
    getAllEvents,
    getMyCreatedEvents,
    getMyRegisteredEvents,
    getMySavedEvents,
    getEventById
} from "@/services/api/event";
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper";
import { BackendEvent, EventCard } from "@/types/event";

// Keys
export const eventKeys = {
    all: ["events"] as const,
    feed: (filters: any) => ["events", "feed", filters] as const,
    detail: (id: string | number) => ["events", "detail", id] as const,
    myEvents: ["events", "my"] as const,
    registered: ["events", "registered"] as const,
    saved: ["events", "saved"] as const,
};

// --- Infinite Feed Hook ---
export function useEventFeed(filters: any) {
    return useInfiniteQuery({
        queryKey: eventKeys.feed(filters),
        queryFn: async ({ pageParam }) => {
            const params = { ...filters, cursor: pageParam };
            const data = await getAllEvents(params);
            return {
                ...data,
                items: data.items.map(mapBackendEventToEventCard)
            };
        },
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// --- My Created Events ---
export function useMyEvents() {
    return useQuery({
        queryKey: eventKeys.myEvents,
        queryFn: async () => {
            const data = await getMyCreatedEvents();
            // getMyCreatedEvents returns BackendEvent[], map it
            return data.map(mapBackendEventToEventCard);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// --- Registered Events ---
export function useRegisteredEvents() {
    return useQuery({
        queryKey: eventKeys.registered,
        queryFn: async () => {
            // getMyRegisteredEvents already returns EventCard[]
            const data = await getMyRegisteredEvents();
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
}

// --- Saved Events ---
export function useSavedEvents() {
    return useQuery({
        queryKey: eventKeys.saved,
        queryFn: async () => {
            // getMySavedEvents already returns EventCard[]
            const data = await getMySavedEvents();
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
}

// --- Single Event ---
export function useEventDetail(id: string | number) {
    return useQuery({
        queryKey: eventKeys.detail(id),
        queryFn: async () => {
            const data = await getEventById(id);
            return mapBackendEventToEventCard(data);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}
