"use client";

import React, { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SettingToggle } from '../components/SettingToggle';
import { useCompanyPrivacySettings } from '../hooks/useCompanyPrivacySettings';

const COMPANY_TAG_OPTIONS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'followers_only', label: 'Followers Only' },
  { id: 'no_one', label: 'No One' },
] as const;

export function CompanyPrivacySettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '';

  const { settings, isLoading, updateSettings } = useCompanyPrivacySettings();

  const handleToggle = useCallback(
    (key: 'showEmail' | 'showPhone', nextVal: boolean) => {
      updateSettings({ [key]: nextVal });
    },
    [updateSettings]
  );

  const handleTaggingChange = useCallback(
    (value: 'everyone' | 'followers_only' | 'no_one') => {
      updateSettings({ tagPermission: value });
    },
    [updateSettings]
  );

  return (
    <div className="w-full max-w-[712px] p-[8px_0px] flex flex-col items-start gap-2 rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Header / Mobile Back - Fixed */}
      <div className="self-stretch inline-flex justify-start items-center gap-3 shrink-0 px-3 sm:px-4 pb-1">
        <button
          type="button"
          onClick={() => router.replace(basePath)}
          aria-label="Back to settings menu"
          className="-ml-1.5 flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Privacy</div>
      </div>

      <div className="w-full px-3 sm:px-4 py-1 flex flex-col gap-4">
        {/* Section 1: Contact Details Visibility */}
        <div className="self-stretch flex flex-col justify-start items-start pb-4 border-b border-ds-border">
          {/* Show business email */}
          <div className="self-stretch py-2 flex flex-row justify-between items-center gap-3">
            <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
              <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Show business email
              </div>
              <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                Allow visitors to view the organization contact email
              </div>
            </div>
            <SettingToggle
              checked={settings?.showEmail ?? false}
              onChange={(nextVal) => handleToggle('showEmail', nextVal)}
              disabled={isLoading}
              ariaLabel="Toggle show business email"
            />
          </div>

          {/* Show business phone */}
          <div className="self-stretch py-2 flex flex-row justify-between items-center gap-3">
            <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
              <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Show business phone
              </div>
              <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                Allow visitors to view the organization phone number
              </div>
            </div>
            <SettingToggle
              checked={settings?.showPhone ?? false}
              onChange={(nextVal) => handleToggle('showPhone', nextVal)}
              disabled={isLoading}
              ariaLabel="Toggle show business phone"
            />
          </div>
        </div>

        {/* Section 2: Who Can Tag This Organization */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3">
          <div className="flex flex-col justify-start items-start">
            <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
              Who Can Tag This Organization
            </div>
            <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Control who is allowed to tag this organization in posts and updates.
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            {COMPANY_TAG_OPTIONS.map((opt) => {
              const isSelected = (settings?.tagPermission || 'everyone') === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleTaggingChange(opt.id)}
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

      </div>
    </div>
  );
}
