import type { LoadingState } from "@/types/common";

export interface EventCard {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  image: string;
  participated?: boolean;
  type?: 'Free' | 'Premium';
  price?: number;
}

export interface EventsState extends LoadingState {
  data?: EventCard[];
}

