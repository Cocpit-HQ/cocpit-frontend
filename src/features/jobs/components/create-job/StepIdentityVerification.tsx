import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { LeftArrowIcon, TrustShieldIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { VerifyIdentityModal } from '@/features/settings';

interface StepIdentityVerificationProps {
  onBack: () => void;
  onClose?: () => void;
  onVerifySuccess: () => void;
  title?: string;
}

export const StepIdentityVerification: React.FC<StepIdentityVerificationProps> = ({
  onBack,
  onClose,
  onVerifySuccess,
  title,
}) => {
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const router = useRouter();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleVerifyClick = () => {
    if (isCompanyMode) {
      router.push(`/organization/${activeProfile?.slug}/edit?tab=verification`);
    } else {
      // Open verification modal directly within the Create Job flow instead of redirecting to Settings
      setIsVerifyModalOpen(true);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center relative py-6 md:py-8 px-4 font-dm-sans overflow-y-auto">
      {/* Top Left: Back Navigation */}
      {/* Desktop Fixed Back button (preserved 100%) */}
      <button
        onClick={onBack}
        type="button"
        aria-label="Back"
        className="hidden md:inline-flex fixed top-[40px] left-[40px] z-[60] items-center gap-2 p-0 text-ds-text-primary cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span className="font-dm-sans font-medium text-base leading-6">Back</span>
      </button>

      {/* Desktop Fixed Close button (preserved 100%) */}
      <button
        onClick={onClose || onBack}
        type="button"
        aria-label="Close"
        className="hidden md:inline-flex fixed top-[40px] right-[40px] z-[60] text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer p-1 select-none bg-transparent border-none outline-none"
      >
        <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
      </button>

      {/* Mobile Top Back Bar (Frame 2609713 / Frame 2609475) */}
      <div className="flex md:hidden w-full max-w-[360px] items-center justify-start h-6 mb-4 shrink-0">
        <button
          onClick={onBack}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">Back</span>
        </button>
      </div>

      {/* Main Container: Frame 2610015 & Container 360px x 519.36px on mobile, 640px on desktop */}
      <div className="w-full max-w-[360px] md:max-w-[640px] flex flex-col items-center px-0 md:px-5 pt-0 md:pt-5 pb-6 md:pb-10 gap-5 my-auto text-center font-dm-sans">
        {/* Headings: Frame 2609237 */}
        <div className="w-full max-w-[360px] md:max-w-[578px] flex flex-col items-center gap-3">
          {/* Title: 32px on mobile (leading 40px), 40px on desktop (leading 48px), bold, text-ds-text-primary */}
          <h1 className="w-full text-ds-text-primary text-[32px] md:text-[40px] font-bold leading-[40px] md:leading-[48px] font-dm-sans text-center">
            Identity Verification Required
          </h1>
          {/* Subtitle: 16px, semibold, leading-6, text-ds-text-secondary */}
          <p className="w-full text-ds-text-secondary text-base font-semibold leading-6 font-dm-sans text-center">
            To maintain the integrity of our career network and ensure the highest quality of listings, only verified users can post a job.
          </p>
        </div>

        {/* Buttons Container: width: 300px, height: 88px, gap: 16px */}
        <div className="w-full max-w-[300px] flex flex-col justify-center items-center gap-4 shrink-0">
          {/* Primary emphasis button: width 203px, height 36px, px-3 py-1.5, bg-ds-accent, rounded-full */}
          <button
            type="button"
            onClick={handleVerifyClick}
            className="w-[203px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex flex-row justify-center items-center gap-2.5 transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0 font-dm-sans"
          >
            <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary whitespace-nowrap">
              Verify Now
            </span>
          </button>
          {/* Secondary button: width 203px, height 36px, px-3 py-1.5, border border-ds-border, rounded-full, text-ds-text-primary */}
          <div className="w-[203px] h-9 px-3 py-1.5 border border-ds-border text-ds-text-primary rounded-full flex flex-row justify-center items-center gap-2.5 bg-transparent shrink-0 select-none cursor-default font-dm-sans">
            <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary whitespace-nowrap">
              Learn about verification
            </span>
          </div>
        </div>

        {/* Frame 2609984: width 360px on mobile, 600px on desktop — side-by-side flex-row */}
        <div className="w-full max-w-[360px] md:max-w-[600px] flex flex-row justify-center items-stretch gap-3">
          {/* Card 1: Higher Visibility */}
          <div className="flex-1 w-full min-h-[112px] p-4 bg-ds-surface-1 rounded-xl flex flex-col items-start gap-1 text-left">
            {/* Eye open icon: 20px x 20px, text-ds-accent */}
            <div className="size-5 flex items-center justify-center text-ds-accent shrink-0">
              <Icon icon="solar:eye-linear" className="size-5" />
            </div>
            {/* Higher Visibility: 14px, 400, leading-5, text-ds-text-primary */}
            <div className="w-full text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
              Higher Visibility
            </div>
            {/* Helper: 12px, 400, leading-4, text-ds-text-secondary */}
            <div className="w-full text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
              Verified jobs appear higher in search results.
            </div>
          </div>

          {/* Card 2: Build Trust */}
          <div className="flex-1 w-full min-h-[112px] p-4 bg-ds-surface-1 rounded-xl flex flex-col items-start gap-1 text-left">
            {/* Trust icon: 20px x 20px, text-ds-accent */}
            <div className="size-5 flex items-center justify-center text-ds-accent shrink-0">
              <TrustShieldIcon className="size-5 text-ds-accent" size={20} />
            </div>
            {/* Build Trust: 14px, 400, leading-5, text-ds-text-primary */}
            <div className="w-full text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
              Build Trust
            </div>
            {/* Helper: 12px, 400, leading-4, text-ds-text-secondary */}
            <div className="w-full text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
              Show candidates your profile is legitimate.
            </div>
          </div>
        </div>

        {/* Frame 2609084: Footer note */}
        <div className="w-full max-w-[360px] md:max-w-[600px] pt-4 flex flex-row flex-wrap justify-center items-center gap-1 text-xs font-normal leading-4 text-center font-dm-sans">
          <span className="text-ds-text-secondary">
            Verification typically takes less than 2 minutes. Need help?{' '}
          </span>
          <span className="text-ds-accent font-normal select-none cursor-default">
            Contact Support
          </span>
        </div>
      </div>

      {/* Identity verification modal for in-flow verification */}
      <VerifyIdentityModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => {
          setIsVerifyModalOpen(false);
          // Advance wizard to role-input step after completing verification
          onVerifySuccess();
        }}
      />
    </div>
  );
};

export default StepIdentityVerification;
