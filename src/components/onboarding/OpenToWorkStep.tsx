"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import styles from "./OpenToWorkStep.module.css";

interface OpenToWorkStepProps {
  onNext: () => void;
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
  const [jobType, setJobType] = useState("");

  const isValid = jobType !== "";

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
        <h1 className={styles.title}>Tell us more about you</h1>
        <p className={styles.subtitle}>This helps us show relevant opportunities</p>

        {/* Form */}
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                required
              >
                <option value="" disabled hidden>What are you looking for?</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
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
            onClick={onNext}
            disabled={!isValid}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
