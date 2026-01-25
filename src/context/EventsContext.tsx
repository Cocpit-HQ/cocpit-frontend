"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { eventsSeed } from '@/lib/data/events';
import { mapBackendEventToEventCard } from '@/lib/mappers/event.mapper';
import type { EventCard, RegisterEventPayload } from '@/types/event';

interface EventsContextType {
  events: EventCard[];
  registeredEventIds: Set<number | string>;
  savedEventIds: Set<number | string>;
  myEventIds: Set<number | string>;
  registerForEvent: (id: number | string, payload: RegisterEventPayload) => Promise<{ success: boolean; error?: any }>;
  cancelRegistration: (id: number | string) => Promise<{ success: boolean; error?: any }>;
  saveEvent: (id: number | string) => void;
  unsaveEvent: (id: number | string) => void;
  createEvent: (event: Omit<EventCard, 'id'>) => void;
  refreshMyEvents: () => Promise<void>;
  refreshRegisteredEvents: () => Promise<void>;
  isRegistered: (id: number | string) => boolean;
  isSaved: (id: number | string) => boolean;
  isSaving: (id: number | string) => boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [events, setEvents] = useState<EventCard[]>(eventsSeed);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number | string>>(new Set(
    eventsSeed.filter(e => e.participated).map(e => e.id)
  ));
  const [savedEventIds, setSavedEventIds] = useState<Set<number | string>>(new Set());
  const [savingEventIds, setSavingEventIds] = useState<Set<number | string>>(new Set());
  const [myEventIds, setMyEventIds] = useState<Set<number | string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Consolidated hydration effect
  React.useEffect(() => {
    if (status === 'authenticated') {
      hydrateUserEvents();
    } else if (status === 'unauthenticated') {
      // Clear sensitive state on logout
      setRegisteredEventIds(new Set());
      setSavedEventIds(new Set());
      setMyEventIds(new Set());
      setIsLoading(false);
    }
  }, [status]);

  const hydrateUserEvents = async () => {
    setIsLoading(true);
    try {
      const { getMyCreatedEvents, getMySavedEvents, getMyRegisteredEvents, getAllEvents } = await import('@/services/api/event');
      const { mapBackendEventToEventCard } = await import('@/lib/mappers/event.mapper');

      // Fetch all user-specific AND public event data in parallel
      const [myEvents, savedEvents, registeredEvents, publicEventsRes] = await Promise.all([
        getMyCreatedEvents().catch(err => { console.error("Failed to fetch my events", err); return []; }),
        getMySavedEvents().catch(err => { console.error("Failed to fetch saved events", err); return []; }),
        getMyRegisteredEvents().catch(err => { console.error("Failed to fetch registered events", err); return []; }),
        getAllEvents().catch(err => { console.error("Failed to fetch public events", err); return { items: [], hasMore: false }; })
      ]);

      // Process My Events
      const mappedMyEvents = myEvents.map(mapBackendEventToEventCard);
      setMyEventIds(new Set(mappedMyEvents.map(e => e.id)));

      // Process Saved Events
      setSavedEventIds(new Set(savedEvents.map(e => e.id)));

      // Process Registered Events
      setRegisteredEventIds(new Set(registeredEvents.map(e => e.id)));

      // Process Public Events
      // Handle paginated response structure
      const publicItems = Array.isArray(publicEventsRes) ? publicEventsRes : (publicEventsRes.items || []);
      const mappedPublicEvents = publicItems.map(mapBackendEventToEventCard);

      // Merge all into main events list to ensure they are visible
      setEvents(prev => {
        // Create a Map of all events by ID to ensure uniqueness.
        // Priority: New fetched events overwrite existing/seed events with same ID.
        const allFetched = [...mappedMyEvents, ...savedEvents, ...registeredEvents, ...mappedPublicEvents];
        const eventMap = new Map<string | number, EventCard>();

        // Add previous events first (seeds)
        prev.forEach(e => eventMap.set(e.id, e));

        // Add/Overwrite with fetched events
        allFetched.forEach(e => eventMap.set(e.id, e));

        // Convert back to array
        return Array.from(eventMap.values());
      });

    } catch (error) {
      console.error("Critical error hydrating user events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMyEvents = async () => {
    // ... (Legacy individual refresh if needed, but preferably use hydration)
    // Keeping this for "create event" flow
    try {
      const { getMyCreatedEvents } = await import('@/services/api/event');
      const { mapBackendEventToEventCard } = await import('@/lib/mappers/event.mapper');
      const myEvents = await getMyCreatedEvents();
      const mappedEvents = myEvents.map(mapBackendEventToEventCard);

      setEvents(prev => {
        const newIds = new Set(mappedEvents.map(e => e.id));
        const keptEvents = prev.filter(p => !newIds.has(p.id));
        return [...mappedEvents, ...keptEvents];
      });
      setMyEventIds(new Set(mappedEvents.map(e => e.id)));
    } catch (error) {
      console.error("Failed to refresh my events", error);
    }
  };

  const refreshRegisteredEvents = async () => {
    // ... (Legacy individual refresh)
    try {
      const { getMyRegisteredEvents } = await import('@/services/api/event');
      const registeredEvents = await getMyRegisteredEvents();
      setRegisteredEventIds(new Set(registeredEvents.map(e => e.id)));
    } catch (error) {
      console.error("Failed to refresh registered events", error);
    }
  };

  const registerForEvent = async (id: number | string, payload: RegisterEventPayload) => {
    try {
      const { registerForEvent: apiRegister } = await import('@/services/api/event');
      await apiRegister(id, payload);
      setRegisteredEventIds(prev => new Set(prev).add(id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const cancelRegistration = async (id: number | string) => {
    try {
      const { unregisterFromEvent } = await import('@/services/api/event');
      await unregisterFromEvent(id);
      setRegisteredEventIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to cancel registration", error);
      return { success: false, error };
    }
  };

  const saveEvent = async (id: number | string) => {
    setSavedEventIds(prev => new Set(prev).add(id));
    setSavingEventIds(prev => new Set(prev).add(id));

    try {
      const { saveEvent: apiSave } = await import('@/services/api/event');
      await apiSave(id);
    } catch (error) {
      console.error("Failed to save event", error);
      setSavedEventIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert('Failed to save event');
    } finally {
      setSavingEventIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const unsaveEvent = async (id: number | string) => {
    setSavedEventIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSavingEventIds(prev => new Set(prev).add(id));

    try {
      const { unsaveEvent: apiUnsave } = await import('@/services/api/event');
      await apiUnsave(id);
    } catch (error) {
      console.error("Failed to unsave event", error);
      setSavedEventIds(prev => new Set(prev).add(id));
      alert('Failed to unsave event');
    } finally {
      setSavingEventIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const createEvent = (eventData: Omit<EventCard, 'id'>) => {
    const numericIds = events.map(e => typeof e.id === 'string' ? 0 : e.id);
    const newId = Math.max(...numericIds, 0) + 1;
    const newEvent: EventCard = { ...eventData, id: newId };
    setEvents(prev => [newEvent, ...prev]);
    setMyEventIds(prev => new Set(prev).add(newId));
  };

  const isRegistered = (id: number | string) => registeredEventIds.has(id);
  const isSaved = (id: number | string) => savedEventIds.has(id);
  const isSaving = (id: number | string) => savingEventIds.has(id);

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
        refreshMyEvents,
        refreshRegisteredEvents,
        isRegistered,
        isSaved,
        isSaving,
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
