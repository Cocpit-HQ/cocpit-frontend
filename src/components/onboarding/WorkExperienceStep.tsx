"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import styles from "./WorkExperienceStep.module.css";

interface WorkExperienceStepProps {
  onNext: () => void;
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
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const isValid = company !== "" && role !== "";

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
