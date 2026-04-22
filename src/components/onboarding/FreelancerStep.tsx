"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import styles from "./FreelancerStep.module.css";

interface FreelancerStepProps {
  onNext: (data: any) => void;
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
  const [role, setRole] = useState("");

  const isValid = role !== "";

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
            <label className={styles.label}>Role</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="" disabled hidden>What do you do?</option>
                {FREELANCE_ROLES.map((r) => (
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
            onClick={() => onNext({ title: role })}
            disabled={!isValid}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
