"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./BioStep.module.css";

interface BioStepProps {
  onComplete: (data: { bio: string; phoneNumber: string }) => void;
  onBack: () => void;
  currentStep: number;
  initialData: {
    bio: string;
    phoneNumber: string;
  };
}

export default function BioStep({ onComplete, onBack, currentStep, initialData }: BioStepProps) {
  const [bio, setBio] = useState(initialData.bio);
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber);

  const handleComplete = () => {
    onComplete({
      bio,
      phoneNumber,
    });
  };

  const handleSkip = () => {
    onComplete({
      bio: "",
      phoneNumber: "",
    });
  };

  const bioCharCount = bio.length;
  const bioMaxLength = 300;

  return (
    <div className={styles.formContent}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft className={styles.backIcon} />
        </button>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${currentStep === 1 ? styles.active : ''}`}></div>
          <div className={`${styles.stepDot} ${currentStep === 2 ? styles.active : ''}`}></div>
        </div>
      </div>

      <div className={styles.formBody}>
        <h2 className={styles.title}>Add your bio</h2>
        <p className={styles.subtitle}>
          Tell us about yourself. You can always update this later.
        </p>

        {/* Bio Field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Bio</label>
          <textarea
            placeholder="Tell us about yourself, your interests, and professional background..."
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, bioMaxLength))}
            className={styles.textarea}
            rows={3}
          />
          <p className={styles.charCount}>
            {bioCharCount} / {bioMaxLength} characters
          </p>
        </div>

        {/* Phone Number Field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Phone Number</label>
          <div className={styles.inputWrapper}>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={styles.input}
            />
          </div>
          <p className={styles.helpText}>
            This helps with account recovery and notifications. (Optional)
          </p>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleComplete}
          className={styles.nextBtn}
        >
          Complete
        </button>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className={styles.skipBtn}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
