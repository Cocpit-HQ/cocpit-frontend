"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, GraduationCap } from "lucide-react";
import styles from "./OnboardingDropdown.module.css";

export interface OnboardingDropdownOption {
  name: string;
  org_id: string | null;
  logo_url: string | null;
}

interface OnboardingDropdownProps {
  label?: string;
  placeholder: string;
  options: (string | OnboardingDropdownOption)[];
  value: string;
  onChange: (value: string, option?: OnboardingDropdownOption) => void;
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

  const handleSelect = (option: string | OnboardingDropdownOption) => {
    if (typeof option === "string") {
      onChange(option);
    } else {
      onChange(option.name, option);
    }
    setSearchTerm("");
    setIsOpen(false);
  };

  const filteredOptions = options.filter((option) => {
    const text = typeof option === "string" ? option : option.name;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exactMatch = filteredOptions.some((opt) => {
    const text = typeof opt === "string" ? opt : opt.name;
    return text.toLowerCase() === searchTerm.trim().toLowerCase();
  });
  const showOther = !!searchTerm.trim() && !exactMatch;

  const isSchoolField = label?.toLowerCase().includes("school") || label?.toLowerCase().includes("university");

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
              filteredOptions.map((option) => {
                const optName = typeof option === "string" ? option : option.name;
                const optKey = typeof option === "string" ? option : `${option.name}-${option.org_id}`;
                return (
                  <div
                    key={optKey}
                    className={`${styles.option} ${value === optName ? styles.optionSelected : ""} flex items-center gap-3 py-2 px-3 hover:bg-secondary cursor-pointer`}
                    onClick={() => handleSelect(option)}
                  >
                    {typeof option === "string" ? (
                      <span>{option}</span>
                    ) : (
                      <>
                        {option.logo_url ? (
                          <img
                            src={option.logo_url}
                            alt={option.name}
                            className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-border"
                          />
                        ) : isSchoolField ? (
                          <GraduationCap className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate">{option.name}</span>
                      </>
                    )}
                  </div>
                );
              })
            ) : !showOther ? (
              <div className={styles.noOptions}>No options found</div>
            ) : null}
            {showOther && (
              <div
                className={`${styles.option} ${styles.otherOption} flex items-center gap-2 py-2 px-3 cursor-pointer`}
                onClick={() => handleSelect(searchTerm.trim())}
              >
                <span>Other: "{searchTerm.trim()}"</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
