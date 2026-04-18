"use client";

import { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import styles from "./InterestsStep.module.css";

interface InterestsStepProps {
  onNext: (items: string[]) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  placeholder: string;
  initialData: string[];
  actionLabel?: string;
  minSelection?: number;
}

export default function InterestsStep({ 
  onNext, 
  onBack, 
  currentStep, 
  totalSteps,
  title,
  subtitle,
  placeholder,
  initialData,
  actionLabel = "Continue",
  minSelection = 1
}: InterestsStepProps) {
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => {
      const next = prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item];
      
      // Update error visibility based on the new selection count
      if (next.length > 0 && next.length < minSelection) {
        setShowError(true);
      } else {
        setShowError(false);
      }
      return next;
    });
  };

  const handleAction = () => {
    if (selectedItems.length < minSelection) {
      setShowError(true);
      return;
    }
    onNext(selectedItems);
  };

  const filteredItems = initialData.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className={styles.searchIcon} size={20} />
          {showError && (
            <p className={styles.errorText}>*Select more than {minSelection - 1}</p>
          )}
        </div>

        {/* Tags Grid */}
        <div className={styles.tagsContainer}>
          {filteredItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.tag} ${
                selectedItems.includes(item) ? styles.tagSelected : ""
              }`}
              onClick={() => toggleItem(item)}
            >
              {item}
            </button>
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
            className={actionLabel === "Finish" ? styles.finishButton : styles.continueButton}
            onClick={handleAction}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
