"use client";

import React, { useCallback, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Icon } from '@iconify/react';
import { useCompanyOnboardingStore } from '../../store/company-onboarding.store';
import { COMPANY_SIZE_OPTIONS } from '../../constants/onboarding.constants';
import {
  getCountries,
  sendEmailOTP,
  confirmEmailOTP,
  sendPhoneOTP,
  confirmPhoneOTP,
  getPlacesAutocomplete,
  getPlaceDetails
} from '../../services/company-onboarding.api';



const PHONE_COUNTRY_OPTIONS = [
  { code: '+91', iso: 'in', label: 'India', digits: 10 },
  { code: '+971', iso: 'ae', label: 'UAE', digits: 9 },
  { code: '+81', iso: 'jp', label: 'Japan', digits: 10 }
];

const Stage2Presence = React.memo(function Stage2Presence() {
  const sessionToken = useRef(uuidv4());
  const officialEmail = useCompanyOnboardingStore(s => s.officialEmail);
  const isEmailVerified = useCompanyOnboardingStore(s => s.isEmailVerified);
  const phoneNumber = useCompanyOnboardingStore(s => s.phoneNumber);
  const phoneCountryCode = useCompanyOnboardingStore(s => s.phoneCountryCode);
  const isPhoneVerified = useCompanyOnboardingStore(s => s.isPhoneVerified);
  const website = useCompanyOnboardingStore(s => s.website);
  const organizationSize = useCompanyOnboardingStore(s => s.organizationSize);
  const hqCountry = useCompanyOnboardingStore(s => s.hqCountry);
  const hqCity = useCompanyOnboardingStore(s => s.hqCity);
  const headline = useCompanyOnboardingStore(s => s.headline);
  const description = useCompanyOnboardingStore(s => s.description);
  const showValidationErrors = useCompanyOnboardingStore(s => s.showValidationErrors);
  const updateField = useCompanyOnboardingStore(s => s.updateField);
  const orgId = useCompanyOnboardingStore(s => s.orgId);

  // Dynamic Countries
  const [countryOptions, setCountryOptions] = useState<{ label: string, value: string }[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    getCountries().then(countries => {
      if (isMounted) {
        const getFlag = (c: string) => {
          if (c === 'India') return '🇮🇳 ';
          if (c === 'UAE') return '🇦🇪 ';
          if (c === 'Japan') return '🇯🇵 ';
          return '';
        };
        setCountryOptions(countries.map(c => ({ label: `${getFlag(c)}${c}`, value: c })));
      }
    }).catch(console.error);
    return () => { isMounted = false; };
  }, []);

  // Verification loading states
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Custom Dropdowns open state
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);

  const sizeRef = React.useRef<HTMLDivElement>(null);
  const countryRef = React.useRef<HTMLDivElement>(null);
  const cityRef = React.useRef<HTMLDivElement>(null);
  const phoneCountryRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setIsSizeOpen(false);
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) setIsCountryOpen(false);
      if (phoneCountryRef.current && !phoneCountryRef.current.contains(event.target as Node)) setIsPhoneCountryOpen(false);
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityOpen(false);
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const [emailCodeError, setEmailCodeError] = useState('');
  const [phoneCodeError, setPhoneCodeError] = useState('');

  // Location autocomplete states
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Debounced search for city
  React.useEffect(() => {
    const delay = setTimeout(async () => {
      if (citySearch.trim().length > 1) {
        setIsSearchingCity(true);
        try {
          const res = await getPlacesAutocomplete(citySearch, sessionToken.current, hqCountry);
          if (res.success && res.data) {
            setCitySuggestions(res.data);
            setShowCityDropdown(true);
          }
        } catch (e) {
          console.error('Failed to fetch cities', e);
        } finally {
          setIsSearchingCity(false);
        }
      } else {
        setCitySuggestions([]);
        setShowCityDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [citySearch, hqCountry]);

  const handleCitySelect = async (placeId: string) => {
    setShowCityDropdown(false);
    setCitySearch('');
    try {
      const res = await getPlaceDetails(placeId, sessionToken.current);
      if (res.success && res.data) {
        updateField('hqCity', res.data.city || '');
        if (res.data.country) {
          // Find the country code that matches the country name
          const googleCountry = res.data.country.toLowerCase();
          const countryMap: Record<string, string> = {
            "united arab emirates": "UAE",
            "india": "India",
            "japan": "Japan"
          };
          const mappedName = countryMap[googleCountry] || res.data.country;
          const matchedCountry = countryOptions.find(o => o.label.toLowerCase() === mappedName.toLowerCase() || o.value.toLowerCase() === mappedName.toLowerCase());
          if (matchedCountry) {
            updateField('hqCountry', matchedCountry.value);
          }
        }
      }
    } catch (e) {
      console.error('Failed to get place details', e);
    }
  };

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

  const handleVerifyEmailClick = useCallback(async () => {
    if (!officialEmail.trim() || isEmailVerified || verifyingEmail) return;

    setEmailDomainError('');

    setVerifyingEmail(true);
    try {
      await sendEmailOTP(officialEmail);
      setShowEmailCode(true);
      setEmailTimer(30);
      setEmailCodeError('');
    } catch (error: any) {
      setEmailDomainError('Failed to send verification code');
    } finally {
      setVerifyingEmail(false);
    }
  }, [officialEmail, isEmailVerified, verifyingEmail]);

  const handleVerifyPhoneClick = useCallback(async () => {
    if (!phoneNumber.trim() || isPhoneVerified || verifyingPhone) return;

    const selectedCountry = PHONE_COUNTRY_OPTIONS.find(c => c.code === phoneCountryCode) || PHONE_COUNTRY_OPTIONS[0];
    const numericLength = phoneNumber.replace(/\D/g, '').length;

    // Check for exact digits
    if (numericLength !== selectedCountry.digits) {
      setPhoneLengthError(`Enter a valid ${selectedCountry.digits}-digit number`);
      return;
    }
    setPhoneLengthError('');

    setVerifyingPhone(true);
    try {
      await sendPhoneOTP(`${phoneCountryCode}${phoneNumber}`);
      setShowPhoneCode(true);
      setPhoneTimer(30);
      setPhoneCodeError('');
    } catch (error: any) {
      setPhoneLengthError('Failed to send verification code');
    } finally {
      setVerifyingPhone(false);
    }
  }, [phoneNumber, phoneCountryCode, isPhoneVerified, verifyingPhone]);

  // Handle verification code changes
  const handleEmailCodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setEmailCode(clean);
    setEmailCodeError('');
    if (clean.length === 6) {
      try {
        const res = await confirmEmailOTP(officialEmail, clean);
        if (res.verified) {
          updateField('isEmailVerified', true);
        } else {
          setEmailCodeError(res.message || 'Invalid verification code');
        }
      } catch (error: any) {
        if (error.response?.data?.message) {
          setEmailCodeError(error.response.data.message);
        } else {
          setEmailCodeError('Invalid verification code');
        }
      }
    }
  };

  const handlePhoneCodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPhoneCode(clean);
    setPhoneCodeError('');
    if (clean.length === 6) {
      try {
        const res = await confirmPhoneOTP(`${phoneCountryCode}${phoneNumber}`, clean);
        if (res.verified) {
          updateField('isPhoneVerified', true);
          // Auto-set HQ country from verified phone country code
          const phoneCountryToHq: Record<string, string> = {
            '+91':  'India',
            '+971': 'UAE',
            '+81':  'Japan',
          };
          const detectedCountry = phoneCountryToHq[phoneCountryCode];
          if (detectedCountry) {
            updateField('hqCountry', detectedCountry);
            updateField('hqCity', ''); // reset city when country changes
          }
        } else {
          setPhoneCodeError(res.message || 'Invalid verification code');
        }
      } catch (error: any) {
        if (error.response?.data?.message) {
          setPhoneCodeError(error.response.data.message);
        } else {
          setPhoneCodeError('Invalid verification code');
        }
      }
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
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover, 
        .dark input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1A2236 inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
      `}</style>

      {/* Grid Layout for Contact and Presence fields */}
      <div className="w-[944px] flex flex-col items-start p-0 gap-4 flex-none">

        {/* Official Email Note */}
        <div className="w-full flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-[12px]">
          <Icon icon="material-symbols:info-outline" className="w-5 h-5 text-blue-500 flex-none mt-0.5" />
          <span className="font-poppins font-normal text-[14px] leading-[20px] text-blue-800 dark:text-blue-200">
            If your company has an official website, please use the email address associated with the same domain when creating the company page.
          </span>
        </div>

        {/* Row 1 - Email & Code */}
        <div className="flex flex-row gap-6 w-full">
          {/* Card 1 - Official Email */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center flex-none transition-colors ${showValidationErrors && (!officialEmail.trim() || !isEmailVerified) ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
                }`}>
                Official Email *
              </label>
            </div>
            <div className="w-[412px] h-[54px] flex flex-row items-start p-0 gap-2 flex-none">
              <input
                type="email"
                value={officialEmail}
                disabled={isEmailVerified}
                onChange={(e) => {
                  updateField('officialEmail', e.target.value);
                  if (isEmailVerified) updateField('isEmailVerified', false);
                  if (showEmailCode) setShowEmailCode(false);
                  if (emailDomainError) setEmailDomainError('');
                }}
                placeholder="contact@company.com"
                className={`h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-all flex-none ${
                  isEmailVerified ? 'w-[412px]' : 'w-[309px]'
                } ${
                  emailDomainError || (showValidationErrors && (!officialEmail.trim() || !isEmailVerified))
                    ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                    : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
                }`}
              />
              {!isEmailVerified && (
                <button
                  onClick={handleVerifyEmailClick}
                  disabled={verifyingEmail || !officialEmail.trim() || showEmailCode}
                  className={`w-[95px] h-[54px] rounded-[24px] border flex items-center justify-center font-poppins font-normal text-[16px] leading-[24px] transition-all flex-none select-none ${
                    verifyingEmail
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-500 dark:text-blue-400 cursor-wait'
                      : showEmailCode
                        ? 'bg-white dark:bg-[#1A2236] border-[#E0E0E7] dark:border-[#1C2840] text-[#6B7280] dark:text-[#A1A8B3] cursor-not-allowed'
                        : officialEmail.trim()
                          ? 'bg-[#1A73E8] border-[#1A73E8] text-white hover:bg-[#1557b0] active:scale-[0.98]'
                          : 'bg-white dark:bg-[#1A2236] border-[#E0E0E7] dark:border-[#1C2840] text-[#6B7280] dark:text-[#A1A8B3] cursor-not-allowed'
                  }`}
                >
                  {verifyingEmail ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Verify'}
                </button>
              )}
            </div>
            {/* Email domain validation error */}
            {emailDomainError && (
              <span className="text-[12px] text-[#EF4444] dark:text-[#F87171] font-poppins font-normal mt-1 px-2">
                *{emailDomainError}
              </span>
            )}
          </div>
          {/* Card 1.5 - Email Verification Code */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
                Verification Code
              </label>
            </div>
            <div className="w-[412px] h-[54px] relative flex-none">
              <input
                type="text"
                value={isEmailVerified ? 'XXXXXX' : emailCode}
                disabled={isEmailVerified}
                onChange={(e) => handleEmailCodeChange(e.target.value)}
                placeholder="000000"
                className={`w-full h-full px-6 pr-12 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#E0E0E7] dark:placeholder:text-[#6B7280] transition-colors ${!!emailCodeError
                    ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                    : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
                  }`}
              />
              {isEmailVerified && (
                <Icon icon="material-symbols:verified" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#10B981] flex-none" />
              )}
              {!!emailCodeError && (
                <Icon icon="material-symbols:cancel" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#EF4444] dark:text-[#F87171] flex-none" />
              )}
              
              <div className="absolute -bottom-[22px] right-2 flex items-center justify-between w-full">
                {!!emailCodeError ? (
                  <span className="text-[12px] text-[#EF4444] dark:text-[#F87171] font-poppins font-normal">*{emailCodeError}</span>
                ) : (
                  <div />
                )}
                {!isEmailVerified && (
                  <span
                    onClick={() => {
                      if (showEmailCode && emailTimer === 0) {
                        setEmailCode('');
                        setEmailCodeError('');
                        updateField('isEmailVerified', false);
                        setEmailTimer(30);
                        sendEmailOTP(officialEmail).catch(() => {
                          setEmailDomainError('Failed to resend verification code');
                        });
                      }
                    }}
                    className={`text-[12px] font-poppins font-medium flex-none ${
                      !showEmailCode
                        ? 'text-[#E0E0E7] dark:text-[#6B7280] cursor-not-allowed'
                        : emailTimer > 0
                          ? 'text-[#1A73E8] dark:text-[#82B8FF] cursor-not-allowed opacity-70'
                          : 'text-[#1A73E8] dark:text-[#82B8FF] hover:underline cursor-pointer'
                      }`}
                  >
                    {emailTimer > 0 ? (
                      <span>Resend code in <span className="font-semibold">{emailTimer}sec</span></span>
                    ) : (
                      "Resend code"
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 - Phone & Code */}
        <div className="flex flex-row gap-6 w-full">
          {/* Card 1 - Phone Number */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${showValidationErrors && (!phoneNumber.trim() || !isPhoneVerified) ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
                }`}>
                Phone Number *
              </label>
            </div>
            <div className="w-[412px] h-[54px] flex flex-row items-start p-0 gap-2 flex-none">
              <div className={`h-[54px] relative flex-none transition-all ${
                isPhoneVerified ? 'w-[412px]' : 'w-[309px]'
              }`} ref={phoneCountryRef}>
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer select-none z-10"
                  onClick={() => { if (!isPhoneVerified) setIsPhoneCountryOpen(!isPhoneCountryOpen); }}
                >
                  <span className="flex items-center">
                    <img src={`https://flagcdn.com/w20/${PHONE_COUNTRY_OPTIONS.find(c => c.code === phoneCountryCode)?.iso || 'in'}.png`} alt="flag" className="w-[20px] h-[15px] object-cover rounded-[2px]" />
                  </span>
                  {!isPhoneVerified && (
                    <svg className="w-3.5 h-3.5 text-black dark:text-[#FFFFFF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {isPhoneCountryOpen && !isPhoneVerified && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-[140px] bg-white dark:bg-[#1A2236] border border-slate-100/50 dark:border-[#1C2840] shadow-lg rounded-[12px] py-2 z-50">
                    {PHONE_COUNTRY_OPTIONS.map(opt => (
                      <div
                        key={opt.code}
                        className="px-4 py-2 font-poppins font-normal text-[14px] text-black dark:text-[#FFFFFF] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-2"
                        onClick={() => {
                          updateField('phoneCountryCode', opt.code);
                          setIsPhoneCountryOpen(false);
                          if (isPhoneVerified) updateField('isPhoneVerified', false);
                          if (showPhoneCode) setShowPhoneCode(false);
                          if (phoneLengthError) setPhoneLengthError('');
                        }}
                      >
                        <span className="flex items-center">
                          <img src={`https://flagcdn.com/w20/${opt.iso}.png`} alt={opt.iso} className="w-[20px] h-[15px] object-cover rounded-[2px]" />
                        </span>
                        <span>{opt.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <input
                  type="tel"
                  value={phoneNumber}
                  disabled={isPhoneVerified}
                  onChange={(e) => {
                    const selectedCountry = PHONE_COUNTRY_OPTIONS.find(c => c.code === phoneCountryCode) || PHONE_COUNTRY_OPTIONS[0];
                    const val = e.target.value.replace(/[^\d\s\+]/g, '');
                    const digitsOnly = val.replace(/\D/g, '');
                    if (digitsOnly.length > selectedCountry.digits) return;
                    
                    updateField('phoneNumber', val);
                    if (isPhoneVerified) updateField('isPhoneVerified', false);
                    if (showPhoneCode) setShowPhoneCode(false);
                    if (phoneLengthError) setPhoneLengthError('');
                  }}
                  placeholder="93493-99493"
                  className={`w-full h-full pl-16 pr-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors ${showValidationErrors && (!phoneNumber.trim() || !isPhoneVerified)
                      ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                      : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
                    }`}
                />
              </div>
              {!isPhoneVerified && (
                <button
                  onClick={handleVerifyPhoneClick}
                  disabled={verifyingPhone || !phoneNumber.trim() || showPhoneCode}
                  className={`w-[95px] h-[54px] rounded-[24px] border flex items-center justify-center font-poppins font-normal text-[16px] leading-[24px] transition-all flex-none select-none ${
                    verifyingPhone
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-500 dark:text-blue-400 cursor-wait'
                      : showPhoneCode
                        ? 'bg-white dark:bg-[#1A2236] border-[#E0E0E7] dark:border-[#1C2840] text-[#6B7280] dark:text-[#A1A8B3] cursor-not-allowed'
                        : phoneNumber.trim()
                          ? 'bg-[#1A73E8] border-[#1A73E8] text-white hover:bg-[#1557b0] active:scale-[0.98]'
                          : 'bg-white dark:bg-[#1A2236] border-[#E0E0E7] dark:border-[#1C2840] text-[#6B7280] dark:text-[#A1A8B3] cursor-not-allowed'
                  }`}
                >
                  {verifyingPhone ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Verify'}
                </button>
              )}
            </div>
            {/* Phone length validation error */}
            {phoneLengthError && (
              <span className="text-[12px] text-[#EF4444] dark:text-[#F87171] font-poppins font-normal mt-1 px-2">
                *{phoneLengthError}
              </span>
            )}
          </div>
          {/* Card 1.5 - Phone Verification Code */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
                Verification Code
              </label>
            </div>
            <div className="w-[412px] h-[54px] relative flex-none">
              <input
                type="text"
                value={isPhoneVerified ? 'XXXXXX' : phoneCode}
                disabled={isPhoneVerified}
                onChange={(e) => handlePhoneCodeChange(e.target.value)}
                placeholder="000000"
                className={`w-full h-full px-6 pr-12 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#E0E0E7] dark:placeholder:text-[#6B7280] transition-colors ${!!phoneCodeError
                    ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                    : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
                  }`}
              />
              {isPhoneVerified && (
                <Icon icon="material-symbols:verified" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#10B981] flex-none" />
              )}
              {!!phoneCodeError && (
                <Icon icon="material-symbols:cancel" className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#EF4444] dark:text-[#F87171] flex-none" />
              )}
              
              <div className="absolute -bottom-[22px] right-2 flex items-center justify-between w-full">
                {!!phoneCodeError ? (
                  <span className="text-[12px] text-[#EF4444] dark:text-[#F87171] font-poppins font-normal">*{phoneCodeError}</span>
                ) : (
                  <div />
                )}
                {!isPhoneVerified && (
                  <span
                    onClick={() => {
                      if (showPhoneCode && phoneTimer === 0) {
                        setPhoneCode('');
                        setPhoneCodeError('');
                        updateField('isPhoneVerified', false);
                        setPhoneTimer(30);
                        sendPhoneOTP(`${phoneCountryCode}${phoneNumber}`).catch(() => {
                          setPhoneLengthError('Failed to resend verification code');
                        });
                      }
                    }}
                    className={`text-[12px] font-poppins font-medium flex-none ${
                      !showPhoneCode
                        ? 'text-[#E0E0E7] dark:text-[#6B7280] cursor-not-allowed'
                        : phoneTimer > 0
                          ? 'text-[#1A73E8] dark:text-[#82B8FF] cursor-not-allowed opacity-70'
                          : 'text-[#1A73E8] dark:text-[#82B8FF] hover:underline cursor-pointer'
                      }`}
                  >
                    {phoneTimer > 0 ? (
                      <span>Resend code in <span className="font-semibold">{phoneTimer}sec</span></span>
                    ) : (
                      "Resend code"
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 - Website & Org Size */}
        <div className="flex flex-row gap-6 w-full">
          {/* Card 2 - Website */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
                Website
              </label>
            </div>
            <input
              type="text"
              value={website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://www.cocpit.com"
              className="w-[412px] h-[54px] px-6 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] focus:outline-none focus:border-blue-500 dark:focus:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors flex-none"
            />
          </div>
          {/* Card 2 - Organization Size */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className="w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
                Organization Size
              </label>
            </div>
            <div ref={sizeRef} className="w-[412px] h-[54px] relative flex-none">
              <div
                onClick={() => setIsSizeOpen(!isSizeOpen)}
                className="w-full h-full px-6 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] focus:outline-none hover:border-blue-500 dark:hover:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] transition-colors cursor-pointer flex items-center justify-between select-none"
              >
                <span className={organizationSize ? "text-black dark:text-[#FFFFFF]" : "text-[#6B7280] dark:text-[#A1A8B3]"}>
                  {organizationSize ? COMPANY_SIZE_OPTIONS.find(o => o.value === organizationSize)?.label : "Select Size"}
                </span>
                <svg className="w-4 h-4 text-black dark:text-[#FFFFFF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isSizeOpen && (
                <div className="absolute top-[60px] left-0 w-full bg-white dark:bg-[#161D2E] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[160px] overflow-y-auto no-scrollbar">
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('organizationSize', opt.value);
                        setIsSizeOpen(false);
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
        </div>

      </div>

      {/* Row 3 - Headquarters Location Section Container */}
      <div className="w-[944px] h-[369px] flex flex-col items-center pt-2 gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex items-center justify-start flex-none">
          <span className="font-poppins font-semibold text-[14px] leading-[20px] tracking-[0.7px] text-[#0D47A1] dark:text-[#82B8FF] uppercase">
            HEADQUARTERS LOCATION *
          </span>
        </div>

        {/* Dropdowns Row (Country & City) */}
        <div className="w-[944px] h-[130px] flex flex-row items-start p-0 gap-6 flex-none">

          {/* Country Card */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${showValidationErrors && !hqCountry ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
                }`}>
                Country
              </label>
            </div>
            <div ref={countryRef} className="w-[412px] h-[54px] relative flex-none">
              <div
                onClick={() => { if (!isPhoneVerified) setIsCountryOpen(!isCountryOpen); }}
                className={`w-full h-full px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] transition-colors flex items-center justify-between select-none ${
                  isPhoneVerified
                    ? 'border-[#E0E0E7] dark:border-[#1C2840] cursor-not-allowed opacity-70'
                    : showValidationErrors && !hqCountry
                      ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171] cursor-pointer hover:border-blue-500 dark:hover:border-[#82B8FF]'
                      : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF] cursor-pointer hover:border-blue-500 dark:hover:border-[#82B8FF]'
                }`}
              >
                <span className={hqCountry ? "text-black dark:text-[#FFFFFF]" : "text-[#6B7280] dark:text-[#A1A8B3]"}>
                  {hqCountry ? countryOptions.find(o => o.value === hqCountry)?.label : "Select Country"}
                </span>
                {isPhoneVerified ? (
                  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-black dark:text-[#FFFFFF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>

              {!isPhoneVerified && isCountryOpen && (
                <div className="absolute top-[60px] left-0 w-full bg-white dark:bg-[#161D2E] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[140px] overflow-y-auto no-scrollbar">
                  {countryOptions.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('hqCountry', opt.value);
                        updateField('hqCity', ''); // Reset city on country change
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

          {/* City Card */}
          <div className="w-[460px] h-[130px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
            <div className="w-[412px] h-[20px] flex flex-col justify-center flex-none">
              <label className={`w-[412px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${showValidationErrors && !hqCity ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
                }`}>
                City
              </label>
            </div>
            <div ref={cityRef} className="w-[412px] h-[54px] relative flex-none">
              <input
                type="text"
                value={showCityDropdown || citySearch !== '' ? citySearch : (hqCity || '')}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                  if (e.target.value === '') {
                     updateField('hqCity', '');
                  }
                }}
                onFocus={() => {
                  setShowCityDropdown(true);
                  if (!citySearch && hqCity) {
                    setCitySearch(hqCity);
                  }
                }}
                placeholder="Search City"
                className={`w-full h-full px-6 pr-12 rounded-[24px] border focus:outline-none hover:border-blue-500 dark:hover:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors ${showValidationErrors && !hqCity
                    ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
                    : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
                  }`}
              />
              <Icon icon="mynaui:search" className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-[#A1A8B3] cursor-pointer" />

              {showCityDropdown && (
                <div className="absolute top-[60px] left-0 w-full bg-white dark:bg-[#161D2E] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] rounded-[16px] py-2 z-[9999] max-h-[200px] overflow-y-auto no-scrollbar">
                  {isSearchingCity ? (
                    <div className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black dark:text-[#A1A8B3]">Searching...</div>
                  ) : citySuggestions.length > 0 ? (
                    citySuggestions.map((opt) => (
                      <div
                        key={opt.placeId}
                        onClick={() => {
                          handleCitySelect(opt.placeId);
                        }}
                        className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-black dark:text-[#A1A8B3] hover:bg-[#EEF2FF] dark:hover:bg-[#1A2236] transition-colors cursor-pointer text-left truncate"
                      >
                        {opt.description}
                      </div>
                    ))
                  ) : citySearch.length > 1 ? (
                    <div className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-[#6B7280] dark:text-[#A1A8B3]">No results found</div>
                  ) : (
                    <div className="w-full px-6 py-3 font-poppins font-normal text-[16px] text-[#6B7280] dark:text-[#A1A8B3]">Type to search...</div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Map Placeholder Card (896px x 191px) */}
        <div className="w-[896px] h-[191px] bg-[#E5E9F0] dark:bg-[#111827] border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[24px] overflow-hidden relative flex items-center justify-center flex-none mt-2">
          {hqCountry || hqCity ? (
            <>
              <iframe
                width="100%"
                height="100%"
                className="border-0 relative z-0"
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent([hqCity, hqCountry].filter(Boolean).join(', '))}&z=${hqCity ? 12 : 5}&output=embed`}
              />
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent([hqCity, hqCountry].filter(Boolean).join(', '))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label="Open in Google Maps"
              />
            </>
          ) : (
            <div className="text-gray-400 text-sm font-poppins">Select a country or city to view map</div>
          )}

          <div className="absolute bottom-3.5 px-3.5 py-1 bg-white/95 dark:bg-[#1C2840]/95 rounded-full shadow-sm text-center border border-slate-100 dark:border-[#1C2840]/50 flex items-center gap-1 select-none z-20 pointer-events-none">
            <Icon icon="mynaui:map" className="w-3.5 h-3.5 text-slate-500 dark:text-[#A1A8B3]" />
            <span className="text-[10px] font-poppins font-medium text-slate-600 dark:text-[#A1A8B3]">HQ Map Preview</span>
          </div>
        </div>

      </div>

      {/* Card 4 - Headline */}
      <div className="w-[944px] h-[134px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex flex-col justify-center flex-none">
          <label className={`w-[896px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] flex items-center transition-colors ${showValidationErrors && !headline.trim() ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-black dark:text-[#A1A8B3]'
            }`}>
            Headline *
          </label>
        </div>
        <input
          type="text"
          value={headline}
          onChange={(e) => updateField('headline', e.target.value)}
          placeholder="e.g., Accelerating global collaboration through kinetic tech"
          className={`w-[896px] h-[54px] px-6 rounded-[24px] border focus:outline-none font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors flex-none ${showValidationErrors && !headline.trim()
              ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] dark:focus:border-[#F87171]'
              : 'border-[#E0E0E7] dark:border-[#1C2840] focus:border-blue-500 dark:focus:border-[#82B8FF]'
            }`}
        />
      </div>

      {/* Card 5 - Description */}
      <div className="w-[944px] h-[225px] bg-white dark:bg-[#111827] border border-slate-100/50 dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[12px] p-6 flex flex-col gap-2 flex-none">
        <div className="w-[896px] h-[20px] flex flex-col justify-center flex-none">
          <label className="w-[896px] h-[20px] font-poppins font-medium text-[14px] leading-[20px] tracking-[0.14px] text-black dark:text-[#A1A8B3] flex items-center">
            Description
          </label>
        </div>
        <textarea
          value={description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Tell the world what your company does..."
          className="w-[896px] h-[149px] px-6 py-4 rounded-[24px] border border-[#E0E0E7] dark:border-[#1C2840] focus:outline-none focus:border-blue-500 dark:focus:border-[#82B8FF] font-poppins font-normal text-[16px] leading-[24px] text-black dark:text-[#FFFFFF] bg-white dark:bg-[#1A2236] placeholder:text-[#6B7280] dark:placeholder:text-[#6B7280] transition-colors flex-none resize-none"
        />
      </div>
    </div>
  );
});

export default Stage2Presence;
