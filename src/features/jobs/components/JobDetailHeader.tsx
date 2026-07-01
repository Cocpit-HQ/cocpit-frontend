import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import { getCurrencyIcon } from '../utils/currency.utils';

interface JobDetailHeaderProps {
  job: Job;
}

export const JobDetailHeader: React.FC<JobDetailHeaderProps> = ({ job }) => {
  const [imgError, setImgError] = React.useState(false);

  const renderLogo = () => {
    if (job.company_logo === 'sphere') {
      return (
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex justify-center items-center overflow-hidden flex-shrink-0 shadow-sm border border-indigo-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-md" />
        </div>
      );
    }
    
    if (job.company_logo && !imgError) {
      return (
        <div className="w-16 h-16 bg-white rounded-3xl flex justify-center items-center overflow-hidden flex-shrink-0 shadow-sm border border-indigo-50">
          <img 
            src={job.company_logo} 
            alt={`${job.company} logo`} 
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    return (
      <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex justify-center items-center flex-shrink-0 shadow-sm border border-indigo-50">
        <Icon icon="hugeicons:job-search" className="w-7 h-7 text-indigo-500" />
      </div>
    );
  };

  return (
    <div className="w-full bg-white p-6 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0px_4px_24px_rgba(99,102,241,0.03)]">
      <div className="flex justify-start items-center gap-4">
        {renderLogo()}
        <div className="flex flex-col justify-start items-start gap-1">
          <h1 className="text-black text-xl md:text-2xl font-semibold font-['Poppins'] leading-8">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
            <span className="text-indigo-500 text-sm font-semibold font-['Poppins']">
              {job.company}
            </span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span className="text-gray-500 text-sm font-normal font-['Poppins']">
              {job.location}
            </span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span className="text-gray-400 text-xs font-semibold font-['Poppins'] px-2 py-0.5 bg-slate-100 rounded-full">
              {job.job_type}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end justify-center gap-1.5 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50 self-stretch md:self-auto min-w-[150px]">
        <span className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase font-['Poppins']">
          Offered Salary
        </span>
        <span className="text-indigo-600 text-lg font-bold font-['Poppins'] flex items-center gap-1.5 md:justify-end">
          {job.salary_display || job.salary_min || job.salary_max ? (
            <>
              <Icon icon={getCurrencyIcon(job.salary_currency)} className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span>
                {job.salary_display
                  ? job.salary_display
                  : `${job.salary_min || ''} – ${job.salary_max || ''}`.trim()
                }
              </span>
            </>
          ) : (
            <span>Salary not disclosed</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default JobDetailHeader;
