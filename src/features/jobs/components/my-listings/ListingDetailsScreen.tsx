import React from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { getCurrencySymbol, formatCompact, getCurrencyIcon } from '../../utils/currency.utils';

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

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

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
    <div className="w-[998px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 p-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start flex-1">
          <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Listing Details</div>
          <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">View, and manage this listing</div>
        </div>
        <div
          className={`flex flex-col justify-center items-center p-[8px] w-[70px] h-[31px] rounded-[9999px] flex-none ${
            isClosed ? 'bg-[#F1F5F9]' : 'bg-[#F0FDF4]'
          }`}
        >
          <span
            className={`text-[10px] font-medium font-['Poppins'] uppercase leading-[15px] flex items-center text-center ${
              isClosed ? 'text-[#64748B]' : 'text-[#22C55E]'
            }`}
          >
            {isClosed ? 'CLOSED' : 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Details Box */}
      <div className="self-stretch p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4">
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Job Role */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Job Role</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="self-stretch flex flex-col justify-start items-start overflow-hidden w-full">
                <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate">{title}</div>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Company Name</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start w-full">
              <div className="justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{company}</div>
            </div>
          </div>

          {/* Location */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Location</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="self-stretch flex flex-col justify-start items-start overflow-hidden w-full">
                <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate">{location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-between items-start">
            <div className="self-stretch inline-flex flex-col justify-start items-start">
              <div className="justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Job Description</div>
            </div>
          </div>
          <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start gap-4 overflow-hidden">
            <div className="justify-center text-black text-base font-normal font-['Poppins'] leading-6 whitespace-pre-wrap w-full">
              {description || dummyDescription}
            </div>
          </div>
        </div>

        {/* Row 3: Experience, Work Type, Work Mode */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Experience */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Experience Level</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center w-full">
              <div className="justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{experience}</div>
            </div>
          </div>

          {/* Work Type */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Work Type</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center w-full">
              <div className="justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{work_type}</div>
            </div>
          </div>

          {/* Work Mode */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Work Mode</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center w-full">
              <div className="justify-center text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{work_mode}</div>
            </div>
          </div>
        </div>

        {/* Row 4: Salary Min, Salary Max */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Min Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Min Salary (Annual)</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center gap-2 w-full">
              {salary_min !== undefined && salary_min !== null && !isNaN(salary_min) ? (
                <Icon icon={getCurrencyIcon(salary_currency)} className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : null}
              <div className="justify-start text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{formatSalary(salary_min)}</div>
            </div>
          </div>

          {/* Max Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Max Salary (Annual)</div>
            </div>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center gap-2 w-full">
              {salary_max !== undefined && salary_max !== null && !isNaN(salary_max) ? (
                <Icon icon={getCurrencyIcon(salary_currency)} className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : null}
              <div className="justify-start text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{formatSalary(salary_max)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="self-stretch pt-6 border-t border-indigo-50 inline-flex justify-between items-center">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          type="button"
          className="px-4 py-2 flex justify-start items-center gap-2 hover:bg-red-50 rounded-lg transition-all active:scale-95"
        >
          <span className="text-center justify-start text-red-400 text-sm font-normal font-['Poppins'] leading-5">
            Delete Job
          </span>
          <Icon icon="lucide:trash-2" className="w-5 h-5 text-red-400" />
        </button>

        {isClosed ? (
          <div className="w-36 h-10 px-4 py-2 bg-slate-100 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white inline-flex justify-center items-center gap-2.5">
            <div className="text-center justify-start text-gray-500 text-sm font-normal font-['Poppins'] leading-5">Closed</div>
          </div>
        ) : (
          <button
            onClick={() => setShowCloseConfirm(true)}
            type="button"
            className="w-36 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 transition-all hover:bg-indigo-600 active:scale-95 shadow-sm"
          >
            <span className="text-center justify-start text-white text-sm font-normal font-['Poppins'] leading-5">
              Close Job
            </span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[360px] p-6 bg-white rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="text-black text-base font-normal font-['Poppins'] leading-5">
                Are you sure you want to delete job?
              </div>
              <div className="text-gray-400 text-xs font-normal font-['Poppins'] leading-4">
                This cannot be undone
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl border border-indigo-100 bg-white text-indigo-500 text-sm font-normal font-['Poppins'] hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center"
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

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[360px] p-6 bg-white rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="text-black text-lg font-medium font-['Poppins'] leading-6">
                Close Job?
              </div>
              <div className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">
                No new applicants will be able to apply after you close this job. Existing offers will remain active for 10 days.
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl border border-indigo-400 bg-white text-indigo-500 text-sm font-medium font-['Poppins'] hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={isClosing}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl bg-[#FF6B6B] text-white text-sm font-medium font-['Poppins'] hover:bg-red-500 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
              >
                {isClosing ? 'Closing...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsScreen;
