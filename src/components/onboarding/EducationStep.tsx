"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import styles from "./EducationStep.module.css";

interface EducationStepProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
];

const SPECIALIZATIONS = [
  "Computer Science",
  "Information Technology",
  "Graphic Design",
  "Business Administration",
  "Marketing",
  "Finance",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

export default function EducationStep({ onNext, onBack, currentStep, totalSteps }: EducationStepProps) {
  const [education, setEducation] = useState("");
  const [specialization, setSpecialization] = useState("");

  const isValid = education !== "" && specialization !== "";

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
            <label className={styles.label}>Education</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                required
              >
                <option value="" disabled hidden>Select your education</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={18} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Specialization</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              >
                <option value="" disabled hidden>Select your specialization</option>
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
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
