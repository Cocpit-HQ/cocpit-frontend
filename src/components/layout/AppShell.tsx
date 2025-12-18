"use client";

import React, { useState } from "react";
import { DarkSidebar } from "@/components/DarkSidebar";
import type { Page } from "@/types/common";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import PostWithOptions from "@/components/home/PostWithOptions";
import CreatePostModal from "@/components/home/CreatePostModal";

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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onAdd = () => {
    setIsOptionsOpen(!isOptionsOpen);
  };

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

      {isOptionsOpen && (
        <PostWithOptions
          onClose={() => setIsOptionsOpen(false)}
          onOptionClick={(option) => {
            if (option === 'photo') {
              setIsModalOpen(true);
            }
            // Handle other options here
            setIsOptionsOpen(false);
          }}
        />
      )}

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default AppShell;

