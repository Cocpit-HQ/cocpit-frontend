
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

import { useSession } from "next-auth/react";

// ... imports

// ... keys

// ... Infinite Feed Hook (Public - No change)
export function useEventFeed(filters: any) {
    return useInfiniteQuery({
        // ... (same implementation)
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
        staleTime: 1000 * 60 * 2,
    });
}

// --- My Created Events ---
export function useMyEvents() {
    const { status } = useSession();
    return useQuery({
        queryKey: eventKeys.myEvents,
        queryFn: async () => {
            const data = await getMyCreatedEvents();
            return data.map(mapBackendEventToEventCard);
        },
        enabled: status === "authenticated",
        staleTime: 1000 * 60 * 5,
    });
}

// --- Registered Events ---
export function useRegisteredEvents() {
    const { status } = useSession();
    return useQuery({
        queryKey: eventKeys.registered,
        queryFn: async () => {
            const data = await getMyRegisteredEvents();
            return data;
        },
        enabled: status === "authenticated",
        staleTime: 1000 * 60 * 5,
    });
}

// --- Saved Events ---
export function useSavedEvents() {
    const { status } = useSession();
    return useQuery({
        queryKey: eventKeys.saved,
        queryFn: async () => {
            const data = await getMySavedEvents();
            return data;
        },
        enabled: status === "authenticated",
        staleTime: 1000 * 60 * 5,
    });
}

// --- Single Event (Public - No change, but id check exists) ---
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
