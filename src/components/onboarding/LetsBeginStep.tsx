"use client";

import { useState, useRef } from "react";
import { ChevronLeft, Type, FileText } from "lucide-react";
import { Icon } from "@iconify/react";
import styles from "./LetsBeginStep.module.css";

interface LetsBeginStepProps {
  onNext: () => void;
}

export default function LetsBeginStep({
  onNext,
}: LetsBeginStepProps) {
  const [selected, setSelected] = useState<"upload" | "manual" | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    setSelected("upload");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];

      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
        setError("*Upload only PDF, Docs");
        setSelected(null);
        setUploadedName(null);
        e.target.value = "";
        return;
      }

      setError(null);
      setSelected("upload");
      setUploadedName(file.name);
    }
  };

  const handleContinue = () => {
    if (selected) {
      onNext();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header content holding Logo */}
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.PNG" alt="Cocpit Logo" className={styles.logo} />
          </div>
        </div>

        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Let's begin</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        {/* Options */}
        <div className={styles.optionsContainer}>
          {/* Upload Resume Option */}
          <button
            type="button"
            className={`${styles.optionCard} ${selected === "upload" && !uploadedName ? styles.selectedCard : ""}`}
            onClick={handleUploadClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            {uploadedName && !error ? (
              <>
                <div className={styles.iconWrapper}>
                  <Icon icon="material-icon-theme:pdf" width={40} height={40} />
                </div>
                <span className={styles.optionTitle} style={{ color: '#6366F1' }}>Change document</span>
                <span className={styles.optionSubtitle}>We'll auto-fill your details</span>
              </>
            ) : (
              <>
                <div className={styles.iconWrapper}>
                  <Icon
                    icon="iconoir:cloud-upload"
                    className={styles.iconElement}
                    width={35}
                    height={30}
                  />
                </div>
                {error && <span style={{ color: '#f87171', fontSize: '10px', marginBottom: '8px', fontWeight: 500 }}>{error}</span>}
                <span className={styles.optionTitle}>Drop or upload resume</span>
                <span className={styles.optionSubtitle}>We'll auto-fill your details</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className={styles.dividerContainer}>
            <div className={styles.line}></div>
            <span className={styles.dividerText}>Or</span>
            <div className={styles.line}></div>
          </div>

          {/* Fill Manually Option */}
          <button
            type="button"
            className={`${styles.optionCard} ${selected === "manual" ? styles.selectedCard : ""}`}
            onClick={() => {
              setSelected("manual");
              onNext();
            }}
          >
            <div className={styles.iconWrapper}>
              <Icon
                icon="iconoir:text-box"
                className={styles.iconElement}
                width={35}
                height={30}
              />
            </div>
            <span className={styles.optionTitle}>Fill manually</span>
            <span className={styles.optionSubtitle}>You'll be redirected to set up page</span>
          </button>
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={`${styles.continueButton} ${selected ? styles.continueActive : ""}`}
            onClick={handleContinue}
            disabled={!selected}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
