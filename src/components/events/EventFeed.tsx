
"use client";

import React, { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { StandardEventCard } from "@/components/events/StandardEventCard";
import { useEventFeed } from "@/hooks/use-event-queries";
import { useEventActions } from "@/hooks/use-event-mutations";
import { useEvents } from "@/context/EventsContext"; // Fallback for some shared state if needed, or replace
import { Skeleton } from "@/components/ui/skeleton";

function EventSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

interface EventFeedProps {
    filters: any;
    searchQuery: string;
}

export function EventFeed({ filters, searchQuery }: EventFeedProps) {
    const router = useRouter();

    // Construct backend params - logic moved from Page
    const getBackendParams = (currentFilters: any, query: string) => {
        const params: any = { limit: 9 };
        if (query) params.q = query;
        if (currentFilters.categories.length > 0) params.category = currentFilters.categories[0];
        if (currentFilters.types.length > 0) {
            if (currentFilters.types.includes('Online') && !currentFilters.types.includes('InPerson')) params.type = 'Online';
            if (currentFilters.types.includes('InPerson') && !currentFilters.types.includes('Online')) params.type = 'InPerson';
        }
        // Date logic could also be extracted to a utility, but keeping simple here
        if (currentFilters.dates.length > 0) {
            const today = new Date();
            if (currentFilters.dates.includes('Today')) {
                params.date = today.toISOString().split('T')[0];
            } else if (currentFilters.dates.includes('Tomorrow')) {
                const tmrw = new Date(today);
                tmrw.setDate(tmrw.getDate() + 1);
                params.date = tmrw.toISOString().split('T')[0];
            } else if (currentFilters.dates.includes('This week')) {
                params.startDate = today.toISOString().split('T')[0];
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
                params.endDate = endOfWeek.toISOString().split('T')[0];
            } else if (currentFilters.dates.includes('This weekend')) {
                const diffToSat = 6 - today.getDay();
                const sat = new Date(today); sat.setDate(today.getDate() + diffToSat);
                const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
                params.startDate = sat.toISOString().split('T')[0];
                params.endDate = sun.toISOString().split('T')[0];
            }
        }
        return params;
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useEventFeed(getBackendParams(filters, searchQuery));

    const { save, unsave } = useEventActions();

    // We need "isSaved" / "isRegistered" state. 
    // Ideally this comes from the user-specific queries.
    // For now, we can still use the Context for read-only checks IF we haven't stripped it yet,
    // OR use the raw data if we fetch "my saved IDs" separately.
    // Let's stick to Context for "isSaved" checking for now to avoid creating a new "useMySavedIds" just yet,
    // or better, rely on the `isSaved` prop if the backend returns it (it does: `is_saved` on Event object).
    // The mapper `mapBackendEventToEventCard` handles `saved: boolean`.
    // So we can use `event.saved`.

    // HOWEVER, the `StandardEventCard` might rely on internal logic or props passed from parents.
    // Let's check StandardEventCard props. It expects `isSaved` boolean.
    // The Context `isSaved(id)` is robust because it updates immediately on click globally.
    // We can use `useEvents()` just for the "check" functions for now until Phase 3 clean up.
    const { isSaved, isRegistered, isSaving } = useEvents(); // Temporarily keep using this for the 'source of truth' for UI state

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    const allEvents = data?.pages.flatMap(page => page.items) || [];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EventSkeleton />
                <EventSkeleton />
                <EventSkeleton />
            </div>
        )
    }

    if (isError) return <div className="p-8 text-center text-red-500">Failed to load events.</div>;

    if (allEvents.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No events found matching your criteria.</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">All Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEvents.map((event, index) => {
                    const isLast = index === allEvents.length - 1;
                    return (
                        <div key={event.id} ref={isLast ? lastElementRef : null}>
                            <StandardEventCard
                                event={event}
                                onClick={() => router.push(`/events/${event.id}`)}
                                isRegistered={isRegistered(event.id)} // Use context or event.participated
                                isSaved={isSaved(event.id)} // Use context or event.saved
                                isSaving={isSaving(event.id)}
                                onToggleSave={(e) => {
                                    e.stopPropagation();
                                    isSaved(event.id) ? unsave.mutate(event.id) : save.mutate(event.id);
                                }}
                                priority={index < 6}
                            />
                        </div>
                    );
                })}
                {isFetchingNextPage && (
                    <>
                        <EventSkeleton />
                        <EventSkeleton />
                    </>
                )}
            </div>
            {!hasNextPage && allEvents.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>You&apos;ve reached the end!</p>
                </div>
            )}
        </div>
    );
}
