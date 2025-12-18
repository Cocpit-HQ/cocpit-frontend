"use client";

import React from "react";
import { DarkSidebar } from "@/components/DarkSidebar";
import type { Page } from "@/types/common";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useActionModal } from "@/context/ActionModalContext";

interface AppShellProps {
  currentPage: Page;
  children: React.ReactNode;
  navigateTo?: (page: Page) => void;
}

export function AppShell({
  currentPage,
  children,
  navigateTo,
}: AppShellProps) {
  const { toggleOptions } = useActionModal();

  return (
    <div className="relative flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar navigateTo={navigateTo} currentPage={currentPage} />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full md:ml-64 pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav currentPage={currentPage} onAdd={toggleOptions} />
    </div>
  );
}

export default AppShell;
