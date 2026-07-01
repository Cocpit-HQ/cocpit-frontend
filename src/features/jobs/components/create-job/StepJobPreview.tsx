import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { formatSalaryRange, getCurrencyIcon } from '../../utils/currency.utils';

interface StepJobPreviewProps {
  details: Partial<JobListing>;
  onBack: () => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onDeleteDraft?: () => void;
}

export const StepJobPreview: React.FC<StepJobPreviewProps> = ({
  details,
  onBack,
  onSaveDraft,
  onPublish,
  onDeleteDraft,
}) => {
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handlePublishClick = () => {
    setShowReviewPopup(true);
  };

  const handlePopupClose = async () => {
    setShowReviewPopup(false);
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraftClick = async () => {
    setIsSavingDraft(true);
    try {
      await onSaveDraft();
    } finally {
      setIsSavingDraft(false);
    }
  };

  useEffect(() => {
    if (!showReviewPopup) return;
    const timer = setTimeout(() => {
      handlePopupClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [showReviewPopup]);
  const {
    title = 'UI/UX Designer',
    company = 'Starlight Technologies',
    location = 'Mumbai, India',
    description = '',
    experience = '0 - 2 years',
    work_type = 'Full-time',
    work_mode = 'Hybrid',
    salary_min,
    salary_max,
    salary_currency = 'USD',
  } = details;

  const salaryDisplay = formatSalaryRange(salary_min, salary_max, salary_currency) || 'Competitive';

  // Format experience value for smaller badge display (e.g. "0 - 2 years" -> "0-2Yrs")
  const formatExperienceBadge = (expStr: string) => {
    return expStr
      .replace(/\s+/g, '') // remove spaces
      .replace(/years?/gi, 'Yrs'); // change years to Yrs
  };

  return (
    <div className="w-full max-w-[998px] mx-auto bg-white flex flex-col justify-start items-center gap-4 px-4 md:px-0 animate-in fade-in duration-300 pb-16">
      {/* Header Row */}
      <div className="self-stretch flex flex-row justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 p-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm flex-shrink-0"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6 text-left">Preview Listing</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-left">This is how candidates will see your job</div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="w-full p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-end gap-4 shadow-sm">
        {/* Card Header Info */}
        <div className="self-stretch flex flex-row justify-between items-start gap-4">
          <div className="flex flex-col justify-start items-start gap-2 w-full text-left min-w-0">
            <div className="text-black text-base font-medium font-['Poppins'] leading-6">{title}</div>
            <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">{company}</div>
            <div className="text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">{work_type}</div>
          </div>
          <img className="w-14 h-10 px-4 py-2 rounded-3xl object-contain border border-[#EEF2FF] bg-[#F8FAFC] flex-shrink-0" src="/assets/company-placeholder.png" alt="Company Logo" />
        </div>

        {/* Card Meta Row (Experience, Work Mode, Salary) */}
        <div className="self-stretch flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mt-2">
          <div className="flex flex-wrap justify-start items-center gap-2">
            <div className="flex justify-start items-center gap-2">
              <Icon icon="hugeicons:job-search" className="w-5 h-5 text-black flex-shrink-0" />
              <div className="text-black text-sm font-normal font-['Poppins'] leading-5">{formatExperienceBadge(experience)}</div>
            </div>
            <div className="size-1.5 bg-black rounded-full flex-shrink-0" />
            <div className="flex justify-start items-center gap-2">
              <Icon icon="lucide:map-pin" className="w-5 h-5 text-black flex-shrink-0" />
              <div className="text-black text-sm font-normal font-['Poppins'] leading-5">
                {work_mode && work_mode.toLowerCase() === 'remote' ? 'Remote' : `${work_mode} - ${location}`}
              </div>
            </div>
          </div>
          <div className="flex justify-start items-center gap-1.5">
            {salary_min || salary_max ? (
              <Icon icon={getCurrencyIcon(salary_currency)} className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : null}
            <div className="text-black text-xs font-medium font-['Poppins'] leading-4">{salaryDisplay}</div>
          </div>
        </div>

        {/* Job Description Content */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full text-left">
          <div className="self-stretch h-5 flex flex-col justify-start items-start">
            <div className="text-black text-sm font-normal font-['Poppins'] leading-5">Job Description</div>
          </div>
          <div className="self-stretch bg-white rounded-xl flex flex-col justify-start items-start gap-4 overflow-hidden">
            <div className="text-black text-base font-normal font-['Poppins'] leading-6 whitespace-pre-wrap w-full text-left leading-relaxed">
              {description}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="self-stretch flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2 w-full gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {onDeleteDraft && (
            <button
              onClick={onDeleteDraft}
              disabled={isSavingDraft || isPublishing || showReviewPopup}
              type="button"
              className="px-4 py-2 hover:bg-red-50 rounded-lg flex flex-col justify-center items-center text-red-400 hover:text-red-500 text-base font-medium font-['Poppins'] leading-6 transition-colors active:scale-95 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Draft
            </button>
          )}
          <button
            onClick={handleSaveDraftClick}
            disabled={isSavingDraft || isPublishing || showReviewPopup}
            type="button"
            className="px-4 py-2 hover:bg-slate-50 rounded-lg flex flex-col justify-center items-center text-gray-500 hover:text-gray-700 text-base font-medium font-['Poppins'] leading-6 transition-colors active:scale-95 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onBack}
            disabled={isSavingDraft || isPublishing || showReviewPopup}
            type="button"
            className="w-full sm:w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 text-indigo-400 text-sm font-normal font-['Poppins'] leading-5 hover:bg-indigo-50/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handlePublishClick}
            disabled={isSavingDraft || isPublishing || showReviewPopup}
            type="button"
            className="w-full sm:w-48 h-10 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-normal font-['Poppins'] leading-5 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <Icon icon="line-md:loading-loop" className="w-5 h-5" />
                <span>Creating Job...</span>
              </>
            ) : (
              'Publish'
            )}
          </button>
        </div>
      </div>

      {/* Review Popup Modal */}
      {showReviewPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 px-4">
          <div 
            onClick={handlePopupClose}
            className="w-full max-w-[440px] p-6 sm:p-10 bg-white rounded-[32px] shadow-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transform transition-all hover:scale-102 active:scale-98"
          >
            <h3 className="text-black text-xl md:text-[22px] font-bold font-['Poppins'] text-center leading-tight">
              Job Post Under Review
            </h3>
            <p className="text-slate-500 text-sm font-normal font-['Poppins'] text-center leading-relaxed max-w-[280px]">
              Our team will review your job post before it goes live.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepJobPreview;
