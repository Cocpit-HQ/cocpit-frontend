import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface StepRoleInputProps {
  onBack: () => void;
  title: string;
  setTitle: (val: string) => void;
  onContinue: () => void;
  isDrafting?: boolean;
}

export const StepRoleInput: React.FC<StepRoleInputProps> = ({
  onBack,
  title,
  setTitle,
  onContinue,
  isDrafting = false,
}) => {
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!title.trim() || title.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsFetching(true);
      try {
        const response = await api.get(`/jobs/roles?q=${encodeURIComponent(title)}`);
        // response.data is [{ role_name: "..." }, ...]
        setSuggestions(response.data.map((r: any) => r.role_name));
      } catch (error) {
        console.error("Error fetching job roles:", error);
      } finally {
        setIsFetching(false);
      }
    };

    const debounceTimer = setTimeout(fetchRoles, 300);
    return () => clearTimeout(debounceTimer);
  }, [title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      setShowSuggestions(false);
      onContinue();
    }
  };

  const handleSelectRole = (role: string) => {
    setTitle(role);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          disabled={isDrafting}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          <Icon icon="lucide:arrow-left" className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-black text-xl font-bold font-['Poppins'] leading-tight">Create job</h2>
          <span className="text-gray-400 text-xs font-normal font-['Poppins']">
            Tell us the role, AI will draft the rest
          </span>
        </div>
      </div>

      {/* Questionnaire Form Section */}
      <div className="w-full max-w-md mx-auto py-12 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center text-center gap-1.5">
          <span className="text-gray-400 text-xs font-semibold font-['Poppins'] tracking-wide">
            Hey, Cocpit
          </span>
          <h3 className="text-black text-xl md:text-2xl font-bold font-['Poppins'] leading-tight">
            What role are you hiring for?
          </h3>
          <p className="text-gray-450 text-xs font-normal font-['Poppins'] max-w-[280px] leading-relaxed text-gray-500">
            Start by defining the position to help us find the perfect match.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Job Role Input field */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-gray-550 text-xs font-semibold font-['Poppins'] text-gray-500">
              Job Role
            </label>
            <div className="relative w-full">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (title.trim().length >= 2) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding so clicks on dropdown can register
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="e.g. UI/UX Designer"
                disabled={isDrafting}
                className={`w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-black text-sm font-semibold font-['Poppins'] focus:outline-none transition-colors shadow-sm disabled:bg-slate-50 disabled:text-gray-400 ${
                  isCompanyMode ? 'focus:border-blue-400' : 'focus:border-indigo-400'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                {isFetching ? (
                   <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                     isCompanyMode ? 'border-blue-200 border-t-[#1A73E8]' : 'border-indigo-200 border-t-[#6366F1]'
                   }`} />
                ) : (
                   <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((role, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                         // use onMouseDown instead of onClick to prevent onBlur from firing first
                         e.preventDefault();
                         handleSelectRole(role);
                      }}
                      className={`px-4 py-2 cursor-pointer text-sm font-['Poppins'] text-gray-700 font-medium transition-colors ${
                        isCompanyMode ? 'hover:bg-blue-50' : 'hover:bg-indigo-50'
                      }`}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Banner Tip Box */}
          <div className={`w-full px-4 py-3 border rounded-2xl flex items-center justify-center ${
            isCompanyMode ? 'bg-blue-50/50 border-blue-50/100' : 'bg-indigo-50/50 border-indigo-50/100'
          }`}>
            <p className={`text-[10px] md:text-[11px] font-semibold font-['Poppins'] text-center leading-relaxed ${
              isCompanyMode ? 'text-[#1A73E8]' : 'text-[#6366F1]'
            }`}>
              Choosing a specific role helps our AI accurately screen candidates for technical skills.
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full flex justify-center mt-2">
            <button
              type="submit"
              disabled={!title.trim() || isDrafting}
              className={`px-12 py-3 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[24px] text-sm font-bold font-['Poppins'] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#6366F1]/90'
              }`}
            >
              {isDrafting ? (
                <>
                  <style>{`
                    @keyframes magic-spin {
                      0% { transform: rotate(0deg); opacity: 1; }
                      15% { transform: rotate(45deg); opacity: 0.3; }
                      40% { transform: rotate(540deg); opacity: 1; }
                      65% { transform: rotate(1080deg); opacity: 0.3; }
                      85% { transform: rotate(1080deg); opacity: 1; }
                      100% { transform: rotate(1080deg); opacity: 1; }
                    }
                    .animate-magic-spin {
                      animation: magic-spin 2.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }
                  `}</style>
                  <img
                    src="/assets/AI 2.svg"
                    alt="AI Generating"
                    className="w-5 h-5 animate-magic-spin"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepRoleInput;
