"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { BusinessProfileData } from "../types/business-profile.types";
import { TabPermissionGuard } from "@/features/access-denied";
import HomeTab from "@/features/businessProfile/components/tabs/HomeTab";
import AboutTab from "@/features/businessProfile/components/tabs/AboutTab";
import PostsTab from "@/features/businessProfile/components/tabs/PostsTab";
import JobsTab from "@/features/businessProfile/components/tabs/JobsTab";
import PeopleTab from "@/features/businessProfile/components/tabs/PeopleTab";
import { cn } from "@/lib/utils";
import { UnderlineTabs, TabItem } from "@/components/ui/UnderlineTabs";

export interface BusinessProfileTabsProps {
  data: BusinessProfileData;
  isOwnProfile: boolean;
  canManageCompany?: boolean;
  currentUserId?: string;
  canManageOwnPosts?: boolean;
  viewerPermissions?: string[];
  isOrgAdminOrOwner?: boolean;
}

const normalizeTab = (tab: string | null | undefined, isEdu?: boolean): string => {
  if (!tab) return "home";
  const lower = tab.toLowerCase().trim();
  if (lower === "post") return "posts";
  if (lower === "job") return "jobs";
  if (isEdu && (lower === "people" || lower === "alumni")) return "alumni";
  if (!isEdu && (lower === "alumni" || lower === "people")) return "people";
  return lower;
};

export function BusinessProfileTabs({
  data,
  isOwnProfile,
  canManageCompany,
  currentUserId,
  canManageOwnPosts,
  viewerPermissions,
  isOrgAdminOrOwner,
}: BusinessProfileTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams?.get("tab");
  const isEdu =
    data.entityType === "INSTITUTION" ||
    (data as any)?.entity_type === "INSTITUTION" ||
    Boolean((data as any)?.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(((data as any)?.industry || "").toLowerCase().trim());
  const activeTabKey = isEdu ? "alumni" : "people";

  const [activeTab, setActiveTab] = React.useState(() => normalizeTab(tabParam, isEdu));

  const scrollToTab = React.useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  }, []);

  React.useEffect(() => {
    if (tabParam) {
      const normalized = normalizeTab(tabParam, isEdu);
      setActiveTab(normalized);
      scrollToTab();
    }
  }, [tabParam, isEdu, scrollToTab]);

  const handleTabChange = (value: string) => {
    const normalized = normalizeTab(value, isEdu);
    setActiveTab(normalized);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("tab", normalized);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTab();
  };

  const tabs: TabItem<string>[] = [
    { label: "Home", id: "home" },
    { label: "About", id: "about" },
    { label: "Post", id: "posts" },
    { label: "Jobs", id: "jobs" },
    { label: isEdu ? "Alumni" : "People", id: activeTabKey },
  ];

  return (
    <Tabs.Root
      id="business-profile-tabs"
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full scroll-mt-[70px] sm:scroll-mt-[110px]"
    >
      {/* Tabs Header: w-[800px] responsive px-4 / pl-5 overflow-x-auto */}
      <div className="w-full max-w-[800px] px-4 sm:px-0 sm:pl-5">
        <UnderlineTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <TabPermissionGuard
        activeTab={activeTab}
        viewerPermissions={viewerPermissions}
        canManageCompany={canManageCompany}
        isOwnProfile={isOwnProfile}
      >
        <Tabs.Content value="home" className="mt-5 outline-none">
          <HomeTab
            data={data}
            isOwnProfile={isOwnProfile}
            canManageCompany={canManageCompany}
            onTabChange={handleTabChange}
            currentUserId={currentUserId}
            canManageOwnPosts={canManageOwnPosts}
            viewerPermissions={viewerPermissions}
          />
        </Tabs.Content>

        <Tabs.Content value="about" className="mt-5 outline-none">
          <AboutTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>

        <Tabs.Content value="jobs" className="mt-5 outline-none">
          <JobsTab
            data={data}
            isOwnProfile={isOwnProfile}
            canManageCompany={canManageCompany}
            viewerPermissions={viewerPermissions}
            isOrgAdminOrOwner={isOrgAdminOrOwner}
          />
        </Tabs.Content>

        <Tabs.Content value="posts" className="mt-5 outline-none">
          <PostsTab
            data={data}
            isOwnProfile={isOwnProfile}
            canManageCompany={canManageCompany}
            currentUserId={currentUserId}
            canManageOwnPosts={canManageOwnPosts}
            viewerPermissions={viewerPermissions}
          />
        </Tabs.Content>

        <Tabs.Content value="people" className="mt-5 outline-none">
          <PeopleTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>

        <Tabs.Content value="alumni" className="mt-5 outline-none">
          <PeopleTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>
      </TabPermissionGuard>
    </Tabs.Root>
  );
}

export default BusinessProfileTabs;
