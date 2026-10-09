"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, CloseCrossIcon, SearchIcon } from "@/components/icons";
import { INITIAL_POPULAR_SKILLS } from "./AddSkillsModal";
import { getOnboardingSkills, Skill } from "@/services/api/onboarding";
import { useDebounce } from "@/hooks/use-debounce";
import { SkillChip } from "@/features/profile/components/SkillChip";
import { cn } from "@/lib/utils";

interface ProfileEditSkillsPickerProps {
  label?: string;
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  className?: string;
  showBulbIcon?: boolean;
  labelClassName?: string;
}

export const ProfileEditSkillsPicker: React.FC<ProfileEditSkillsPickerProps> = ({
  label = "Skills",
  selectedSkills = [],
  onChange,
  placeholder = "Search and add skills (e.g. Figma, Project Management)",
  className,
  showBulbIcon = true,
  labelClassName,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter skills
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setApiResults([]);
      return;
    }

    let isCancelled = false;
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const res = await getOnboardingSkills({
          q: debouncedQuery.trim(),
          limit: 20,
        });
        if (!isCancelled && res?.data?.items) {
          const names = res.data.items.map((s: Skill) => s.name);
          setApiResults(names);
        }
      } catch {
        // Fallback to local filtering
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchSkills();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const displayedOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return INITIAL_POPULAR_SKILLS.filter((s) => !selectedSkills.includes(s)).slice(0, 10);
    }
    const localMatches = INITIAL_POPULAR_SKILLS.filter(
      (s) => s.toLowerCase().includes(q) && !selectedSkills.includes(s)
    );
    const combined = Array.from(new Set([...localMatches, ...apiResults])).filter(
      (s) => !selectedSkills.includes(s)
    );
    return combined.slice(0, 15);
  }, [query, apiResults, selectedSkills]);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      onChange([...selectedSkills, trimmed]);
    }
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(selectedSkills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      handleAddSkill(query.trim());
    }
  };

  return (
    <div ref={containerRef} className={cn("w-full flex flex-col gap-3 relative", className)}>
      {/* Input container with bottom border */}
      <div
        className={cn(
          "w-full h-[62px] py-[8px] px-0 border-b transition-colors flex flex-col justify-center items-start gap-[10px] box-border relative",
          isOpen
            ? "border-[var(--ds-accent)]"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]"
        )}
      >
        <label
          className={cn(
            "font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-center text-[var(--ds-text-secondary)]",
            labelClassName
          )}
        >
          {label}
        </label>

        {/* Search Input Row */}
        <div className="w-full flex items-center justify-between h-[20px]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none p-0 m-0 cursor-text"
          />
          <div
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="w-[16px] h-[16px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] shrink-0 ml-1 cursor-pointer flex items-center justify-center"
          >
            <ChevronDownIcon size={16} className={cn("w-full h-full text-[var(--ds-text-primary)] transition-transform duration-200", isOpen && "rotate-180")} />
          </div>
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-[64px] left-0 right-0 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-xl py-2 px-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-h-[220px] overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-2.5 scrollbar-hide pr-1" role="listbox">
            {displayedOptions.length > 0 ? (
              displayedOptions.map((skill, idx) => (
                <button
                  key={`skill-opt-${idx}-${skill}`}
                  type="button"
                  role="option"
                  onClick={() => handleAddSkill(skill)}
                  className="self-stretch text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] bg-transparent focus:outline-none"
                >
                  <span className="truncate">{skill}</span>
                </button>
              ))
            ) : query.trim() ? (
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => handleAddSkill(query.trim())}
                  className="self-stretch w-full text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate text-[var(--ds-accent)] hover:opacity-80 bg-transparent focus:outline-none"
                >
                  Add &quot;{query.trim()}&quot; as custom skill
                </button>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-[var(--ds-text-muted)] font-['DM_Sans']">
                Type to search skills
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Skill Chips Below */}
      {selectedSkills.length > 0 && (
        <div className="w-full flex flex-wrap gap-2 pt-1">
          {selectedSkills.map((skill, idx) => (
            <SkillChip
              key={`selected-skill-${idx}-${skill}`}
              name={skill}
              showBulbIcon={showBulbIcon}
              deletable={true}
              onDelete={(skillToRemove) => handleRemoveSkill(skillToRemove)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileEditSkillsPicker;
