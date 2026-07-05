import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { OrganizationType } from '../../types/company-onboarding.types';

const ChooseOrganization = React.memo(function ChooseOrganization() {
  const setOrganizationType = useCompanyOnboardingStore(s => s.setOrganizationType);
  const setOrgId = useCompanyOnboardingStore(s => s.setOrgId);
  const setCurrentStage = useCompanyOnboardingStore(s => s.setCurrentStage);
  const updateField = useCompanyOnboardingStore(s => s.updateField);
  const goNext = useCompanyOnboardingStore(s => s.goNext);
  const [loadingType, setLoadingType] = useState<OrganizationType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback((type: OrganizationType) => {
    setOrganizationType(type);
    goNext();
  }, [setOrganizationType, goNext]);

  return (
    <div className="w-full flex flex-col items-center mx-auto">
      {/* 896x76px Frame for Header Text */}
      <div className="w-full max-w-[896px] text-center flex flex-col items-center gap-1 relative px-10">
        <h1 className="w-full h-[48px] text-[28px] md:text-[32px] font-bold text-slate-900 dark:text-[#FFFFFF] tracking-tight leading-none flex items-center justify-center flex-none">
          Create a Cocpit Business Page
        </h1>
        <p className="w-full h-[24px] text-[16px] leading-[24px] font-normal text-gray-500 dark:text-[#A1A8B3] tracking-[-0.32px] flex items-center justify-center text-center flex-none">
          Build a page for your organization to connect, share, and grow on Cocpit. Choose a page type to continue
        </p>
      </div>

      {/* 619x249px Frame with exact 99px gap between images (40px gap + ~19px 'Or' + 40px gap) */}
      <div className="w-full max-w-[619px] h-[249.36px] mt-10 flex items-center justify-center gap-10 mx-auto">
        {/* Company Card */}
        <div 
          onClick={() => !loadingType && handleSelect('COMPANY')}
          className={`group ${loadingType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center justify-start gap-6 rounded-2xl p-0 w-[260px] h-[249.36px] relative`}
        >
          {loadingType === 'COMPANY' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 rounded-2xl">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="w-[260px] h-[201.36px] relative">
            <Image 
              src="/images/companyonboarding/company.png" 
              alt="Company" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="w-[79px] h-[24px] text-[16px] leading-[24px] font-medium text-black dark:text-[#A1A8B3] flex items-center justify-center tracking-[-0.32px] flex-none">
            Company
          </span>
        </div>

        {/* Or Divider */}
        <div className="w-[19px] h-[24px] text-[16px] leading-[24px] font-medium text-gray-500 dark:text-[#A1A8B3] tracking-[-0.32px] flex items-center justify-center flex-none">
          Or
        </div>

        {/* Institute Card */}
        <div 
          onClick={() => !loadingType && handleSelect('INSTITUTE')}
          className={`group ${loadingType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center justify-start gap-6 rounded-2xl p-0 w-[260px] h-[249.36px] relative`}
        >
          {loadingType === 'INSTITUTE' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 rounded-2xl">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="w-[260px] h-[201.36px] relative">
            <Image 
              src="/images/companyonboarding/Institute.png" 
              alt="Institute" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="w-[63px] h-[24px] text-[16px] leading-[24px] font-medium text-black dark:text-[#A1A8B3] flex items-center justify-center tracking-[-0.32px] flex-none">
            Institute
          </span>
        </div>
      </div>
      {error && (
        <div className="mt-8 text-red-500 font-medium">
          {error}
        </div>
      )}
    </div>
  );
});

export default ChooseOrganization;
