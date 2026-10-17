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
  const { setActiveModal, activeModal, isArticleMode, isOrgPublicView } = useUIStore();
  const { isCompany, activeProfile } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCreateJobActive = searchParams?.get('view') === 'create-job';

  // Automatically hide bottom nav and distraction-free elements on article pages, article mode, post detail, public profile full view, or edit pages
  const isArticlePage = pathname?.includes('/article/');
  const isPostDetailPage = pathname?.startsWith('/post/');
  const isPublicProfile = Boolean(
    pathname?.startsWith('/profile/') &&
    !['/profile/edit', '/profile/download', '/profile/posts'].includes(pathname)
  );
  const isOrgProfilePage = Boolean(
    pathname?.startsWith('/organization/') &&
    !pathname?.includes('/edit') &&
    !pathname?.includes('/settings') &&
    !pathname?.includes('/analytics') &&
    !pathname?.includes('/dashboard') &&
    !pathname?.includes('/old-settings') &&
    !pathname?.includes('/invite')
  );
  const isOwnActiveCompany = Boolean(
    isCompany && activeProfile?.slug && (
      pathname === `/organization/${activeProfile.slug}` ||
      pathname === `/organization/${encodeURIComponent(activeProfile.slug)}` ||
      decodeURIComponent(pathname || '') === `/organization/${activeProfile.slug}`
    )
  );
  const isExplicitPublicOrg = Boolean(
    isOrgProfilePage && (
      searchParams?.get('view') === 'public' ||
      searchParams?.get('mode') === 'public' ||
      searchParams?.get('preview') === 'true'
    )
  );
  const isPublicOrgProfile = (isOrgProfilePage && !isOwnActiveCompany) || isExplicitPublicOrg || Boolean(isOrgPublicView);
  const isNotificationsPage = pathname?.startsWith('/notifications');
  const isSettingsRoute = Boolean(
    pathname === '/settings' ||
    pathname?.startsWith('/settings/') ||
    pathname?.includes('/settings')
  );
  const isRootSettings = Boolean(
    pathname === '/settings' ||
    pathname?.match(/^\/organization\/[^\/]+\/settings\/?$/)
  );
  const isSettingsSubpage = isSettingsRoute && !isRootSettings;
  const isDistractionFree = isArticlePage || isArticleMode || isPostDetailPage || isPublicProfile || isPublicOrgProfile || isNotificationsPage;
  const shouldHideBottomNav = hideBottomNav || isDistractionFree || isSettingsSubpage || activeModal === 'create-post';

  return (
    <div className={`relative flex flex-col ${isSettingsRoute ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-ds-bg text-foreground overflow-x-hidden`}>
      {!isDistractionFree && (
        <div className="hidden sm:block fixed left-0 top-0 h-screen z-40">
          <Sidebar />
        </div>
      )}

      {/* Top Header - hidden on distraction-free pages and settings routes */}
      {!isDistractionFree && !isSettingsRoute && (
        <>
          <div className="hidden sm:block">
            <TopHeader />
          </div>
          <div className="sm:hidden">
            <MobileTopHeader />
          </div>
        </>
      )}

      {/* Main content */}
      <main className={
        isDistractionFree
          ? "min-w-0 flex-1 w-full relative"
          : isSettingsRoute
            ? `min-w-0 flex-1 w-full h-full overflow-hidden sm:pl-[280px] lg:pl-[320px] ${shouldHideBottomNav ? "" : "pb-16"} sm:pb-0 relative`
            : `min-w-0 flex-1 w-full sm:pl-[220px] pt-[60px] sm:pt-[120px] ${shouldHideBottomNav ? "" : "pb-16"} sm:pb-0 relative`
      }>
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
