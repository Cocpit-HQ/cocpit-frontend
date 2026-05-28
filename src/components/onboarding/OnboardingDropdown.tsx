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
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = filteredOptions.some(opt => opt.toLowerCase() === searchTerm.trim().toLowerCase());
  const showOther = !!searchTerm.trim() && !exactMatch;

  return (
    <div className={styles.formGroup} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.dropdownContainer}>
        <div
          className={`${styles.card} ${isOpen ? styles.cardActive : ""} ${disabled ? styles.disabled : ""}`}
          onClick={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
            }
          }}
        >
          <div className={styles.selectContent}>
            {isOpen ? (
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
              />
            ) : (
              <span className={`${styles.selectText} ${!value ? styles.placeholder : ""}`}>
                {value || placeholder}
              </span>
            )}
          </div>
          <div 
            className={styles.chevronWrapper}
            onClick={(e) => {
              if (!disabled) {
                e.stopPropagation();
                if (isOpen) {
                  setIsOpen(false);
                  setSearchTerm("");
                } else {
                  setIsOpen(true);
                }
              }
            }}
          >
            <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronRotate : ""}`} size={20} />
          </div>
        </div>

        {isOpen && (
          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`${styles.option} ${value === option ? styles.optionSelected : ""}`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : !showOther ? (
              <div className={styles.noOptions}>No options found</div>
            ) : null}
            {showOther && (
              <div
                className={`${styles.option} ${styles.otherOption}`}
                onClick={() => handleSelect(searchTerm.trim())}
              >
                Other: "{searchTerm.trim()}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
