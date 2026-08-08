"use client";

import React, { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import CompanyEditProfileTab from "./CompanyEditProfileTab";
import CompanyEditAboutTab from "./CompanyEditAboutTab";
import CompanyEditVerificationTab from "./CompanyEditVerificationTab";

export default function CompanyProfileEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string || "nexsus-global-systems";
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/organization/${slug}/edit?${params.toString()}`);
  };

  const { data: profileData } = useQuery({
    queryKey: ["orgProfile", slug],
    queryFn: () => companyProfileService.getOrgProfile(slug),
  });
  
  const orgId = profileData?.org?.org_id || profileData?.org?.id || profileData?.id || profileData?.orgId || slug;

  const handleBack = () => {
    router.push(`/organization/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-poppins pb-20">
      {/* Outer wrapper keeping same alignment formula as organization profile page */}
      <div 
        style={{ marginLeft: "max(0px, calc((100% - 998px) / 2))" }}
        className="w-full max-w-[960px] sm:px-4 md:px-0 pt-[20px] flex flex-col gap-6"
      >
        
        {/* Header with back button */}
        <div className="flex items-center gap-[16px] w-full max-w-[928px] h-[48px] mb-[24px]">
          <button
            onClick={handleBack}
            className="w-[48px] h-[48px] shrink-0 rounded-[100px] border border-[#DADADA] flex items-center justify-center text-[#6B7280] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 text-[#6B7280]" />
          </button>
          <div className="flex flex-col justify-center h-[42px]">
            <h1 className="text-[18px] font-medium text-black dark:text-white leading-[26px]">
              Edit page
            </h1>
            <span className="text-[12px] font-normal text-[#6B7280] dark:text-zinc-400 leading-[16px]">
              Update your page details and save your changes.
            </span>
          </div>
        </div>

        {/* Tab Controls and Panels */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* Scrollable Tabs List */}
          <Tabs.List className="flex gap-[16px] items-center p-0 mb-[24px]">
            {[
              { name: "Profile", value: "profile" },
              { name: "About", value: "about" },
              { name: "Verification", value: "verification" },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="flex justify-center items-center px-[16px] h-[40px] text-[12px] leading-[20px] font-normal rounded-[24px] border border-[#1A73E8] bg-white dark:bg-zinc-950 text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all data-[state=active]:bg-[#E8F1FF] dark:data-[state=active]:bg-blue-900/40 data-[state=active]:font-medium data-[state=active]:border-transparent outline-none cursor-pointer"
              >
                {tab.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Profile Tab Panel */}
          <Tabs.Content value="profile" className="outline-none">
            <CompanyEditProfileTab onCancel={handleBack} orgId={orgId} />
          </Tabs.Content>

          {/* About Tab Panel */}
          <Tabs.Content value="about" className="outline-none">
            <CompanyEditAboutTab onCancel={handleBack} orgId={orgId} />
          </Tabs.Content>

          {/* Verification Tab Panel */}
          <Tabs.Content value="verification" className="outline-none">
            <CompanyEditVerificationTab onCancel={handleBack} orgId={orgId} />
          </Tabs.Content>

        </Tabs.Root>

      </div>
    </div>
  );
}
