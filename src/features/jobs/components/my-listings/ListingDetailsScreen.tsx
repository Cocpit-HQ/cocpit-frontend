import React from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';

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
    status,
  } = listing;

  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[salary_currency] || salary_currency;

  const formatSalary = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return 'Not specified';
    return `${symbol}${val.toLocaleString()}`;
  };

  const isClosed = status?.toUpperCase() === 'CLOSED';

  return (
    <div className="w-[960px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6">Listing Details</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">View and manage this listing</div>
        </div>
      </div>

      {/* Details Box */}
      <div className="self-stretch p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4 border border-[#EEF2FF]">
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Job Role */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Job Role</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{title}</div>
            </div>
          </div>

          {/* Company Name */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Company Name</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{company}</div>
            </div>
          </div>

          {/* Location */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Location</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{location}</div>
            </div>
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Job Description</span>
          <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start gap-4 overflow-hidden">
            <div className="text-black text-base font-normal font-['Poppins'] leading-6 whitespace-pre-wrap w-full">
              {description || 'No description provided.'}
            </div>
          </div>
        </div>

        {/* Row 3: Experience, Work Type, Work Mode */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Experience */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Experience Level</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{experience}</div>
            </div>
          </div>

          {/* Work Type */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Work Type</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{work_type}</div>
            </div>
          </div>

          {/* Work Mode */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Work Mode</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{work_mode}</div>
            </div>
          </div>
        </div>

        {/* Row 4: Salary Min, Salary Max */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Min Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Min Salary (Annual)</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{formatSalary(salary_min)}</div>
            </div>
          </div>

          {/* Max Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <span className="text-black text-sm font-normal font-['Poppins'] leading-5 font-medium">Max Salary (Annual)</span>
            <div className="self-stretch p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden">
              <div className="text-black text-base font-normal font-['Poppins'] leading-6 truncate w-full">{formatSalary(salary_max)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="self-stretch inline-flex justify-between items-center mt-2">
        <button
          onClick={() => onDeleteListing(id)}
          type="button"
          className="flex justify-start items-center gap-1.5 px-4 py-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 text-base font-medium font-['Poppins'] leading-6 transition-all active:scale-95"
        >
          <Icon icon="lucide:trash-2" className="w-5 h-5 text-red-500" />
          <span>Delete Job</span>
        </button>
        <button
          onClick={() => !isClosed && onCloseListing(id)}
          disabled={isClosed}
          type="button"
          className={`w-36 h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-semibold font-['Poppins'] leading-5 transition-all shadow-sm ${
            isClosed
              ? 'bg-gray-300 cursor-not-allowed opacity-80'
              : 'bg-indigo-500 hover:bg-indigo-600 active:scale-95'
          }`}
        >
          <span>{isClosed ? 'Job Closed' : 'Close Job'}</span>
        </button>
      </div>
    </div>
  );
};

export default ListingDetailsScreen;
