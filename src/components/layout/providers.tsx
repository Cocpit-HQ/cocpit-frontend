"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { setInMemorySession } from "@/lib/session-cache";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

function AxiosAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "loading") {
      setInMemorySession(session || null);
    }
  }, [session, status]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AxiosAuthSync />
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <ThemeProvider attribute="data-theme" defaultTheme="navy" enableSystem={false} themes={['light', 'dark', 'navy']}>
          <QueryClientProvider client={queryClient}>
            <ActiveProfileProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </ActiveProfileProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </SessionProvider>
  );
}

