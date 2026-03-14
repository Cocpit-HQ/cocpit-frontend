"use client";

import React from "react";

import { SocialProvider } from "@/context/SocialContext";
import { FeedProvider } from "@/context/FeedContext";
import { StoriesProvider } from "@/context/StoriesContext";

export default function FeedRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialProvider>
      <FeedProvider>
        <StoriesProvider>{children}</StoriesProvider>
      </FeedProvider>
    </SocialProvider>
  );
}
