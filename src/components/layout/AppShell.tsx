"use client";

import React from "react";
import { DarkSidebar } from "@/components/DarkSidebar";
import type { Page } from "@/types/common";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface AppShellProps {
  currentPage: Page;
  children: React.ReactNode;
  navigateTo?: (page: Page) => void;
  onAdd?: () => void;
}

export function AppShell({
  currentPage,
  children,
  navigateTo,
  onAdd,
}: AppShellProps) {
  return (
    <div className="relative flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar navigateTo={navigateTo} currentPage={currentPage} />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full md:ml-64 pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav currentPage={currentPage} onAdd={onAdd} />
    </div>
  );
}

export default AppShell;

