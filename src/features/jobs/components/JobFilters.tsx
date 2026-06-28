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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [localFilters, setLocalFilters] = useState<JobsFilter>({
    job_type: filters.job_type || '',
    experience: filters.experience || '',
    work_mode: filters.work_mode || '',
    salary_range: filters.salary_range || '',
    date_posted: filters.date_posted || '',
    industry: filters.industry || ''
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset expanded section only when opening the dropdown
  useEffect(() => {
    if (isOpen) {
      setExpandedSection('job_type');
    }
  }, [isOpen]);

  // Keep local filters synced with global filters
  useEffect(() => {
    setLocalFilters({
      job_type: filters.job_type || '',
      experience: filters.experience || '',
      work_mode: filters.work_mode || '',
      salary_range: filters.salary_range || '',
      date_posted: filters.date_posted || '',
      industry: filters.industry || ''
    });
  }, [filters]);

  const togglePopup = () => {
    setIsOpen(prev => !prev);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleClear = () => {
    setLocalFilters({
      job_type: '',
      experience: '',
      work_mode: '',
      salary_range: '',
      date_posted: '',
      industry: ''
    });
    onClearFilters();
    setIsOpen(false);
  };

  const jobTypeOptions = ['', 'Full time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const experienceOptions = ['', 'Fresher', 'Junior (1-3 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'];
  const workModeOptions = ['', 'Remote', 'Hybrid', 'Onsite'];
  const salaryOptions = ['', 'Under 3L', '3L-5L', '6L-10L', '10L+'];
  const datePostedOptions = ['', 'Today', 'Last 7 days', 'Last 30 days'];

  const standardIndustries = ['Tech', 'Finance', 'Marketing', 'Design', 'Sales', 'Healthcare', 'Education'];
  const isCustomIndustry = !!(localFilters.industry && !standardIndustries.map(i => i.toLowerCase()).includes(localFilters.industry.toLowerCase()));
  const [customIndustryText, setCustomIndustryText] = useState('');

  useEffect(() => {
    if (isCustomIndustry) {
      setCustomIndustryText(localFilters.industry || '');
    } else {
      setCustomIndustryText('');
    }
  }, [localFilters.industry, isCustomIndustry]);

  const hasActiveFilters = !!(
    filters.job_type ||
    filters.experience ||
    filters.work_mode ||
    filters.salary_range ||
    filters.date_posted ||
    filters.industry
  );

  const renderAccordionSection = (
    label: string,
    sectionKey: string,
    filterKey: keyof JobsFilter,
    options: string[]
  ) => {
    const isExpanded = expandedSection === sectionKey;
    const currentVal = localFilters[filterKey] || '';

    return (
      <div className="flex flex-col border-b border-indigo-50/50 pb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black select-none"
        >
          <span className="flex items-center gap-1.5">
            {label}
            {!!currentVal && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </span>
          <Icon
            icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className="w-4 h-4 text-gray-500"
          />
        </button>
        {isExpanded && (
          <div className="flex flex-col pl-2 gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map(opt => {
              const isSelected = currentVal === opt;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const nextVal = isSelected ? '' : opt;
                    setLocalFilters(prev => ({ ...prev, [filterKey]: nextVal }));
                    onFilterChange(filterKey, nextVal);
                  }}
                  className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                    isSelected
                      ? 'text-[#6366F1] font-medium'
                      : 'text-gray-500 hover:text-black font-normal'
                  }`}
                >
                  {opt === '' ? 'All' : opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="self-stretch flex justify-between items-center gap-4" ref={containerRef}>
      
      {/* Quick Filters */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => {
            const nextVal = filters.job_type === 'Full time' ? '' : 'Full time';
            setLocalFilters(prev => ({ ...prev, job_type: nextVal }));
            onFilterChange('job_type', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            filters.job_type === 'Full time'
              ? 'border-indigo-100 bg-indigo-50 text-indigo-500'
              : 'border-transparent text-gray-700 hover:bg-gray-50'
          }`}
        >
          Full time
        </button>

        <button 
          onClick={() => {
            const nextVal = filters.work_mode === 'Remote' ? '' : 'Remote';
            setLocalFilters(prev => ({ ...prev, work_mode: nextVal }));
            onFilterChange('work_mode', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            filters.work_mode === 'Remote'
              ? 'border-indigo-100 bg-indigo-50 text-indigo-500'
              : 'border-transparent text-gray-700 hover:bg-gray-50'
          }`}
        >
          Remote
        </button>

        <button 
          onClick={() => {
            const nextVal = filters.experience === 'Fresher' ? '' : 'Fresher';
            setLocalFilters(prev => ({ ...prev, experience: nextVal }));
            onFilterChange('experience', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            filters.experience === 'Fresher'
              ? 'border-indigo-100 bg-indigo-50 text-indigo-500'
              : 'border-transparent text-gray-700 hover:bg-gray-50'
          }`}
        >
          Fresher
        </button>
      </div>

      <div className="relative">
        {/* Main Filters Button */}
        <button
          onClick={togglePopup}
          className={`p-2 flex justify-center items-center rounded-full transition-all active:scale-95 hover:bg-gray-100`}
        >
          <Icon icon="iconoir:filter-list" className="w-6 h-6 text-black" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-0 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          )}
        </button>

        {/* Pop up Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-[280px] bg-white rounded-[24px] border border-indigo-50 shadow-[0px_8px_30px_rgba(0,0,0,0.06)] p-4 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Top Row: Title and Clear */}
            <div className="flex justify-between items-center w-full pb-3 border-b border-indigo-50/50">
              <span className="font-['Poppins'] font-semibold text-sm text-black">
                Filters
              </span>
              <button
                onClick={handleClear}
                className="font-['Poppins'] font-medium text-sm text-[#FF5B5B] hover:text-rose-600 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Scrollable Sections Container */}
            <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
              {renderAccordionSection('Job type', 'job_type', 'job_type', jobTypeOptions)}
              {renderAccordionSection('Experience level', 'experience', 'experience', experienceOptions)}
              {renderAccordionSection('Work mode', 'work_mode', 'work_mode', workModeOptions)}
              {renderAccordionSection('Salary range', 'salary_range', 'salary_range', salaryOptions)}
              {renderAccordionSection('Date posted', 'date_posted', 'date_posted', datePostedOptions)}

              {/* Accordion: Industry */}
              <div className="flex flex-col border-b border-indigo-50/50 pb-2">
                <button
                  onClick={() => toggleSection('industry')}
                  className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black select-none"
                >
                  <span className="flex items-center gap-1.5">
                    Industry
                    {!!localFilters.industry && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </span>
                  <Icon
                    icon={expandedSection === 'industry' ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                    className="w-4 h-4 text-gray-500"
                  />
                </button>
                {expandedSection === 'industry' && (
                  <div className="flex flex-col pl-2 gap-1 max-h-48 overflow-y-auto pr-1 pr-1 scrollbar-hide animate-in fade-in slide-in-from-top-1 duration-150">
                    {['', ...standardIndustries].map(opt => {
                      const isSelected = localFilters.industry === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            const nextVal = isSelected ? '' : opt;
                            setLocalFilters(prev => ({ ...prev, industry: nextVal }));
                            onFilterChange('industry', nextVal);
                          }}
                          className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                            isSelected
                              ? 'text-[#6366F1] font-medium'
                              : 'text-gray-500 hover:text-black font-normal'
                          }`}
                        >
                          {opt === '' ? 'All' : opt}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        const isOtherSelected = localFilters.industry === 'Other' || isCustomIndustry;
                        const nextVal = isOtherSelected ? '' : 'Other';
                        setLocalFilters(prev => ({ ...prev, industry: nextVal }));
                        if (!nextVal) {
                          onFilterChange('industry', '');
                        }
                      }}
                      className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                        localFilters.industry === 'Other' || isCustomIndustry
                          ? 'text-[#6366F1] font-medium'
                          : 'text-gray-500 hover:text-black font-normal'
                      }`}
                    >
                      Other
                    </button>
                    {(localFilters.industry === 'Other' || isCustomIndustry) && (
                      <div className="w-full pl-1 pr-2 pb-2">
                        <input
                          type="text"
                          value={customIndustryText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomIndustryText(val);
                            setLocalFilters(prev => ({ ...prev, industry: val || 'Other' }));
                          }}
                          onBlur={() => {
                            onFilterChange('industry', customIndustryText || '');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onFilterChange('industry', customIndustryText || '');
                            }
                          }}
                          placeholder="Art.."
                          autoFocus
                          className="w-full bg-transparent border-b border-black text-[13px] font-['Poppins'] font-normal text-black py-0.5 outline-none placeholder:text-gray-400 mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
