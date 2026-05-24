import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  X,
  type LucideIcon,
} from 'lucide-react';

export type AchievementOptionId =
  | 'new-project'
  | 'new-role'
  | 'academic-milestone'
  | 'certificate';

export interface AchievementOption {
  id: AchievementOptionId;
  label: string;
  description: string;
  placeholder: string;
  icon: LucideIcon;
}

export const ACHIEVEMENT_OPTIONS: AchievementOption[] = [
  {
    id: 'new-project',
    label: 'New Project',
    description: "Share something you've built",
    placeholder: 'Share your new project...',
    icon: FolderKanban,
  },
  {
    id: 'new-role',
    label: 'New Role',
    description: 'Let your network know your latest update',
    placeholder: 'Share your new role...',
    icon: BriefcaseBusiness,
  },
  {
    id: 'academic-milestone',
    label: 'Academic Milestone',
    description: 'Share your learning progress',
    placeholder: 'Share your academic milestone...',
    icon: GraduationCap,
  },
  {
    id: 'certificate',
    label: 'Certificate',
    description: 'Show your latest achievement',
    placeholder: 'Share your certificate...',
    icon: BadgeCheck,
  },
];

export const getAchievementOptionById = (
  optionId: AchievementOptionId | null
) => ACHIEVEMENT_OPTIONS.find((option) => option.id === optionId) || null;

interface AchievementOptionPickerProps {
  isOpen: boolean;
  selectedOptionId: AchievementOptionId | null;
  onClose: () => void;
  onSelect: (option: AchievementOption) => void;
}

const AchievementOptionPicker = ({
  isOpen,
  selectedOptionId,
  onClose,
  onSelect,
}: AchievementOptionPickerProps) => {
  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 px-4"
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-option-picker-title"
        className="w-full max-w-[360px] rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0px_24px_60px_rgba(15,23,42,0.18)] dark:border-[#2a2a4a] dark:bg-[#1a1a2e]"
      >
        <div className="relative flex flex-col items-center gap-1 border-b border-[#F3F4F6] px-5 pb-3 text-center dark:border-[#2a2a4a]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 rounded-full p-1 text-[#F87171] transition-colors hover:bg-[#FEE2E2] dark:hover:bg-red-950/30"
            aria-label="Close achievement options"
          >
            <X className="h-4 w-4 stroke-[2.2]" />
          </button>
          <h3
            id="achievement-option-picker-title"
            className="text-[13px] font-semibold leading-5 text-[#111827] dark:text-white"
          >
            Select an option
          </h3>
          <p className="text-[10px] leading-4 text-[#6B7280] dark:text-[#9CA3AF]">
            Pick one option to personalize your next achievement post.
          </p>
        </div>

        <div className="mt-3 space-y-1">
          {ACHIEVEMENT_OPTIONS.map((option) => {
            const isActive = selectedOptionId === option.id;
            const OptionIcon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'border-[#C7D2FE] bg-[#EEF2FF] shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10'
                    : 'border-transparent hover:border-[#E5E7EB] hover:bg-[#F8FAFC] dark:hover:border-[#3a3a5a] dark:hover:bg-[#23233b]'
                }`}
              >
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-sm dark:bg-[#23233b] dark:text-indigo-300">
                  <OptionIcon className="h-3.5 w-3.5 stroke-[2]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12px] font-semibold leading-4 text-[#111827] dark:text-white">
                    {option.label}
                  </span>
                  <span className="mt-1 text-[10px] leading-4 text-[#6B7280] dark:text-[#9CA3AF]">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-[#C7D2FE] px-4 py-1.5 text-[11px] font-medium text-[#6366F1] transition-colors hover:bg-[#EEF2FF] dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
};

export default AchievementOptionPicker;
