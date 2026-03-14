"use client";

import React from "react";

import { SocialProvider } from "@/context/SocialContext";

export default function MessagingRouteLayout({ children }: { children: React.ReactNode }) {
  return <SocialProvider>{children}</SocialProvider>;
}
