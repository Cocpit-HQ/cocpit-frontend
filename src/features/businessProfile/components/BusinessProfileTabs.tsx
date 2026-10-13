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

export interface BusinessProfileTabsProps {
  data: BusinessProfileData;
  isOwnProfile: boolean;
  canManageCompany?: boolean;
  currentUserId?: string;
  canManageOwnPosts?: boolean;
  viewerPermissions?: string[];
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

  React.useEffect(() => {
    if (tabParam) {
      setActiveTab(normalizeTab(tabParam, isEdu));
    }
  }, [tabParam, isEdu]);

  const handleTabChange = (value: string) => {
    const normalized = normalizeTab(value, isEdu);
    setActiveTab(normalized);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("tab", normalized);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { label: "Home", value: "home" },
    { label: "About", value: "about" },
    { label: "Post", value: "posts" },
    { label: "Jobs", value: "jobs" },
    { label: isEdu ? "Alumni" : "People", value: activeTabKey },
  ];

  return (
    <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="w-full mt-2">
      {/* Tabs Header: w-[800px] pl-5 inline-flex justify-start items-center gap-3 */}
      <Tabs.List className="w-full max-w-[800px] pl-5 inline-flex justify-start items-center gap-3 border-b border-transparent">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.value;
          return (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="inline-flex flex-col justify-start items-center cursor-pointer group outline-none select-none p-0 bg-transparent border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded-sm"
            >
              <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
                <div className="inline-flex justify-center items-center gap-1">
                  <span
                    className={cn(
                      "text-base font-medium font-['DM_Sans'] leading-6 transition-colors",
                      isSelected
                        ? "text-[var(--ds-text-primary)]"
                        : "text-[var(--ds-text-secondary)] group-hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              </div>
              {isSelected ? (
                <div className="self-stretch h-[2px] bg-[var(--ds-accent)]" />
              ) : (
                <div className="self-stretch h-[2px] bg-transparent" />
              )}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>

      <TabPermissionGuard activeTab={activeTab}>
        <Tabs.Content value="home" className="mt-4 outline-none">
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

        <Tabs.Content value="about" className="mt-4 outline-none">
          <AboutTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>

        <Tabs.Content value="jobs" className="mt-4 outline-none">
          <JobsTab
            data={data}
            isOwnProfile={isOwnProfile}
            canManageCompany={canManageCompany}
            viewerPermissions={viewerPermissions}
          />
        </Tabs.Content>

        <Tabs.Content value="posts" className="mt-4 outline-none">
          <PostsTab
            data={data}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}
            canManageOwnPosts={canManageOwnPosts}
            viewerPermissions={viewerPermissions}
          />
        </Tabs.Content>

        <Tabs.Content value="people" className="mt-4 outline-none">
          <PeopleTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>

        <Tabs.Content value="alumni" className="mt-4 outline-none">
          <PeopleTab data={data} isOwnProfile={isOwnProfile} />
        </Tabs.Content>
      </TabPermissionGuard>
    </Tabs.Root>
  );
}

export default BusinessProfileTabs;
