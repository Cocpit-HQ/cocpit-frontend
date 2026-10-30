"use client";

import React, { useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SettingToggle } from '../components/SettingToggle';
import { MobileSettingsHeader } from '../components/MobileSettingsView';
import { useCompanyPrivacySettings } from '../hooks/useCompanyPrivacySettings';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { businessProfileService, useCompanyPermissions } from '@/features/businessProfile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PrivacySettings } from '@/services/api/settings';

const VISIBILITY_OPTIONS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'followers_only', label: 'Followers Only' },
  { id: 'no_one', label: 'No One' },
] as const;

type VisibilityField = 'tagPermission' | 'followingVisibility' | 'followersVisibility' | 'messagePermission';

interface VisibilitySectionConfig {
  field: VisibilityField;
  title: string;
  description: string;
}

const VISIBILITY_SECTIONS: VisibilitySectionConfig[] = [
  {
    field: 'tagPermission',
    title: 'Who Can Tag You',
    description: 'Control who is allowed to tag you across COCPIT.',
  },
  {
    field: 'followingVisibility',
    title: 'Who can see your following',
    description: 'Control who is allowed to see your following',
  },
  {
    field: 'followersVisibility',
    title: 'Who can see your followers',
    description: 'Control who is allowed to see your followers',
  },
  {
    field: 'messagePermission',
    title: 'Who can message you',
    description: 'Control who can send direct messages to your company',
  },
];

export function CompanyPrivacySettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { activeProfile, updateActiveProfile, refreshProfile } = useActiveProfile();

  const { settings, isLoading, updateSettings } = useCompanyPrivacySettings();

  const slug = activeProfile?.slug || pathname.match(/\/organization\/([^\/]+)/)?.[1] || '';

  // Query live organization profile so verification status is always fresh without needing full page refresh
  const { data: profileData } = useQuery({
    queryKey: ["orgProfile", slug],
    queryFn: () => businessProfileService.getOrgProfile(slug),
    enabled: !!slug,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const org = profileData?.org || profileData?.organization || profileData || {};

  const companyPerms = useCompanyPermissions(activeProfile?.viewer_role_data ? activeProfile : org);
  const canVerify = Boolean(
    companyPerms.isOwner ||
    companyPerms.isAdmin ||
    companyPerms.canVerify ||
    companyPerms.checkPermission('MANAGE_VERIFICATION') ||
    companyPerms.checkPermission('*')
  );

  const isOrgVerified = Boolean(
    org.isVerified ||
    org.is_verified ||
    org.verification_status === 'VERIFIED' ||
    org.verification_status === 'DOMAIN_VERIFIED' ||
    org.verification_status === 'DOCUMENT_VERIFIED'
  );

  const isVerified = Boolean(
    isOrgVerified ||
    activeProfile?.verification_status === 'VERIFIED' ||
    activeProfile?.verification_status === 'DOMAIN_VERIFIED' ||
    activeProfile?.verification_status === 'DOCUMENT_VERIFIED' ||
    activeProfile?.is_identity_verified ||
    (activeProfile as any)?.is_verified ||
    (activeProfile as any)?.isVerified
  );

  // Sync active profile if backend org verification status changed
  useEffect(() => {
    if (isOrgVerified && activeProfile && activeProfile.verification_status !== 'VERIFIED') {
      if (updateActiveProfile) {
        updateActiveProfile({
          verification_status: org.verification_status || 'VERIFIED',
          is_identity_verified: true,
        });
      }
      if (refreshProfile) {
        void refreshProfile();
      }
    }
  }, [isOrgVerified, org.verification_status, activeProfile, updateActiveProfile, refreshProfile]);

  const handleVerifyClick = useCallback(() => {
    if (!canVerify) return;
    if (slug) {
      router.push(`/organization/${slug}/verify`);
    } else {
      router.push('/organization');
    }
  }, [canVerify, router, slug]);

  const handleToggle = useCallback(
    (key: 'showEmail' | 'showPhone', nextVal: boolean) => {
      updateSettings({ [key]: nextVal });
    },
    [updateSettings]
  );

  const handleOptionChange = useCallback(
    (field: VisibilityField, value: 'everyone' | 'followers_only' | 'no_one') => {
      updateSettings({ [field]: value });
    },
    [updateSettings]
  );

  return (
    <div className="w-full max-w-[712px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-2 rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Mobile Header: < Privacy */}
      <MobileSettingsHeader title="Privacy" />

      {/* Desktop Section Header: Profile visibility (visible on desktop md+) */}
      <div className="hidden md:block self-stretch px-3 sm:px-4 pb-1">
        <div className="ds-text-body-2 text-ds-text-primary">Profile visibility</div>
      </div>

      <div className="w-full px-4 md:px-4 py-0 md:py-1 flex flex-col gap-4">
        {/* Section 1: Visibility Toggles */}
        <div className="self-stretch flex flex-col justify-start items-start pb-4 border-b border-ds-border">
          {/* Show email on profile */}
          <div className="self-stretch py-2 flex flex-row justify-between items-center gap-3">
            <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
              <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Show email on profile
              </div>
              <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                Let other see your email on your public profile
              </div>
            </div>
            <SettingToggle
              checked={settings?.showEmail ?? false}
              onChange={(nextVal) => handleToggle('showEmail', nextVal)}
              disabled={isLoading}
              ariaLabel="Toggle show email on profile"
            />
          </div>

          {/* Show phone number on profile */}
          <div className="self-stretch py-2 flex flex-row justify-between items-center gap-3">
            <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
              <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Show phone number on profile
              </div>
              <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                Let other see your phone number on your public profile
              </div>
            </div>
            <SettingToggle
              checked={settings?.showPhone ?? false}
              onChange={(nextVal) => handleToggle('showPhone', nextVal)}
              disabled={isLoading}
              ariaLabel="Toggle show phone number on profile"
            />
          </div>
        </div>

        {/* Section 2: Account Verification */}
        <div className="self-stretch py-2 pb-4 inline-flex justify-between items-center border-b border-ds-border">
          <div className="inline-flex flex-col justify-center items-start">
            <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
              Account verification
            </div>
            <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              {isVerified ? "Your identity has been verified" : "Verify your identity to unlock more features"}
            </div>
          </div>
          {isVerified ? (
            <div
              className="flex flex-row justify-center items-center px-3 py-1.5 gap-2.5 w-[82px] h-[36px] border border-ds-success rounded-[100px] select-none cursor-default shrink-0 pointer-events-none"
              aria-disabled="true"
            >
              <span className="w-[58px] h-6 flex justify-center items-center text-ds-success font-['DM_Sans'] font-medium text-base leading-6">
                Verified
              </span>
            </div>
          ) : !canVerify ? (
            <TooltipProvider>
              <Tooltip delayDuration={100} enableTouch>
                <TooltipTrigger asChild>
                  <span className="inline-block cursor-not-allowed">
                    <button
                      type="button"
                      onClick={handleVerifyClick}
                      className="w-[68px] h-[36px] rounded-[100px] border border-ds-border text-ds-text-primary flex justify-center items-center transition-colors cursor-not-allowed shrink-0"
                    >
                      <span className="justify-start text-base font-medium font-['DM_Sans'] leading-6">
                        Verify
                      </span>
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs font-['DM_Sans'] z-50">
                  You don't have access to verify on the behalf of company
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              type="button"
              onClick={handleVerifyClick}
              className="w-[68px] h-[36px] rounded-[100px] border border-ds-border hover:border-ds-accent text-ds-text-primary hover:text-ds-accent flex justify-center items-center transition-colors cursor-pointer shrink-0"
            >
              <span className="justify-start text-base font-medium font-['DM_Sans'] leading-6">
                Verify
              </span>
            </button>
          )}
        </div>

        {/* Sections 3 to 6: Tagging, Following, Followers, and Messaging Visibility */}
        {VISIBILITY_SECTIONS.map((section, idx) => {
          const currentValue = (settings as any)?.[section.field] || 'everyone';
          const isLastSection = idx === VISIBILITY_SECTIONS.length - 1;

          return (
            <div
              key={section.field}
              className={`self-stretch flex flex-col justify-start items-start gap-3 pb-4 ${
                !isLastSection ? 'border-b border-ds-border' : ''
              }`}
            >
              <div className="flex flex-col justify-start items-start">
                <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                  {section.title}
                </div>
                <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                  {section.description}
                </div>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const isSelected = !isLoading && currentValue === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionChange(section.field, opt.id)}
                      className="self-stretch py-3 rounded-xl inline-flex justify-between items-center cursor-pointer group select-none"
                    >
                      <div className="justify-center text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5">
                        {opt.label}
                      </div>
                      {isSelected ? (
                        <div className="size-6 p-1.5 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-ds-accent flex justify-center items-center gap-2.5 shrink-0">
                          <div className="size-2 bg-ds-accent rounded-full shrink-0" />
                        </div>
                      ) : (
                        <div className="size-6 relative shrink-0">
                          <div className="size-6 left-0 top-0 absolute rounded-[100px] border-[1.5px] border-ds-text-muted group-hover:border-ds-text-secondary transition-colors" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
