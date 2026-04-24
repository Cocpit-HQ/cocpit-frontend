"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./OnboardingDropdown.module.css";

interface OnboardingDropdownProps {
  label?: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OnboardingDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
}: OnboardingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={styles.formGroup} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.dropdownContainer}>
        <div
          className={`${styles.card} ${isOpen ? styles.cardActive : ""} ${disabled ? styles.disabled : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className={styles.selectContent}>
            <span className={`${styles.selectText} ${!value ? styles.placeholder : ""}`}>
              {value || placeholder}
            </span>
          </div>
          <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronRotate : ""}`} size={20} />
        </div>

        {isOpen && (
          <div className={styles.optionsList}>
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option}
                  className={`${styles.option} ${value === option ? styles.optionSelected : ""}`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className={styles.noOptions}>No options found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
