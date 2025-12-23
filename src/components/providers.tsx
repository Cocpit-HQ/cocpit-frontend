"use client";

import { EventsProvider } from "@/context/EventsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="navy" enableSystem={false} themes={['light', 'dark', 'navy']}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <EventsProvider>
            {children}
          </EventsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
