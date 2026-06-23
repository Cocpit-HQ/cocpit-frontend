import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

interface StepIdentityVerificationProps {
  onBack: () => void;
  onVerifySuccess: () => void;
}

export const StepIdentityVerification: React.FC<StepIdentityVerificationProps> = ({
  onBack,
  onVerifySuccess,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyClick = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('Identity verified successfully!');
      onVerifySuccess();
    }, 1500);
  };

  return (
    <div className="w-[960px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-8 overflow-hidden animate-in fade-in duration-300">
      
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6">Create job</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
            Tell us the role, AI will draft the rest
          </div>
        </div>
      </div>

      {/* Verification Center Content */}
      <div className="w-full max-w-[672px] py-6 bg-white rounded-3xl flex flex-col justify-start items-center gap-5 overflow-hidden">
        
        {/* Verification Shield Ribbon SVG Graphic */}
        <div className="w-32 h-32 flex items-center justify-center relative">
          <Icon icon="streamline-freehand-color:security-computer-shield" className="w-24 h-24" />
        </div>

        {/* Headings */}
        <div className="flex flex-col items-center text-center gap-2 px-4">
          <h2 className="text-black text-2xl font-bold font-['Poppins'] leading-tight">
            Identity Verification Required
          </h2>
          <p className="text-gray-500 text-xs font-normal font-['Poppins'] leading-relaxed max-w-[420px]">
            To maintain the integrity of our career network and ensure the highest quality of listings, only verified users can post a job.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 items-center w-full max-w-[280px]">
          <button
            onClick={handleVerifyClick}
            disabled={isVerifying}
            type="button"
            className="w-full h-11 px-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-md shadow-indigo-100"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify now</span>
            )}
          </button>
          
          <button
            type="button"
            className="w-full h-11 px-5 bg-white hover:bg-slate-50 text-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 text-sm font-semibold font-['Poppins'] transition-all active:scale-95"
          >
            <span>Learn about verification</span>
          </button>
        </div>

        {/* Benefits Row */}
        <div className="self-stretch pt-4 inline-flex justify-center items-stretch gap-4 px-4 w-full">
          {/* Card 1: Visibility */}
          <div className="w-72 p-4 bg-slate-50 rounded-xl inline-flex flex-col justify-start items-start gap-1.5 border border-slate-100/50 shadow-sm">
            <div className="size-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Icon icon="solar:eye-linear" className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="self-stretch pt-0.5 flex flex-col justify-start items-start">
              <span className="text-black text-xs font-semibold font-['Poppins'] leading-4">
                Higher Visibility
              </span>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <p className="text-gray-500 text-[11px] font-normal font-['Poppins'] leading-snug">
                Verified jobs appear higher in search results.
              </p>
            </div>
          </div>

          {/* Card 2: Trust */}
          <div className="w-72 p-4 bg-slate-50 rounded-xl inline-flex flex-col justify-start items-start gap-1.5 border border-slate-100/50 shadow-sm">
            <div className="size-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Icon icon="solar:shield-keyhole-linear" className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="self-stretch pt-0.5 flex flex-col justify-start items-start">
              <span className="text-black text-xs font-semibold font-['Poppins'] leading-4">
                Build Trust
              </span>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <p className="text-gray-500 text-[11px] font-normal font-['Poppins'] leading-snug">
                Show candidates your profile is legitimate.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Text */}
        <div className="self-stretch pt-4 inline-flex justify-center items-center gap-1.5 text-center px-4">
          <p className="text-gray-500 text-xs font-normal font-['Poppins'] leading-relaxed">
            Verification typically takes less than 2 minutes. Need help?{' '}
            <button type="button" className="text-indigo-500 hover:underline font-medium">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepIdentityVerification;
