import type { LoadingState } from "@/types/common";

export interface EventCard {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  attendees: string;
  image: string;
  category: string;
  participated?: boolean;
  type?: 'Free' | 'Premium';
  price?: number;
}

export interface EventsState extends LoadingState {
  data?: EventCard[];
}

