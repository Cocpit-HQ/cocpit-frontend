import { BackendEvent, EventCard } from "@/types/event";

// Helper to map BackendEvent -> EventCard
export function mapBackendEventToEventCard(e: BackendEvent): EventCard {
    // Safe derivation of date/time
    const dateObj = new Date(e.start_time);
    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : (e.start_date || e.start_time); // Fallback to raw string
    const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : e.start_time;

    return {
        id: e.event_id,
        title: e.title,
        description: e.description,
        date: dateStr,
        time: timeStr,
        endDate: e.end_date || e.end_time,
        endTime: e.end_time,
        location: e.location,
        category: e.category,
        image: e.banner_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070",
        attendees: "0",
        maxAttendees: e.max_attendees,
        eventType: e.event_type,
        virtualLink: e.virtual_link,
        organizer: {
            name: e.organizer?.name || e.organizer_name || "Organizer",
            email: e.organizer?.email || e.organizer_email || ""
        },
        organizerName: e.organizer?.name || e.organizer_name || "Organizer",
        allowWaitlist: e.waitlist_enabled,
        registrationDeadline: e.registration_deadline,
        priceType: e.price_type,
        price: e.price,
        tags: e.tags
    };
}
