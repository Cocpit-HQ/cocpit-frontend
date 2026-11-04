import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { LeftArrowIcon } from '@/components/icons';
import { JobListing } from '../../types/jobs.types';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { formatCompactNumber, getCurrencySymbol } from '../../utils/currency.utils';

interface ListingDetailsScreenProps {
  listing: JobListing;
  onBack: () => void;
  onCloseListing: (id: string) => Promise<void>;
  onDeleteListing: (id: string) => Promise<void>;
}

export const ListingDetailsScreen: React.FC<ListingDetailsScreenProps> = ({
  listing,
  onBack,
  onCloseListing,
  onDeleteListing,
}) => {
  const {
    id,
    title = '',
    company = '',
    location = '',
    description = '',
    experience = 'Not specified',
    work_type = 'Not specified',
    work_mode = 'Not specified',
    industry = 'Technology',
    salary_min,
    salary_max,
    salary_currency,
    status,
  } = listing;

  const formatSalary = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'Not specified';
    return `₹${Number(val).toLocaleString()}`;
  };

  const getSalaryDisplay = () => {
    const sym = salary_currency === 'INR' ? '₹' : (salary_currency ? getCurrencySymbol(salary_currency) : '$');
    if (salary_min && salary_max) {
      return `${sym}${formatCompactNumber(salary_min)} – ${sym}${formatCompactNumber(salary_max)}`;
    }
    if (salary_min) {
      return `${sym}${formatCompactNumber(salary_min)}+`;
    }
    if (salary_max) {
      return `Up to ${sym}${formatCompactNumber(salary_max)}`;
    }
    return 'Not specified';
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasLongDescription = (description || '').length > 220;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteListing(id);
    } catch (err) {
      console.error('Delete job error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClose = async () => {
    try {
      setIsClosing(true);
      await onCloseListing(id);
    } catch (err) {
      console.error('Close job error:', err);
    } finally {
      setIsClosing(false);
      setShowCloseConfirm(false);
    }
  };

  const isClosed = status?.toUpperCase() === 'CLOSED';

  return (
    <div className="w-full min-h-screen relative bg-ds-bg text-ds-text-primary font-dm-sans selection:bg-ds-accent/30 selection:text-ds-text-primary">
      {/* =========================================================================
          DESKTOP VIEW (md: and above) - UNTOUCHED DESKTOP UI & STYLES
      ========================================================================= */}

      {/* Top-Left Back Button (top: 40px, left: 40px) - Desktop Only */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="hidden md:inline-flex fixed top-[40px] left-[40px] z-[60] items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
          <span className="text-base font-medium leading-6">Back</span>
        </button>
      )}

      {/* Top-Right Close (✕) Button (top: 40px, right: 40px) - Desktop Only */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Close"
          className="hidden md:flex fixed top-[40px] right-[40px] z-[60] items-center justify-center size-9 rounded-md text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent group"
        >
          <Icon
            icon="solar:close-linear"
            className="size-5 text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0"
          />
        </button>
      )}

      {/* Main 640px Centered Column matching Figma Frame - Desktop Only */}
      <div className="hidden md:flex w-full max-w-[640px] mx-auto px-4 sm:px-0 pt-16 sm:pt-[60px] pb-16 flex-col justify-start items-center gap-5">
        
        {/* Title Header */}
        <div className="w-full flex justify-start items-center gap-2">
          <h1 className="text-ds-text-primary text-base font-normal leading-6">
            Listing details
          </h1>
        </div>

        {/* Fields Stack */}
        <div className="w-full flex flex-col justify-start items-start gap-10">
          
          {/* Row 1: Job Role & Recruiter */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Job role
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {title || 'Not specified'}
              </span>
            </div>

            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Recruiter
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {company || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Row 2: Location & Work Mode */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Location
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {location || 'Not specified'}
              </span>
            </div>

            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Work mode
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {work_mode || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Row 3: Experience Level & Work Type */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Experience level
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {experience || 'Not specified'}
              </span>
            </div>

            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Work type
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {work_type || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Row 4: Job Description */}
          <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <span className="text-ds-text-secondary text-xs font-medium leading-4">
              Job description
            </span>
            <div className="w-full text-ds-text-primary text-sm font-normal leading-5 whitespace-pre-wrap break-words">
              {description || 'No job description provided.'}
            </div>
          </div>

          {/* Row 5: Industry Type, Min Salary, Max Salary */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Industry type
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {industry || 'Technology'}
              </span>
            </div>

            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Min salary (annual)
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {formatSalary(salary_min)}
              </span>
            </div>

            <div className="w-full py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <span className="text-ds-text-secondary text-xs font-medium leading-4">
                Max salary (annual)
              </span>
              <span className="text-ds-text-primary text-sm font-normal leading-5 break-words">
                {formatSalary(salary_max)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Frame 2609476) - Desktop Only */}
        <div className="flex justify-center items-center gap-2 mt-5">
          {isClosed ? (
            <div className="h-9 px-4 py-1.5 rounded-[100px] bg-ds-surface-1 text-ds-text-muted flex items-center justify-center cursor-not-allowed select-none">
              <span className="text-base font-medium leading-6">Closed</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className="h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-[100px] flex items-center justify-center cursor-pointer transition-all border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              <span className="text-base font-medium leading-6">Close job</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-9 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-2 text-ds-text-primary flex items-center justify-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <span className="text-base font-medium leading-6">Delete job</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (< md / 768px) - FIGMA PREVIEW PAGE (Frames 2609713, 2610015)
      ========================================================================= */}
      <div className="flex md:hidden w-full flex-col px-4 pt-4 pb-8 max-w-[420px] mx-auto gap-5 animate-in fade-in duration-200">
        
        {/* Frame 2609713: Mobile Header (Back + Cancel/Close) */}
        <div className="w-full flex flex-row justify-between items-center h-6">
          {/* Back button (Frame 2609475) */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
            <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">
              Back
            </span>
          </button>

          {/* Close / Cancel Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Close"
              className="flex items-center justify-center size-6 text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              <Icon
                icon="solar:close-linear"
                className="size-5 text-ds-text-primary shrink-0"
              />
            </button>
          )}
        </div>

        {/* Frame 2610015 & Frame 2609734: Main Mobile Content */}
        <div className="w-full flex flex-col items-start gap-5">
          {/* Job Role Title (Frame 2608873) */}
          <div className="w-full flex flex-col justify-center items-start">
            <h1 className="text-base font-semibold font-dm-sans leading-6 text-ds-text-primary break-words">
              {title || 'Job Listing'}
            </h1>
          </div>

          {/* 2x2 Metadata Grid (Frame 2608881, 2609992, 2609993) */}
          <div className="w-full flex flex-col gap-2 rounded-2xl">
            {/* Row 1: Experience & Work mode (Frame 2609992) */}
            <div className="w-full grid grid-cols-2 gap-4">
              {/* Experience (Frame 2608881) */}
              <div className="flex flex-col justify-center items-start gap-2">
                <div className="flex flex-row items-center gap-2 text-ds-text-secondary">
                  <Icon
                    icon="solar:bag-suitcase-linear"
                    className="size-5 text-ds-text-secondary shrink-0"
                  />
                  <span className="text-xs font-normal font-dm-sans leading-4 text-ds-text-secondary">
                    Experience
                  </span>
                </div>
                <span className="text-base font-normal font-dm-sans leading-6 text-ds-text-primary break-words">
                  {experience || '0-2Yrs'}
                </span>
              </div>

              {/* Work mode (Frame 2608879) */}
              <div className="flex flex-col justify-center items-start gap-2">
                <div className="flex flex-row items-center gap-2 text-ds-text-secondary">
                  <Icon
                    icon="solar:map-point-linear"
                    className="size-5 text-ds-text-secondary shrink-0"
                  />
                  <span className="text-xs font-normal font-dm-sans leading-4 text-ds-text-secondary">
                    Work mode
                  </span>
                </div>
                <span className="text-base font-normal font-dm-sans leading-6 text-ds-text-primary break-words">
                  {work_mode || 'Hybrid'}
                </span>
              </div>
            </div>

            {/* Row 2: Work type & Salary (Frame 2609993) */}
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              {/* Work type (Frame 2608875) */}
              <div className="flex flex-col justify-center items-start gap-2">
                <div className="flex flex-row items-center gap-2 text-ds-text-secondary">
                  <Icon
                    icon="solar:calendar-linear"
                    className="size-5 text-ds-text-secondary shrink-0"
                  />
                  <span className="text-xs font-normal font-dm-sans leading-4 text-ds-text-secondary">
                    Work type
                  </span>
                </div>
                <span className="text-base font-normal font-dm-sans leading-6 text-ds-text-primary break-words">
                  {work_type || 'Full Time'}
                </span>
              </div>

              {/* Salary (Frame 2608882) */}
              <div className="flex flex-col justify-center items-start gap-2">
                <div className="flex flex-row items-center gap-2 text-ds-text-secondary">
                  <Icon
                    icon="solar:dollar-minimalistic-linear"
                    className="size-5 text-ds-text-secondary shrink-0"
                  />
                  <span className="text-xs font-normal font-dm-sans leading-4 text-ds-text-secondary">
                    Salary
                  </span>
                </div>
                <span className="text-base font-normal font-dm-sans leading-6 text-ds-text-primary break-words">
                  {getSalaryDisplay()}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section (Frame 2608778) */}
          <div className="w-full flex flex-col items-start gap-3">
            <h2 className="text-base font-semibold font-dm-sans leading-6 text-ds-text-primary">
              Description
            </h2>
            <div
              className={`w-full text-ds-text-primary text-sm font-normal font-dm-sans leading-5 whitespace-pre-wrap break-words transition-all ${
                !isDescriptionExpanded && hasLongDescription ? 'line-clamp-6' : ''
              }`}
            >
              {description || 'No job description provided.'}
            </div>

            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                className="text-ds-accent text-sm font-normal font-dm-sans leading-5 hover:underline cursor-pointer bg-transparent border-none p-0 outline-none focus-visible:ring-1 focus-visible:ring-ds-accent"
              >
                {isDescriptionExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>

          {/* Action Buttons Row (Frame 2609956) */}
          <div className="w-full flex flex-row justify-end items-center gap-2 pt-2">
            {isClosed ? (
              <div className="h-9 px-3 py-1.5 rounded-[100px] bg-ds-surface-1 text-ds-text-muted flex items-center justify-center cursor-not-allowed select-none">
                <span className="text-base font-medium leading-6">Closed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                className="h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-[100px] flex items-center justify-center cursor-pointer transition-all border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
              >
                <span className="text-base font-medium leading-6">Close job</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-2 text-ds-text-primary flex items-center justify-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              <span className="text-base font-medium leading-6">Delete job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal using common ActionConfirmModal */}
      <ActionConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Are you sure you want to delete job?"
        description="Your changes be undone"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        buttonWidthClass="w-[77px]"
        modalClassName="w-[272px]"
      />

      {/* Close Confirmation Modal using common ActionConfirmModal */}
      <ActionConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleClose}
        title="Are you sure you want to close job?"
        description="No new applicants will be able to apply after you close this job. Existing offers will remain active for 10 days."
        confirmText="Close"
        cancelText="Cancel"
        isLoading={isClosing}
        buttonWidthClass="w-[77px]"
        modalClassName="w-[272px]"
      />
    </div>
  );
};

export default ListingDetailsScreen;
