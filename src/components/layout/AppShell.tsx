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

  // Automatically hide bottom nav and distraction-free elements on article pages, article mode, post detail, or public profile full view
  const isArticlePage = pathname?.includes('/article/');
  const isPostDetailPage = pathname?.startsWith('/post/');
  const isPublicProfile = Boolean(
    pathname?.startsWith('/profile/') &&
    !['/profile/edit', '/profile/download', '/profile/posts'].includes(pathname)
  );
  const isNotificationsPage = pathname?.startsWith('/notifications');
  const { activeModal, isArticleMode } = useUIStore();
  const isDistractionFree = isArticlePage || isArticleMode || isPostDetailPage || isPublicProfile || isNotificationsPage;
  const shouldHideBottomNav = hideBottomNav || isDistractionFree || activeModal === 'create-post';

  return (
    <div className="relative flex flex-col min-h-screen bg-ds-bg text-foreground overflow-x-hidden">
      {/* Desktop sidebar */}
      {!isDistractionFree && (
        <div className="hidden md:block fixed left-0 top-0 h-screen z-40">
          <Sidebar />
        </div>
      )}
      
      {/* Top Header */}
      {!isDistractionFree && (
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
      <main className={isDistractionFree ? "min-w-0 flex-1 w-full relative z-0" : `min-w-0 flex-1 w-full md:pl-[220px] pt-[60px] md:pt-[120px] ${shouldHideBottomNav ? "" : "pb-16"} md:pb-0 relative z-0`}>
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
      {/* Quick Chat removed/hidden for UAT environment */}
      {/* {!isDistractionFree && <QuickChatWidget />} */}
    </div>
  );
}

export default AppShell;
