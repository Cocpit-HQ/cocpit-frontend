"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

        {/* Title & Subtitle */}
        <h1 className={styles.title}>What best describes you?</h1>
        <p className={styles.subtitle}>This helps personalize your experience</p>

        {/* Options List */}
        <div className={styles.optionsList}>
          {ROLES.map((role) => (
            <div
              key={role.id}
              className={`${styles.card} ${selectedId === role.id ? styles.cardActive : ""}`}
              onClick={() => setSelectedId(role.id)}
            >
              <span className={styles.cardText}>{role.label}</span>
              <div className={`${styles.radio} ${selectedId === role.id ? styles.radioActive : ""}`}>
                <div className={styles.radioInner} />
              </div>
            </div>
          ))}
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
