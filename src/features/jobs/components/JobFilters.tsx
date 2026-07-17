import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobsFilter } from '../types/jobs.types';
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('job_type');
  const containerRef = useRef<HTMLDivElement>(null);

  const [localFilters, setLocalFilters] = useState<JobsFilter>({
    job_type: filters.job_type || '',
    experience: filters.experience || '',
    work_mode: filters.work_mode || '',
    salary_range: filters.salary_range || '',
    date_posted: filters.date_posted || '',
    industry: filters.industry || ''
  });

  // Close dropdowns when clicking outside (Desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // The mobile Drawer handles its own click-away logic via Vaul.
      // Since it renders in a portal, clicking inside it would otherwise trigger this outside click handler.
      if (window.innerWidth < 768) return;
      
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset expanded section and sync local filters when opening the dropdown
  useEffect(() => {
    if (isOpen) {
      setExpandedSection('job_type');
      setLocalFilters({
        job_type: filters.job_type || '',
        experience: filters.experience || '',
        work_mode: filters.work_mode || '',
        salary_range: filters.salary_range || '',
        date_posted: filters.date_posted || '',
        industry: filters.industry || ''
      });
    }
  }, [isOpen, filters]);

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
      <div className="flex flex-col border-b border-indigo-50/50 dark:border-[#2E3445]/50 pb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black dark:text-[#F9FAFB] select-none"
        >
          <span className="flex items-center gap-1.5">
            {label}
            {!!currentVal && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-[#818CF8]" />
            )}
          </span>
          <Icon
            icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className="w-4 h-4 text-gray-500 dark:text-[#9CA3AF]"
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
                      ? 'text-[#6366F1] dark:text-[#818CF8] font-medium'
                      : 'text-gray-500 dark:text-[#9CA3AF] hover:text-black dark:hover:text-[#F9FAFB] font-normal'
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

  const filterContent = (
    <>
      {renderAccordionSection('Job type', 'job_type', 'job_type', jobTypeOptions, true)}
      {renderAccordionSection('Experience level', 'experience', 'experience', experienceOptions, true)}
      {renderAccordionSection('Work mode', 'work_mode', 'work_mode', workModeOptions, true)}
      {renderAccordionSection('Salary range', 'salary_range', 'salary_range', salaryOptions, true)}

      {/* Accordion: Industry */}
      <div className="flex flex-col border-b border-indigo-50/50 dark:border-[#2E3445]/50 pb-2">
        <button
          onClick={() => toggleSection('industry')}
          className="w-full flex justify-between items-center py-2 text-sm font-semibold font-['Poppins'] text-black dark:text-[#F9FAFB] select-none"
        >
          <span className="flex items-center gap-1.5">
            Industry
            {!!localFilters.industry && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-[#818CF8]" />
            )}
          </span>
          <Icon
            icon={expandedSection === 'industry' ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className="w-4 h-4 text-gray-500 dark:text-[#9CA3AF]"
          />
        </button>
        {expandedSection === 'industry' && (
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-top-1 duration-150 relative">
            <div className="sticky top-0 bg-white dark:bg-[#0B0F19] z-10 pb-1">
              <div className="border-b border-gray-200 dark:border-[#2E3445] px-1 pb-1">
                <input
                  type="text"
                  placeholder="Search"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  className="w-full text-[13px] font-['Poppins'] font-normal text-black dark:text-[#F9FAFB] bg-transparent py-1 outline-none placeholder:text-gray-500 dark:placeholder:text-[#9CA3AF]"
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
                            ? 'text-[#6366F1] dark:text-[#818CF8] font-medium'
                            : 'text-gray-500 dark:text-[#9CA3AF] hover:text-black dark:hover:text-[#F9FAFB] font-normal'
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
                              ? 'text-[#6366F1] dark:text-[#818CF8] font-medium'
                              : 'text-gray-500 dark:text-[#9CA3AF] hover:text-black dark:hover:text-[#F9FAFB] font-normal'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}

                    {sorted.length === 0 && searchLower && (
                      <div className="py-2 text-[12px] text-gray-400 dark:text-[#9CA3AF] font-['Poppins']">No industries found</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      
      {renderAccordionSection('Date posted', 'date_posted', 'date_posted', datePostedOptions, false)}
    </>
  );

  const renderMobileOptions = (filterKey: keyof JobsFilter, options: string[], isMultiSelect: boolean = true) => {
    const currentVal = localFilters[filterKey] || '';
    const selectedValues = currentVal 
      ? (Array.isArray(currentVal) ? currentVal : currentVal.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    return (
      <div className="flex flex-col gap-1 w-full">
        {options.filter(o => o !== '').map(opt => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => {
                let nextVal = '';
                if (!isMultiSelect) {
                  nextVal = isSelected ? '' : opt;
                } else {
                  if (isSelected) {
                    nextVal = selectedValues.filter(v => v !== opt).join(',');
                  } else {
                    nextVal = [...selectedValues, opt].join(',');
                  }
                }
                setLocalFilters(prev => ({ ...prev, [filterKey]: nextVal }));
              }}
              className="flex justify-between items-center py-3 text-sm transition-colors font-['Poppins'] w-full"
            >
              <span className={isSelected ? "text-[#6366F1] dark:text-[#818CF8]" : "text-black dark:text-[#F9FAFB]"}>{opt}</span>
              {isSelected && <Icon icon="lucide:check" className="w-5 h-5 text-[#6366F1] dark:text-[#818CF8]" />}
            </button>
          );
        })}
      </div>
    );
  };


  return (
    <div className="w-full flex flex-row-reverse md:flex-row justify-between items-center gap-4" ref={containerRef}>
      
      {/* Quick Filters */}
      <div className="flex-1 flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar pb-1 flex-nowrap">
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
              ? 'border-indigo-100 dark:border-[#818CF8]/30 bg-indigo-50 dark:bg-[#818CF8]/10 text-indigo-500 dark:text-[#818CF8]'
              : 'border-transparent text-gray-700 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2E3445]'
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
              ? 'border-indigo-100 dark:border-[#818CF8]/30 bg-indigo-50 dark:bg-[#818CF8]/10 text-indigo-500 dark:text-[#818CF8]'
              : 'border-transparent text-gray-700 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2E3445]'
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
          className={`shrink-0 px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
            (filters.experience || '').split(',').map(s => s.trim()).includes('Fresher')
              ? 'border-indigo-100 dark:border-[#818CF8]/30 bg-indigo-50 dark:bg-[#818CF8]/10 text-indigo-500 dark:text-[#818CF8]'
              : 'border-transparent text-gray-700 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2E3445]'
          }`}
        >
          Fresher
        </button>
      </div>

      <div className="relative shrink-0">
        {/* Main Filters Button */}
        <button
          onClick={togglePopup}
          className={`p-2 flex justify-center items-center rounded-full transition-all active:scale-95 hover:bg-gray-100 dark:hover:bg-[#2E3445]`}
        >
          <Icon icon="iconoir:filter-list" className="w-6 h-6 text-black dark:text-[#F9FAFB]" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-0 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          )}
        </button>

        {/* Desktop Pop up Dropdown */}
        {isOpen && (
          <div className="hidden md:flex flex-col absolute right-0 top-12 w-[280px] bg-white dark:bg-[#0B0F19] rounded-[24px] border border-indigo-50 dark:border-[#2E3445] shadow-[0px_8px_30px_rgba(0,0,0,0.06)] p-4 z-50 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Top Row: Title and Clear */}
            <div className="flex justify-between items-center w-full pb-3 border-b border-indigo-50/50 dark:border-[#2E3445]/50">
              <span className="font-['Poppins'] font-semibold text-sm text-black dark:text-[#F9FAFB]">
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
              {filterContent}
            </div>
          </div>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <div className="md:hidden">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent className="h-[85vh] bg-white dark:bg-[#0B0F19] border-t border-gray-200 dark:border-[#2E3445] rounded-t-[24px] z-[80] flex flex-col overflow-hidden">
              <DrawerTitle className="sr-only">Filters</DrawerTitle>
              {/* Top Row: Title and Clear */}
              <div className="flex justify-between items-center w-full px-5 py-4 border-b border-gray-200 dark:border-[#2E3445] flex-shrink-0">
                <span className="font-['Poppins'] font-semibold text-xl text-black dark:text-[#F9FAFB] flex items-center gap-2">
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-[#6366F1] dark:bg-[#818CF8] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {Object.values(localFilters).filter(v => v !== '').length}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleClear}
                  className="font-['Poppins'] font-medium text-sm text-[#FF5B5B] hover:text-rose-600 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Master-Detail Layout */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Categories */}
                <div className="w-[140px] border-r border-gray-200 dark:border-[#2E3445] overflow-y-auto pt-2">
                   {[
                     { id: 'job_type', label: 'Job Type' },
                     { id: 'experience', label: 'Experience level' },
                     { id: 'work_mode', label: 'Work mode' },
                     { id: 'salary_range', label: 'Salary range' },
                     { id: 'industry', label: 'Industry' },
                     { id: 'date_posted', label: 'Date posted' },
                   ].map(cat => (
                     <button
                       key={cat.id}
                       onClick={() => setActiveMobileTab(cat.id)}
                       className={`w-full text-left py-4 px-4 text-[13px] font-['Poppins'] transition-colors ${
                         activeMobileTab === cat.id 
                           ? 'border-l-2 border-[#6366F1] dark:border-[#818CF8] text-[#6366F1] dark:text-[#818CF8] bg-[#6366F1]/5 dark:bg-[#818CF8]/10 font-medium' 
                           : 'text-black dark:text-[#F9FAFB] border-l-2 border-transparent'
                       }`}
                     >
                       {cat.label}
                     </button>
                   ))}
                </div>

                {/* Right Content - Options */}
                <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col relative">
                   {activeMobileTab === 'job_type' && renderMobileOptions('job_type', jobTypeOptions, true)}
                   {activeMobileTab === 'experience' && renderMobileOptions('experience', experienceOptions, true)}
                   {activeMobileTab === 'work_mode' && renderMobileOptions('work_mode', workModeOptions, true)}
                   {activeMobileTab === 'salary_range' && renderMobileOptions('salary_range', salaryOptions, true)}
                   {activeMobileTab === 'date_posted' && renderMobileOptions('date_posted', datePostedOptions, false)}
                   
                   {activeMobileTab === 'industry' && (
                     <div className="flex flex-col w-full h-full">
                        <div className="sticky top-0 bg-white dark:bg-[#0B0F19] z-10 pb-2 pt-2">
                          <input
                            type="text"
                            placeholder="Search industry"
                            value={industrySearch}
                            onChange={(e) => setIndustrySearch(e.target.value)}
                            className="w-full text-[13px] font-['Poppins'] font-normal text-black dark:text-[#F9FAFB] bg-gray-50 dark:bg-[#1C2340] px-3 py-2 rounded-lg outline-none placeholder:text-gray-500 dark:placeholder:text-[#9CA3AF]"
                          />
                        </div>
                        <div className="flex flex-col gap-1 pb-4">
                          {(() => {
                            const searchLower = industrySearch.toLowerCase().trim();
                            const selectedValues = localFilters.industry ? localFilters.industry.split(',').map(s => s.trim()).filter(Boolean) : [];
                            let filtered = availableIndustries;
                            if (searchLower) {
                              filtered = availableIndustries.filter(i => i.toLowerCase().includes(searchLower));
                            }
                            const sorted = [...filtered].sort((a, b) => {
                              const aSel = selectedValues.includes(a);
                              const bSel = selectedValues.includes(b);
                              if (aSel && !bSel) return -1;
                              if (!aSel && bSel) return 1;
                              return a.localeCompare(b);
                            });
                            
                            return sorted.map(opt => {
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
                                  }}
                                  className="flex justify-between items-center py-3 text-sm transition-colors font-['Poppins'] w-full"
                                >
                                  <span className={isSelected ? "text-[#6366F1] dark:text-[#818CF8]" : "text-black dark:text-[#F9FAFB]"}>{opt}</span>
                                  {isSelected && <Icon icon="lucide:check" className="w-5 h-5 text-[#6366F1] dark:text-[#818CF8]" />}
                                </button>
                              );
                            });
                          })()}
                        </div>
                     </div>
                   )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="px-5 py-4 bg-white dark:bg-[#0B0F19] border-t border-gray-200 dark:border-[#2E3445] flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    Object.entries(localFilters).forEach(([k, v]) => {
                      if (filters[k as keyof JobsFilter] !== v) {
                        onFilterChange(k as keyof JobsFilter, v as string);
                      }
                    });
                    setIsOpen(false);
                  }}
                  className="w-[66%] md:w-auto h-11 rounded-[24px] bg-[#6366F1] dark:bg-[#818CF8] text-white font-semibold font-['Poppins'] text-sm hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
