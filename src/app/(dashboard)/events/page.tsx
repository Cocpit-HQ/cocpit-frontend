import { Suspense } from "react";
import { EventsPage } from "@/components/events/EventsPage";
import { Loader2 } from "lucide-react";

export default function EventsRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <EventsPage />
    </Suspense>
  );
}

