"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { NotificationPopover } from "@/features/notification/components/NotificationPopover";

import { FeatureGuard } from "@/components/feature-flags/FeatureGuard";

export function MobileTopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (pathname && !pathname.startsWith('/search')) {
      setSearchQuery('');
    }
  }, [pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-[100vw] h-[60px] bg-ds-bg z-40 flex items-center px-4 md:hidden overflow-hidden gap-[16px] box-border">
      {/* Search Input */}
      <FeatureGuard featureKey="enableGlobalSearch" mode="silent">
        <div className="flex-1 flex flex-row items-center justify-between border-b border-[#3F3F46] pb-1 ml-2">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent outline-none font-['DM_Sans'] text-[15px] text-[#A1A1AA] placeholder:text-[#A1A1AA] w-full pl-2"
          />
          <Icon
            name="search"
            className="w-[20px] h-[20px] text-[#A1A1AA] shrink-0 cursor-pointer mr-1"
            onClick={() => {
              if (searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          />
        </div>
      </FeatureGuard>

      {/* Actions */}
      <div className="flex items-center gap-[16px] shrink-0 pr-4 ml-auto">
        <Link href="/messaging" className="cursor-pointer shrink-0 group">
          <Icon name="chat" className="w-[20px] h-[20px] text-[#A1A1AA] group-hover:text-[#EC6229] transition-colors" />
        </Link>
        <div className="shrink-0">
          <FeatureGuard featureKey="enableNotificationsModule" mode="silent">
            <NotificationPopover
              className="group relative flex flex-row items-center justify-center bg-transparent transition-colors"
              icon={<Icon name="notification" className="w-[22px] h-[22px] text-[#A1A1AA] group-hover:text-[#EC6229] group-data-[state=open]:text-[#EC6229] transition-colors" />}
            />
          </FeatureGuard>
        </div>
      </div>
    </header>
  );
}

export default MobileTopHeader;
