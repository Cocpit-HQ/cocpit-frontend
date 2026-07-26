"use client";

import React from "react";
import { RouteGuard } from "@/features/access-denied";

export default function MessagingRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission={["CHAT", "MESSAGES", "JOBS_CHAT"]} matchAny>
      {children}
    </RouteGuard>
  );
}
