"use client";

import React from "react";
import { DarkSidebar } from "@/components/layout/DarkSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useUIStore } from "@/store/ui.store";
import { HomeHeader } from "@/components/home/HomeHeader";
import { Plus } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/components/organizations/hooks/use-company';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuickChatWidget } from '@/features/messaging/components/quick-chat/QuickChatWidget';

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export function AppShell({
  children,
  hideBottomNav = false,
}: AppShellProps) {
  const { setActiveModal } = useUIStore();
  const { isCompany } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCreateJobActive = searchParams?.get('view') === 'create-job';

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DarkSidebar />
      </div>

      {/* Main content */}
      <main className={`min-w-0 flex-1 w-full md:ml-[232px] ${hideBottomNav ? "" : "pb-16"} md:pb-0`}>
        <HomeHeader />
        {children}
      </main>

      {/* Mobile bottom navigation */}
      {!hideBottomNav && (
        <>
          {!pathname?.startsWith('/organization/') && !pathname?.includes('/jobs/') && !isCreateJobActive && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      if (isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      setActiveModal('create-post');
                    }}
                    className={`md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#6366F1] text-white rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(99,102,241,0.4)] hover:bg-[#5558e3] transition-colors ${(isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) ? '!cursor-not-allowed' : ''}`}
                    aria-label="Create Post"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                        <Plus className="w-4 h-4" strokeWidth={3} />
                    </div>
                  </button>
                </TooltipTrigger>
                {(isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) && (
                    <TooltipContent side="top" className="bg-gray-800 text-white border-gray-700">
                        <p>You don't have permission to access this</p>
                    </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          <MobileBottomNav />
        </>
      )}
      <QuickChatWidget />
    </div>
  );
}

export default AppShell;
