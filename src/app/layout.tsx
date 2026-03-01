import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ActionModalProvider } from "@/context/ActionModalContext";
import { FeedProvider } from "@/context/FeedContext";
import { JobsProvider } from "@/context/JobsContext";
import { PostUploadProvider } from "@/context/PostUploadContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cocpit",
  description: "Connect. Grow. Succeed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <FeedProvider>
            <PostUploadProvider>
              <JobsProvider>
                <ActionModalProvider>
                  {children}
                  <GlobalUploadProgress />
                  <Toaster />
                  <Sonner />
                </ActionModalProvider>
              </JobsProvider>
            </PostUploadProvider>
          </FeedProvider>
        </Providers>
      </body>
    </html>
  );
}

