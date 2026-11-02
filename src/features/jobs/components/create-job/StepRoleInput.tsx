import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { LeftArrowIcon } from '@/components/icons';

interface StepRoleInputProps {
  onBack: () => void;
  onClose?: () => void;
  title: string;
  setTitle: (val: string) => void;
  onContinue: () => void;
  isDrafting?: boolean;
}

export const StepRoleInput: React.FC<StepRoleInputProps> = ({
  onBack,
  onClose,
  title,
  setTitle,
  onContinue,
  isDrafting = false,
}) => {
  const { activeProfile } = useActiveProfile();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!title.trim() || title.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsFetching(true);
      try {
        const response = await api.get(`/jobs/roles?q=${encodeURIComponent(title)}`);
        setSuggestions(response.data.map((r: any) => r.role_name));
      } catch (error) {
        console.error("Error fetching job roles:", error);
      } finally {
        setIsFetching(false);
      }
    };

    const debounceTimer = setTimeout(fetchRoles, 300);
    return () => clearTimeout(debounceTimer);
  }, [title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      setShowSuggestions(false);
      onContinue();
    }
  };

  const handleSelectRole = (role: string) => {
    setTitle(role);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center relative py-8 px-4 font-dm-sans overflow-y-auto">
      {/* Top Left: Back Navigation - use chevron icon and secondary hover color per design system */}
      <button
        onClick={onBack}
        type="button"
        disabled={isDrafting}
        aria-label="Back"
        className="fixed top-[40px] left-[40px] z-[60] inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span className="font-dm-sans font-medium text-base leading-6">Back</span>
      </button>

      {/* Main Centered Questionnaire Section */}
      <div className="w-full max-w-[592px] flex flex-col justify-center items-center gap-5 my-auto">
        {/* Headings */}
        <div className="self-stretch flex flex-col justify-start items-center gap-3 text-center">
          <div className="text-ds-accent ds-text-title text-[40px] font-bold leading-[48px]">
            Hey, {activeProfile?.name || 'Cocpit'}
          </div>
          <div className="flex flex-col justify-start items-center gap-1">
            <h1 className="text-ds-text-primary ds-text-title text-[40px] font-bold leading-[48px]">
              What role are you hiring for?
            </h1>
            <p className="text-ds-text-secondary text-sm sm:text-base font-semibold leading-6 whitespace-nowrap max-w-none">
              Start by defining the position to help us find the perfect match.
            </p>
          </div>
        </div>

        {/* Input Form & Actions */}
        <form onSubmit={handleSubmit} className="w-full max-w-[300px] flex flex-col justify-center items-center gap-4">
          {/* Underline Input: Frame 2609640 style */}
          <div className="self-stretch py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-1 transition-colors relative">
            <label className="text-center text-ds-text-secondary text-xs font-medium leading-4">
              Job Role
            </label>
            <div className="w-full relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (title.trim().length >= 2) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="e.g. Senior Product Designer"
                disabled={isDrafting}
                className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0"
              />
              {isFetching && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon icon="lucide:loader-2" className="size-4 animate-spin text-ds-text-muted" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#030303] border border-[#2C2C33] rounded-[8px] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                <div
                  className="max-h-48 overflow-y-auto flex flex-col gap-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {suggestions.map((role, idx) => {
                    const isSelected = title.trim().toLowerCase() === role.toLowerCase();
                    return (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectRole(role);
                        }}
                        className="self-stretch inline-flex items-center cursor-pointer select-none"
                      >
                        <span
                          className={`text-sm font-dm-sans leading-5 truncate transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-ds-accent font-medium'
                              : 'text-ds-text-secondary hover:text-ds-text-primary font-normal'
                          }`}
                        >
                          {role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Banner Tip Box */}
          <div className="w-[300px] h-[40px] px-3 bg-ds-surface-1 rounded-xl inline-flex justify-center items-center border border-ds-border/40">
            <div className="flex-1 inline-flex flex-col justify-start items-start">
              <p className="self-stretch text-center text-ds-text-primary text-[10px] font-normal leading-tight">
                Choosing a specific role helps our AI accurately screen candidates for technical skills.
              </p>
            </div>
          </div>

          {/* Action Button: Continue */}
          <button
            type="submit"
            disabled={!title.trim() || isDrafting}
            className={`w-[260px] h-[36px] px-3 py-1.5 rounded-full inline-flex justify-center items-center gap-2.5 text-base font-medium leading-6 transition-all ${
              !title.trim() || isDrafting
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
                : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer shadow-sm'
            }`}
          >
            {isDrafting ? (
              <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StepRoleInput;

