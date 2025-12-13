"use client";

import { useState, useRef } from "react";
import { Upload, Check, X, ChevronLeft } from "lucide-react";
import styles from "./ProfileStep.module.css";

interface ProfileStepProps {
  onComplete: (data: { profileImage: string | null; accountName: string }) => void;
  onBack: () => void;
  currentStep: number;
  initialData: {
    profileImage: string | null;
    accountName: string;
  };
}

export default function ProfileStep({ onComplete, onBack, currentStep, initialData }: ProfileStepProps) {
  const [profileImage, setProfileImage] = useState<string | null>(initialData.profileImage);
  const [accountName, setAccountName] = useState(initialData.accountName);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkAccountName = async () => {
    if (!accountName.trim()) {
      setNameAvailable(null);
      return;
    }

    setChecking(true);
    // Simulate API call - in future, this will check with backend
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Since no database yet, always return available
    setNameAvailable(true);
    setChecking(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountName(e.target.value);
    setNameAvailable(null);
  };

  const handleNext = () => {
    if (accountName.trim() && nameAvailable) {
      onComplete({
        profileImage,
        accountName,
      });
    }
  };

  const isNextDisabled = !accountName.trim() || nameAvailable === false || nameAvailable === null;

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
        <h2 className={styles.title}>Add a profile picture</h2>
        <p className={styles.subtitle}>
          Choose a profile picture to personalize your account. You can change it anytime.
        </p>

        {/* Profile Picture Upload */}
        <div className={styles.uploadSection}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className={styles.uploadImage} />
            ) : (
              <>
                <Upload className={styles.uploadIcon} />
                <span className={styles.uploadText}>Tap to upload</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* Account Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Account name</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Enter your account name"
              value={accountName}
              onChange={handleNameChange}
              className={styles.input}
              maxLength={20}
            />
            {nameAvailable !== null && (
              <div className={`${styles.statusIcon} ${nameAvailable ? styles.success : styles.error}`}>
                {nameAvailable ? (
                  <Check className={styles.icon} />
                ) : (
                  <X className={styles.icon} />
                )}
              </div>
            )}
          </div>

          {/* Availability Check Button */}
          <button
            onClick={checkAccountName}
            disabled={!accountName.trim() || checking}
            className={styles.checkBtn}
          >
            {checking ? "Checking..." : "Check availability"}
          </button>

          {/* Status Messages */}
          {nameAvailable === true && (
            <p className={styles.successMsg}>✓ Name available</p>
          )}
          {nameAvailable === false && (
            <p className={styles.errorMsg}>✗ Name not available. Try another.</p>
          )}
          {nameAvailable === null && accountName && (
            <p className={styles.infoMsg}>Checking availability...</p>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={styles.nextBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
}