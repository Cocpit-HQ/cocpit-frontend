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

  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [industrySearch, setIndustrySearch] = useState('');

  useEffect(() => {
    import('../services/jobs.service').then(({ getIndustries }) => {
      getIndustries().then(data => setAvailableIndustries(data.map(d => d.industry_name)));
    }).catch(err => console.error('Failed to load industries', err));
  }, []);

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
    options: string[],
    isMultiSelect: boolean = true
  ) => {
    const isExpanded = expandedSection === sectionKey;
    const currentVal = localFilters[filterKey] || '';
    const selectedValues = currentVal 
      ? (Array.isArray(currentVal) ? currentVal : currentVal.split(',').map(s => s.trim()))
      : [];

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
              const isSelected = opt === '' ? selectedValues.length === 0 : selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    let nextVal = '';
                    if (!isMultiSelect) {
                      nextVal = isSelected ? '' : opt;
                    } else {
                      if (opt === '') {
                        nextVal = '';
                      } else {
                        if (isSelected) {
                          nextVal = selectedValues.filter(v => v !== opt).join(',');
                        } else {
                          nextVal = [...selectedValues, opt].join(',');
                        }
                      }
                    }
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
            const currentVals = (filters.job_type || '').split(',').map(s => s.trim()).filter(Boolean);
            const isSelected = currentVals.includes('Full time');
            const nextVal = isSelected ? currentVals.filter(v => v !== 'Full time').join(',') : [...currentVals, 'Full time'].join(',');
            setLocalFilters(prev => ({ ...prev, job_type: nextVal }));
            onFilterChange('job_type', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            (filters.job_type || '').split(',').map(s => s.trim()).includes('Full time')
              ? 'border-indigo-100 bg-indigo-50 text-indigo-500'
              : 'border-transparent text-gray-700 hover:bg-gray-50'
          }`}
        >
          Full time
        </button>

        <button 
          onClick={() => {
            const currentVals = (filters.work_mode || '').split(',').map(s => s.trim()).filter(Boolean);
            const isSelected = currentVals.includes('Remote');
            const nextVal = isSelected ? currentVals.filter(v => v !== 'Remote').join(',') : [...currentVals, 'Remote'].join(',');
            setLocalFilters(prev => ({ ...prev, work_mode: nextVal }));
            onFilterChange('work_mode', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            (filters.work_mode || '').split(',').map(s => s.trim()).includes('Remote')
              ? 'border-indigo-100 bg-indigo-50 text-indigo-500'
              : 'border-transparent text-gray-700 hover:bg-gray-50'
          }`}
        >
          Remote
        </button>

        <button 
          onClick={() => {
            const currentVals = (filters.experience || '').split(',').map(s => s.trim()).filter(Boolean);
            const isSelected = currentVals.includes('Fresher');
            const nextVal = isSelected ? currentVals.filter(v => v !== 'Fresher').join(',') : [...currentVals, 'Fresher'].join(',');
            setLocalFilters(prev => ({ ...prev, experience: nextVal }));
            onFilterChange('experience', nextVal);
          }}
          className={`px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            (filters.experience || '').split(',').map(s => s.trim()).includes('Fresher')
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
              {renderAccordionSection('Job type', 'job_type', 'job_type', jobTypeOptions, true)}
              {renderAccordionSection('Experience level', 'experience', 'experience', experienceOptions, true)}
              {renderAccordionSection('Work mode', 'work_mode', 'work_mode', workModeOptions, true)}
              {renderAccordionSection('Salary range', 'salary_range', 'salary_range', salaryOptions, true)}

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
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-top-1 duration-150 relative">
                    <div className="sticky top-0 bg-white z-10 pb-1">
                      <div className="border-b border-gray-200 px-1 pb-1">
                        <input
                          type="text"
                          placeholder="Search"
                          value={industrySearch}
                          onChange={(e) => setIndustrySearch(e.target.value)}
                          className="w-full text-[13px] font-['Poppins'] font-normal text-black py-1 outline-none placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col pl-2 pr-1">
                      {(() => {
                        const searchLower = industrySearch.toLowerCase().trim();
                        const selectedValues = localFilters.industry ? localFilters.industry.split(',').map(s => s.trim()).filter(Boolean) : [];
                        
                        let filtered = availableIndustries;
                        if (searchLower) {
                          filtered = availableIndustries.filter(i => i.toLowerCase().includes(searchLower));
                        }
                        
                        // Sort: selected at the top, then alphabetically
                        const sorted = [...filtered].sort((a, b) => {
                          const aSel = selectedValues.includes(a);
                          const bSel = selectedValues.includes(b);
                          if (aSel && !bSel) return -1;
                          if (!aSel && bSel) return 1;
                          return a.localeCompare(b);
                        });

                        return (
                          <>
                            {/* "All" Option */}
                            {!searchLower && (
                              <button
                                onClick={() => {
                                  setLocalFilters(prev => ({ ...prev, industry: '' }));
                                  onFilterChange('industry', '');
                                }}
                                className={`w-full py-1.5 text-left text-[13px] font-['Poppins'] transition-colors ${
                                  selectedValues.length === 0
                                    ? 'text-[#6366F1] font-medium'
                                    : 'text-gray-500 hover:text-black font-normal'
                                }`}
                              >
                                All
                              </button>
                            )}

                            {/* Mapped Options */}
                            {sorted.map(opt => {
                              const isSelected = selectedValues.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    let nextVal = '';
                                    if (isSelected) {
                                      nextVal = selectedValues.filter(v => v !== opt).join(',');
                                    } else {
                                      nextVal = [...selectedValues, opt].join(',');
                                    }
                                    setLocalFilters(prev => ({ ...prev, industry: nextVal }));
                                    onFilterChange('industry', nextVal);
                                  }}
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

                            {sorted.length === 0 && searchLower && (
                              <div className="py-2 text-[12px] text-gray-400 font-['Poppins']">No industries found</div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {renderAccordionSection('Date posted', 'date_posted', 'date_posted', datePostedOptions, false)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
