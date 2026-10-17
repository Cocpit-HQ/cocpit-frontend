"use client";

import React from "react";
import { AddPlusIcon } from "@/components/icons";

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

  return (
    <div className="w-full max-w-[800px] pl-5 flex flex-row justify-between items-center select-none flex-wrap gap-4">
      {/* Tab Buttons */}
      <div className="flex flex-row items-center gap-3 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="inline-flex flex-col justify-start items-center cursor-pointer transition-colors"
            >
              <div className="px-3 py-1.5 flex flex-col justify-center items-center">
                <span
                  className={`text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-[var(--ds-text-primary)]"
                      : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
              {isSelected ? (
                <div className="w-full h-0 outline outline-[1.5px] outline-[var(--ds-accent)]" />
              ) : (
                <div className="w-full h-0 outline outline-[1.5px] outline-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Button for Current Tab */}
      {isOwnProfile && onAddClick && (
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
      )}
    </div>
  );
};

export default ProfileTabs;
