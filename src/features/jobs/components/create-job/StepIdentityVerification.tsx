import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { TrustShieldIcon } from '@/components/icons';
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
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-center items-center relative py-8 sm:py-12 px-4 font-sans animate-in fade-in duration-200">
      {/* Top Left: Back Navigation - use chevron icon and secondary hover color per design system */}
      <button
        onClick={onBack}
        type="button"
        aria-label="Back"
        className="fixed top-6 left-4 sm:top-10 sm:left-10 z-[60] inline-flex items-center gap-2 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer select-none bg-transparent border-none outline-none group"
      >
        <Icon icon="solar:alt-arrow-left-linear" className="w-5 h-5 shrink-0 text-ds-text-primary group-hover:text-ds-text-secondary transition-colors" />
        <span className="font-sans font-medium text-base leading-6">Back</span>
      </button>

      {/* Top Right: Close Navigation */}
      <button
        onClick={onClose || onBack}
        type="button"
        aria-label="Close"
        className="fixed top-6 right-4 sm:top-10 sm:right-10 z-[60] text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer p-1 select-none bg-transparent border-none outline-none"
      >
        <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
      </button>

      {/* Main Container: 640.24px max-width, responsive padding and gap */}
      <div className="w-full max-w-[640px] flex flex-col items-center px-4 sm:px-5 pt-4 sm:pt-5 pb-8 sm:pb-10 gap-5 my-auto text-center">
        {/* Headings: max-w-[578px], gap: 12px */}
        <div className="w-full max-w-[578px] flex flex-col items-center gap-3">
          {/* Title: 40px, bold, leading-[48px], text-ds-text-primary */}
          <h1 className="w-full text-ds-text-primary text-2xl sm:text-3xl md:text-[40px] font-bold leading-tight sm:leading-[44px] md:leading-[48px] font-sans text-center">
            Identity Verification Required
          </h1>
          {/* Subtitle: 16px, semibold, leading-6, text-ds-text-secondary */}
          <p className="w-full text-ds-text-secondary text-sm sm:text-base font-semibold leading-5 sm:leading-6 font-sans text-center">
            To maintain the integrity of our career network and ensure the highest quality of listings, only verified users can post a job.
          </p>
        </div>

        {/* Buttons Container: width: 300px, height: 88px, gap: 16px */}
        <div className="w-full max-w-[300px] sm:h-[88px] flex flex-col justify-center items-center gap-4 shrink-0">
          {/* Primary emphasis button: width 203px, height 36px, px-3 py-1.5, bg-ds-accent, rounded-full */}
          <button
            type="button"
            onClick={handleVerifyClick}
            className="w-full max-w-[203px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex flex-row justify-center items-center gap-2.5 transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0"
          >
            <span className="w-[82px] h-6 flex justify-center items-center font-sans font-medium text-base leading-6 text-ds-text-primary whitespace-nowrap">
              Verify Now
            </span>
          </button>
          {/* Secondary button: width 203px, height 36px, px-3 py-1.5, border border-ds-border, rounded-full */}
          <button
            type="button"
            onClick={handleVerifyClick}
            className="w-full max-w-[203px] h-9 px-3 py-1.5 border border-ds-border active:scale-95 text-ds-text-primary rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0"
          >
            <span className="w-[179px] h-6 flex justify-center items-center font-sans font-medium text-base leading-6 text-ds-text-primary whitespace-nowrap">
              Learn about verification
            </span>
          </button>
        </div>

        {/* Frame 2609984: width 600px max, responsive grid/flex */}
        <div className="w-full max-w-[600px] flex flex-col sm:flex-row justify-center items-stretch gap-3">
          {/* Card 1: Higher Visibility - flex-1, min-h-[96px], padding: 16px, gap: 4px, bg-ds-surface-1, rounded: 12px */}
          <div className="w-full sm:w-[293px] min-h-[96px] p-4 bg-ds-surface-1 rounded-xl flex flex-col items-start gap-1 text-left border border-ds-border/20">
            {/* Eye open icon: 20px x 20px, text-ds-accent */}
            <div className="size-5 flex items-center justify-center text-ds-accent shrink-0">
              <Icon icon="solar:eye-linear" className="size-5" />
            </div>
            {/* Higher Visibility: 14px, weight 400, leading-5, text-ds-text-primary */}
            <div className="w-full text-ds-text-primary text-sm font-normal leading-5 font-sans">
              Higher Visibility
            </div>
            {/* Helper: 12px, weight 400, leading-4, text-ds-text-secondary */}
            <div className="w-full text-ds-text-secondary text-xs font-normal leading-4 font-sans">
              Verified jobs appear higher in search results.
            </div>
          </div>

          {/* Card 2: Build Trust - flex-1, min-h-[96px], padding: 16px, gap: 4px, bg-ds-surface-1, rounded: 12px */}
          <div className="w-full sm:w-[293px] min-h-[96px] p-4 bg-ds-surface-1 rounded-xl flex flex-col items-start gap-1 text-left border border-ds-border/20">
            {/* Trust icon: 20px x 20px */}
            <div className="size-5 flex items-center justify-center shrink-0">
              <TrustShieldIcon className="size-5" size={20} />
            </div>
            {/* Build Trust: 14px, weight 400, leading-5, text-ds-text-primary */}
            <div className="w-full text-ds-text-primary text-sm font-normal leading-5 font-sans">
              Build Trust
            </div>
            {/* Helper: 12px, weight 400, leading-4, text-ds-text-secondary */}
            <div className="w-full text-ds-text-secondary text-xs font-normal leading-4 font-sans">
              Show candidates your profile is legitimate.
            </div>
          </div>
        </div>

        {/* Frame 2609084: Footer note */}
        <div className="w-full max-w-[600px] pt-4 flex flex-row flex-wrap justify-center items-center gap-1 text-xs font-normal leading-4 text-center font-sans">
          <span className="text-ds-text-secondary">
            Verification typically takes less than 2 minutes. Need help?{' '}
          </span>
          <Link
            href="https://cocpit.in/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="!text-ds-accent hover:!text-ds-accent-hover font-normal cursor-pointer bg-transparent border-none p-0 outline-none focus-visible:ring-1 focus-visible:ring-ds-accent rounded-sm transition-colors"
            style={{ color: 'var(--ds-accent)' }}
          >
            Contact Support
          </Link>
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
