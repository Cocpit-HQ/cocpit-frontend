"use client";

import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCompanyOnboardingStore } from '../store/company-onboarding.store';
import StageProgressBar from './StageProgressBar';
import StageNavigationButtons from './StageNavigationButtons';
import { publishNewOrganization } from '../services/company-onboarding.api';

import ChooseOrganization from './steps/ChooseOrganization';
import Stage1Identity from './steps/Stage1Identity';
import Stage2Presence from './steps/Stage2Presence';
import Stage3Verification from './steps/Stage3Verification';
import Stage4Live from './steps/Stage4Live';

export function CompanyOnboardingPage() {
  const currentStage = useCompanyOnboardingStore(s => s.currentStage);
  const goNext = useCompanyOnboardingStore(s => s.goNext);
  const goBack = useCompanyOnboardingStore(s => s.goBack);
  const resetStore = useCompanyOnboardingStore(s => s.resetStore);
  const updateField = useCompanyOnboardingStore(s => s.updateField);
  const setCurrentStage = useCompanyOnboardingStore(s => s.setCurrentStage);
  const setOrganizationType = useCompanyOnboardingStore(s => s.setOrganizationType);
  const setOrgId = useCompanyOnboardingStore(s => s.setOrgId);

  // Always reset the store when entering the onboarding flow for a new session
  React.useEffect(() => {
    resetStore();
  }, [resetStore]);
  
  // Store values needed for validation
  const organizationName = useCompanyOnboardingStore(s => s.organizationName);
  const logoPreview = useCompanyOnboardingStore(s => s.logoPreview);
  const officialEmail = useCompanyOnboardingStore(s => s.officialEmail);
  const isEmailVerified = useCompanyOnboardingStore(s => s.isEmailVerified);
  const phoneNumber = useCompanyOnboardingStore(s => s.phoneNumber);
  const phoneCountryCode = useCompanyOnboardingStore(s => s.phoneCountryCode);
  const isPhoneVerified = useCompanyOnboardingStore(s => s.isPhoneVerified);
  const hqCountry = useCompanyOnboardingStore(s => s.hqCountry);
  const hqCity = useCompanyOnboardingStore(s => s.hqCity);
  const headline = useCompanyOnboardingStore(s => s.headline);
  const documents = useCompanyOnboardingStore(s => s.documents);
  const orgId = useCompanyOnboardingStore(s => s.orgId);
  const isSubmitting = useCompanyOnboardingStore(s => s.isSubmitting);
  const setIsSubmitting = useCompanyOnboardingStore(s => s.setIsSubmitting);
  const apiError = useCompanyOnboardingStore(s => s.apiError);
  const setApiError = useCompanyOnboardingStore(s => s.setApiError);
  const foundedYear = useCompanyOnboardingStore(s => s.foundedYear);
  const industry = useCompanyOnboardingStore(s => s.industry);
  const logoFile = useCompanyOnboardingStore(s => s.logoFile);
  const website = useCompanyOnboardingStore(s => s.website);
  const organizationSize = useCompanyOnboardingStore(s => s.organizationSize);
  const description = useCompanyOnboardingStore(s => s.description);
  const countryOfOperation = useCompanyOnboardingStore(s => s.countryOfOperation);
  const organizationType = useCompanyOnboardingStore(s => s.organizationType);

  // Derived validation state
  const isNextDisabled = React.useMemo(() => {
    if (currentStage === 1) {
      const yearTrimmed = foundedYear.trim();
      const isYearInvalid = yearTrimmed.length > 0 && (
        yearTrimmed.length !== 4 ||
        parseInt(yearTrimmed, 10) < 1000 ||
        parseInt(yearTrimmed, 10) > new Date().getFullYear()
      );
      return !organizationName.trim() || !logoPreview || isYearInvalid;
    }
    if (currentStage === 2) {
      return (
        !officialEmail.trim() ||
        !phoneNumber.trim() ||
        !hqCountry.trim() ||
        !hqCity.trim() ||
        !headline.trim() ||
        !isEmailVerified ||
        !isPhoneVerified
      );
    }
    if (currentStage === 3) {
      return false;
    }
    return false;
  }, [
    currentStage,
    organizationName,
    logoPreview,
    officialEmail,
    phoneNumber,
    hqCountry,
    hqCity,
    headline,
    isEmailVerified,
    isPhoneVerified,
    documents,
  ]);

  const handleNext = useCallback(() => {
    if (currentStage === 1) {
      const yearTrimmed = foundedYear.trim();
      const isYearInvalid = yearTrimmed.length > 0 && (
        yearTrimmed.length !== 4 ||
        parseInt(yearTrimmed, 10) < 1000 ||
        parseInt(yearTrimmed, 10) > new Date().getFullYear()
      );
      const hasErrors = !organizationName.trim() || !logoPreview || isYearInvalid;
      if (hasErrors) {
        updateField('showValidationErrors', true);
        return;
      }
      
      updateField('showValidationErrors', false);
      goNext();
      return;
    }
    
    if (currentStage === 2) {
      const hasErrors = !officialEmail.trim() || !phoneNumber.trim() || !hqCountry.trim() || !hqCity.trim() || !headline.trim() || !isEmailVerified || !isPhoneVerified;
      if (hasErrors) {
        updateField('showValidationErrors', true);
        return;
      }

      updateField('showValidationErrors', false);
      goNext();
      return;
    }
    
    updateField('showValidationErrors', false);
    goNext();
  }, [
    currentStage, organizationName, logoPreview, officialEmail, phoneNumber, hqCountry, hqCity, headline, 
    isEmailVerified, isPhoneVerified, goNext, updateField, foundedYear
  ]);

  const [hasPublishError, setHasPublishError] = useState(false);

  const handleCancel = useCallback(() => {
    resetStore();
    window.history.back();
  }, [resetStore]);

  const handlePublish = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setHasPublishError(false);

      const formData = new FormData();
      formData.append('type', organizationType || '');
      formData.append('name', organizationName);
      if (foundedYear) formData.append('established_year', foundedYear);
      if (industry) formData.append('industry', industry);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (logoPreview && logoPreview.startsWith('data:image')) {
        const arr = logoPreview.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const reconstructedFile = new File([u8arr], 'logo.png', { type: mime });
        formData.append('logo', reconstructedFile);
      }

      formData.append('email', officialEmail);
      formData.append('phone', `${phoneCountryCode}${phoneNumber}`);
      if (website) formData.append('website', website);
      formData.append('size', organizationSize);
      formData.append('country', hqCountry);
      formData.append('city', hqCity);
      formData.append('headline', headline);
      if (description) formData.append('description', description);
      if (countryOfOperation) formData.append('country_of_operation', countryOfOperation);

      documents.forEach(doc => {
        if (doc.file) {
          formData.append('documents', doc.file);
        }
      });

      const res = await publishNewOrganization(formData);
      if (res.success) {
        updateField('slug', res.slug);
        updateField('orgId', res.org_id);
        goNext();
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      setHasPublishError(true);
      let msg = err.response?.data?.message || err.message || "Failed to publish organization";
      if (err.response?.status === 413 || msg.includes('File size too large')) {
        msg = "Files are too large. Please upload smaller documents (max 10MB total).";
      } else if (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout')) {
        msg = "Network timeout. Please check your connection and try again.";
      }
      setApiError(msg);
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    organizationType, organizationName, foundedYear, industry, logoFile, 
    officialEmail, phoneCountryCode, phoneNumber, website, organizationSize, 
    hqCountry, hqCity, headline, description, countryOfOperation, documents, 
    goNext, setIsSubmitting, setApiError, updateField
  ]);

  const handleTryAgain = useCallback(async () => {
    handlePublish();
  }, [handlePublish]);

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 0: return <ChooseOrganization />;
      case 1: return <Stage1Identity />;
      case 2: return <Stage2Presence />;
      case 3: return <Stage3Verification />;
      case 4:
        if (hasPublishError) {
          return (
            <div className="w-[944px] flex flex-col items-center justify-center gap-6 mx-auto select-none animate-in fade-in zoom-in duration-200">
              {/* Red Info Circle Icon */}
              <div className="w-10 h-10 rounded-full border-2 border-[#EF4444] dark:border-[#F87171] flex items-center justify-center flex-none">
                <span className="font-poppins font-bold text-[20px] leading-none text-[#EF4444] dark:text-[#F87171] select-none flex items-center justify-center">i</span>
              </div>

              {/* Text messages stack */}
              <div className="flex flex-col items-center justify-start gap-2 flex-none">
                <h1 className="font-poppins font-semibold text-[32px] leading-[40px] text-black dark:text-[#FFFFFF] text-center">
                  Something went wrong
                </h1>
                <p className="w-[450px] font-poppins font-normal text-[14px] leading-[22px] text-[#6B7280] dark:text-[#A1A8B3] text-center">
                  {apiError || "We completed all the required steps, but something went wrong while creating your Organization page. Please try again"}
                </p>
              </div>

              {/* Try Again Button */}
              <button
                onClick={handleTryAgain}
                disabled={isSubmitting}
                className="px-6 py-2 h-[40px] rounded-[24px] bg-[#1A73E8] hover:bg-[#1557b0] disabled:bg-[#E0E0E7] disabled:text-white text-white font-poppins font-medium text-[14px] leading-[20px] transition-all flex items-center justify-center flex-none active:scale-[0.98] gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Try Again
              </button>
            </div>
          );
        }
        return <Stage4Live />;
      default: return null;
    }
  };

  const getStageTitle = () => {
    switch (currentStage) {
      case 1: return "Stage 1: Identity";
      case 2: return "Stage 2: Presence";
      case 3: return "Stage 3: Verification";
      default: return null;
    }
  };



  return (
    <div className="w-full flex justify-center bg-white dark:bg-[#0B0F19] min-h-screen">
      
      {/* FRAME CONTAINER (Dynamic height based on Stage) */}
      <div className={`w-full max-w-[1024px] relative flex flex-col bg-white dark:bg-[#0B0F19] transition-all duration-300 ${
        currentStage === 2 ? 'min-h-[1346px]' : currentStage === 3 ? 'min-h-[812px]' : 'min-h-[780px]'
      }`}>
        
        {/* CLOSE BUTTON - absolute top-[204px] right-[40px] inside frame container, only on Stage 0 */}
        {currentStage === 0 && (
          <button 
            onClick={handleCancel}
            className="absolute top-[204px] right-[40px] p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group z-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" strokeWidth={2.5} />
          </button>
        )}

        {/* CONTENT */}
        <div className={`flex-1 flex flex-col ${
          currentStage === 0 ? 'pt-[269px] pb-10' : currentStage === 4 ? 'p-[24px_40px] justify-center items-center my-auto' : 'pt-[100px] pb-10'
        }`}>
          {/* Common Header / Title for Stages 1-3 */}
          {currentStage > 0 && currentStage < 4 && (
            <div className="mb-10 text-center">
              <h1 className={`h-[40px] text-[32px] leading-[40px] font-bold text-black dark:text-[#FFFFFF] tracking-[-0.32px] flex items-center justify-center mx-auto mb-8 flex-none ${
                currentStage === 1 ? 'w-[254px]' : currentStage === 2 ? 'w-[284px]' : 'w-[320px]'
              }`}>
                {getStageTitle()}
              </h1>
              <StageProgressBar currentStage={currentStage} />
            </div>
          )}

          {/* Animated Stage Content Container */}
          <div className="relative flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* Main Stage Component Wrapper */}
                <div className="w-full flex-1">
                  {renderCurrentStage()}
                </div>
                
                {/* API Error Message */}
                {apiError && currentStage !== 4 && (
                  <div className="w-full max-w-[944px] mx-auto mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400 font-poppins text-[14px]">{apiError}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation Buttons */}
          {currentStage < 4 && (
            <div className="w-full flex flex-col items-center">
              <StageNavigationButtons 
                currentStage={currentStage}
                isNextDisabled={isNextDisabled}
                onNext={handleNext}
                onBack={goBack}
                onCancel={handleCancel}
                onPublish={handlePublish}
                isSubmitting={isSubmitting}
              />
              {apiError && (
                <div className="text-red-500 dark:text-red-400 font-medium mt-4 text-sm">
                  {apiError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
