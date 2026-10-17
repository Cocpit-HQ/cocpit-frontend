import React, { useMemo } from 'react';
import { useEventFeed } from '@/components/events/hooks/use-event-queries';
import { StandardEventCard } from '@/components/events/StandardEventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';

interface HomeUpcomingEventsProps {
    companyId: string;
    onViewAll: () => void;
}

export function HomeUpcomingEvents({ companyId, onViewAll }: HomeUpcomingEventsProps) {
    const { data, status } = useEventFeed({ companyId });

    const events = useMemo(() => {
        if (!data) return [];
        const allEvents = data.pages.flatMap(page => page.items);
        return allEvents.slice(0, 3); // Show 3 events to match grid
    }, [data]);

    if (status === 'pending') {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    if (status === 'error' || events.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Events
                </h3>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                {events.map((event) => (
                    <div key={event.id} className="min-w-[85vw] md:min-w-0 snap-center">
                        <StandardEventCard
                            event={event}
                            onClick={() => window.location.href = `/events/${event.id}`}
                            isRegistered={false}
                            isSaved={false}
                            onToggleSave={() => { }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
