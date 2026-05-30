'use client';

import { Dialog, BareDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FolderKanban, BriefcaseBusiness, GraduationCap, BadgeCheck, X, type LucideIcon } from 'lucide-react';

type AchievementOption = 'new_project' | 'new_role' | 'academic_milestone' | 'certificate';

export type AchievementOptionId =
  | 'new-project'
  | 'new-role'
  | 'academic-milestone'
  | 'certificate';

export interface AchievementOptionData {
  id: AchievementOptionId;
  label: string;
  description: string;
  placeholder: string;
  icon: LucideIcon;
}

export const ACHIEVEMENT_OPTIONS: AchievementOptionData[] = [
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

interface AchievementPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: AchievementOption) => void;
}

export const AchievementPickerDialog = ({ isOpen, onClose, onSelect }: AchievementPickerDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BareDialogContent className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
        <div className="sr-only">
          <DialogTitle>Select Milestone Option</DialogTitle>
          <DialogDescription>
            Post jobs, insights, or milestones to grow your presence.
          </DialogDescription>
        </div>
        <div className="w-[600px] p-4 bg-white rounded-3xl inline-flex flex-col justify-start items-end overflow-hidden">

          {/* X close button */}
          <button onClick={onClose} className="self-stretch inline-flex justify-end items-center gap-2.5">
            <X className="w-5 h-5 text-red-400 hover:text-red-500 transition-colors" />
          </button>

          <div className="self-stretch py-4 flex flex-col justify-start items-center gap-4">
            {/* Title */}
            <div className="self-stretch flex flex-col justify-start items-center gap-2">
              <div className="text-center text-black text-lg font-medium font-['Poppins'] leading-6">Select an option</div>
              <div className="text-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Post jobs, insights, or milestones to grow your presence.</div>
            </div>

            {/* New Project — default highlighted */}
            <button
              onClick={() => { onSelect('new_project'); onClose(); }}
              className="self-stretch px-4 py-2 achievement-btn achievement-btn-selected rounded-xl inline-flex justify-start items-center gap-4 transition-colors"
            >
              <FolderKanban className="w-6 h-6 text-black" />
              <div className="inline-flex flex-col justify-center items-start gap-2">
                <div className="text-black text-base font-medium font-['Poppins'] leading-6">New Project</div>
                <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">Share something you've built</div>
              </div>
            </button>

            {/* New Role */}
            <button
              onClick={() => { onSelect('new_role'); onClose(); }}
              className="self-stretch px-4 py-2 achievement-btn rounded-xl inline-flex justify-start items-center gap-4 transition-colors"
            >
              <BriefcaseBusiness className="w-6 h-6 text-black" />
              <div className="inline-flex flex-col justify-center items-start gap-2">
                <div className="text-black text-base font-medium font-['Poppins'] leading-6">New Role</div>
                <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">Let your network know your latest update</div>
              </div>
            </button>

            {/* Academic Milestone */}
            <button
              onClick={() => { onSelect('academic_milestone'); onClose(); }}
              className="self-stretch px-4 py-2 achievement-btn rounded-xl inline-flex justify-start items-center gap-4 transition-colors"
            >
              <GraduationCap className="w-6 h-6 text-black" />
              <div className="inline-flex flex-col justify-center items-start gap-2">
                <div className="text-black text-base font-medium font-['Poppins'] leading-6">Academic Milestone</div>
                <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">Share your learning progress</div>
              </div>
            </button>

            {/* Certificate */}
            <button
              onClick={() => { onSelect('certificate'); onClose(); }}
              className="self-stretch px-4 py-2 achievement-btn rounded-xl inline-flex justify-start items-center gap-4 transition-colors"
            >
              <BadgeCheck className="w-6 h-6 text-black" />
              <div className="inline-flex flex-col justify-center items-start gap-2">
                <div className="text-black text-base font-medium font-['Poppins'] leading-6">Certificate</div>
                <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">Show your latest achievement</div>
              </div>
            </button>
          </div>

          {/* Back button */}
          <button
            onClick={onClose}
            className="w-24 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 inline-flex justify-center items-center gap-2.5"
          >
            <div className="text-center text-indigo-400 text-sm font-normal font-['Poppins'] leading-5">Back</div>
          </button>

        </div>
      </BareDialogContent>
    </Dialog>
  );
};

export type { AchievementOption };
