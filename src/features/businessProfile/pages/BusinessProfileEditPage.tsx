"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessProfileService } from "../services/businessProfile.service";
import BusinessEditProfileTab from "../components/edit/BusinessEditProfileTab";
import BusinessEditAboutTab from "../components/edit/BusinessEditAboutTab";
import { BusinessBuildingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AccessDenied } from "@/features/access-denied";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export function BusinessProfileEditPage() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const slug = decodeURIComponent(rawSlug);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "about" ? "about" : "profile";

  const { activeProfile } = useActiveProfile();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["orgProfile", rawSlug],
    queryFn: () => businessProfileService.getOrgProfile(rawSlug),
  });

  const actingCompanyRole = activeProfile?.viewer_role_data;
  const actingRoleName = (actingCompanyRole?.name || profileData?.viewer_role || "").toLowerCase();
  const isOwner = Boolean(
    actingCompanyRole?.is_owner ||
    profileData?.is_own_profile ||
    actingRoleName === "owner"
  );
  const isAdmin = actingRoleName === "admin";
  const actingPermissions: string[] =
    actingCompanyRole?.permissions ||
    profileData?.viewer_permissions ||
    [];
  const canEditCompany = isOwner || isAdmin || actingPermissions.includes("*") || actingPermissions.includes("MANAGE_COMPANY_DETAILS");

  useEffect(() => {
    if (mounted && canEditCompany) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mounted, canEditCompany]);

  const setActiveTab = (tab: "profile" | "about") => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    router.replace(`/organization/${rawSlug}/edit?${p.toString()}`);
  };

  const org = profileData?.org || profileData || {};
  const orgId = org.org_id || org.company_id || org.id || profileData?.orgId || rawSlug;
  const orgName = org.name || "";
  const logoUrl = org.logo_url || org.logoUrl || undefined;
  const coverUrl = org.cover_url || org.coverUrl || undefined;

  const handleClose = () => {
    router.push(`/organization/${rawSlug}`);
  };

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-bg)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--ds-accent)]" />
      </div>
    );
  }

  if (!canEditCompany) {
    return (
      <AccessDenied
        title="You don't have access to this screen"
        roleName={actingCompanyRole?.name || profileData?.viewer_role || 'Member'}
      />
    );
  }

  const content = (
    <div className="fixed inset-0 z-[60] min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] flex flex-col items-center overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200">
      {/* Top right close button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed top-8 right-8 md:top-10 md:right-10 z-[70] p-2 text-ds-text-primary hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
        aria-label="Close edit mode"
      >
        <X className="w-5 h-5 text-ds-text-primary" />
      </button>

      {/* Main Centered Container (Profile: 800px, About: 640px matching Figma) */}
      <div
        className={cn(
          "w-full mx-auto px-4 pt-[60px] pb-24 flex flex-col items-center gap-5 relative transition-[max-width] duration-150",
          activeTab === "about" ? "max-w-[640px]" : "max-w-[800px]"
        )}
      >
        
        {/* Header Breadcrumb */}
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={orgName}
              className="w-8 h-8 rounded-lg object-cover bg-[var(--ds-surface-1)] border border-[var(--ds-border)] shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--ds-surface-2)] border border-[var(--ds-border)] flex items-center justify-center shrink-0">
              <BusinessBuildingIcon className="w-4 h-4 text-[var(--ds-text-primary)]" size={16} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[var(--ds-text-primary)] text-base font-normal font-['DM_Sans'] leading-6">
              {orgName}
            </span>
            <span className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
            <span className="text-[var(--ds-text-muted)] text-base font-normal font-['DM_Sans'] leading-6">
              {activeTab === "profile" ? "Edit profile" : "Edit about"}
            </span>
          </div>
        </div>

        {/* Tab Switcher (Matching Figma Frame 2609634) */}
        <div className="self-stretch inline-flex justify-start items-center gap-3">
          {/* Profile Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="inline-flex flex-col justify-start items-center cursor-pointer group focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
              <div className="inline-flex justify-center items-center gap-1">
                <span
                  className={cn(
                    "text-base font-medium font-['DM_Sans'] leading-6 transition-colors",
                    activeTab === "profile"
                      ? "text-ds-text-primary"
                      : "text-ds-text-secondary group-hover:text-ds-text-primary"
                  )}
                >
                  Profile
                </span>
              </div>
            </div>
            {activeTab === "profile" ? (
              <div className="self-stretch h-[2px] bg-[var(--ds-accent)]" />
            ) : (
              <div className="self-stretch h-[2px] bg-transparent" />
            )}
          </button>

          {/* About Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className="inline-flex flex-col justify-start items-center cursor-pointer group focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
              <div className="inline-flex justify-center items-center gap-1">
                <span
                  className={cn(
                    "text-base font-medium font-['DM_Sans'] leading-6 transition-colors",
                    activeTab === "about"
                      ? "text-ds-text-primary"
                      : "text-ds-text-secondary group-hover:text-ds-text-primary"
                  )}
                >
                  About
                </span>
              </div>
            </div>
            {activeTab === "about" ? (
              <div className="self-stretch h-[2px] bg-[var(--ds-accent)]" />
            ) : (
              <div className="self-stretch h-[2px] bg-transparent" />
            )}
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === "profile" ? (
          <BusinessEditProfileTab
            onCancel={handleClose}
            orgId={orgId}
            currentLogoUrl={logoUrl}
            currentCoverUrl={coverUrl}
            currentOrgName={orgName}
          />
        ) : (
          <BusinessEditAboutTab
            onCancel={handleClose}
            orgId={orgId}
            orgProfile={org}
          />
        )}
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}

export default BusinessProfileEditPage;
