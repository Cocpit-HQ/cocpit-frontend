"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails } from "@/services/api/onboarding";
import styles from "./WorkExperienceStep.module.css";

interface WorkExperienceStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Netflix",
  "Apple",
  "Meta",
  "Uber",
  "Other",
];

const ROLES = [
  "Software Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Data Scientist",
  "Marketing Manager",
  "Sales Representative",
  "Project Manager",
  "Other",
];

export default function WorkExperienceStep({ onNext, onBack, currentStep, totalSteps }: WorkExperienceStepProps) {
  const { userRole } = useOnboardingStore();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isValid = company !== "" && role !== "";

  const handleContinue = async () => {
    if (!isValid || !userRole) return;

    setIsSaving(true);
    try {
      await saveOnboardingDetails({
        role: userRole,
        company_name: company,
        title: role,
      });
      onNext();
    } catch (error) {
      console.error("Failed to save work details:", error);
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
          <div className={styles.formGroup}>
            <label className={styles.label}>Company</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              >
                <option value="" disabled hidden>Where do you work?</option>
                {COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={18} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="" disabled hidden>Your job title</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={18} />
            </div>
          </div>
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
