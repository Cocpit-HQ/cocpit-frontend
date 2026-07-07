"use client";

import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { CompanyProfileData } from "../../types/company-profile.types";
import HomeTab from "./tabs/HomeTab";
import AboutTab from "./tabs/AboutTab";
import PostsTab from "./tabs/PostsTab";
import JobsTab from "./tabs/JobsTab";
import PeopleTab from "./tabs/PeopleTab";

interface CompanyProfileTabsProps {
  data: CompanyProfileData;
  isOwnProfile: boolean;
}

export default function CompanyProfileTabs({ data, isOwnProfile }: CompanyProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState("home");

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full mt-0">

      {/* Scrollable Tabs List */}
      <Tabs.List className="flex w-full md:w-[428px] h-[36px] items-start gap-[16px] p-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {[
          { label: "Home", value: "home" },
          { label: "About", value: "about" },
          { label: "Posts", value: "posts" },
          { label: "Jobs", value: "jobs" },
          { label: data.entityType === "INSTITUTE" ? "Alumni" : "People", value: "people" }
        ].map((tab) => {
          return (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex justify-center items-center px-4 py-2 h-[36px] text-[14px] leading-[20px] text-black dark:text-zinc-300 font-normal hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors data-[state=active]:text-[#1A73E8] data-[state=active]:font-semibold data-[state=active]:border-b data-[state=active]:border-[#1A73E8] outline-none"
            >
              {tab.label}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>

      {/* Home Tab Content */}
      <Tabs.Content value="home" className="mt-6 outline-none">
        <HomeTab data={data} isOwnProfile={isOwnProfile} onTabChange={setActiveTab} />
      </Tabs.Content>

      <Tabs.Content value="about" className="mt-6 outline-none">
        <AboutTab data={data} />
      </Tabs.Content>

      <Tabs.Content value="posts" className="mt-6 outline-none">
        <PostsTab data={data} isOwnProfile={isOwnProfile} />
      </Tabs.Content>

      <Tabs.Content value="jobs" className="mt-6 outline-none">
        <JobsTab data={data} isOwnProfile={isOwnProfile} />
      </Tabs.Content>

      <Tabs.Content value="people" className="mt-6 outline-none">
        <PeopleTab data={data} />
      </Tabs.Content>

    </Tabs.Root>
  );
}
