"use client";

import React from "react";

import { EventsProvider } from "@/context/EventsContext";

export default function EventsRouteLayout({ children }: { children: React.ReactNode }) {
  return <EventsProvider>{children}</EventsProvider>;
}
