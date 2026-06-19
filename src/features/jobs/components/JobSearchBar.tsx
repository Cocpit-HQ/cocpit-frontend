import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useDebounce } from '@/hooks/use-debounce';

interface JobSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const JobSearchBar: React.FC<JobSearchBarProps> = ({ value, onChange, placeholder = 'Search jobs, companies, or keywords...' }) => {
  const [localSearch, setLocalSearch] = useState(value);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    onChange(debouncedSearch);
  }, [debouncedSearch, onChange]);

  useEffect(() => {
    setLocalSearch(value);
  }, [value]);

  return (
    <div className="w-full relative flex items-center">
      <input
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white hover:bg-slate-50/50 focus:bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-100 focus:outline-indigo-500 text-black text-sm font-normal font-['Poppins'] leading-5 shadow-[0px_4px_12px_rgba(99,102,241,0.02)] focus:shadow-[0px_4px_20px_rgba(99,102,241,0.06)] transition-all duration-200"
      />
      <div className="absolute left-4 text-gray-400">
        <Icon icon="lucide:search" className="w-5 h-5" />
      </div>
      {localSearch && (
        <button
          onClick={() => setLocalSearch('')}
          className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
          aria-label="Clear search"
        >
          <Icon icon="lucide:x" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default JobSearchBar;
