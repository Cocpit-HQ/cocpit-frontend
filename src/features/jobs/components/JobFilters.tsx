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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [localFilters, setLocalFilters] = useState<JobsFilter>({
    date_posted: filters.date_posted || '',
    industry: filters.industry || '',
    location_type: filters.location_type || ''
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local filters when the pop up opens or prop filters change
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        date_posted: filters.date_posted || '',
        industry: filters.industry || '',
        location_type: filters.location_type || ''
      });
      // Auto expand active filter section
      if (filters.date_posted) {
        setExpandedSection('date_posted');
      } else if (filters.industry) {
        setExpandedSection('industry');
      } else if (filters.location_type) {
        setExpandedSection('location');
      } else {
        setExpandedSection(null);
      }
    }
  }, [isOpen, filters]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => (prev === name ? null : name));
    setIsOpen(false);
  };

  const togglePopup = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        setActiveDropdown(null);
      }
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleApply = () => {
    onFilterChange('date_posted', localFilters.date_posted || '');
    onFilterChange('industry', localFilters.industry || '');
    onFilterChange('location_type', localFilters.location_type || '');
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({
      date_posted: '',
      industry: '',
      location_type: ''
    });
    // Clear all filters
    onClearFilters();
    setIsOpen(false);
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
    const isDropdownOpen = activeDropdown === label;
    const isSelected = !!currentVal;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(label)}
          className={`h-10 px-4 py-2 rounded-3xl flex justify-center items-center gap-2 transition-all active:scale-95 ${
            isSelected
              ? 'bg-indigo-50 outline outline-1 outline-offset-[-1px] outline-indigo-500 text-indigo-500 font-semibold'
              : 'bg-white text-black font-normal hover:bg-slate-50'
          }`}
        >
          <span className="text-sm font-['Poppins'] leading-5">
            {isSelected ? `${label}: ${currentVal}` : label}
          </span>
          <Icon
            icon={isDropdownOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className={`w-4 h-4 transition-transform ${
              isSelected ? 'text-indigo-500' : 'text-gray-500'
            }`}
          />
        </button>

        {isDropdownOpen && (
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

  const hasActiveFilters = Object.values(filters).some(val => !!val);
  const hasActivePopupFilters = !!(filters.date_posted || filters.industry || filters.location_type);

  return (
    <div className="self-stretch flex justify-between items-center gap-4" ref={containerRef}>
      {/* Horizontal pill filters */}
      <div className="flex flex-wrap justify-start items-center gap-3">
        {renderDropdown('Job type', 'job_type', jobTypeOptions, filters.job_type || '')}
        {renderDropdown('Experience level', 'experience', experienceOptions, filters.experience || '')}
        {renderDropdown('Work mode', 'work_mode', workModeOptions, filters.work_mode || '')}
        {renderDropdown('Salary range', 'salary_range', salaryOptions, filters.salary_range || '')}
      </div>

      {/* Sort/Filter icon display (Figma) */}
      <div className="relative">
        <div
          onClick={togglePopup}
          className="w-14 h-10 bg-white hover:bg-slate-50 rounded-[24px] flex justify-center items-center relative flex-shrink-0 cursor-pointer transition-all active:scale-95"
        >
          <Icon icon="iconoir:filter-list" className="absolute left-[16px] top-[8px] w-6 h-6 text-black" />
          {hasActivePopupFilters && (
            <div className="w-2.5 h-2.5 absolute top-[6px] right-[6px] bg-indigo-500 rounded-full ring-2 ring-white" />
          )}
        </div>

        {/* Pop up dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-[260px] bg-white rounded-[24px] border border-indigo-50 shadow-[0px_8px_30px_rgba(0,0,0,0.06)] p-4 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Top Row: Apply and Clear */}
            <div className="flex justify-between items-center w-full pb-3 border-b border-indigo-50/50">
              <button
                onClick={handleApply}
                className="font-['Poppins'] font-semibold text-sm text-[#6366F1] hover:text-indigo-600 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={handleClear}
                className="font-['Poppins'] font-medium text-sm text-[#FF5B5B] hover:text-rose-600 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Accordion 1: Date posted */}
            <div className="flex flex-col border-b border-indigo-50/50 pb-2">
              <button
                onClick={() => toggleSection('date_posted')}
                className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black select-none"
              >
                <span>Date posted</span>
                <Icon
                  icon={expandedSection === 'date_posted' ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                  className="w-4 h-4 text-gray-500"
                />
              </button>
              {expandedSection === 'date_posted' && (
                <div className="flex flex-col pl-2 gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {['Today', 'Last 7 days', 'Last 30 days'].map(opt => {
                    const isSelected = localFilters.date_posted === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setLocalFilters(prev => ({ ...prev, date_posted: isSelected ? '' : opt }))}
                        className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                          isSelected
                            ? 'text-[#6366F1] font-medium'
                            : 'text-gray-500 hover:text-black font-normal'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 2: Industry */}
            <div className="flex flex-col border-b border-indigo-50/50 pb-2">
              <button
                onClick={() => toggleSection('industry')}
                className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black select-none"
              >
                <span>Industry</span>
                <Icon
                  icon={expandedSection === 'industry' ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                  className="w-4 h-4 text-gray-500"
                />
              </button>
              {expandedSection === 'industry' && (
                <div className="flex flex-col pl-2 gap-1 max-h-48 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {standardIndustries.map(opt => {
                    const isSelected = localFilters.industry === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setLocalFilters(prev => ({ ...prev, industry: isSelected ? '' : opt }))}
                        className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                          isSelected
                            ? 'text-[#6366F1] font-medium'
                            : 'text-gray-500 hover:text-black font-normal'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setLocalFilters(prev => ({ ...prev, industry: localFilters.industry === 'Other' || isCustomIndustry ? '' : 'Other' }));
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
                        placeholder="Art.."
                        autoFocus
                        className="w-full bg-transparent border-b border-black text-[13px] font-['Poppins'] font-normal text-black py-0.5 outline-none placeholder:text-gray-400 mt-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 3: Location */}
            <div className="flex flex-col pb-1">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black select-none"
              >
                <span>Location</span>
                <Icon
                  icon={expandedSection === 'location' ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                  className="w-4 h-4 text-gray-500"
                />
              </button>
              {expandedSection === 'location' && (
                <div className="flex flex-col pl-2 gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {['City', 'Country'].map(opt => {
                    const isSelected = localFilters.location_type === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setLocalFilters(prev => ({ ...prev, location_type: isSelected ? '' : opt }))}
                        className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                          isSelected
                            ? 'text-[#6366F1] font-medium'
                            : 'text-gray-500 hover:text-black font-normal'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
