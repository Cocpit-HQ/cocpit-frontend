import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobsFilter } from '../types/jobs.types';

interface JobFiltersProps {
  filters: JobsFilter;
  onFilterChange: (key: keyof JobsFilter, value: string) => void;
  onClearFilters: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const jobTypeOptions = ['', 'Full time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const experienceOptions = ['', 'Fresher', 'Junior (1-3 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'];
  const workModeOptions = ['', 'Remote', 'Hybrid', 'Onsite'];
  const salaryOptions = ['', 'Under 3L', '3L-5L', '6L-10L', '10L+'];

  const renderDropdown = (
    label: string,
    filterKey: keyof JobsFilter,
    options: string[],
    currentVal: string
  ) => {
    const isOpen = activeDropdown === label;
    const isSelected = !!currentVal;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(label)}
          className={`h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2 transition-all ${
            isSelected
              ? 'bg-indigo-50 outline-indigo-500 text-indigo-500 font-semibold'
              : 'bg-white outline-indigo-50 text-black font-normal hover:bg-slate-50'
          }`}
        >
          <span className="text-sm font-['Poppins'] leading-5">
            {isSelected ? `${label}: ${currentVal}` : label}
          </span>
          <Icon
            icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className={`w-4 h-4 transition-transform ${
              isSelected ? 'text-indigo-500' : 'text-gray-500'
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl border border-indigo-50 shadow-lg py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map(option => (
              <button
                key={option}
                onClick={() => {
                  onFilterChange(filterKey, option);
                  setActiveDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-['Poppins'] hover:bg-indigo-50/50 transition-colors ${
                  (currentVal || '') === option
                    ? 'text-indigo-500 font-semibold bg-indigo-50/30'
                    : 'text-gray-700 font-normal'
                }`}
              >
                {option === '' ? 'All' : option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(val => !!val);

  return (
    <div className="self-stretch flex justify-between items-center gap-4" ref={containerRef}>
      <div className="flex flex-wrap justify-start items-center gap-3">
        {renderDropdown('Job type', 'job_type', jobTypeOptions, filters.job_type || '')}
        {renderDropdown('Experience level', 'experience', experienceOptions, filters.experience || '')}
        {renderDropdown('Work mode', 'work_mode', workModeOptions, filters.work_mode || '')}
        {renderDropdown('Salary range', 'salary_range', salaryOptions, filters.salary_range || '')}

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="h-10 px-4 py-2 bg-rose-50 hover:bg-rose-100/80 rounded-3xl text-rose-500 font-medium text-xs font-['Poppins'] transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Sort/Filter icon display (Figma) */}
      <div className="w-14 h-10 bg-white hover:bg-slate-50 border border-slate-100 rounded-3xl flex justify-center items-center relative flex-shrink-0 cursor-pointer shadow-sm transition-all active:scale-95">
        <Icon icon="lucide:sliders-horizontal" className="w-5 h-5 text-black" />
        {hasActiveFilters && (
          <div className="w-2 h-2 absolute top-2 right-4 bg-indigo-500 rounded-full ring-2 ring-white" />
        )}
      </div>
    </div>
  );
};

export default JobFilters;
