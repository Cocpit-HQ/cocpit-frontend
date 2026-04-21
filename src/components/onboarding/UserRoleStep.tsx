"use client";

import { ChevronLeft, ChevronDown } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import styles from "./UserRoleStep.module.css";

interface UserRoleStepProps {
  onNext: (role: string) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const ROLES = [
  { id: "student", label: "Student" },
  { id: "working", label: "Working" },
  { id: "freelancer", label: "Freelancer" },
  { id: "open_to_work", label: "Open to work" },
];

export default function UserRoleStep({ onNext, onBack, currentStep, totalSteps }: UserRoleStepProps) {
  const { userRole, setUserRole } = useOnboardingStore();
  const selectedId = userRole;
  const setSelectedId = setUserRole;

  const handleContinue = () => {
    if (selectedId) {
      onNext(selectedId);
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
          <h1 className={styles.title}>What best describes you?</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        {/* Selection Area */}
        <div className={styles.selectionArea}>
          <span className={styles.label}>Current status</span>
          <div className={styles.card}>
            <div className={styles.selectContent}>
              <span className={styles.selectText}>
                {ROLES.find(r => r.id === (selectedId || "student"))?.label}
              </span>
            </div>
            <ChevronDown className={styles.chevron} size={20} />
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
            disabled={!selectedId}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
