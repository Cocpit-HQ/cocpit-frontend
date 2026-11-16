'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { LeftArrowIcon } from '@/components/icons';
import { JobOptionDrawer } from '../drawers/JobOptionDrawer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface EditJobFormData {
  role: string;
  company: string;
  location: string;
  workMode: string;
  experience: string;
  workType: string;
}

interface EditJobMobileScreenProps {
  initialData: EditJobFormData;
  onSave: (data: EditJobFormData) => void;
  onCancel: () => void;
}

const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'Onsite'] as const;

const EXPERIENCE_OPTIONS = [
  '0 - 2 years',
  'Fresher',
  'Junior (1-3 yrs)',
  'Mid-level (3-5 yrs)',
  'Senior (5+ yrs)',
] as const;

const WORK_TYPE_OPTIONS = [
  'Full time',
  'Part time',
  'Contract',
  'Internship',
  'Freelance',
] as const;

export const EditJobMobileScreen: React.FC<EditJobMobileScreenProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [role, setRole] = useState(initialData.role || 'UI/UX Designer');
  const [company, setCompany] = useState(initialData.company || 'Driftline Digital');
  const [location, setLocation] = useState(initialData.location || 'Mumbai, India');
  const [workMode, setWorkMode] = useState(initialData.workMode || 'Hybrid');
  const [experience, setExperience] = useState(initialData.experience || '0 - 2 years');
  const [workType, setWorkType] = useState(initialData.workType || 'Full time');

  // Drawer state machines
  const [isWorkModeDrawerOpen, setIsWorkModeDrawerOpen] = useState(false);
  const [isExperienceDrawerOpen, setIsExperienceDrawerOpen] = useState(false);
  const [isWorkTypeDrawerOpen, setIsWorkTypeDrawerOpen] = useState(false);

  // Track if any modifications were made against initial data
  const isDirty = useMemo(() => {
    return (
      role.trim() !== (initialData.role || '').trim() ||
      company.trim() !== (initialData.company || '').trim() ||
      location.trim() !== (initialData.location || '').trim() ||
      workMode !== (initialData.workMode || '') ||
      experience !== (initialData.experience || '') ||
      workType !== (initialData.workType || '')
    );
  }, [role, company, location, workMode, experience, workType, initialData]);

  // Save is active ONLY when changes exist and required job role is non-empty
  const canSave = isDirty && role.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;

    if (!role.trim()) {
      toast.error('Job role cannot be empty');
      return;
    }

    onSave({
      role: role.trim(),
      company: company.trim(),
      location: location.trim(),
      workMode,
      experience,
      workType,
    });
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary flex flex-col items-center relative py-6 px-4 font-dm-sans overflow-y-auto select-none sm:hidden animate-in fade-in duration-200">
      {/* Frame 2609713: Top Nav Bar (< Back and X Cancel) */}
      <div className="w-full max-w-[360px] flex flex-row justify-between items-center h-6 mb-8 shrink-0">
        <button
          onClick={onCancel}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 p-0 text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">Back</span>
        </button>

        <button
          onClick={onCancel}
          type="button"
          aria-label="Cancel"
          className="text-ds-text-primary hover:opacity-80 transition-opacity p-1 bg-transparent border-none outline-none cursor-pointer"
        >
          <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
        </button>
      </div>

      {/* Frame 2610015 / Container: Form Fields Container */}
      <div className="w-full max-w-[360px] flex flex-col items-center gap-5 pb-10">
        {/* Frame 2609659: Fields List */}
        <div className="w-full flex flex-col items-end gap-2">
          {/* 1. Job role (Input with label) */}
          <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border">
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Job role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="UI/UX Designer"
              className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
            />
          </div>

          {/* 2. Recruiter (Input with label) */}
          <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border">
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Recruiter
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company / Recruiter"
              className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
            />
          </div>

          {/* 3. Location (Input with label) */}
          <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border">
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mumbai, India"
              className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
            />
          </div>

          {/* 4. Work mode (Input with label and icon -> opens JobOptionDrawer) */}
          <div
            onClick={() => setIsWorkModeDrawerOpen(true)}
            className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border cursor-pointer active:opacity-80 transition-opacity"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsWorkModeDrawerOpen(true);
              }
            }}
          >
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans pointer-events-none">
              Work mode
            </label>
            <div className="w-full flex flex-row justify-between items-center h-5">
              <span className="text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
                {workMode || 'Select work mode'}
              </span>
              <Icon icon="lucide:chevron-down" className="w-4 h-4 text-ds-text-primary shrink-0" />
            </div>
          </div>

          {/* 5. Experience level (Input with label and icon -> opens JobOptionDrawer) */}
          <div
            onClick={() => setIsExperienceDrawerOpen(true)}
            className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border cursor-pointer active:opacity-80 transition-opacity"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsExperienceDrawerOpen(true);
              }
            }}
          >
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans pointer-events-none">
              Experience level
            </label>
            <div className="w-full flex flex-row justify-between items-center h-5">
              <span className="text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
                {experience || 'Select experience'}
              </span>
              <Icon icon="lucide:chevron-down" className="w-4 h-4 text-ds-text-primary shrink-0" />
            </div>
          </div>

          {/* 6. Work type (Input with label and icon -> opens JobOptionDrawer) */}
          <div
            onClick={() => setIsWorkTypeDrawerOpen(true)}
            className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5 box-border cursor-pointer active:opacity-80 transition-opacity"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsWorkTypeDrawerOpen(true);
              }
            }}
          >
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans pointer-events-none">
              Work type
            </label>
            <div className="w-full flex flex-row justify-between items-center h-5">
              <span className="text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
                {workType || 'Select work type'}
              </span>
              <Icon icon="lucide:chevron-down" className="w-4 h-4 text-ds-text-primary shrink-0" />
            </div>
          </div>
        </div>

        {/* Frame 2609476: Bottom Action (Save Button right-aligned) */}
        <div className="w-full flex flex-row justify-end items-center pt-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className={cn(
              "h-9 px-3 py-1.5 rounded-full flex items-center justify-center font-dm-sans text-base font-medium leading-6 transition-all shadow-sm outline-none border-none",
              canSave
                ? "bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-ds-accent"
                : "bg-ds-accent/40 text-ds-text-primary/40 cursor-not-allowed pointer-events-none"
            )}
          >
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Bottom Option Drawers */}
      <JobOptionDrawer
        isOpen={isWorkModeDrawerOpen}
        onClose={() => setIsWorkModeDrawerOpen(false)}
        options={WORK_MODE_OPTIONS}
        selectedValue={workMode}
        onSelect={(val) => setWorkMode(val)}
        heightClass="h-[160px]"
        ariaLabel="Select work mode"
      />

      <JobOptionDrawer
        isOpen={isExperienceDrawerOpen}
        onClose={() => setIsExperienceDrawerOpen(false)}
        options={EXPERIENCE_OPTIONS}
        selectedValue={experience}
        onSelect={(val) => setExperience(val)}
        heightClass="h-[220px]"
        ariaLabel="Select experience level"
      />

      <JobOptionDrawer
        isOpen={isWorkTypeDrawerOpen}
        onClose={() => setIsWorkTypeDrawerOpen(false)}
        options={WORK_TYPE_OPTIONS}
        selectedValue={workType}
        onSelect={(val) => setWorkType(val)}
        heightClass="h-[232px]"
        ariaLabel="Select work type"
      />
    </div>
  );
};

export default EditJobMobileScreen;
