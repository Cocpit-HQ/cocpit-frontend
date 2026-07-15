import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { getCurrencySymbol, formatCompact, getCurrencyIcon } from '../../utils/currency.utils';
import { useActiveProfile } from '@/context/ActiveProfileContext';

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
  const dummyDescription = `Role: UI/UX Designer
Location: Mumbai, India

About the Role:
As a UI/UX Designer at Starlight Technologies, you will be responsible for creating exceptional user experiences for our next-generation career networking platform. You will bridge the gap between user needs and business goals through data-driven design and intuitive interfaces.

Key Responsibilities:
- Design end-to-end user journeys for both mobile and web platforms.
- Create high-fidelity mockups and interactive prototypes using Figma.
- Collaborate with engineering teams to ensure pixel-perfect implementation.
- Conduct user research and usability testing to validate design decisions.
- Contribute to and maintain our evolving design system.

Requirements:
- 3+ years of experience in digital product design.
- Strong portfolio showcasing problem-solving and visual design skills.
- Mastery of design tools (Figma, Adobe Creative Suite).
- Understanding of HTML/CSS/JS constraints and opportunities.
- Excellent communication and presentation abilities.`;

  const {
    id,
    title = 'UI/UX Designer',
    company = 'Starlight Technologies',
    location = 'Mumbai, India',
    description = dummyDescription,
    experience = '0 - 2 years',
    work_type = 'Full-time',
    work_mode = 'Hybrid',
    salary_min,
    salary_max,
    salary_currency = 'USD',
    status,
  } = listing;

  const formatSalary = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'Not specified';
    return formatCompact(val, salary_currency);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { activeProfile } = useActiveProfile();
  const isCompany = activeProfile?.type === 'COMPANY';

  const t = {
    bg: isCompany ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]',
    text: isCompany ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]',
    textMuted: isCompany ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]',
    border: isCompany ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]',
    borderLight: isCompany ? 'dark:border-[#16365F]' : 'dark:border-[#252E54]',
    primary: isCompany ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]',
    primaryBg: isCompany ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]',
    primaryHover: isCompany ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90',
    card: isCompany ? 'dark:bg-[#1A2435]' : 'dark:bg-[#252E54]',
    ultraLight: isCompany ? 'dark:bg-[#121B2B]' : 'dark:bg-[#1C2340]',
    modalBg: isCompany ? 'dark:bg-[#1A2435]' : 'dark:bg-[#1C2340]',
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteListing(id);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setIsClosing(false);
      setShowCloseConfirm(false);
    }
  };

  const isClosed = status?.toUpperCase() === 'CLOSED';

  return (
    <>
      {/* Desktop Layout */}
      <div className={`hidden md:flex w-[998px] mx-auto bg-white ${t.bg} flex-col justify-start items-center gap-4 overflow-hidden animate-in fade-in duration-300`}>
        {/* Header Row */}
        <div className="self-stretch inline-flex justify-start items-center gap-4">
          <button
            onClick={onBack}
            type="button"
            className={`size-12 p-2 rounded-[100px] border border-zinc-300 ${t.border} backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500`}
          >
            <Icon icon="lucide:chevron-left" className={`w-6 h-6 text-gray-500 ${t.textMuted}`} />
          </button>
          <div className="inline-flex flex-col justify-start items-start flex-1">
            <div className={`text-center justify-start text-black ${t.text} text-lg font-medium font-['Poppins'] leading-6`}>Listing Details</div>
            <div className={`text-center justify-start text-gray-500 ${t.textMuted} text-xs font-normal font-['Poppins'] leading-4`}>View, and manage this listing</div>
          </div>
          <div
            className={`flex flex-col justify-center items-center p-[8px] w-[70px] h-[31px] rounded-[9999px] flex-none ${
              isClosed ? 'bg-[#F1F5F9] dark:bg-gray-800' : 'bg-[#F0FDF4] dark:bg-green-900/30'
            }`}
          >
            <span
              className={`text-[10px] font-medium font-['Poppins'] uppercase leading-[15px] flex items-center text-center ${
                isClosed ? 'text-[#64748B] dark:text-gray-400' : 'text-[#22C55E] dark:text-[#4ADE80]'
              }`}
            >
              {isClosed ? 'CLOSED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Details Box */}
        <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl flex flex-col justify-start items-start gap-4`}>
          {/* Row 1: Role, Company, Location */}
          <div className="self-stretch inline-flex justify-center items-start gap-6">
            {/* Job Role */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Job Role</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} flex flex-col justify-start items-start overflow-hidden`}>
                <div className="self-stretch flex flex-col justify-start items-start overflow-hidden w-full">
                  <div className={`self-stretch justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate`}>{title}</div>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Company Name</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} flex flex-col justify-start items-start w-full`}>
                <div className={`justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{company}</div>
              </div>
            </div>

            {/* Location */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Location</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} flex flex-col justify-start items-start overflow-hidden`}>
                <div className="self-stretch flex flex-col justify-start items-start overflow-hidden w-full">
                  <div className={`self-stretch justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate`}>{location}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch inline-flex justify-between items-start">
              <div className="self-stretch inline-flex flex-col justify-start items-start">
                <div className={`justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Job Description</div>
              </div>
            </div>
            <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} flex flex-col justify-start items-start gap-4 overflow-hidden`}>
              <div className={`justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 whitespace-pre-wrap w-full`}>
                {description || dummyDescription}
              </div>
            </div>
          </div>

          {/* Row 3: Experience, Work Type, Work Mode */}
          <div className="self-stretch inline-flex justify-center items-start gap-6">
            {/* Experience */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Experience Level</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} inline-flex justify-start items-center w-full`}>
                <div className={`justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{experience}</div>
              </div>
            </div>

            {/* Work Type */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Work Type</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} inline-flex justify-start items-center w-full`}>
                <div className={`justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{work_type}</div>
              </div>
            </div>

            {/* Work Mode */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Work Mode</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} inline-flex justify-start items-center w-full`}>
                <div className={`justify-center text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{work_mode}</div>
              </div>
            </div>
          </div>

          {/* Row 4: Salary Min, Salary Max */}
          <div className="self-stretch inline-flex justify-center items-start gap-6">
            {/* Min Salary */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Min Salary (Annual)</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} inline-flex justify-start items-center gap-2 w-full`}>
                {salary_min !== undefined && salary_min !== null && !isNaN(salary_min) ? (
                  <Icon icon={getCurrencyIcon(salary_currency)} className={`w-5 h-5 text-gray-500 ${t.textMuted} flex-shrink-0`} />
                ) : null}
                <div className={`justify-start text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{formatSalary(salary_min)}</div>
              </div>
            </div>

            {/* Max Salary */}
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch flex flex-col justify-start items-start">
                <div className={`self-stretch justify-center text-black ${t.text} text-sm font-normal font-['Poppins'] leading-5`}>Max Salary (Annual)</div>
              </div>
              <div className={`self-stretch p-4 bg-white ${t.bg} rounded-xl border border-indigo-50 ${t.borderLight} inline-flex justify-start items-center gap-2 w-full`}>
                {salary_max !== undefined && salary_max !== null && !isNaN(salary_max) ? (
                  <Icon icon={getCurrencyIcon(salary_currency)} className={`w-5 h-5 text-gray-500 ${t.textMuted} flex-shrink-0`} />
                ) : null}
                <div className={`justify-start text-black ${t.text} text-base font-normal font-['Poppins'] leading-6 truncate w-full`}>{formatSalary(salary_max)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className={`self-stretch pt-6 border-t border-indigo-50 ${t.borderLight} inline-flex justify-between items-center`}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            type="button"
            className="px-4 py-2 flex justify-start items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
          >
            <span className="text-center justify-start text-red-400 dark:text-[#F87171] text-sm font-normal font-['Poppins'] leading-5">
              Delete Job
            </span>
            <Icon icon="lucide:trash-2" className="w-5 h-5 text-red-400 dark:text-[#F87171]" />
          </button>

          {isClosed ? (
            <div className={`w-36 h-10 px-4 py-2 bg-slate-100 ${t.ultraLight} rounded-3xl border border-white ${t.borderLight} inline-flex justify-center items-center gap-2.5`}>
              <div className={`text-center justify-start text-gray-500 ${t.textMuted} text-sm font-normal font-['Poppins'] leading-5`}>Closed</div>
            </div>
          ) : (
            <button
              onClick={() => setShowCloseConfirm(true)}
              type="button"
              className={`w-36 h-10 px-4 py-2 bg-indigo-500 ${t.primaryBg} ${t.primaryHover} rounded-3xl border border-white ${t.borderLight} flex justify-center items-center gap-2.5 transition-all active:scale-95 shadow-sm`}
            >
              <span className="text-center justify-start text-white text-sm font-normal font-['Poppins'] leading-5">
                Close Job
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className={`flex md:hidden flex-col w-full min-h-[100dvh] bg-white ${t.bg} pb-[100px] pt-4`}>
        {/* Mobile Header */}
        <div className="flex flex-row items-center px-4 pb-4 gap-4 mt-2">
          <button
            onClick={onBack}
            type="button"
            className={`w-10 h-10 rounded-full border border-gray-200 ${t.border} flex items-center justify-center shrink-0 hover:bg-slate-50 transition-colors`}
          >
            <Icon icon="lucide:chevron-left" className={`w-5 h-5 text-gray-600 ${t.textMuted}`} />
          </button>
          <div className="flex flex-col">
            <h1 className={`text-[16px] font-semibold font-['Poppins'] leading-[24px] text-black ${t.text}`}>
              Listing Details
            </h1>
            <p className={`text-[12px] font-normal font-['Poppins'] text-gray-500 ${t.textMuted}`}>
              View and manage this listing
            </p>
          </div>
        </div>

        {/* Mobile Body */}
        <div className="flex flex-col px-4 gap-6">
          <div className="flex flex-col gap-1">
            <h2 className={`text-[18px] font-semibold font-['Poppins'] uppercase text-black ${t.text}`}>
              {title}
            </h2>
            <p className={`text-[14px] font-normal font-['Poppins'] text-gray-500 ${t.textMuted}`}>
              {company}
            </p>
            <p className={`text-[14px] font-normal font-['Poppins'] text-gray-500 ${t.textMuted}`}>
              {work_type}
            </p>
            
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-3">
                <Icon icon="lucide:briefcase" className={`w-5 h-5 text-gray-700 ${t.text}`} />
                <span className={`text-[14px] font-medium font-['Poppins'] text-gray-800 ${t.text}`}>
                  {experience}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="lucide:map-pin" className={`w-5 h-5 text-gray-700 ${t.text}`} />
                <span className={`text-[14px] font-medium font-['Poppins'] text-gray-800 ${t.text}`}>
                  {work_mode} - {location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <h3 className={`text-[16px] font-semibold font-['Poppins'] text-black ${t.text}`}>
              Job description
            </h3>
            <div className={`p-4 bg-[#F8FAFC] ${t.ultraLight} rounded-2xl flex flex-col items-start`}>
              <div className={`text-[14px] font-normal font-['Poppins'] leading-[24px] text-black ${t.text} whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-6' : ''}`}>
                {description || dummyDescription}
              </div>
              <button 
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className={`mt-3 text-[14px] font-medium font-['Poppins'] text-indigo-500 ${t.primary}`}
              >
                {isDescriptionExpanded ? 'See less' : 'See more'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className={`fixed bottom-[64px] left-0 right-0 p-4 bg-white ${t.bg} border-t border-gray-100 ${t.border} z-40 flex items-center justify-between pb-[calc(1rem+env(safe-area-inset-bottom))]`}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            type="button"
            className="flex items-center gap-2 px-2 py-2 hover:opacity-70 transition-opacity"
          >
            <span className="text-[14px] font-medium font-['Poppins'] text-[#FF6B6B] dark:text-[#F87171]">
              Delete job
            </span>
            <Icon icon="lucide:trash-2" className="w-5 h-5 text-[#FF6B6B] dark:text-[#F87171]" />
          </button>

          {isClosed ? (
            <div className={`px-8 h-12 rounded-full bg-gray-100 ${t.ultraLight} flex items-center justify-center`}>
              <span className={`text-[14px] font-medium font-['Poppins'] text-gray-500 ${t.textMuted}`}>
                Closed
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowCloseConfirm(true)}
              type="button"
              className={`px-10 h-12 rounded-[24px] bg-[#6366F1] ${t.primaryBg} ${t.primaryHover} flex items-center justify-center transition-all active:scale-95`}
            >
              <span className="text-[14px] font-medium font-['Poppins'] text-white">
                Close job
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Shared) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 top-[48px] md:top-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className={`w-full max-w-[360px] p-6 bg-white ${t.modalBg} rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200`}>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className={`text-black ${t.text} text-base font-normal font-['Poppins'] leading-5`}>
                Are you sure you want to delete job?
              </div>
              <div className={`text-gray-400 ${t.textMuted} text-xs font-normal font-['Poppins'] leading-4`}>
                This cannot be undone
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
                className={`flex-1 h-10 px-4 rounded-3xl border border-indigo-100 ${t.borderLight} bg-white ${t.modalBg} text-indigo-500 ${t.primary} text-sm font-normal font-['Poppins'] hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl bg-red-400 text-white text-sm font-normal font-['Poppins'] hover:bg-red-500 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal (Shared) */}
      {showCloseConfirm && (
        <div className="fixed inset-0 top-[48px] md:top-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className={`w-full max-w-[360px] p-6 bg-white ${t.modalBg} rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200`}>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className={`text-black ${t.text} text-lg font-medium font-['Poppins'] leading-6`}>
                Close Job?
              </div>
              <div className={`text-gray-500 ${t.textMuted} text-sm font-normal font-['Poppins'] leading-5`}>
                No new applicants will be able to apply after you close this job. Existing offers will remain active for 10 days.
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                type="button"
                className={`flex-1 h-10 px-4 rounded-3xl border border-indigo-400 ${t.borderLight} bg-white ${t.modalBg} text-indigo-500 ${t.primary} text-sm font-medium font-['Poppins'] hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center`}
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={isClosing}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl bg-[#FF6B6B] dark:bg-[#F87171] text-white text-sm font-medium font-['Poppins'] hover:bg-red-500 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
              >
                {isClosing ? 'Closing...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingDetailsScreen;

