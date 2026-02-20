"use client";

import { EventsProvider } from "@/context/EventsContext";
import { SocialProvider } from "@/context/SocialContext";
import { SocketProvider } from "@/context/SocketContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="navy" enableSystem={false} themes={['light', 'dark', 'navy']}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <EventsProvider>
              <SocialProvider>
                <SocketProvider>
                  {children}
                </SocketProvider>
              </SocialProvider>
            </EventsProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
