"use client";

import {
  EventRegistrationModal,
} from '@/components/events/EventRegistrationModal';
import { useParams, useRouter } from 'next/navigation';
import { useSmartBack } from '@/hooks/use-smart-back';
import { useEvents } from '@/context/EventsContext';
import { getEventById, registerForEvent } from "@/services/api/event"
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper"
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  User,
  ChevronLeft,
  Bookmark,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { EventCard } from '@/types/event';

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { goBack } = useSmartBack();
  const { id } = params;

  // Normalize ID to string for comparison, as URL params are strings
  const eventIdStr = Array.isArray(id) ? id[0] : id;

  const { events, isRegistered, registeredEventIds, refreshRegisteredEvents, isSaved, saveEvent, unsaveEvent, cancelRegistration } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local state for the event, potentially fetched independently if not in context
  const [fetchedEvent, setFetchedEvent] = useState<EventCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // 1. Try to find in Context first (fast path)
  const contextEvent = events.find((e) => String(e.id) === eventIdStr);

  // 2. Effect to handle fetching if not in context or to verify data
  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      if (!eventIdStr) return;

      // If we already have it from context, we might rely on that, 
      // but strictly speaking for a detail page we might want fresh data.
      // For now, if we have contextEvent, use it to stop loading immediately.
      if (contextEvent) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { getEventById } = await import('@/services/api/event');
        const data = await getEventById(eventIdStr);
        if (isMounted) {
          setFetchedEvent(mapBackendEventToEventCard(data));
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch event details:", err);
          setError("Event not found or failed to load.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => { isMounted = false; };
  }, [eventIdStr, contextEvent]);

  // Derived event: Context takes precedence if available (synchronous), otherwise fetched
  const event = contextEvent || fetchedEvent;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground animate-pulse">Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-500 font-semibold">{error || "Event not found"}</div>
        <button
          onClick={() => goBack('/events')}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const registered = isRegistered(event.id);
  const saved = isSaved(event.id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => goBack('/events')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <button
            onClick={() => saved ? unsaveEvent(event.id) : saveEvent(event.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${saved
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-card border-border hover:bg-muted text-muted-foreground'
              }`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'Saved' : 'Save Event'}
          </button>
        </div>

        <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
          <img
            src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full">
            <div className="flex items-end justify-between">
              <h1 className="text-4xl font-bold text-white max-w-2xl">{event.title}</h1>
              {registered && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                  Registered
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">About this event</h2>
            <p className="text-muted-foreground mb-8">
              {event.description}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Date and Time</h3>
                  <p className="text-muted-foreground">
                    {event.date} · {event.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">
                    {event.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Attendees</h3>
                  <p className="text-muted-foreground">
                    {event.attendees || 0} going
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border">
              <h3 className="text-xl font-bold mb-4">Organizers</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span>{event.organizerName || event.organizer?.name || "Organizer"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <a
                    href={`mailto:${event.organizer?.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {event.organizer?.email || "No email provided"}
                  </a>
                </div>
                {/* 
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                   ... Phone logic if available ...
                </div>
                */}
              </div>
            </div>
            {registered ? (
              <div className="space-y-3">
                <button
                  onClick={() => alert('Mock Ticket Download')} // Implement mock download
                  className="w-full bg-green-600 text-white font-bold px-6 py-4 rounded-xl hover:bg-green-700 transition-all text-lg shadow-lg"
                >
                  Download Ticket
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to cancel your registration?')) {
                      setIsCancelling(true);
                      const result = await cancelRegistration(event.id);
                      setIsCancelling(false);

                      if (result.success) {
                        router.refresh();
                        // Optional: Navigate back to registered tab if desired
                        // router.push('/events?tab=registered'); 
                      } else {
                        alert("Failed to cancel registration. Please try again.");
                      }
                    }
                  }}
                  disabled={isCancelling}
                  className="w-full bg-card border border-red-200 text-red-500 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? 'Processing...' : 'Cancel Registration'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white font-bold px-6 py-4 rounded-xl hover:opacity-90 transition-all text-lg shadow-lg shadow-purple-500/20"
              >
                Register for this event
              </button>
            )}
          </div>
        </div>
      </div>
      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />
    </div>
  );
};

export default EventDetailPage;
