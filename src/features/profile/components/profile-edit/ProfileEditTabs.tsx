"use client";

import React from "react";
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
  return (
    <div className="w-full md:w-[800px] md:max-w-full h-[36px] flex flex-row items-center gap-[12px] overflow-x-auto scrollbar-hide border-b border-transparent">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative h-[36px] flex flex-col items-center justify-center px-1 font-['DM_Sans'] font-medium text-[16px] leading-[24px] whitespace-nowrap transition-colors cursor-pointer focus:outline-none",
              isActive
                ? "text-[var(--ds-text-primary)]"
                : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--ds-accent)] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ProfileEditTabs;
