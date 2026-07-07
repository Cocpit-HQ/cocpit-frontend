"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  const [activeTab, setActiveTab] = useState("profile");

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
        <div className="flex items-center gap-4 w-full h-[56px] pb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-gray-300 dark:border-zinc-800 flex items-center justify-center text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[20px] font-semibold text-gray-900 dark:text-white leading-[28px]">
              Edit page
            </h1>
            <span className="text-[12px] text-gray-500 dark:text-zinc-400">
              Update your page details and save your changes.
            </span>
          </div>
        </div>

        {/* Tab Controls and Panels */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* Scrollable Tabs List */}
          <Tabs.List className="flex gap-[16px] h-10 items-center p-0 mb-6">
            {[
              { name: "Profile", value: "profile" },
              { name: "About", value: "about" },
              { name: "Verification", value: "verification" },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="flex justify-center items-center px-4 py-1.5 h-10 text-[14px] leading-5 font-semibold rounded-[24px] border border-[#6B7280] bg-white dark:bg-zinc-950 text-[#6B7280] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all data-[state=active]:bg-[#E8F1FF] dark:data-[state=active]:bg-blue-950/40 data-[state=active]:text-[#1A73E8] data-[state=active]:border-transparent outline-none cursor-pointer"
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
