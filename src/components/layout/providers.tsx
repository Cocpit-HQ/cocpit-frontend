"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { setInMemorySession } from "@/lib/session-cache";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

const THEME_BG_COLORS: Record<string, string> = {
  dark:  '#030303',
  // light: '#FFF9F6',
};

/**
 * Syncs <html> background-color and <meta name="theme-color"> whenever the
 * active theme changes. This ensures Safari's pull-to-refresh overscroll area
 * always shows the correct theme background instead of a mismatched default.
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = THEME_BG_COLORS[resolvedTheme ?? 'dark'] ?? '#030303';
    // Safari reads <html> background for the rubber-band / overscroll area.
    document.documentElement.style.backgroundColor = color;
    // Keep the browser chrome (tab bar on mobile Safari) in sync.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }, [resolvedTheme]);

  return null;
}

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
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
          themes={['dark']}
        >
          <ThemeColorSync />
          <QueryClientProvider client={queryClient}>
            <ActiveProfileProvider>
              <FeatureFlagProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </FeatureFlagProvider>
            </ActiveProfileProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </SessionProvider>
  );
}

