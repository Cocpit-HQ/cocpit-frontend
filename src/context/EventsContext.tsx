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

  // Fetch my events and saved events on load
  React.useEffect(() => {
    if (status === 'authenticated') {
      refreshMyEvents();
      refreshSavedEvents();
      refreshRegisteredEvents();
    }
  }, [status]);

  const refreshRegisteredEvents = async () => {
    try {
      const { getMyRegisteredEvents } = await import('@/services/api/event');
      const registeredEvents = await getMyRegisteredEvents();
      setRegisteredEventIds(new Set(registeredEvents.map(e => e.id)));
    } catch (error) {
      console.error("Failed to refresh registered events", error);
    }
  };

  const refreshSavedEvents = async () => {
    try {
      const { getMySavedEvents } = await import('@/services/api/event');
      const savedEvents = await getMySavedEvents();
      setSavedEventIds(new Set(savedEvents.map(e => e.id)));

      // Merge saved events into main list if not present?
      // For now, adhere to "Saved tab" logic which filters main `events`.
      // Getting strict consistency might require merging like myEvents.
      // Let's do it to be safe so they appear in Saved tab even if not in seed.
      setEvents(prev => {
        const newIds = new Set(savedEvents.map(e => e.id));
        const keptEvents = prev.filter(p => !newIds.has(p.id));
        return [...savedEvents, ...keptEvents];
      });

    } catch (error) {
      console.error("Failed to refresh saved events", error);
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
    // Optimistic update
    setSavedEventIds(prev => new Set(prev).add(id));
    setSavingEventIds(prev => new Set(prev).add(id));

    try {
      const { saveEvent: apiSave } = await import('@/services/api/event');
      await apiSave(id);
    } catch (error) {
      console.error("Failed to save event", error);
      // Revert on error
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
    // Optimistic
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
      // Revert
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
    // Handle mixed string/number IDs when calculating max
    const numericIds = events.map(e => typeof e.id === 'string' ? 0 : e.id);
    const newId = Math.max(...numericIds, 0) + 1;
    const newEvent: EventCard = { ...eventData, id: newId };
    setEvents(prev => [newEvent, ...prev]);
    setMyEventIds(prev => new Set(prev).add(newId));
  };

  const refreshMyEvents = async () => {
    try {
      const { getMyCreatedEvents } = await import('@/services/api/event');
      const myEvents = await getMyCreatedEvents();
      console.log("Fetched my events:", myEvents);

      // myEvents is already EventCard[]
      const mappedEvents: EventCard[] = myEvents.map(mapBackendEventToEventCard);

      setEvents(prev => {
        // Filter out items in `prev` that have IDs present in `mappedEvents` (to avoid duplicates)
        // This ensures the new mapped events replace any old versions of them.
        const newIds = new Set(mappedEvents.map(e => e.id));
        const keptEvents = prev.filter(p => !newIds.has(p.id));
        return [...mappedEvents, ...keptEvents];
      });

      setMyEventIds(new Set(mappedEvents.map(e => e.id)));
    } catch (error) {
      console.error("Failed to refresh my events", error);
    }
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
