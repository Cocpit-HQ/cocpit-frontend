"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import styles from "./OpenToWorkStep.module.css";
import OnboardingDropdown from "./OnboardingDropdown";

interface OpenToWorkStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const JOB_TYPES = [
  "Full-time Job",
  "Internship",
  "Contract Work",
  "Part-time Job",
  "Freelance Projects",
  "Remote Work",
  "Apprenticeship",
  "Other",
];

export default function OpenToWorkStep({ onNext, onBack, currentStep, totalSteps }: OpenToWorkStepProps) {
  const { userRole, jobTitle: storeTitle, setWorkExperience } = useOnboardingStore();
  const { toast } = useToast();
  const [jobType, setJobTypeLocal] = useState(storeTitle || "");
  const [isSaving, setIsSaving] = useState(false);

  const isValid = jobType !== "";

  const handleContinue = async () => {
    if (!isValid || !userRole) return;

    setIsSaving(true);
    try {
      await saveOnboardingDetails({
        role: userRole,
        title: jobType,
      });
      
      // We use setWorkExperience for OpenToWork too, just without a company
      setWorkExperience("", jobType);
      onNext();
    } catch (error) {
      console.error("Failed to save open-to-work details:", error);
      toast({
        title: "Error",
        description: "Failed to save your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.PNG" alt="Cocpit Logo" height={56} className={styles.logo} />
          </div>
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle Group */}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Tell us more about you</h1>
          <p className={styles.subtitle}>This helps us show relevant opportunities</p>
        </div>

        {/* Form */}
        <div className={styles.form}>
          <OnboardingDropdown
            label="Role"
            placeholder="What are you looking for?"
            options={JOB_TYPES}
            value={jobType}
            onChange={setJobTypeLocal}
          />
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!isValid || isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
