"use client";

import React from "react";
import { DarkSidebar } from "@/components/layout/DarkSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useUIStore } from "@/store/ui.store";
import { HomeHeader } from "@/components/home/HomeHeader";

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export function AppShell({
  children,
  hideBottomNav = false,
}: AppShellProps) {
  const { setOptionsOpen } = useUIStore();

  return (
    <div className="relative flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar />
      </div>

      {/* Main content */}
      <main className={`flex-1 w-full md:ml-[232px] ${hideBottomNav ? "" : "pb-16"} md:pb-0`}>
        <HomeHeader />
        {children}
      </main>

      {/* Mobile bottom navigation */}
      {!hideBottomNav && (
        <MobileBottomNav onAdd={() => setOptionsOpen(true)} />
      )}
    </div>
  );
}

export default AppShell;
