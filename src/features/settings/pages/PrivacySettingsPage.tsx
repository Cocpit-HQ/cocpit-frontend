"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Smartphone, Laptop, Tablet, LogOut, ChevronLeft } from 'lucide-react';
import { SettingToggle } from '../components/SettingToggle';
import { VerifyIdentityModal } from '../components/VerifyIdentityModal';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { useActiveSessions } from '../hooks/useActiveSessions';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyProfile } from '@/hooks/use-my-profile';
import { ActiveSession } from '@/services/api/settings';

const TAG_OPTIONS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'connections_only', label: 'Connections Only' },
  { id: 'followers_only', label: 'Followers Only' },
  { id: 'no_one', label: 'No One' },
] as const;

const DEFAULT_FALLBACK_SESSIONS: ActiveSession[] = [
  {
    id: 'current-macbook',
    type: 'laptop',
    device: 'MacBook Pro 16"',
    location: 'San Francisco, USA',
    createdAt: '',
    isCurrent: true,
  },
  {
    id: 'iphone-session',
    type: 'phone',
    device: 'iPhone 15 Pro',
    location: 'Austin, USA 2 hours ago',
    createdAt: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 'ipad-session',
    type: 'tablet' as any,
    device: 'iPad Air',
    location: 'San Francisco, USA Dec 14, 2023',
    createdAt: 'Dec 14, 2023',
    isCurrent: false,
  },
];

function formatSessionDate(dateStr?: string) {
  if (!dateStr) return '';
  if (dateStr.includes('ago')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function PrivacySettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/privacy';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const { activeProfile } = useActiveProfile();
  const { data: myProfile } = useMyProfile();

  const { settings: privacy, isLoading: isPrivacyLoading, updateSettings } = usePrivacySettings();
  const { 
    sessions, 
    isLoading: isSessionsLoading, 
    logoutSession, 
    logoutOtherSessions,
    isLoggingOutOthers 
  } = useActiveSessions();

  const isUserVerified = Boolean(
    myProfile?.user?.is_identity_verified ||
    (myProfile?.user as any)?.is_verified ||
    (myProfile?.user as any)?.isVerified ||
    (myProfile?.user as any)?.verification_status === 'VERIFIED' ||
    (myProfile?.user as any)?.verification_status === 'approved' ||
    (privacy as any)?.is_verified ||
    (privacy as any)?.is_identity_verified ||
    (privacy as any)?.verification_status === 'VERIFIED' ||
    (activeProfile as any)?.is_identity_verified ||
    (activeProfile as any)?.is_verified ||
    activeProfile?.verification_status === 'VERIFIED' ||
    activeProfile?.verification_status === 'approved'
  );

  const isCompanyVerified = Boolean(
    activeProfile?.type === 'COMPANY' && (
      activeProfile?.verification_status === 'VERIFIED' ||
      activeProfile?.verification_status === 'DOMAIN_VERIFIED'
    )
  );

  const isVerified = activeProfile?.type === 'COMPANY' ? isCompanyVerified : isUserVerified;

  const handleToggle = useCallback(
    (key: 'showEmail' | 'showPhone', nextVal: boolean) => {
      updateSettings({ [key]: nextVal });
    },
    [updateSettings]
  );

  const handleTaggingChange = useCallback(
    (value: 'everyone' | 'connections_only' | 'followers_only' | 'no_one') => {
      updateSettings({ tagPermission: value });
    },
    [updateSettings]
  );

  const displaySessions = (sessions && sessions.length > 0) ? sessions : DEFAULT_FALLBACK_SESSIONS;

  return (
    <div className="w-full max-w-[712px] p-[8px_0px] flex flex-col items-start gap-2 rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Header / Mobile Back - Fixed */}
      <div className="self-stretch inline-flex justify-start items-center gap-3 shrink-0 px-3 sm:px-4 pb-1">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          aria-label="Back to settings menu"
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Profile visibility</div>
      </div>

      <div className="w-full px-3 sm:px-4 py-1 flex flex-col gap-4">
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
              checked={privacy?.showEmail ?? false}
              onChange={(nextVal) => handleToggle('showEmail', nextVal)}
              disabled={isPrivacyLoading}
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
              checked={privacy?.showPhone ?? false}
              onChange={(nextVal) => handleToggle('showPhone', nextVal)}
              disabled={isPrivacyLoading}
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
          ) : (
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(true)}
              className="px-3 py-1.5 rounded-[100px] border border-ds-border hover:border-ds-accent text-ds-text-primary hover:text-ds-accent flex justify-center items-center gap-2.5 transition-colors cursor-pointer"
            >
              <span className="justify-start text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Verify
              </span>
            </button>
          )}
        </div>

        {/* Section 3: Who Can Tag You */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3 pb-4 border-b border-ds-border">
          <div className="flex flex-col justify-start items-start">
            <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
              Who Can Tag You
            </div>
            <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Control who is allowed to tag you across COCPIT.
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            {TAG_OPTIONS.map((opt) => {
              const isSelected = !isPrivacyLoading && (privacy?.tagPermission || 'everyone') === opt.id;
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

        {/* Section 4: Active Sessions */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3">
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
              Active sessions
            </div>
            <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Control how you share your information and manage device access.
            </div>
          </div>

          <div className="w-full flex flex-col justify-start items-start gap-3">
            {displaySessions.map((session) => {
              const isCurrent = session.isCurrent;
              const devName = session.device.toLowerCase();
              const isPhone = session.type === 'phone' || devName.includes('phone') || devName.includes('android');
              const isTablet = (session.type as string) === 'tablet' || devName.includes('ipad') || devName.includes('tablet');

              return (
                <div key={session.id} className="w-full py-2 flex justify-between items-center gap-3 sm:gap-4">
                  <div className="flex justify-start items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="size-12 bg-ds-surface-1 rounded-full flex justify-center items-center shrink-0">
                      {isPhone ? (
                        <Smartphone className="size-5 text-ds-text-primary" />
                      ) : isTablet ? (
                        <Tablet className="size-5 text-ds-text-primary" />
                      ) : (
                        <Laptop className="size-5 text-ds-text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center items-start pr-1 sm:pr-2">
                      <p className="w-full text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 truncate m-0">
                        {session.device}
                      </p>
                      <p className="w-full text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 truncate m-0">
                        {session.location} {session.createdAt ? `• ${formatSessionDate(session.createdAt)}` : ''}
                      </p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="w-[107px] h-[36px] px-3 py-1 gap-1 bg-ds-bg border border-ds-success rounded-full flex flex-row justify-center items-center shrink-0 select-none">
                      <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-success whitespace-nowrap">
                        This device
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoutSession(session.id)}
                      className="h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border hover:border-ds-accent text-ds-text-primary hover:text-ds-accent flex justify-center items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <LogOut className="size-4 shrink-0" />
                      <span className="text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                        Log out
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Log out from all other device button */}
        <div className="self-stretch py-3 rounded-3xl flex flex-col justify-center items-center mt-2">
          <button
            type="button"
            onClick={() => logoutOtherSessions()}
            disabled={isLoggingOutOthers}
            className="px-4 py-1.5 rounded-[100px] border border-ds-border hover:border-ds-accent text-ds-text-primary hover:text-ds-accent inline-flex justify-center items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="justify-start text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
              {isLoggingOutOthers ? 'Logging out...' : 'Log out from all other device'}
            </span>
          </button>
        </div>

      </div>

      <VerifyIdentityModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} />
    </div>
  );
}
