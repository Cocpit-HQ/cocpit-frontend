"use client";

import React, { useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';

const COMPANY_SIZE_OPTIONS = [
  { label: '1–10 members', value: '1-10' },
  { label: '11–50 members', value: '11-50' },
  { label: '51–200 members', value: '51-200' },
  { label: '201–500 members', value: '201-500' },
  { label: '501–1,000 members', value: '501-1000' },
  { label: '1,001–5,000 members', value: '1001-5000' },
  { label: '5,001–10,000 members', value: '5001-10000' },
  { label: '10,000+ members', value: '10000+' },
];

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
  'live.com', 'msn.com', 'me.com', 'gmx.com', 'inbox.com',
  'rediffmail.com', 'mailinator.com'
];

const COUNTRY_OPTIONS = [
  { label: 'India', value: 'IN' },
  { label: 'Singapore', value: 'SG' },
  { label: 'United Arab Emirates', value: 'AE' },
];

const CITY_MAP: Record<string, { label: string; value: string }[]> = {
  IN: [{ label: 'Mumbai', value: 'BOM' }, { label: 'Bangalore', value: 'BLR' }, { label: 'Delhi', value: 'DEL' }],
  SG: [{ label: 'Singapore', value: 'SG' }],
  AE: [{ label: 'Dubai', value: 'DXB' }, { label: 'Abu Dhabi', value: 'AUH' }],
};

const Stage2Presence = React.memo(function Stage2Presence() {
  const officialEmail = useCompanyOnboardingStore(s => s.officialEmail);
  const isEmailVerified = useCompanyOnboardingStore(s => s.isEmailVerified);
  const phoneNumber = useCompanyOnboardingStore(s => s.phoneNumber);
  const isPhoneVerified = useCompanyOnboardingStore(s => s.isPhoneVerified);
  const website = useCompanyOnboardingStore(s => s.website);
  const organizationSize = useCompanyOnboardingStore(s => s.organizationSize);
  const hqCountry = useCompanyOnboardingStore(s => s.hqCountry);
  const hqCity = useCompanyOnboardingStore(s => s.hqCity);
  const headline = useCompanyOnboardingStore(s => s.headline);
  const description = useCompanyOnboardingStore(s => s.description);
  const showValidationErrors = useCompanyOnboardingStore(s => s.showValidationErrors);
  const updateField = useCompanyOnboardingStore(s => s.updateField);

  // Verification loading states
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Custom Dropdowns open state
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  const sizeRef = React.useRef<HTMLDivElement>(null);
  const countryRef = React.useRef<HTMLDivElement>(null);
  const cityRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setIsSizeOpen(false);
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) setIsCountryOpen(false);
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setIsCityOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVerifyEmail = useCallback(() => {
    setVerifyingEmail(true);
    setTimeout(() => {
      updateField('isEmailVerified', true);
      setVerifyingEmail(false);
    }, 1200);
  }, [updateField]);

  const handleVerifyPhone = useCallback(() => {
    setVerifyingPhone(true);
    setTimeout(() => {
      updateField('isPhoneVerified', true);
      setVerifyingPhone(false);
    }, 1200);
  }, [updateField]);

  // Verification code card open states
  const [showEmailCode, setShowEmailCode] = useState(false);
  const [showPhoneCode, setShowPhoneCode] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Inline validation error states
  const [emailDomainError, setEmailDomainError] = useState('');
  const [phoneLengthError, setPhoneLengthError] = useState('');

  // Timers countdown effect
  React.useEffect(() => {
    let emailInterval: NodeJS.Timeout;
    if (emailTimer > 0) {
      emailInterval = setInterval(() => {
        setEmailTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(emailInterval);
  }, [emailTimer]);

  React.useEffect(() => {
    let phoneInterval: NodeJS.Timeout;
    if (phoneTimer > 0) {
      phoneInterval = setInterval(() => {
        setPhoneTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(phoneInterval);
  }, [phoneTimer]);

  const handleVerifyEmailClick = useCallback(() => {
    if (!officialEmail.trim() || isEmailVerified || verifyingEmail) return;

    // Check for free email domain
    const domain = officialEmail.split('@')[1]?.toLowerCase();
    if (domain && FREE_EMAIL_DOMAINS.includes(domain)) {
      setEmailDomainError('Use a company domain email (e.g. you@company.com)');
      return;
    }
    setEmailDomainError('');

    setVerifyingEmail(true);
    setTimeout(() => {
      setVerifyingEmail(false);
      setShowEmailCode(true);
      setEmailTimer(30);
    }, 1000);
  }, [officialEmail, isEmailVerified, verifyingEmail]);

  const handleVerifyPhoneClick = useCallback(() => {
    if (!phoneNumber.trim() || isPhoneVerified || verifyingPhone) return;

    // Check for 10-digit phone number
    if (phoneNumber.replace(/\D/g, '').length !== 10) {
      setPhoneLengthError('Enter a valid 10-digit number');
      return;
    }
    setPhoneLengthError('');

    setVerifyingPhone(true);
    setTimeout(() => {
      setVerifyingPhone(false);
      setShowPhoneCode(true);
      setPhoneTimer(30);
    }, 1000);
  }, [phoneNumber, isPhoneVerified, verifyingPhone]);

  // Handle verification code changes
  const handleEmailCodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setEmailCode(clean);
    if (clean === '000000') {
      updateField('isEmailVerified', true);
    }
  };

  const handlePhoneCodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPhoneCode(clean);
    if (clean === '000000') {
      updateField('isPhoneVerified', true);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-[944px] min-h-[980px] mx-auto select-none">
      
      {/* CSS style to hide scrollbars inside dropdown menus and disable browser autofill background */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #000000 !important;
        }
      `}</style>

      {/* Two Column Layout for Contact and Presence fields */}
      <div className="w-[944px] flex flex-row items-start p-0 gap-6 flex-none">
        
        {/* Column 1 - Left Fields (Email, Website) */}
        <div className="flex flex-col gap-4 w-[460px] flex-none">
          
          {/* Card 1 - Official Email */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[105px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center flex-none transition-colors ${
                showValidationErrors && (!officialEmail.trim() || !isEmailVerified) ? 'text-[#EF4444]' : 'text-black'
              }`}>
                Official Email *
              </label>
            </div>
            <div className="w-[412px] h-[54px] flex flex-row items-start p-0 gap-2 flex-none">
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => {
                  updateField('officialEmail', e.target.value);
                  if (isEmailVerified) updateField('isEmailVerified', false);
                  if (emailDomainError) setEmailDomainError('');
                }}
                placeholder="contact@company.com"
                className={`w-[309px] h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] transition-colors flex-none ${
                  emailDomainError || (showValidationErrors && (!officialEmail.trim() || !isEmailVerified))
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E0E0E7] focus:border-blue-500'
                }`}
              />
              <button
                onClick={handleVerifyEmailClick}
                disabled={isEmailVerified || verifyingEmail || !officialEmail.trim() || showEmailCode}
                className={`w-[95px] h-[54px] rounded-[24px] border flex items-center justify-center font-poppins font-normal text-[16px] leading-[24px] transition-all flex-none select-none ${
                  isEmailVerified
                    ? 'bg-green-50 border-green-200 text-green-600 font-semibold cursor-default'
                    : verifyingEmail
                    ? 'bg-blue-50 border-blue-200 text-blue-500 cursor-wait'
                    : showEmailCode
                    ? 'bg-white border-[#E0E0E7] text-[#6B7280] cursor-not-allowed'
                    : officialEmail.trim()
                    ? 'bg-[#1A73E8] border-[#1A73E8] text-white hover:bg-[#1557b0] active:scale-[0.98]'
                    : 'bg-white border-[#E0E0E7] text-[#6B7280] cursor-not-allowed'
                }`}
              >
                {isEmailVerified ? 'Verified' : verifyingEmail ? '...' : 'Verify'}
              </button>
            </div>
            {/* Email domain validation error */}
            {emailDomainError && (
              <span className="text-[12px] text-[#EF4444] font-poppins font-normal mt-1 px-2">
                *{emailDomainError}
              </span>
            )}
          </div>

          {/* Card 1.5 - Email Verification Code (Shown when Verify is clicked) */}
          {showEmailCode && (
            <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
              <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
                <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black flex items-center">
                  Verification Code
                </label>
              </div>
              <div className="w-[412px] h-[54px] relative flex-none">
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => handleEmailCodeChange(e.target.value)}
                  placeholder="000000"
                  className={`w-full h-full px-6 pr-12 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#E0E0E7] transition-colors ${
                    emailCode.length === 6 && emailCode !== '000000'
                      ? 'border-[#EF4444] focus:border-[#EF4444]'
                      : 'border-[#E0E0E7] focus:border-blue-500'
                  }`}
                />
                {isEmailVerified && (
                  <Icon icon="material-symbols:verified" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#10B981] flex-none" />
                )}
                {emailCode.length === 6 && emailCode !== '000000' && (
                  <Icon icon="material-symbols:cancel" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#EF4444] flex-none" />
                )}
              </div>
              <div className="w-full flex items-center justify-between mt-0.5 px-2">
                {emailCode.length === 6 && emailCode !== '000000' ? (
                  <span className="text-[12px] text-[#EF4444] font-poppins font-normal">*Invalid code</span>
                ) : (
                  <div />
                )}
                <span 
                  onClick={() => {
                    if (emailTimer === 0) {
                      setEmailCode('');
                      updateField('isEmailVerified', false);
                      setEmailTimer(30);
                    }
                  }}
                  className={`text-[12px] font-poppins font-medium flex-none ${
                    emailTimer > 0 
                      ? 'text-[#6B7280] cursor-not-allowed' 
                      : 'text-[#1A73E8] hover:underline cursor-pointer'
                  }`}
                >
                  {emailTimer > 0 ? (
                    <span>Resend code in <span className="text-[#1A73E8] font-semibold">{emailTimer}sec</span></span>
                  ) : (
                    "Resend code"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Card 2 - Website */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black flex items-center">
                Website
              </label>
            </div>
            <input
              type="text"
              value={website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://www.cocpit.com"
              className="w-[412px] h-[54px] px-6 rounded-[24px] border border-[#E0E0E7] focus:outline-none focus:border-blue-500 font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] transition-colors flex-none"
            />
          </div>

        </div>

        {/* Column 2 - Right Fields (Phone, Org Size) */}
        <div className="flex flex-col gap-4 w-[460px] flex-none">
          
          {/* Card 1 - Phone Number */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
                showValidationErrors && (!phoneNumber.trim() || !isPhoneVerified) ? 'text-[#EF4444]' : 'text-black'
              }`}>
                Phone Number *
              </label>
            </div>
            <div className="w-[412px] h-[54px] flex flex-row items-start p-0 gap-2 flex-none">
              <div className="w-[309px] h-[54px] relative flex-none">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer select-none">
                  <span className="text-[20px] leading-none">🇮🇳</span>
                  <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    updateField('phoneNumber', digits);
                    if (isPhoneVerified) updateField('isPhoneVerified', false);
                    if (phoneLengthError) setPhoneLengthError('');
                  }}
                  placeholder="93493-99493"
                  className={`w-full h-full pl-16 pr-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] transition-colors ${
                    showValidationErrors && (!phoneNumber.trim() || !isPhoneVerified)
                      ? 'border-[#EF4444] focus:border-[#EF4444]'
                      : 'border-[#E0E0E7] focus:border-blue-500'
                  }`}
                />
              </div>
              <button
                onClick={handleVerifyPhoneClick}
                disabled={isPhoneVerified || verifyingPhone || !phoneNumber.trim() || showPhoneCode}
                className={`w-[95px] h-[54px] rounded-[24px] border flex items-center justify-center font-poppins font-normal text-[16px] leading-[24px] transition-all flex-none select-none ${
                  isPhoneVerified
                    ? 'bg-green-50 border-green-200 text-green-600 font-semibold cursor-default'
                    : verifyingPhone
                    ? 'bg-blue-50 border-blue-200 text-blue-500 cursor-wait'
                    : showPhoneCode
                    ? 'bg-white border-[#E0E0E7] text-[#6B7280] cursor-not-allowed'
                    : phoneNumber.trim()
                    ? 'bg-[#1A73E8] border-[#1A73E8] text-white hover:bg-[#1557b0] active:scale-[0.98]'
                    : 'bg-white border-[#E0E0E7] text-[#6B7280] cursor-not-allowed'
                }`}
              >
                {isPhoneVerified ? 'Verified' : verifyingPhone ? '...' : 'Verify'}
              </button>
            </div>
            {/* Phone length validation error */}
            {phoneLengthError && (
              <span className="text-[12px] text-[#EF4444] font-poppins font-normal mt-1 px-2">
                *{phoneLengthError}
              </span>
            )}
          </div>

          {/* Card 1.5 - Phone Verification Code (Shown when Verify is clicked) */}
          {showPhoneCode && (
            <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
              <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
                <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black flex items-center">
                  Verification Code
                </label>
              </div>
              <div className="w-[412px] h-[54px] relative flex-none">
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => handlePhoneCodeChange(e.target.value)}
                  placeholder="000000"
                  className={`w-full h-full px-6 pr-12 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#E0E0E7] transition-colors ${
                    phoneCode.length === 6 && phoneCode !== '000000'
                      ? 'border-[#EF4444] focus:border-[#EF4444]'
                      : 'border-[#E0E0E7] focus:border-blue-500'
                  }`}
                />
                {isPhoneVerified && (
                  <Icon icon="material-symbols:verified" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#10B981] flex-none" />
                )}
                {phoneCode.length === 6 && phoneCode !== '000000' && (
                  <Icon icon="material-symbols:cancel" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#EF4444] flex-none" />
                )}
              </div>
              <div className="w-full flex items-center justify-between mt-0.5 px-2">
                {phoneCode.length === 6 && phoneCode !== '000000' ? (
                  <span className="text-[12px] text-[#EF4444] font-poppins font-normal">*Invalid code</span>
                ) : (
                  <div />
                )}
                <span 
                  onClick={() => {
                    if (phoneTimer === 0) {
                      setPhoneCode('');
                      updateField('isPhoneVerified', false);
                      setPhoneTimer(30);
                    }
                  }}
                  className={`text-[12px] font-poppins font-medium flex-none ${
                    phoneTimer > 0 
                      ? 'text-[#6B7280] cursor-not-allowed' 
                      : 'text-[#1A73E8] hover:underline cursor-pointer'
                  }`}
                >
                  {phoneTimer > 0 ? (
                    <span>Resend code in <span className="text-[#1A73E8] font-semibold">{phoneTimer}sec</span></span>
                  ) : (
                    "Resend code"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Card 2 - Organization Size */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black flex items-center">
                Organization Size
              </label>
            </div>
            <div ref={sizeRef} className="w-[412px] h-[54px] relative flex-none">
              <div 
                onClick={() => setIsSizeOpen(!isSizeOpen)}
                className="w-full h-full px-6 rounded-[24px] border border-[#E0E0E7] focus:outline-none hover:border-blue-500 font-poppins font-normal text-[16px] leading-[24px] text-black bg-white transition-colors cursor-pointer flex items-center justify-between select-none"
              >
                <span className={organizationSize ? "text-black" : "text-[#6B7280]"}>
                  {organizationSize ? COMPANY_SIZE_OPTIONS.find(o => o.value === organizationSize)?.label : "Select Size"}
                </span>
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isSizeOpen && (
                <div className="absolute top-[60px] left-0 w-full bg-white border border-[#E0E0E7] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[160px] overflow-y-auto no-scrollbar">
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('organizationSize', opt.value);
                        setIsSizeOpen(false);
                      }}
                      className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black hover:bg-[#EEF2FF] transition-colors cursor-pointer text-left"
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Row 3 - Headquarters Location Section Container */}
      <div className="w-[944px] h-[369px] flex flex-col items-center pt-2 gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex items-center justify-start flex-none">
          <span className="font-poppins font-semibold text-[14px] leading-[20px] tracking-[0.7px] text-[#0D47A1] uppercase">
            HEADQUARTERS LOCATION *
          </span>
        </div>

        {/* Dropdowns Row (Country & City) */}
        <div className="w-[944px] h-[130px] flex flex-row items-start p-0 gap-6 flex-none">
          
          {/* Country Card */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
                showValidationErrors && !hqCountry ? 'text-[#EF4444]' : 'text-black'
              }`}>
                Country
              </label>
            </div>
            <div ref={countryRef} className="w-[412px] h-[54px] relative flex-none">
              <div 
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className={`w-full h-full px-6 rounded-[24px] border focus:outline-none hover:border-blue-500 font-poppins font-normal text-[16px] leading-[24px] text-black bg-white transition-colors cursor-pointer flex items-center justify-between select-none ${
                  showValidationErrors && !hqCountry
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E0E0E7] focus:border-blue-500'
                }`}
              >
                <span className={hqCountry ? "text-black" : "text-[#6B7280]"}>
                  {hqCountry ? COUNTRY_OPTIONS.find(o => o.value === hqCountry)?.label : "Select Country"}
                </span>
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isCountryOpen && (
                <div className="absolute top-[60px] left-0 w-full bg-white border border-[#E0E0E7] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[140px] overflow-y-auto no-scrollbar">
                  {COUNTRY_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('hqCountry', opt.value);
                        updateField('hqCity', ''); // Reset city on country change
                        setIsCountryOpen(false);
                      }}
                      className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black hover:bg-[#EEF2FF] transition-colors cursor-pointer text-left"
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* City Card */}
          <div className="w-[460px] h-[130px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
                showValidationErrors && !hqCity ? 'text-[#EF4444]' : 'text-black'
              }`}>
                City
              </label>
            </div>
            <div ref={cityRef} className="w-[412px] h-[54px] relative flex-none">
              <div 
                onClick={() => hqCountry && setIsCityOpen(!isCityOpen)}
                className={`w-full h-full px-6 rounded-[24px] border focus:outline-none hover:border-blue-500 font-poppins font-normal text-[16px] leading-[24px] bg-white transition-colors flex items-center justify-between select-none ${
                  hqCountry ? 'cursor-pointer text-black' : 'cursor-not-allowed text-[#6B7280] opacity-60'
                } ${
                  showValidationErrors && !hqCity
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E0E0E7] focus:border-blue-500'
                }`}
              >
                <span>
                  {hqCity ? (CITY_MAP[hqCountry]?.find(o => o.value === hqCity)?.label || hqCity) : "Select City"}
                </span>
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isCityOpen && hqCountry && (
                <div className="absolute top-[60px] left-0 w-full bg-white border border-[#E0E0E7] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[140px] overflow-y-auto no-scrollbar">
                  {(CITY_MAP[hqCountry] || []).map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('hqCity', opt.value);
                        setIsCityOpen(false);
                      }}
                      className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black hover:bg-[#EEF2FF] transition-colors cursor-pointer text-left"
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Map Placeholder Card (896px x 191px) */}
        <div className="w-[896px] h-[191px] bg-white border border-[#E0E0E7] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[24px] overflow-hidden relative flex items-center justify-center flex-none mt-2">
          <div className="absolute inset-0 bg-[#E3F2FD] opacity-70">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#BBDEFB" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Abstract land shapes */}
              <path d="M10 50 Q 80 80 120 40 T 250 80 T 360 40" fill="none" stroke="#90CAF9" strokeWidth="3" strokeDasharray="5,5" />
              <path d="M30 110 Q 150 140 280 100" fill="none" stroke="#90CAF9" strokeWidth="2" />
            </svg>
          </div>
          
          {/* Centered Pulse Marker */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#1A73E8] border-2 border-white flex items-center justify-center">
                <Icon icon="mynaui:location" className="w-3.5 h-3.5 text-white" />
              </span>
            </span>
          </div>

          <div className="absolute bottom-3.5 px-3.5 py-1 bg-white/95 rounded-full shadow-sm text-center border border-slate-100 flex items-center gap-1 select-none z-20">
            <Icon icon="mynaui:map" className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-poppins font-medium text-slate-600">HQ Map Preview</span>
          </div>
        </div>

      </div>

      {/* Card 4 - Headline */}
      <div className="w-[944px] h-[134px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex flex-col justify-center flex-none">
          <label className={`w-[896px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${
            showValidationErrors && !headline.trim() ? 'text-[#EF4444]' : 'text-black'
          }`}>
            Headline *
          </label>
        </div>
        <input
          type="text"
          value={headline}
          onChange={(e) => updateField('headline', e.target.value)}
          placeholder="e.g., Accelerating global collaboration through kinetic tech"
          className={`w-[896px] h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] transition-colors flex-none ${
            showValidationErrors && !headline.trim()
              ? 'border-[#EF4444] focus:border-[#EF4444]'
              : 'border-[#E0E0E7] focus:border-blue-500'
          }`}
        />
      </div>

      {/* Card 5 - Description */}
      <div className="w-[944px] h-[225px] bg-white border border-slate-100/50 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex flex-col justify-center flex-none">
          <label className="w-[896px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black flex items-center">
            Description
          </label>
        </div>
        <textarea
          value={description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Tell the world what your company does..."
          className="w-[896px] h-[149px] px-6 py-4 rounded-[24px] border border-[#E0E0E7] focus:outline-none focus:border-blue-500 font-poppins font-normal text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] transition-colors flex-none resize-none"
        />
      </div>

    </div>
  );
});

export default Stage2Presence;
