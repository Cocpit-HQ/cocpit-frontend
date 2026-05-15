import MessagingPage from "@/features/messaging/MessagingPage";
import { Suspense } from "react";

export default function MessagingRoute() {
  return (
    <Suspense fallback={<div>Loading messaging...</div>}>
      <MessagingPage />
    </Suspense>
  );
}

