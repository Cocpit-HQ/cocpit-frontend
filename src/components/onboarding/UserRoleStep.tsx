"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingRole } from "@/services/api/onboarding";
import styles from "./UserRoleStep.module.css";

interface UserRoleStepProps {
  onNext: (role: string) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const ROLES = [
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher" },
  { id: "intern", label: "Intern" },
  { id: "self_employed", label: "Self employed" },
  { id: "employed", label: "Employed" },
  { id: "unemployed", label: "Unemployed" },
];

export default function UserRoleStep({ onNext, onBack, currentStep, totalSteps }: UserRoleStepProps) {
  const { userRole, setUserRole } = useOnboardingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedId = userRole;

  const handleSelect = (id: string) => {
    setUserRole(id);
    setIsOpen(false);
  };

  const handleContinue = async () => {
    if (!selectedId) return;

    setIsSaving(true);
    try {
      await saveOnboardingRole(selectedId);
      onNext(selectedId);
    } catch (error) {
      console.error("Failed to save role:", error);
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
          <h1 className={styles.title}>What best describes you?</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        {/* Selection Area */}
        <div className={styles.selectionArea}>
          <span className={styles.label}>Current status</span>
          <div className={styles.dropdownContainer}>
            <div
              className={`${styles.card} ${isOpen ? styles.cardActive : ""}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className={styles.selectContent}>
                <span className={`${styles.selectText} ${!selectedId ? styles.placeholder : ""}`}>
                  {ROLES.find(r => r.id === selectedId)?.label || "Choose your status"}
                </span>
              </div>
              <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronRotate : ""}`} size={20} />
            </div>

            {isOpen && (
              <div className={styles.optionsList}>
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className={`${styles.option} ${selectedId === role.id ? styles.optionSelected : ""}`}
                    onClick={() => handleSelect(role.id)}
                  >
                    {role.label}
                  </div>
                ))}
              </div>
            )}
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
            disabled={!selectedId || isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
