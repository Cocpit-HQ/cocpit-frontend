import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';

interface JobDetailBodyProps {
  job: Job;
}

export const JobDetailBody: React.FC<JobDetailBodyProps> = ({ job }) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Description & Requirements Column */}
      <div className="lg:col-span-2 flex flex-col gap-6 bg-white p-6 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
        
        {/* Strength Indicator (Tooltip text) */}
        <div className="p-4 bg-indigo-50/50 rounded-2xl flex items-start gap-3 border border-indigo-50 text-indigo-500">
          <Icon icon="lucide:sparkles" className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs font-semibold font-['Poppins'] leading-5">
            You're stronger than 90% of applicants for this job based on your profile and skills
          </span>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-black text-lg font-semibold font-['Poppins'] border-b border-slate-100 pb-2">
            Job Description
          </h2>
          <p className="text-gray-600 text-sm font-normal font-['Poppins'] leading-6 whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Requirements Section */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-black text-lg font-semibold font-['Poppins'] border-b border-slate-100 pb-2">
              Key Requirements
            </h2>
            <ul className="flex flex-col gap-2.5">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 flex items-center justify-center text-indigo-500 mt-0.5 flex-shrink-0">
                    <Icon icon="lucide:check-circle-2" className="w-4 h-4" />
                  </div>
                  <span className="text-gray-600 text-sm font-normal font-['Poppins'] leading-5">
                    {req}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-black text-lg font-semibold font-['Poppins'] border-b border-slate-100 pb-2">
              Skills & Keywords
            </h2>
            <div className="flex flex-wrap gap-2 mt-1">
              {job.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-indigo-50/50 text-indigo-500 rounded-full text-xs font-semibold font-['Poppins'] hover:bg-indigo-50 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Summary Details Panel */}
      <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
        <h2 className="text-black text-lg font-semibold font-['Poppins'] border-b border-slate-100 pb-2">
          Job Summary
        </h2>

        <div className="flex flex-col gap-4">
          {/* Work Mode */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <Icon icon="lucide:map-pin" className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase font-['Poppins']">
                Work Mode
              </span>
              <span className="text-black text-sm font-medium font-['Poppins'] mt-0.5">
                {job.work_mode || 'Hybrid'}
              </span>
            </div>
          </div>

          {/* Experience level */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <Icon icon="hugeicons:job-search" className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase font-['Poppins']">
                Experience Level
              </span>
              <span className="text-black text-sm font-medium font-['Poppins'] mt-0.5">
                {job.experience || '0-2 Yrs'}
              </span>
            </div>
          </div>

          {/* Response Rate */}
          {job.response_rate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Icon icon="lucide:percent" className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-semibold uppercase font-['Poppins']">
                  Response Rate
                </span>
                <span className="text-black text-sm font-medium font-['Poppins'] mt-0.5">
                  {job.response_rate}
                </span>
              </div>
            </div>
          )}

          {/* Avg Reply */}
          {job.avg_reply && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Icon icon="lucide:clock" className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-semibold uppercase font-['Poppins']">
                  Average Reply
                </span>
                <span className="text-black text-sm font-medium font-['Poppins'] mt-0.5">
                  {job.avg_reply}
                </span>
              </div>
            </div>
          )}

          {/* Posted Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <Icon icon="lucide:calendar" className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase font-['Poppins']">
                Date Posted
              </span>
              <span className="text-black text-sm font-medium font-['Poppins'] mt-0.5">
                {job.posted_at}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailBody;
