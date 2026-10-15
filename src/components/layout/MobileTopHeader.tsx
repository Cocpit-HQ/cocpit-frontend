"use client";

import React from "react";
import { Icon } from "@/components/icons";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NotificationPopover } from "@/features/notification/components/NotificationPopover";
import { GlobalSearch } from "@/features/navigation/components/GlobalSearch";

import { FeatureGuard } from "@/components/feature-flags/FeatureGuard";
import { Settings } from "lucide-react";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export function MobileTopHeader() {
  const pathname = usePathname();
  const { activeProfile, isCompany } = useActiveProfile();

  const isProfileActive = Boolean(
    pathname === "/profile" || 
    pathname === "/profile/posts" || 
    pathname?.startsWith("/profile/edit") || 
    (Boolean(isCompany || activeProfile?.type === "COMPANY") && 
      Boolean(activeProfile?.slug) && 
      pathname?.startsWith(`/organization/${activeProfile?.slug}`) && 
      !pathname?.endsWith('/settings') && 
      !pathname?.endsWith('/events') &&
      !pathname?.endsWith('/analytics'))
  );

  const settingsLink = (isCompany || activeProfile?.type === "COMPANY") && activeProfile?.slug
    ? `/organization/${activeProfile.slug}/settings`
    : "/settings";

  const analyticsLink = (isCompany || activeProfile?.type === "COMPANY") && activeProfile?.slug
    ? `/organization/${activeProfile.slug}/analytics`
    : "/analytics";

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-[100vw] h-[52px] bg-ds-bg z-40 flex items-center px-4 md:hidden gap-5 box-border">
      {/* Search Input */}
      <FeatureGuard featureKey="enableGlobalSearch" mode="silent">
        <GlobalSearch variant="mobile" />
      </FeatureGuard>

      {/* Actions */}
      <div className="flex items-center gap-5 shrink-0 ml-auto">
        {isProfileActive ? (
          <>
            <Link href={analyticsLink} className="cursor-pointer shrink-0 group" aria-label="Analytics">
              <Icon name="analytics" className="w-[20px] h-[20px] text-ds-text-secondary group-hover:text-ds-accent transition-colors" />
            </Link>
            <Link href={settingsLink} className="cursor-pointer shrink-0 group" aria-label="Settings">
              <Settings className="w-[20px] h-[20px] text-ds-text-secondary group-hover:text-ds-accent transition-colors" />
            </Link>
          </>
        ) : (
          <>
            <Link href="/messaging" className="cursor-pointer shrink-0 group" aria-label="Messages">
              <Icon name="chat" className="w-[20px] h-[20px] text-ds-text-primary hover:text-ds-accent transition-colors" />
            </Link>
            <div className="shrink-0">
              <FeatureGuard featureKey="enableNotificationsModule" mode="silent">
                <NotificationPopover
                  className="group relative flex flex-row items-center justify-center bg-transparent transition-colors"
                  icon={<Icon name="notification" className="w-[20px] h-[20px] text-ds-text-primary transition-colors" />}
                />
              </FeatureGuard>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default MobileTopHeader;
