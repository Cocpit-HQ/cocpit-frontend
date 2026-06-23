import React from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';

interface StepJobPreviewProps {
  details: Partial<JobListing>;
  onBack: () => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
}

export const StepJobPreview: React.FC<StepJobPreviewProps> = ({
  details,
  onBack,
  onSaveDraft,
  onPublish,
}) => {
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

  // Currency symbols map
  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[salary_currency] || salary_currency;

  const formatSalaryVal = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return null;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formattedMin = formatSalaryVal(salary_min);
  const formattedMax = formatSalaryVal(salary_max);

  const salaryDisplay =
    formattedMin && formattedMax
      ? `${symbol}${formattedMin} - ${symbol}${formattedMax}`
      : formattedMin
      ? `${symbol}${formattedMin}+`
      : formattedMax
      ? `Up to ${symbol}${formattedMax}`
      : 'Competitive';

  // Format experience value for smaller badge display (e.g. "0 - 2 years" -> "0-2Yrs")
  const formatExperienceBadge = (expStr: string) => {
    return expStr
      .replace(/\s+/g, '') // remove spaces
      .replace(/years?/gi, 'Yrs'); // change years to Yrs
  };

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
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6">Preview Listing</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">This is how candidates will see your job</div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="self-stretch p-6 bg-white rounded-xl flex flex-col justify-start items-start gap-4 border border-[#EEF2FF]">
        {/* Card Header Info */}
        <div className="self-stretch flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-black text-xl font-bold font-['Poppins'] leading-tight">{title}</h3>
            <span className="text-gray-600 text-base font-normal font-['Poppins'] leading-snug">{company}</span>
            <span className="text-gray-500 text-sm font-normal font-['Poppins']">{work_type}</span>
          </div>

          {/* Company Logo Badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 to-slate-400 flex items-center justify-center shadow-inner overflow-hidden border border-slate-300">
            <Icon icon="solar:globus-bold" className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>

        {/* Card Meta Row (Experience, Work Mode, Salary) */}
        <div className="self-stretch flex justify-between items-center pb-2 border-b border-[#EEF2FF]/60 text-sm">
          <div className="flex items-center gap-2 text-gray-700 font-medium font-['Poppins']">
            {/* Experience */}
            <div className="flex items-center gap-1">
              <Icon icon="lucide:briefcase" className="w-4 h-4 text-gray-500" />
              <span>{formatExperienceBadge(experience)}</span>
            </div>
            
            <span className="text-gray-300">•</span>

            {/* Work Mode & Location */}
            <div className="flex items-center gap-1">
              <Icon icon="lucide:map-pin" className="w-4 h-4 text-gray-500" />
              <span>{work_mode} - {location}</span>
            </div>
          </div>

          {/* Salary Display */}
          <div className="text-black font-semibold font-['Poppins']">
            {salaryDisplay}
          </div>
        </div>

        {/* Job Description Content */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
          <h4 className="text-black text-sm font-semibold font-['Poppins'] leading-tight">Job Description</h4>
          <div className="text-gray-800 text-base font-normal font-['Poppins'] leading-relaxed whitespace-pre-wrap w-full">
            {description}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="self-stretch inline-flex justify-between items-center mt-2">
        <button
          onClick={onSaveDraft}
          type="button"
          className="px-4 py-2 hover:bg-slate-50 rounded-lg inline-flex flex-col justify-center items-center text-gray-500 hover:text-gray-700 text-base font-medium font-['Poppins'] leading-6 transition-colors active:scale-95"
        >
          Save Draft
        </button>
        <div className="flex justify-start items-center gap-2">
          <button
            onClick={onBack}
            type="button"
            className="w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95"
          >
            Back
          </button>
          <button
            onClick={onPublish}
            type="button"
            className="w-36 h-10 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95 shadow-sm"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepJobPreview;
