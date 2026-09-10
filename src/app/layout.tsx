// Invalidate layout cache to reload global styles - timestamp 1725259560
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Roboto, DM_Sans } from "next/font/google";
import "./globals.css";
import "./newGlobal.css"; // New design system — typography, motion, spacing tokens

import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  document.documentElement.setAttribute('data-theme', saved || 'dark');
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
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
        className={`${dmSans.variable} ${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${roboto.variable} antialiased overflow-x-hidden scrollbar-hide`}
      >
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}

