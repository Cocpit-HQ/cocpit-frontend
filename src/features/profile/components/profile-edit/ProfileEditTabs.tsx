"use client";

import React from "react";
import { UnderlineTabs, TabItem } from "@/components/ui/UnderlineTabs";

export type ProfileEditTabKey = "profile" | "skills" | "experience" | "education" | "project";

export type { TabItem } from "@/components/ui/UnderlineTabs";

export interface ProfileEditTabItem {
  key: ProfileEditTabKey;
  label: string;
}

export const PROFILE_EDIT_TABS: ProfileEditTabItem[] = [
  { key: "profile", label: "Profile" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "project", label: "Project" },
];

interface ProfileEditTabsProps {
  activeTab: ProfileEditTabKey;
  onTabChange: (tab: ProfileEditTabKey) => void;
  tabs?: ProfileEditTabItem[];
}

export const ProfileEditTabs: React.FC<ProfileEditTabsProps> = ({
  activeTab,
  onTabChange,
  tabs = PROFILE_EDIT_TABS,
}) => {
  const tabItems: TabItem<ProfileEditTabKey>[] = tabs.map((t) => ({
    id: t.key,
    label: t.label,
  }));

  return (
    <div className="w-full">
      <UnderlineTabs
        tabs={tabItems}
        activeTab={activeTab}
        onChange={onTabChange}
      />
    </div>
  );
};

export default ProfileEditTabs;
