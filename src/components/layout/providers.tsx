"use client";

import { EventsProvider } from "@/context/EventsContext";
import { SocialProvider } from "@/context/SocialContext";
import { SocketProvider } from "@/context/SocketContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <ThemeProvider attribute="data-theme" defaultTheme="navy" enableSystem={false} themes={['light', 'dark', 'navy']}>
          <QueryClientProvider client={queryClient}>
            <ActiveProfileProvider>
              <TooltipProvider>
                <EventsProvider>
                  <SocialProvider>
                    <SocketProvider>
                      {children}
                    </SocketProvider>
                  </SocialProvider>
                </EventsProvider>
              </TooltipProvider>
            </ActiveProfileProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </SessionProvider>
  );
}
