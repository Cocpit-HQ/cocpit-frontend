// Invalidate layout cache to reload global styles
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${roboto.variable} antialiased overflow-x-hidden`}
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

