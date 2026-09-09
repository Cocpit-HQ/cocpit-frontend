"use client";

import React, { useState } from "react";
import { Icon } from "@/components/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationPopover } from "@/features/notification/components/NotificationPopover";

export function MobileTopHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-[100vw] h-[60px] bg-ds-bg z-40 flex items-center px-4 md:hidden overflow-hidden gap-[16px] box-border">
      {/* Search Input */}
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

      {/* Actions */}
      <div className="flex items-center gap-[16px] shrink-0 pr-4">
        <Link href="/messaging" className="cursor-pointer shrink-0 group">
          <Icon name="chat" className="w-[20px] h-[20px] text-[#A1A1AA] group-hover:text-[#EC6229] transition-colors" />
        </Link>
        <div className="shrink-0">
          <NotificationPopover
            className="group relative flex flex-row items-center justify-center bg-transparent transition-colors"
            icon={<Icon name="notification" className="w-[22px] h-[22px] text-[#A1A1AA] group-hover:text-[#EC6229] group-data-[state=open]:text-[#EC6229] transition-colors" />}
          />
        </div>
      </div>
    </header>
  );
}

export default MobileTopHeader;
