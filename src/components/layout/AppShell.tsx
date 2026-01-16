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
  hideBottomNav?: boolean;
}

export function AppShell({
  currentPage,
  children,
  navigateTo,
  hideBottomNav = false,
}: AppShellProps) {
  const { toggleOptions } = useActionModal();

  return (
    <div className="relative flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar navigateTo={navigateTo} currentPage={currentPage} />
      </div>

      {/* Main content */}
      <main className={`flex-1 w-full md:ml-64 ${hideBottomNav ? "" : "pb-16"} md:pb-0 overflow-y-auto`}>{children}</main>

      {/* Mobile bottom navigation */}
      {!hideBottomNav && (
        <MobileBottomNav currentPage={currentPage} onAdd={toggleOptions} />
      )}
    </div>
  );
}

export default AppShell;
