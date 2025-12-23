"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { eventsSeed } from '@/lib/data/events';
import type { EventCard } from '@/types/events';

interface EventsContextType {
  events: EventCard[];
  registeredEventIds: Set<number>;
  savedEventIds: Set<number>;
  myEventIds: Set<number>;
  registerForEvent: (id: number) => void;
  cancelRegistration: (id: number) => void;
  saveEvent: (id: number) => void;
  unsaveEvent: (id: number) => void;
  createEvent: (event: Omit<EventCard, 'id'>) => void;
  isRegistered: (id: number) => boolean;
  isSaved: (id: number) => boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventCard[]>(eventsSeed);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set(
    eventsSeed.filter(e => e.participated).map(e => e.id)
  ));
  const [savedEventIds, setSavedEventIds] = useState<Set<number>>(new Set());
  const [myEventIds, setMyEventIds] = useState<Set<number>>(new Set());

  const registerForEvent = (id: number) => {
    setRegisteredEventIds(prev => new Set(prev).add(id));
  };

  const cancelRegistration = (id: number) => {
    setRegisteredEventIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const saveEvent = (id: number) => {
    setSavedEventIds(prev => new Set(prev).add(id));
  };

  const unsaveEvent = (id: number) => {
    setSavedEventIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const createEvent = (eventData: Omit<EventCard, 'id'>) => {
    const newId = Math.max(...events.map(e => e.id), 0) + 1;
    const newEvent: EventCard = { ...eventData, id: newId };
    setEvents(prev => [newEvent, ...prev]);
    setMyEventIds(prev => new Set(prev).add(newId));
  };

  const isRegistered = (id: number) => registeredEventIds.has(id);
  const isSaved = (id: number) => savedEventIds.has(id);

  return (
    <EventsContext.Provider
      value={{
        events,
        registeredEventIds,
        savedEventIds,
        myEventIds,
        registerForEvent,
        cancelRegistration,
        saveEvent,
        unsaveEvent,
        createEvent,
        isRegistered,
        isSaved,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
