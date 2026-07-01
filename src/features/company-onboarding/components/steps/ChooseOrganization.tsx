import React, { useCallback } from 'react';
import Image from 'next/image';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { OrganizationType } from '../../types/company-onboarding.types';

const ChooseOrganization = React.memo(function ChooseOrganization() {
  const setOrganizationType = useCompanyOnboardingStore(s => s.setOrganizationType);
  const goNext = useCompanyOnboardingStore(s => s.goNext);

  const handleSelect = useCallback((type: OrganizationType) => {
    setOrganizationType(type);
    goNext();
  }, [setOrganizationType, goNext]);

  return (
    <div className="w-full flex flex-col items-center mx-auto">
      {/* 896x76px Frame for Header Text */}
      <div className="w-full max-w-[896px] text-center flex flex-col items-center gap-1 relative px-10">
        <h1 className="w-full h-[48px] text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none flex items-center justify-center flex-none">
          Create a Cocpit Business Page
        </h1>
        <p className="w-full h-[24px] text-[16px] leading-[24px] font-normal text-gray-500 tracking-[-0.32px] flex items-center justify-center text-center flex-none">
          Build a page for your organization to connect, share, and grow on Cocpit. Choose a page type to continue
        </p>
      </div>

      {/* 619x249px Frame with exact 99px gap between images (40px gap + ~19px 'Or' + 40px gap) */}
      <div className="w-full max-w-[619px] h-[249.36px] mt-10 flex items-center justify-center gap-10 mx-auto">
        {/* Company Card */}
        <div 
          onClick={() => handleSelect('COMPANY')}
          className="group cursor-pointer flex flex-col items-center justify-start gap-6 rounded-2xl transition-all duration-300 hover:bg-slate-50 active:scale-95 p-0 w-[260px] h-[249.36px]"
        >
          <div className="w-[260px] h-[201.36px] relative">
            <Image 
              src="/images/companyonboarding/company.png" 
              alt="Company" 
              fill 
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="w-[79px] h-[24px] text-[16px] leading-[24px] font-medium text-black group-hover:text-blue-600 transition-colors flex items-center justify-center tracking-[-0.32px] flex-none">
            Company
          </span>
        </div>

        {/* Or Divider */}
        <div className="w-[19px] h-[24px] text-[16px] leading-[24px] font-medium text-gray-500 tracking-[-0.32px] flex items-center justify-center flex-none">
          Or
        </div>

        {/* Institute Card */}
        <div 
          onClick={() => handleSelect('INSTITUTE')}
          className="group cursor-pointer flex flex-col items-center justify-start gap-6 rounded-2xl transition-all duration-300 hover:bg-slate-50 active:scale-95 p-0 w-[260px] h-[249.36px]"
        >
          <div className="w-[260px] h-[201.36px] relative">
            <Image 
              src="/images/companyonboarding/Institute.png" 
              alt="Institute" 
              fill 
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="w-[63px] h-[24px] text-[16px] leading-[24px] font-medium text-black group-hover:text-blue-600 transition-colors flex items-center justify-center tracking-[-0.32px] flex-none">
            Institute
          </span>
        </div>
      </div>
    </div>
  );
});

export default ChooseOrganization;
