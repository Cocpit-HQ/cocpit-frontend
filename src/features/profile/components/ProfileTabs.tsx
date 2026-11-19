"use client";

import React from "react";
import { AddPlusIcon } from "@/components/icons";
import { UnderlineTabs, TabItem } from "@/components/ui/UnderlineTabs";

export type ProfileTabType = "posts" | "experience" | "education" | "projects" | "skills";

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  isOwnProfile?: boolean;
  onAddClick?: () => void;
}

const TABS: { id: ProfileTabType; label: string; actionLabel: string }[] = [
  { id: "posts", label: "Posts", actionLabel: "Create post" },
  { id: "experience", label: "Experience", actionLabel: "Add experience" },
  { id: "education", label: "Education", actionLabel: "Add education" },
  { id: "projects", label: "Projects", actionLabel: "Add project" },
  { id: "skills", label: "Skills", actionLabel: "Add skills" },
];

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  isOwnProfile = true,
  onAddClick,
}) => {
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const tabItems: TabItem<ProfileTabType>[] = TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
  }));

  const rightAction = isOwnProfile && onAddClick ? (
    <button
      type="button"
      onClick={onAddClick}
      className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex items-center justify-center gap-2 transition-all cursor-pointer flex-shrink-0"
    >
      <div className="w-4 h-4 flex-none order-0 flex-grow-0 relative flex items-center justify-center">
        <AddPlusIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
      </div>
      <span className="text-[var(--ds-text-primary)] text-sm font-medium font-['DM_Sans'] leading-5 whitespace-nowrap">
        {currentTab.actionLabel}
      </span>
    </button>
  ) : undefined;

  return (
    <div className="w-full max-w-[800px] pl-5 flex flex-row justify-between items-center select-none flex-wrap gap-4">
      <UnderlineTabs
        tabs={tabItems}
        activeTab={activeTab}
        onChange={onTabChange}
        rightElement={rightAction}
      />
    </div>
  );
};

export default ProfileTabs;
