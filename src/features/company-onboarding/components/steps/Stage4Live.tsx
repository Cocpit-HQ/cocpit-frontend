"use client";

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { setActorContext } from '@/services/api/auth';
import { useActiveProfile } from '@/context/ActiveProfileContext';

const Stage4Live = React.memo(function Stage4Live() {
  const organizationName = useCompanyOnboardingStore(s => s.organizationName);
  const slug = useCompanyOnboardingStore(s => s.slug);
  const orgId = useCompanyOnboardingStore(s => s.orgId);
  const { refreshProfile } = useActiveProfile();
  const [switchFailed, setSwitchFailed] = useState(false);

  useEffect(() => {
    if (!orgId) {
      console.error('[Stage4Live] No orgId in onboarding store; cannot switch actor context.');
      setSwitchFailed(true);
      return;
    }

    let cancelled = false;

    const switchAndRedirect = async () => {
      try {
        await setActorContext({ type: 'ORGANIZATION', id: orgId });
        // Pulls the actor context fresh from the backend (which now reports
        // ORGANIZATION) and updates ActiveProfileContext's state accordingly,
        // so the switch is confirmed rather than assumed before we navigate.
        await refreshProfile?.();
        if (cancelled) return;
        window.location.href = slug ? `/organization/${slug}` : `/feed`;
      } catch (err) {
        console.error('[Stage4Live] Failed to switch actor context:', err);
        if (!cancelled) setSwitchFailed(true);
      }
    };

    void switchAndRedirect();
    return () => { cancelled = true; };
  }, [orgId, slug, refreshProfile]);

  return (
    <div className="w-[944px] h-[224px] flex flex-col items-center justify-center gap-4 mx-auto select-none">
      {/* Background Icon Wrapper (80px x 80px) */}
      <div className="w-[80px] h-[80px] bg-[#D8E2FF] dark:bg-[#1A2236] rounded-full flex items-center justify-center flex-none">
        <Icon icon="material-symbols:check-circle" className="w-[40px] h-[40px] text-[#1A73E8] dark:text-[#82B8FF] flex-none" />
      </div>

      {/* Message Container (424px x 128px) */}
      <div className="w-[424px] h-[128px] flex flex-col items-center justify-start gap-4 flex-none">

        {/* Congratulations Heading */}
        <h1 className="w-[424px] h-[56px] font-poppins font-semibold text-[48px] leading-[56px] tracking-[-0.96px] text-[#1A73E8] dark:text-[#82B8FF] text-center flex items-center justify-center">
          Congratulations
        </h1>

        {switchFailed ? (
          <>
            <p className="w-[424px] font-poppins font-normal text-[18px] leading-[28px] text-[#6B7280] dark:text-[#A1A8B3] text-center">
              Your company page for <span className="font-semibold text-black dark:text-[#FFFFFF]">{organizationName}</span> is live, but we couldn&apos;t switch you into it automatically.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => { setSwitchFailed(false); window.location.reload(); }}
                className="text-[#1A73E8] dark:text-[#82B8FF] font-medium hover:underline"
              >
                Retry
              </button>
              <a
                href={slug ? `/organization/${slug}` : '/feed'}
                className="text-[#1A73E8] dark:text-[#82B8FF] font-medium hover:underline"
              >
                Go to company page
              </a>
            </div>
          </>
        ) : (
          /* Live confirmation message */
          <p className="w-[424px] h-[56px] font-poppins font-normal text-[18px] leading-[28px] text-[#6B7280] dark:text-[#A1A8B3] text-center">
            Your company page for <span className="font-semibold text-black dark:text-[#FFFFFF]">{organizationName}</span> is now live. You have been assigned as the <span className="font-semibold text-[#1A73E8] dark:text-[#82B8FF]">Owner</span>.
          </p>
        )}

      </div>
    </div>
  );
});

export default Stage4Live;
