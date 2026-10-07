"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type ProfileEditTabKey = "profile" | "skills" | "experience" | "education" | "project";

export interface TabItem {
  key: ProfileEditTabKey;
  label: string;
}

export const PROFILE_EDIT_TABS: TabItem[] = [
  { key: "profile", label: "Profile" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "project", label: "Project" },
];

const TAB_CONFIG: Record<ProfileEditTabKey, { widthClass: string; orderClass: string }> = {
  profile: { widthClass: "w-[72px]", orderClass: "order-0" },
  skills: { widthClass: "w-[62px]", orderClass: "order-1" },
  experience: { widthClass: "w-[109px]", orderClass: "order-2" },
  education: { widthClass: "w-[101px]", orderClass: "order-3" },
  project: { widthClass: "w-[78px]", orderClass: "order-4" },
};

interface ProfileEditTabsProps {
  activeTab: ProfileEditTabKey;
  onTabChange: (tab: ProfileEditTabKey) => void;
  tabs?: TabItem[];
}

export const ProfileEditTabs: React.FC<ProfileEditTabsProps> = ({
  activeTab,
  onTabChange,
  tabs = PROFILE_EDIT_TABS,
}) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const setTabRef = useCallback((key: string) => (el: HTMLButtonElement | null) => {
    tabRefs.current[key] = el;
  }, []);

  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <div className="w-full h-[36px] flex flex-row items-center gap-[12px] overflow-x-auto scrollbar-hide border-b border-transparent">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const config = TAB_CONFIG[tab.key] || { widthClass: "w-auto", orderClass: "order-0" };
        return (
          <button
            key={tab.key}
            ref={setTabRef(tab.key)}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative h-[36px] flex flex-col items-center justify-center p-0 flex-none grow-0 font-['DM_Sans'] font-medium text-[16px] leading-[24px] whitespace-nowrap transition-colors cursor-pointer focus:outline-none",
              config.widthClass,
              config.orderClass,
              isActive
                ? "text-[var(--ds-text-primary)] border-b-2 border-[var(--ds-accent)]"
                : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] border-b-2 border-transparent"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ProfileEditTabs;
