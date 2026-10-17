import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useActiveProfile } from '@/context/ActiveProfileContext';
import { VerifyIdentityModal } from '@/features/settings';

interface StepIdentityVerificationProps {
  onBack: () => void;
  onVerifySuccess: () => void;
  title?: string;
}

export const StepIdentityVerification: React.FC<StepIdentityVerificationProps> = ({
  onBack,
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
      setIsVerifyModalOpen(true);
    }
  };

  return (
    <div className={`w-full max-w-[998px] mx-auto flex flex-col justify-start items-center gap-8 px-4 md:px-0 animate-in fade-in duration-300 ${isCompanyMode ? 'bg-white dark:bg-[#0F1115]' : 'bg-white dark:bg-[#0B0F19]'}`}>
      
      {/* Header Row */}
      <div className="self-stretch flex flex-row justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className={`size-12 rounded-[100px] outline outline-1 outline-offset-[-1px] backdrop-blur-md flex justify-center items-center gap-2.5 active:scale-95 transition-all shadow-sm flex-shrink-0 ${isCompanyMode ? 'outline-zinc-300 hover:bg-slate-50 text-gray-500 dark:outline-[#2A2D35] dark:hover:bg-[#121B2B] dark:text-[#A1A8B3]' : 'outline-zinc-300 hover:bg-slate-50 text-gray-500 dark:outline-[#2E3445] dark:hover:bg-[#1C2340] dark:text-[#9CA3AF]'}`}
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 currentColor" />
        </button>
        <div className="flex flex-col justify-start items-start">
          <div className={`text-lg font-medium font-['Poppins'] leading-6 ${isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]'}`}>Create job</div>
          <div className={`text-xs font-normal font-['Poppins'] leading-4 ${isCompanyMode ? 'text-gray-500 dark:text-[#A1A8B3]' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
            {title || 'Tell us the role, AI will draft the rest'}
          </div>
        </div>
      </div>

      {/* Verification Center Content */}
      <div className={`w-full max-w-[672px] py-6 rounded-3xl flex flex-col justify-start items-center gap-5 overflow-hidden ${isCompanyMode ? 'bg-white dark:bg-[#0F1115]' : 'bg-white dark:bg-[#0B0F19]'}`}>
        
        {/* Verification Shield Ribbon SVG Graphic */}
        <div className="w-32 h-32 flex items-center justify-center relative">
          <Icon icon="streamline-freehand-color:security-computer-shield" className="w-24 h-24" />
        </div>

        {/* Headings */}
        <div className="flex flex-col items-center text-center gap-2 px-4">
          <h2 className={`text-2xl font-bold font-['Poppins'] leading-tight ${isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]'}`}>
            Identity Verification Required
          </h2>
          <p className={`text-xs font-normal font-['Poppins'] leading-relaxed max-w-[420px] ${isCompanyMode ? 'text-gray-500 dark:text-[#A1A8B3]' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
            To maintain the integrity of our career network and ensure the highest quality of listings, only verified users can post a job.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 items-center w-full max-w-[280px]">
          <button
            onClick={handleVerifyClick}
            type="button"
            className={`w-full h-11 px-5 text-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-md ${isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#1A73E8]/50 shadow-blue-100' : 'bg-[#6366F1] hover:bg-indigo-600 disabled:bg-indigo-300 shadow-indigo-100'}`}
          >
            <span>Verify now</span>
          </button>
          
          <button
            type="button"
            className={`w-full h-11 px-5 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 text-sm font-semibold font-['Poppins'] transition-all active:scale-95 ${isCompanyMode ? 'bg-white hover:bg-slate-50 text-[#1A73E8] outline-blue-400 dark:bg-[#0F1115] dark:hover:bg-[#121B2B] dark:text-[#4D9CFF] dark:outline-[#2A2D35]' : 'bg-white hover:bg-slate-50 text-indigo-500 outline-indigo-400 dark:bg-[#0B0F19] dark:hover:bg-[#1C2340] dark:text-[#818CF8] dark:outline-[#2E3445]'}`}
          >
            <span>Learn about verification</span>
          </button>
        </div>

        {/* Benefits Row */}
        <div className="self-stretch pt-4 flex flex-col sm:flex-row justify-center items-stretch gap-4 px-4 w-full">
          {/* Card 1: Visibility */}
          <div className={`w-full sm:w-72 p-4 rounded-xl flex flex-col justify-start items-start gap-1.5 border shadow-sm ${isCompanyMode ? 'bg-slate-50 border-slate-100/50 dark:bg-[#121B2B] dark:border-[#2A2D35]' : 'bg-slate-50 border-slate-100/50 dark:bg-[#1C2340] dark:border-[#2E3445]'}`}>
            <div className={`size-8 rounded-full flex items-center justify-center ${isCompanyMode ? 'bg-blue-50 text-[#1A73E8] dark:bg-[#1A73E8]/20 dark:text-[#4D9CFF]' : 'bg-indigo-50 text-indigo-500 dark:bg-[#6366F1]/20 dark:text-[#818CF8]'}`}>
              <Icon icon="solar:eye-linear" className="w-5 h-5 currentColor" />
            </div>
            <div className="self-stretch pt-0.5 flex flex-col justify-start items-start">
              <span className={`text-xs font-semibold font-['Poppins'] leading-4 ${isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]'}`}>
                Higher Visibility
              </span>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <p className={`text-[11px] font-normal font-['Poppins'] leading-snug ${isCompanyMode ? 'text-gray-500 dark:text-[#A1A8B3]' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
                Verified jobs appear higher in search results.
              </p>
            </div>
          </div>

          {/* Card 2: Trust */}
          <div className={`w-full sm:w-72 p-4 rounded-xl flex flex-col justify-start items-start gap-1.5 border shadow-sm ${isCompanyMode ? 'bg-slate-50 border-slate-100/50 dark:bg-[#121B2B] dark:border-[#2A2D35]' : 'bg-slate-50 border-slate-100/50 dark:bg-[#1C2340] dark:border-[#2E3445]'}`}>
            <div className={`size-8 rounded-full flex items-center justify-center ${isCompanyMode ? 'bg-blue-50 text-[#1A73E8] dark:bg-[#1A73E8]/20 dark:text-[#4D9CFF]' : 'bg-indigo-50 text-indigo-500 dark:bg-[#6366F1]/20 dark:text-[#818CF8]'}`}>
              <Icon icon="solar:shield-keyhole-linear" className="w-5 h-5 currentColor" />
            </div>
            <div className="self-stretch pt-0.5 flex flex-col justify-start items-start">
              <span className={`text-xs font-semibold font-['Poppins'] leading-4 ${isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]'}`}>
                Build Trust
              </span>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <p className={`text-[11px] font-normal font-['Poppins'] leading-snug ${isCompanyMode ? 'text-gray-500 dark:text-[#A1A8B3]' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
                Show candidates your profile is legitimate.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Text */}
        <div className="self-stretch pt-4 flex justify-center items-center gap-1.5 text-center px-4">
          <p className={`text-xs font-normal font-['Poppins'] leading-relaxed ${isCompanyMode ? 'text-gray-500 dark:text-[#A1A8B3]' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
            Verification typically takes less than 2 minutes. Need help?{' '}
            <button type="button" className={`hover:underline font-medium ${isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-indigo-500 dark:text-[#818CF8]'}`}>
              Contact Support
            </button>
          </p>
        </div>
      </div>

      <VerifyIdentityModal 
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  );
};

export default StepIdentityVerification;
