
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StandardEventCard } from "@/components/events/StandardEventCard";
import { useMyEvents, useRegisteredEvents, useSavedEvents } from "@/hooks/use-event-queries";
import { useEventActions } from "@/hooks/use-event-mutations";
import { useEvents } from "@/context/EventsContext";
import { Loader2 } from "lucide-react";

interface EventListProps {
    type: 'my_events' | 'registered' | 'saved';
}

export function UserEventsList({ type }: EventListProps) {
    const router = useRouter();
    const { register, unregister, save, unsave } = useEventActions();
    const { isSaved, isSaving, isRegistered } = useEvents(); // Keep utilizing context state for cohesive UI updates for now

    // Select hook
    let hook;
    switch (type) {
        case 'my_events': hook = useMyEvents; break;
        case 'registered': hook = useRegisteredEvents; break;
        case 'saved': hook = useSavedEvents; break;
        default: hook = useMyEvents;
    }

    const { data: events, isLoading, isError } = hook();

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) return <div className="text-red-500 text-center p-8">Failed to load events.</div>;

    if (!events || events.length === 0) {
        return (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No events found in this section.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
                <div key={event.id} className="relative group">
                    <StandardEventCard
                        event={event}
                        onClick={() => router.push(`/events/${event.id}`)}
                        isRegistered={type === 'registered' ? true : isRegistered(event.id)}
                        isSaved={type === 'saved' ? true : isSaved(event.id)}
                        isSaving={isSaving(event.id)}
                        onToggleSave={(e) => {
                            e.stopPropagation();
                            // Optimistic toggle logic is handled by mutation hooks invalidation
                            isSaved(event.id) ? unsave.mutate(event.id) : save.mutate(event.id);
                        }}
                    />
                    {type === 'registered' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm("Are you sure?")) unregister.mutate(event.id);
                            }}
                            className="absolute top-4 right-4 z-20 bg-red-500 text-white text-xs px-3 py-1 rounded shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            Unregister
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
