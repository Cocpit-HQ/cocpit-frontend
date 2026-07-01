"use client";

import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCompanyOnboardingStore } from '../store/company-onboarding.store';
import StageProgressBar from './StageProgressBar';
import StageNavigationButtons from './StageNavigationButtons';

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
  
  // Store values needed for validation
  const organizationName = useCompanyOnboardingStore(s => s.organizationName);
  const logoPreview = useCompanyOnboardingStore(s => s.logoPreview);
  const officialEmail = useCompanyOnboardingStore(s => s.officialEmail);
  const isEmailVerified = useCompanyOnboardingStore(s => s.isEmailVerified);
  const phoneNumber = useCompanyOnboardingStore(s => s.phoneNumber);
  const isPhoneVerified = useCompanyOnboardingStore(s => s.isPhoneVerified);
  const hqCountry = useCompanyOnboardingStore(s => s.hqCountry);
  const hqCity = useCompanyOnboardingStore(s => s.hqCity);
  const headline = useCompanyOnboardingStore(s => s.headline);
  const documents = useCompanyOnboardingStore(s => s.documents);

  // Derived validation state
  const isNextDisabled = React.useMemo(() => {
    if (currentStage === 3) {
      return documents.length === 0 || documents.every(d => !d.file);
    }
    return false;
  }, [currentStage, documents]);

  const handleNext = useCallback(() => {
    if (currentStage === 1) {
      const hasErrors = !organizationName.trim() || !logoPreview;
      if (hasErrors) {
        updateField('showValidationErrors', true);
        return;
      }
    }
    if (currentStage === 2) {
      const hasErrors = !officialEmail.trim() || !phoneNumber.trim() || !hqCountry.trim() || !hqCity.trim() || !headline.trim() || !isEmailVerified || !isPhoneVerified;
      if (hasErrors) {
        updateField('showValidationErrors', true);
        return;
      }
    }
    updateField('showValidationErrors', false);
    goNext();
  }, [currentStage, organizationName, logoPreview, officialEmail, phoneNumber, hqCountry, hqCity, headline, isEmailVerified, isPhoneVerified, goNext, updateField]);

  const [hasPublishError, setHasPublishError] = useState(true);

  const handleCancel = useCallback(() => {
    resetStore();
    window.history.back();
  }, [resetStore]);

  const handlePublish = useCallback(() => {
    console.log("Publishing organization...");
    setHasPublishError(true); // Reset to fail first on publish click to show fail flow
    goNext();
  }, [goNext]);

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
              <div className="w-10 h-10 rounded-full border-2 border-[#EF4444] flex items-center justify-center flex-none">
                <span className="font-poppins font-bold text-[20px] leading-none text-[#EF4444] select-none flex items-center justify-center">i</span>
              </div>

              {/* Text messages stack */}
              <div className="flex flex-col items-center justify-start gap-2 flex-none">
                <h1 className="font-poppins font-semibold text-[32px] leading-[40px] text-black text-center">
                  Something went wrong
                </h1>
                <p className="w-[450px] font-poppins font-normal text-[14px] leading-[22px] text-[#6B7280] text-center">
                  We completed all the required steps, but something went wrong while creating your Organization page. Please try again
                </p>
              </div>

              {/* Try Again Button */}
              <button
                onClick={() => setHasPublishError(false)}
                className="px-6 py-2 h-[40px] rounded-[24px] bg-[#1A73E8] hover:bg-[#1557b0] text-white font-poppins font-medium text-[14px] leading-[20px] transition-all flex items-center justify-center flex-none active:scale-[0.98]"
              >
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
    <div className="w-full flex justify-center bg-white min-h-screen">
      
      {/* FRAME CONTAINER (Dynamic height based on Stage) */}
      <div className={`w-full max-w-[1024px] relative flex flex-col bg-white transition-all duration-300 ${
        currentStage === 2 ? 'min-h-[1346px]' : currentStage === 3 ? 'min-h-[812px]' : 'min-h-[780px]'
      }`}>
        
        {/* CLOSE BUTTON - absolute top-[204px] right-[40px] inside frame container, only on Stage 0 */}
        {currentStage === 0 && (
          <button 
            onClick={handleCancel}
            className="absolute top-[204px] right-[40px] p-2 rounded-full hover:bg-red-50 transition-colors group z-50"
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
              <h1 className={`h-[40px] text-[32px] leading-[40px] font-bold text-black tracking-[-0.32px] flex items-center justify-center mx-auto mb-8 flex-none ${
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
                {renderCurrentStage()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation Buttons */}
          {currentStage < 4 && (
            <StageNavigationButtons 
              currentStage={currentStage}
              isNextDisabled={isNextDisabled}
              onNext={handleNext}
              onBack={goBack}
              onCancel={handleCancel}
              onPublish={handlePublish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
