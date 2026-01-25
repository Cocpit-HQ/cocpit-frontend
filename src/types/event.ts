
export interface BackendEvent {
    event_id: string; // Changed from id
    title: string;
    description: string;
    banner_url?: string; // Changed from banner_url? (it was already banner_url but just ensuring)

    start_date?: string; // Likely derived from start_time in backend or missing
    start_time: string; // Main timestamp
    end_date?: string;
    end_time?: string;

    location: string;
    event_type: 'Online' | 'InPerson';
    virtual_link?: string;

    category: string;
    tags?: string[];

    // Backend might return flat fields or nested, based on conflicting info. Supporting both.
    organizer_name?: string;
    organizer_email?: string;
    organizer?: {
        name: string;
        email: string;
        avatar?: string;
    };
    registered_count?: number;

    max_attendees?: number;
    registration_deadline?: string;
    waitlist_enabled?: boolean; // Added

    price_type: 'Free' | 'Paid';
    price?: number;
    ticket_name?: string;

    created_at: string;
    updated_at: string;
}

export interface CreateEventPayload {
    title: string;
    description: string;
    banner?: File;

    date: string;
    time: string;
    endDate?: string;
    endTime?: string;

    location: string;
    eventType: 'Online' | 'InPerson';
    virtualLink?: string;

    category: string;
    tags?: string[];

    organizerName?: string;
    organizerEmail?: string;

    maxAttendees?: string | number;
    registrationDeadline?: string;
    waitlist?: boolean;

    priceType: 'Free' | 'Paid';
    price?: string | number;
    ticketName?: string;
    quantity?: string | number;
    paymentProvider?: string;
}

export interface CreateEventResponse {
    message: string;
    eventId: string;
}

export interface RegisterEventPayload {
    name: string;
    email: string;
    mobile_number: string;
    company_name?: string;
    job_title?: string;
}

export interface RegisterEventResponse {
    message: string;
    registrationId?: string;
    status: 'registered' | 'waitlisted';
}

export type MyCreatedEventsResponse = BackendEvent[];

// Keeping EventCard for compatibility with existing UI components if needed, or mapping to it. 
// For strict adherence, the UI should probably use the Event interface or a mapper. 
// Assuming EventCard is the "Frontend View Model" and Event is "Backend DTO".
// Re-exporting EventCard from previous version if it's used elsewhere (it is).
export interface EventCard {
    id: number | string;
    title: string;
    date: string;
    endDate?: string;
    time: string;
    endTime?: string;
    description: string;
    location: string;
    eventType?: 'Online' | 'InPerson';
    virtualLink?: string;
    attendees: string;
    maxAttendees?: number;
    image: string;
    category: string;
    tags?: string[];
    participated?: boolean;
    organizer?: {
        name: string;
        email: string;
    };
    organizerName?: string; // Added as per user request
    registrationDeadline?: string;
    allowWaitlist?: boolean; // Renamed from waitlist
    priceType?: 'Free' | 'Paid';
    price?: number;
    ticketDetails?: {
        name: string;
        quantity: number;
        provider?: string;
    };
    type?: 'Free' | 'Premium' | 'Paid';
}
