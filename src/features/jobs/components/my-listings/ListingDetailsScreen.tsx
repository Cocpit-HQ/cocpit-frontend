import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';

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
    status,
  } = listing;

  const formatSalary = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'Not specified';
    return Number(val).toLocaleString();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
      {/* Top-Left Back Button (top: 40px, left: 40px) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="fixed top-6 left-4 sm:top-10 sm:left-10 z-[60] flex items-center gap-2 h-9 px-2 rounded-md text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent group"
        >
          <Icon
            icon="solar:arrow-left-linear"
            className="size-5 text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0"
          />
          <span className="text-base font-medium leading-6">Back</span>
        </button>
      )}

      {/* Top-Right Close (✕) Button (top: 40px, right: 40px) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Close"
          className="fixed top-6 right-4 sm:top-10 sm:right-10 z-[60] flex items-center justify-center size-9 rounded-md text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent group"
        >
          <Icon
            icon="solar:close-linear"
            className="size-5 text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0"
          />
        </button>
      )}

      {/* Main 640px Centered Column matching Figma Frame */}
      <div className="w-full max-w-[640px] mx-auto px-4 sm:px-0 pt-16 sm:pt-[60px] pb-16 flex flex-col justify-start items-center gap-5 animate-in fade-in duration-300">
        
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

        {/* Action Buttons (Frame 2609476) */}
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
