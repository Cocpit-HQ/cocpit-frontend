// Invalidate layout cache to reload global styles - timestamp 1725259560
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Roboto, DM_Sans } from "next/font/google";
import "./globals.css";
import "./newGlobal.css"; // New design system — typography, motion, spacing tokens

import Providers from "@/components/layout/providers";
import { GlobalToast } from "@/shared/commonComponents/GlobalToast";
import MobileUnsupported from "@/components/shared/MobileUnsupported";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins-base",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cocpit",
  description: "Connect. Grow. Succeed.",
  icons: {
    icon: "/assets/weblogo.png.PNG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className="scrollbar-hide">
      <head>
        <meta name="theme-color" content="#030303" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only 'dark' theme is valid. 'navy' and 'light' are commented out.
                var validThemes = ['dark'];
                /* var validThemes = ['dark', 'navy', 'light']; */
                var themeColors = {
                  'dark':  '#030303',
                  // 'navy':  '#030303',
                  // 'light': '#FFF9F6',
                };
                try {
                  var saved = localStorage.getItem('theme');
                  // Ensure default is strictly 'dark' if unset, 'system', or invalid
                  if (!saved || validThemes.indexOf(saved) === -1) {
                    saved = 'dark';
                    localStorage.setItem('theme', 'dark');
                  }
                  var color = themeColors[saved] || '#030303';
                  document.documentElement.setAttribute('data-theme', saved);
                  // Apply bg directly on <html> so Safari overscroll / pull-to-refresh
                  // shows the correct theme color instead of a mismatched default.
                  document.documentElement.style.backgroundColor = color;
                  // Keep <meta name="theme-color"> in sync for the browser chrome.
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', color);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.backgroundColor = '#030303';
                }
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus,
              input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 1000px var(--ds-bg) inset !important;
                box-shadow: 0 0 0 1000px var(--ds-bg) inset !important;
                -webkit-text-fill-color: var(--ds-text-primary) !important;
                /* Forces the cursor to match Figma's accent color (#EC6229) during browser autofill */
                caret-color: #EC6229 !important;
                transition: background-color 50000s ease-in-out 0s, color 50000s ease-in-out 0s !important;
              }
              input:autofill {
                box-shadow: 0 0 0 1000px var(--ds-bg) inset !important;
                -webkit-text-fill-color: var(--ds-text-primary) !important;
                /* Forces the cursor to match Figma's accent color (#EC6229) during browser autofill */
                caret-color: #EC6229 !important;
              }
            `,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${roboto.variable} antialiased overflow-x-hidden scrollbar-hide bg-background text-foreground`}
      >
        <Providers>
          {/* <div className="hidden lg:contents"> */}
            {children}
          {/* </div>
          <div className="block lg:hidden">
            <MobileUnsupported />
          </div> */}
          <GlobalToast />
        </Providers>
      </body>
    </html>
  );
}

