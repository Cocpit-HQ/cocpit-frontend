"use client";

import React, { useState, useEffect } from "react";
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

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (useCompanyOnboardingStore.persist?.hasHydrated && !useCompanyOnboardingStore.persist.hasHydrated()) {
      const unsub = useCompanyOnboardingStore.persist.onFinishHydration(() => {
        setHasMounted(true);
      });
      return () => unsub();
    }
    setHasMounted(true);
  }, []);

  const handleNext = () => {
    goNext();
  };

  const handleBack = () => {
    goBack();
  };

  const handleRetry = () => {
    const errorLower = apiError?.toLowerCase() || "";
    const isPresenceError = errorLower.includes("description") || errorLower.includes("headline") || errorLower.includes("presence") || errorLower.includes("website") || errorLower.includes("email") || errorLower.includes("phone");
    const isIdentityError = errorLower.includes("name") || errorLower.includes("slug") || errorLower.includes("industry");
    setApiError(null);
    if (isIdentityError) {
      setCurrentStage(1);
    } else if (isPresenceError) {
      setCurrentStage(2);
    } else {
      setCurrentStage(3);
    }
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
        return (
          <StepCongratulations
            onClose={() => {
              resetStore();
              router.replace("/feed");
            }}
          />
        );
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

  if (!hasMounted) {
    return (
      <CompanyOnboardingLayout showBack={false} showClose={false}>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-ds-accent border-t-transparent animate-spin" />
        </div>
      </CompanyOnboardingLayout>
    );
  }

  return (
    <CompanyOnboardingLayout
      showBack={currentStage > 0 && currentStage < 4}
      onBack={handleBack}
      showClose={true}
      onClose={
        currentStage >= 4
          ? () => {
              resetStore();
              router.replace("/feed");
            }
          : undefined
      }
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

