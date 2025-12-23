import type { LoadingState } from "@/types/common";

export interface EventCard {
  id: number;
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

  // Organizer
  organizer?: {
    name: string;
    email: string;
  };

  // Registration
  registrationDeadline?: string;
  waitlist?: boolean;

  // Pricing
  priceType?: 'Free' | 'Paid';
  price?: number;
  ticketDetails?: {
    name: string;
    quantity: number;
    provider?: string;
  };

  // Legacy compatibility (optional)
  type?: 'Free' | 'Premium' | 'Paid';
}

export interface EventsState extends LoadingState {
  data?: EventCard[];
}
