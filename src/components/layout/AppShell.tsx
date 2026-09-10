"use client";

import React from "react";
import { Sidebar } from "@/features/navigation/components/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useUIStore } from "@/store/ui.store";
import { TopHeader } from "@/features/navigation/components/TopHeader";
import { MobileTopHeader } from "@/components/layout/MobileTopHeader";
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

  // Automatically hide bottom nav and distraction-free elements on article pages or article mode
  const isArticlePage = pathname?.includes('/article/');
  const { activeModal, isArticleMode } = useUIStore();
  const isDistractionFreeArticle = isArticlePage || isArticleMode;
  const shouldHideBottomNav = hideBottomNav || isDistractionFreeArticle || activeModal === 'create-post';

  return (
    <div className="relative flex min-h-screen bg-ds-bg text-foreground">
      {/* Desktop sidebar */}
      {!isDistractionFreeArticle && (
        <div className="hidden md:block fixed left-0 top-0 h-screen z-40">
          <Sidebar />
        </div>
      )}
      
      {/* Top Header */}
      {!isDistractionFreeArticle && (
        <>
          <div className="hidden md:block">
            <TopHeader />
          </div>
          <div className="md:hidden">
            <MobileTopHeader />
          </div>
        </>
      )}

      {/* Main content */}
      <main className={isDistractionFreeArticle ? "min-w-0 flex-1 w-full relative z-0" : `min-w-0 flex-1 w-full md:ml-[253px] pt-[60px] md:pt-[120px] ${shouldHideBottomNav ? "" : "pb-16"} md:pb-0 relative z-0`}>
        {children}
      </main>

      {/* Mobile bottom navigation */}
      {!shouldHideBottomNav && (
        <>
          {!pathname?.startsWith('/organization/') && !pathname?.includes('/jobs/') && !isCreateJobActive && (
            <></>
          )}
          <MobileBottomNav />
        </>
      )}
      {!isDistractionFreeArticle && <QuickChatWidget />}
    </div>
  );
}

export default AppShell;
