import type { LoadingState } from "@/types/common";

export interface EventCard {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  image: string;
}

export interface EventsState extends LoadingState {
  data?: EventCard[];
}

