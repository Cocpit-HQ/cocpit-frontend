"use client";

import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { INDUSTRY_OPTIONS } from '../../constants/onboarding.constants';

const Stage1Identity = React.memo(function Stage1Identity() {
  const organizationName = useCompanyOnboardingStore(s => s.organizationName);
  const foundedYear = useCompanyOnboardingStore(s => s.foundedYear);
  const industry = useCompanyOnboardingStore(s => s.industry);
  const organizationType = useCompanyOnboardingStore(s => s.organizationType);
  const logoPreview = useCompanyOnboardingStore(s => s.logoPreview);
  const showValidationErrors = useCompanyOnboardingStore(s => s.showValidationErrors);
  const updateField = useCompanyOnboardingStore(s => s.updateField);
  const setLogo = useCompanyOnboardingStore(s => s.setLogo);

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isYearError = React.useMemo(() => {
    const trimmed = foundedYear.trim();
    if (!trimmed) return false;
    const year = parseInt(trimmed, 10);
    const currentYear = new Date().getFullYear();
    if (trimmed.length === 4) {
      return year < 1000 || year > currentYear;
    }
    return showValidationErrors;
  }, [foundedYear, showValidationErrors]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('organizationName', e.target.value);
  }, [updateField]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 4 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    updateField('foundedYear', value);
  }, [updateField]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  }, [setLogo]);

  const handleRemoveLogo = useCallback(() => {
    setLogo(null);
  }, [setLogo]);

  const triggerLogoSelection = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-[944px] min-h-[414px] mx-auto gap-8 md:gap-0 select-none">
      {/* Left: Form Controls */}
      <div className="w-[540px] h-[414px] flex flex-col gap-4 flex-none justify-start">
        
        {/* Card 1 - Organization Name */}
        <div className="w-[540px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
          <div className="w-[492px] h-[20px] flex flex-col justify-center flex-none">
            <label className={`w-[492px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
              showValidationErrors && !organizationName.trim() ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
            }`}>
              Organization Name *
            </label>
          </div>
          <input
            type="text"
            value={organizationName}
            onChange={handleNameChange}
            placeholder="e.g. Nexus Global Systems"
            className={`w-[492px] h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors flex-none ${
              showValidationErrors && !organizationName.trim()
                ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
            }`}
          />
        </div>

        {/* Card 2 - Founded Year */}
        <div className="w-[540px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
          <div className="w-[492px] h-[20px] flex flex-col justify-center flex-none">
            <label className={`w-[492px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
              isYearError ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
            }`}>
              Founded Year
            </label>
          </div>
          <input
            type="text"
            value={foundedYear}
            onChange={handleYearChange}
            placeholder="2024"
            className={`w-[492px] h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors flex-none ${
              isYearError
                ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
            }`}
          />
        </div>

        {/* Card 3 - Industry Selection */}
        {organizationType !== 'INSTITUTE' && (
          <div className="w-[540px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[492px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[492px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
                Industry Selection
              </label>
            </div>
            <div ref={dropdownRef} className="w-[492px] h-[54px] relative flex-none">
              {/* Custom Trigger */}
              <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full px-6 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] focus:outline-none hover:border-blue-500 dark:hover:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] transition-colors cursor-pointer flex items-center justify-between select-none"
              >
                <span className={industry ? "text-black dark:text-[#FFFFFF]" : "text-[#6B7280] dark:text-[#A1A8B3]"}>
                  {industry ? INDUSTRY_OPTIONS.find(opt => opt.value === industry)?.label : "Select Industry"}
                </span>
                <div className="flex items-center justify-center w-6 h-6">
                  <svg 
                    className={`w-4 h-4 text-black dark:text-[#FFFFFF] transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Custom Dropdown Menu */}
              {isOpen && (
                <>
                  <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  <div 
                    className="absolute top-[60px] left-0 w-full bg-white dark:bg-[#161D2E] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[220px] overflow-y-auto no-scrollbar"
                    style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                  >
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          updateField('industry', opt.value);
                          setIsOpen(false);
                        }}
                        className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black dark:text-[#A1A8B3] hover:bg-[#EEF2FF] dark:hover:bg-[#1A2236] transition-colors cursor-pointer text-left"
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Asset Uploads */}
      <div className="w-[380px] h-[414px] bg-white dark:bg-[#111827] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[24px] flex flex-col justify-center items-center p-0 flex-none">
        
        {/* Hidden file input */}
        <input
          type="file"
          id="logo-file-input"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />

        {/* Frame 2609064 - Upload Zone Wrapper */}
        <div className="w-[380px] h-[180px] flex flex-col items-center justify-center pb-4 flex-none">
          {logoPreview ? (
            <div className="flex flex-col items-center justify-center flex-none">
              <div className="w-[120px] h-[120px] relative rounded-[12px] overflow-hidden border-[4px] border-white dark:border-[#1A2236] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] bg-white dark:bg-[#1A2236] flex items-center justify-center p-0 flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-cover block"
                />
              </div>
              <span 
                onClick={triggerLogoSelection}
                className="font-poppins font-normal text-[12px] leading-[20px] text-[#1A73E8] hover:underline cursor-pointer text-center mt-2 flex-none"
              >
                Change
              </span>
            </div>
          ) : (
            <label 
              htmlFor="logo-file-input"
              className="w-[120px] h-[120px] bg-white dark:bg-[#1A2236] border-[4px] border-white dark:border-[#1A2236] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] rounded-[12px] flex flex-col items-center justify-center cursor-pointer flex-none"
            >
              <Icon icon="mynaui:upload" className="w-6 h-6 text-black dark:text-[#A1A8B3] mb-2 flex-none" />
              <span className="w-[81px] h-[20px] font-poppins font-normal text-[12px] leading-[20px] tracking-[0.14px] text-[#6B7280] dark:text-[#A1A8B3] text-center flex items-center justify-center flex-none">
                Profile Image
              </span>
            </label>
          )}
        </div>

        {/* Frame 2608500 - Texts Block */}
        <div className="w-[380px] h-[56px] flex flex-col items-center justify-start gap-2 flex-none">
          {/* Organization Identity Assets */}
          <span className="w-[205px] h-[20px] font-poppins font-semibold text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#FFFFFF] text-center flex items-center justify-center flex-none">
            Organization Identity Assets
          </span>
          {/* Description */}
          <span className="w-[336px] h-[16px] font-poppins font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-[#A1A8B3] text-center flex items-center justify-center flex-none">
            Upload your official logo for verification.
          </span>
        </div>

        {/* Frame 2609062 - Alert / Error Block */}
        <div className="w-[380px] h-[76px] flex items-center justify-center px-4 py-2 flex-none">
          {showValidationErrors && !logoPreview ? (
            <span className="text-[12px] font-poppins font-medium text-[#EF4444] dark:text-[#F87171] text-center flex-none">
              *Logo is mandatory
            </span>
          ) : (
            <span className="w-[348px] h-[52px] font-poppins font-normal text-[12px] leading-[18px] text-[#1A73E8] dark:text-[#82B8FF] text-center flex items-center justify-center flex-none">
              Ensure your logo is at least 1:1 ratio for the best viewing experience on executive desktops.
            </span>
          )}
        </div>

      </div>
    </div>
  );
});

export default Stage1Identity;
