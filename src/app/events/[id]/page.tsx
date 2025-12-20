
"use client";

import {
  EventRegistrationModal,
} from '@/components/events/EventRegistrationModal';
import { useParams, useRouter } from 'next/navigation';
import { eventsSeed } from '@/lib/data/events';
import type { EventCard } from '@/types/events';
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  User,
  ChevronLeft,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import type { Theme } from '@/types/common';

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>('light');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (matches: boolean) =>
      setSystemTheme(matches ? 'dark' : 'light');
    updateTheme(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return systemTheme;
}

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const eventId = parseInt(id as string, 10);
  const event = eventsSeed.find((e) => e.id === eventId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { theme } = useTheme();
  const systemTheme = useSystemTheme();

  const isDark = useMemo(
    () => theme === 'dark' || (theme === 'system' && systemTheme === 'dark'),
    [systemTheme, theme]
  );

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-[#171c28] text-white' : 'bg-[#F3F2EF] text-gray-900'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
            } transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl font-bold text-white">{event.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">About this event</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              vestibulum in eros vel tincidunt. Donec ullamcorper, libero a
              fermentum facilisis, eros nisl lacinia a, vel aliquam turpis nunc
              eget nibh.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-6 h-6 text-[#5B7CFF]" />
                <div>
                  <h3 className="font-semibold">Date and Time</h3>
                  <p
                    className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {event.date} · {event.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="w-6 h-6 text-[#5B7CFF]" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p
                    className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {event.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-[#5B7CFF]" />
                <div>
                  <h3 className="font-semibold">Attendees</h3>
                  <p
                    className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {event.attendees} going
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className={`${
                isDark ? 'bg-[#242b3d]' : 'bg-white border'
              } p-6 rounded-2xl`}
            >
              <h3 className="text-xl font-bold mb-4">Organizers</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User
                    className={`w-5 h-5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                  <span>The Company Inc.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail
                    className={`w-5 h-5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                  <a
                    href="mailto:contact@thecompany.com"
                    className="hover:text-[#5B7CFF] transition-colors"
                  >
                    contact@thecompany.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone
                    className={`w-5 h-5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                  <a
                    href="tel:+1234567890"
                    className="hover:text-[#5B7CFF] transition-colors"
                  >
                    +1 234 567 890
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white font-bold px-6 py-4 rounded-xl hover:opacity-90 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={event.participated}
            >
              {event.participated ? 'Already Registered' : 'Register for this event'}
            </button>
          </div>
        </div>
      </div>
      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        isDark={isDark}
      />
    </div>
  );
};

export default EventDetailPage;
