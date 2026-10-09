"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";
import {
  CompanyOnboardingLayout,
  StepChooseOrganization,
  StepIdentity,
  StepPresence,
  StepVerification,
  StepCongratulations,
  StepError,
  StepStagePlaceholder,
} from "../components";

export const CompanyOnboardingFlow: React.FC = () => {
  const router = useRouter();
  const currentStage = useCompanyOnboardingStore((s) => s.currentStage);
  const setCurrentStage = useCompanyOnboardingStore((s) => s.setCurrentStage);
  const apiError = useCompanyOnboardingStore((s) => s.apiError);
  const setApiError = useCompanyOnboardingStore((s) => s.setApiError);
  const goNext = useCompanyOnboardingStore((s) => s.goNext);
  const goBack = useCompanyOnboardingStore((s) => s.goBack);
  const resetStore = useCompanyOnboardingStore((s) => s.resetStore);

  // Reset store when mounting a new flow
  useEffect(() => {
    resetStore();
  }, [resetStore]);

  const handleNext = () => {
    goNext();
  };

  const handleBack = () => {
    goBack();
  };

  const handleRetry = () => {
    setApiError(null);
    setCurrentStage(3);
  };

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return <StepChooseOrganization onNext={handleNext} />;
      case 1:
        return <StepIdentity onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <StepPresence onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <StepVerification onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <StepCongratulations />;
      case 5:
        return (
          <StepError
            onRetry={handleRetry}
            errorMessage={apiError || undefined}
          />
        );
      default:
        return (
          <StepStagePlaceholder
            stage={currentStage}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
    }
  };

  return (
    <CompanyOnboardingLayout
      showBack={currentStage > 0 && currentStage < 4}
      onBack={handleBack}
      showClose={true}
      onClose={currentStage >= 4 ? () => router.replace("/feed") : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full flex items-center justify-center"
        >
          {renderStage()}
        </motion.div>
      </AnimatePresence>
    </CompanyOnboardingLayout>
  );
};

export default CompanyOnboardingFlow;

