
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query'; // Using direct query or custom hook
import { StandardEventCard } from '@/components/events/StandardEventCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCompanyPermissions } from '@/components/companies/hooks/use-company';
import { useEventFeed } from '@/components/events/hooks/use-event-queries';
import { EventCard } from '@/types/event';

interface CompanyEventsProps {
    companyId: string;
    company: any; // Type for company object
}

export function CompanyEvents({ companyId, company }: CompanyEventsProps) {
    const { canDelete, checkPermission } = useCompanyPermissions(company);
    const canPost = checkPermission('CREATE_CONTENT') || checkPermission('POST_JOBS'); // Adjust permissions as needed

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useEventFeed({ companyId });

    const events = data?.pages.flatMap(page => page.items) || [];

    if (status === 'pending') {
        return <div className="text-center py-10">Loading events...</div>;
    }

    if (status === 'error') {
        return <div className="text-center py-10 text-red-500">Failed to load events.</div>;
    }

    return (
        <div className="space-y-6">
            {canPost && (
                <div className="flex justify-end">
                    {/* Trigger for Create Event Modal - likely needs context or prop to open it */}
                    {/* For now, just a placeholder or link if modal logic is external */}
                </div>
            )}

            {events.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No upcoming events hosted by {company.name}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event: EventCard) => (
                        <StandardEventCard
                            key={event.id}
                            event={event}
                            onClick={() => window.location.href = `/events/${event.id}`} // Or router.push
                            isRegistered={false} // Needs logic
                            isSaved={false} // Needs logic
                            onToggleSave={() => { }} // Needs logic
                        />
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    );
}
