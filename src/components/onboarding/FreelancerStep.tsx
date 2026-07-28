"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import styles from "./FreelancerStep.module.css";
import OnboardingDropdown from "./OnboardingDropdown";

interface FreelancerStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const FREELANCE_ROLES = [
  "Full-stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Graphic Designer",
  "UI/UX Designer",
  "Content Writer",
  "Digital Marketer",
  "SEO Specialist",
  "Video Editor",
  "Other",
];

export default function FreelancerStep({ onNext, onBack, currentStep, totalSteps }: FreelancerStepProps) {
  const { userRole, jobTitle: storeTitle, setWorkExperience, educationList, workExperienceList } = useOnboardingStore();
  const { toast } = useToast();
  const [role, setRoleLocal] = useState(storeTitle || "");
  const [isSaving, setIsSaving] = useState(false);

  const isValid = role !== "";

  const handleContinue = async () => {
    if (!isValid || !userRole) return;

    setIsSaving(true);
    try {
      await saveOnboardingDetails({
        role: userRole,
        company_name: "Freelance", // Default for freelancer
        title: role,
        educations: educationList,
        experiences: workExperienceList,
      });
      
      setWorkExperience("", role);
      onNext();
    } catch (error) {
      console.error("Failed to save freelancer details:", error);
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
            placeholder="What do you do?"
            options={FREELANCE_ROLES}
            value={role}
            onChange={setRoleLocal}
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
