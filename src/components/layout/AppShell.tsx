"use client";

import React from "react";
import { DarkSidebar } from "@/components/layout/DarkSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useActionModal } from "@/context/ActionModalContext";
// import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export function AppShell({
  children,
  hideBottomNav = false,
}: AppShellProps) {
  const { toggleOptions } = useActionModal();
  // const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar />
      </div>

      {/* Main content */}
      <main className={`flex-1 w-full md:ml-64 ${hideBottomNav ? "" : "pb-16"} md:pb-0`}>{children}</main>

      {/* Mobile bottom navigation */}
      {!hideBottomNav && (
        <MobileBottomNav onAdd={toggleOptions} />
      )}
    </div>
  );
}

export default AppShell;
