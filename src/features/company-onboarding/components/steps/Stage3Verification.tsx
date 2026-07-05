"use client";

import React, { useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { getCountries } from '../../services/company-onboarding.api';

const Stage3Verification = React.memo(function Stage3Verification() {
  const organizationName = useCompanyOnboardingStore(s => s.organizationName);
  const industry = useCompanyOnboardingStore(s => s.industry);
  const logoPreview = useCompanyOnboardingStore(s => s.logoPreview);
  const headline = useCompanyOnboardingStore(s => s.headline);
  const hqCity = useCompanyOnboardingStore(s => s.hqCity);
  const hqCountry = useCompanyOnboardingStore(s => s.hqCountry);

  const countryOfOperation = useCompanyOnboardingStore(s => s.countryOfOperation);
  const documents = useCompanyOnboardingStore(s => s.documents);
  const updateField = useCompanyOnboardingStore(s => s.updateField);
  const addDocument = useCompanyOnboardingStore(s => s.addDocument);
  const removeDocument = useCompanyOnboardingStore(s => s.removeDocument);
  const updateDocument = useCompanyOnboardingStore(s => s.updateDocument);
  const [countryOptions, setCountryOptions] = useState<{label: string, value: string}[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    getCountries().then(countries => {
      if (isMounted) {
        setCountryOptions(countries.map(c => ({ label: c, value: c })));
      }
    }).catch(console.error);

  }, []);

  // Custom Dropdown open state
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateDocument(id, e.target.files[0]);
    }
  }, [updateDocument]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start w-full max-w-[944px] min-h-[414px] py-2 mx-auto gap-10 select-none">
      
      {/* CSS style to hide scrollbars inside dropdown menus */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Left Column - Verification Forms (600px) */}
      <div className="w-[600px] flex flex-col gap-4 flex-none">
        
        {/* Card 1 - Country of Operation (600px x 130px) */}
        <div className="w-[600px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
          <div className="w-[552px] h-[20px] flex flex-col justify-center flex-none">
            <label className="w-[552px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
              Country of Operation <span className="font-normal text-[#6B7280] dark:text-[#A1A8B3] ml-1">(Optional)</span>
            </label>
          </div>
          <div ref={countryRef} className="w-[552px] h-[54px] relative flex-none">
            <div 
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="w-full h-full px-6 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] focus:outline-none hover:border-blue-500 dark:hover:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] transition-colors cursor-pointer flex items-center justify-between select-none"
            >
              <span className={countryOfOperation ? "text-black dark:text-[#FFFFFF]" : "text-[#6B7280] dark:text-[#A1A8B3]"}>
                {countryOfOperation ? countryOptions.find(o => o.value === countryOfOperation)?.label : "Select Country"}
              </span>
              <svg className="w-4 h-4 text-black dark:text-[#FFFFFF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isCountryOpen && (
              <div className="absolute top-[60px] left-0 w-full bg-white dark:bg-[#161D2E] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[140px] overflow-y-auto no-scrollbar">
                {countryOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      updateField('countryOfOperation', opt.value);
                      setIsCountryOpen(false);
                    }}
                    className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black dark:text-[#A1A8B3] hover:bg-[#EEF2FF] dark:hover:bg-[#1A2236] transition-colors cursor-pointer text-left"
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents Section Header Row */}
        <div className="w-[600px] h-[40px] flex flex-row justify-between items-center px-6 pt-4 flex-none">
          <span className="text-[#0D47A1] dark:text-[#82B8FF] font-poppins font-bold text-[16px] leading-[20px] tracking-[0.7px] uppercase">
            Documents <span className="font-normal normal-case tracking-normal text-[#6B7280] dark:text-[#A1A8B3]">(Optional)</span>
          </span>
          <button
            onClick={addDocument}
            className="flex items-center justify-center w-6 h-6 text-[#1A73E8] dark:text-[#82B8FF] hover:text-[#1557b0] active:scale-90 transition-transform flex-none"
          >
            <Icon icon="mynaui:plus" className="w-6 h-6" />
          </button>
        </div>

        <p className="w-[600px] px-6 -mt-2 font-poppins font-normal text-[12px] leading-[18px] text-slate-400 dark:text-[#A1A8B3] flex-none">
          You can skip this step and publish your profile now — verification documents can be added later from your organization settings.
        </p>

        {/* List of Document Cards (each is 600px x 178px or 154px stacked with delete row) */}
        <div className="w-[600px] flex flex-col gap-4 flex-none">
          {documents.length === 0 ? (
            <div className="w-full h-[120px] flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-[#1C2840]/50 rounded-[12px] p-6 text-center bg-slate-50/50 dark:bg-[#1A2236]/10">
              <Icon icon="mynaui:file" className="w-8 h-8 text-slate-400 dark:text-[#6B7280] mb-2" />
              <p className="font-poppins font-normal text-[12px] text-slate-400 dark:text-[#A1A8B3]">
                No documents added yet. Click &quot;+&quot; to upload legal verification certificates.
              </p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div key={doc.id} className="w-[600px] flex flex-col gap-1 flex-none">
                {/* Background+Border+Shadow Card */}
                <div 
                  className="w-[600px] h-[126px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col justify-between flex-none relative"
                >
                  {/* Label Row */}
                  <div className="w-[552px] h-[20px] flex items-center justify-between flex-none">
                    <span className="font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3]">
                      Verification Document
                    </span>
                  </div>

                  {/* Input Pill / File Picker */}
                  {doc.file ? (
                    <div className="w-[552px] h-[50px] bg-white dark:bg-[#1A2236] border border-[#E0E0E7] dark:border-[#1C2840] rounded-[24px] px-6 flex items-center justify-between relative flex-none">
                      <div className="flex items-center gap-3">
                        <div className="w-[20px] h-[20px] rounded-[8px] bg-[#D9D9D9] dark:bg-[#1C2840] flex items-center justify-center flex-none">
                          <Icon icon="mynaui:file" className="w-4 h-4 text-slate-600 dark:text-[#A1A8B3]" />
                        </div>
                        <span className="font-poppins font-normal text-[14px] leading-[20px] text-black dark:text-[#FFFFFF] truncate max-w-[380px] text-left">
                          {doc.file.name}
                        </span>
                      </div>
                      <span
                        onClick={() => document.getElementById(`file-input-${doc.id}`)?.click()}
                        className="font-poppins font-normal text-[12px] leading-[20px] text-[#1A73E8] dark:text-[#82B8FF] hover:underline cursor-pointer flex-none"
                      >
                        Change
                      </span>
                    </div>
                  ) : (
                    <label 
                      htmlFor={`file-input-${doc.id}`}
                      className="w-[552px] h-[50px] px-6 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] bg-white dark:bg-[#1A2236] hover:border-blue-500 dark:hover:border-[#82B8FF] transition-colors flex items-center justify-center cursor-pointer flex-none select-none"
                    >
                      <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-[#6B7280] dark:text-[#A1A8B3]" />
                    </label>
                  )}

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id={`file-input-${doc.id}`}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileChange(doc.id, e)}
                    className="hidden"
                  />
                </div>

                {/* Index-based Delete row (Frame 2609130) */}
                {idx > 0 && (
                  <div className="w-[600px] h-[24px] flex flex-row justify-end items-center px-6 flex-none">
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="w-6 h-6 flex items-center justify-center text-[#EF4444] dark:text-[#F87171] hover:text-red-700 dark:hover:text-red-400 transition-colors active:scale-90"
                    >
                      <Icon icon="mynaui:trash" className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Right Column - Live Profile Preview Card (300px x 427px) */}
      <div className="w-[300px] h-[427px] bg-white dark:bg-[#111827] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none backdrop-blur-[6px] rounded-[24px] p-6 flex flex-col justify-between flex-none">
        <div className="w-full flex flex-col gap-4 text-left">
          
          <div className="w-[250px] h-[20px] flex items-center justify-start flex-none">
            <span className="font-poppins font-semibold text-[14px] leading-[20px] tracking-[0.7px] text-[#6B7280] dark:text-[#A1A8B3] uppercase">
              PREVIEW ON PROFILE
            </span>
          </div>

          {/* Inner Profile Card (250px x 187px) */}
          <div className="w-[250px] h-[187px] bg-[#F2F7FF] dark:bg-[#1C2840]/20 rounded-[12px] p-4 flex flex-col justify-between flex-none relative">
            <div className="flex flex-row items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-[#D3E4FE] dark:bg-[#1C2840] border border-white dark:border-[#1A2236] shadow-sm flex items-center justify-center p-1 flex-none overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A73E8] flex items-center justify-center text-white font-poppins font-bold text-[18px]">
                    {organizationName ? organizationName[0].toUpperCase() : 'C'}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-left justify-center min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-poppins font-semibold text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] truncate max-w-[146px]">
                    {organizationName || 'Cocpit'}
                  </span>
                  <Icon icon="material-symbols:verified" className="w-5 h-5 text-[#1A73E8] flex-none" />
                </div>
                <span className="font-poppins font-normal text-[12px] leading-[18px] text-[#6B7280] dark:text-[#A1A8B3] truncate max-w-[149px]">
                  {headline || 'SaaS & FinTech Solutions'}
                </span>
              </div>
            </div>

            {/* Skeleton text bars */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="w-[148.98px] h-[8px] bg-[#E8F1FF] dark:bg-[#1C2840]/40 rounded-full" />
              <div className="w-[218px] h-[8px] bg-[#E8F1FF] dark:bg-[#1C2840]/40 rounded-full" />
              <div className="w-[99.33px] h-[8px] bg-[#E8F1FF] dark:bg-[#1C2840]/40 rounded-full" />
            </div>

            {/* Bottom Row Divider & Content */}
            <div className="flex items-center justify-between border-t border-[#C1C6D6] dark:border-[#1C2840]/60 mt-3 pt-3">
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#D8E2FF] dark:bg-[#1C2840] border-2 border-[#F8F9FF] dark:border-[#111827]" />
                <div className="w-6 h-6 rounded-full bg-[#DAE2FD] dark:bg-[#1C2840] border-2 border-[#F8F9FF] dark:border-[#111827]" />
                <div className="w-6 h-6 rounded-full bg-[#E0E3E5] dark:bg-[#1C2840] border-2 border-[#F8F9FF] dark:border-[#111827]" />
              </div>
              <span className="font-poppins font-semibold text-[12px] leading-[16px] text-[#0D47A1] dark:text-[#82B8FF]">
                1.2k Partners
              </span>
            </div>
          </div>

          {/* Tips Info Box (250px x 138px) */}
          <div className="w-[250px] h-[138px] bg-[#EFF4FF] dark:bg-[#1C2840]/10 border-l-[3px] border-[#0D47A1] dark:border-[#82B8FF] rounded-[8px] p-4 flex items-start gap-2 text-left flex-none">
            <div className="w-[215px] h-[106px] flex flex-col justify-start">
              <span className="font-poppins font-bold text-[12px] leading-[21px] text-black dark:text-[#FFFFFF]">
                Did you know? <span className="font-normal text-[#000000] dark:text-[#A1A8B3]">Verified organizations receive an average of 4x more inbound partnership inquiries than unverified peers.</span>
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
});

export default Stage3Verification;
