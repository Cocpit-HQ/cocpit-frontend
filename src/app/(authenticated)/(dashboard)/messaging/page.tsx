"use client";

import MessagingPage from "@/features/messaging/MessagingPage";
import { Suspense } from "react";
import { FeatureGuard } from "@/components/feature-flags";

export default function MessagingRoute() {
  return (
    <FeatureGuard featureKey="enableMessaging" moduleName="Messaging & Chats">
      <Suspense fallback={<div>Loading messaging...</div>}>
        <MessagingPage />
      </Suspense>
    </FeatureGuard>
  );
}
