import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { useMyProfile } from '@/hooks/use-my-profile';
import api from '@/lib/axios';
import { generateJobDescription } from '../../services/jobs.service';
import { CURRENCIES } from '../../utils/currency.utils';
import { toast } from 'sonner';

interface StepJobDetailsProps {
  jobId?: string | null;
  initialRole: string;
  initialDetails?: Partial<JobListing>;
  onBack: () => void;
  onSaveDraft: (details: Partial<JobListing>) => Promise<void>;
  onContinue: (details: Partial<JobListing>) => Promise<void>;
}

export const StepJobDetails: React.FC<StepJobDetailsProps> = ({
  jobId,
  initialRole,
  initialDetails,
  onBack,
  onSaveDraft,
  onContinue,
}) => {
  const { data: profileData } = useMyProfile();
  const userProfile = profileData?.user;
  const hasPopulated = useRef(false);
  const hasManuallyRegenerated = useRef(false); // Stops bg polling once user explicitly regenerates

  // Form fields
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialDetails?.company || userProfile?.name || '');
  const [location, setLocation] = useState(initialDetails?.location || userProfile?.location || '');
  const [description, setDescription] = useState(initialDetails?.description || '');

  // Normalization for dropdown values
  const normalizeExperience = (exp: string | undefined): string => {
    if (!exp) return 'Fresher';
    if (exp === '0 - 2 years') return 'Junior (1-3 yrs)';
    if (exp === '2 - 5 years') return 'Mid-level (3-5 yrs)';
    if (exp === '5+ years') return 'Senior (5+ yrs)';
    return exp;
  };
  const normalizeWorkType = (wt: string | undefined): string => {
    if (!wt) return 'Full time';
    if (wt === 'Full-time') return 'Full time';
    return wt;
  };

  const [experience, setExperience] = useState(normalizeExperience(initialDetails?.experience));
  const [workType, setWorkType] = useState(normalizeWorkType(initialDetails?.work_type));
  const [workMode, setWorkMode] = useState(initialDetails?.work_mode || 'Hybrid');
  const [minSalary, setMinSalary] = useState(initialDetails?.salary_min ? String(initialDetails.salary_min) : '');
  const [maxSalary, setMaxSalary] = useState(initialDetails?.salary_max ? String(initialDetails.salary_max) : '');
  const [currency, setCurrency] = useState(initialDetails?.salary_currency || 'USD');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Safely populate defaults when the profile data resolves, if it wasn't cached instantly
  useEffect(() => {
    if (userProfile && !hasPopulated.current) {
      if (!company && !initialDetails?.company && userProfile.name) {
        setCompany(userProfile.name);
      }
      if (!location && !initialDetails?.location && userProfile.location) {
        setLocation(userProfile.location);
      }
      hasPopulated.current = true;
    }
  }, [userProfile, company, location, initialDetails]);

  // Fetch background AI generation if description is empty
  useEffect(() => {
    if (!jobId || description.trim() !== '') return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 6;

    const fetchJob = async () => {
      // Stop if user has already explicitly clicked "Regenerate with AI"
      if (hasManuallyRegenerated.current) return;

      try {
        setIsAiGenerating(true);
        const response = await api.get(`/jobs/${jobId}`);
        const jobData = response.data;

        if (isMounted && !hasManuallyRegenerated.current && jobData.description && jobData.description.trim() !== '') {
          setDescription(jobData.description);
          setIsAiGenerating(false);

          // Auto-fill other fields if provided by AI
          if (jobData.experience_min !== null && jobData.experience_max !== null) {
            const min = parseInt(jobData.experience_min, 10);
            if (isNaN(min) || min === 0) {
              setExperience('Fresher');
            } else if (min <= 2) {
              setExperience('Junior (1-3 yrs)');
            } else if (min <= 4) {
              setExperience('Mid-level (3-5 yrs)');
            } else {
              setExperience('Senior (5+ yrs)');
            }
          }
        } else if (isMounted && !hasManuallyRegenerated.current && retryCount < maxRetries) {
          // If description is still empty, retry after 1.5 seconds
          retryCount++;
          setTimeout(fetchJob, 1500);
        } else if (isMounted) {
          setIsAiGenerating(false);
        }
      } catch (error) {
        console.error("Failed to fetch generated job details", error);
        if (isMounted) setIsAiGenerating(false);
      }
    };

    fetchJob();

    return () => { isMounted = false; };
  }, [jobId]); // intentionally omitting description so it doesn't re-trigger on user type

  // AI loading and options state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom Dropdown Open States
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);
  const [isWorkModeOpen, setIsWorkModeOpen] = useState(false);
  const [isMinCurrencyOpen, setIsMinCurrencyOpen] = useState(false);
  const [isMaxCurrencyOpen, setIsMaxCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Dropdown Refs
  const experienceRef = useRef<HTMLDivElement>(null);
  const workTypeRef = useRef<HTMLDivElement>(null);
  const workModeRef = useRef<HTMLDivElement>(null);
  const minCurrencyRef = useRef<HTMLDivElement>(null);
  const maxCurrencyRef = useRef<HTMLDivElement>(null);

  // We no longer auto-prefill the description.
  // The user can type their own, or click "Regenerate with AI" to trigger it.

  // Auto-resize description textarea to prevent internal scrollbar
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description, isAiGenerating]);

  // Click outside to close custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (experienceRef.current && !experienceRef.current.contains(event.target as Node)) {
        setIsExperienceOpen(false);
      }
      if (workTypeRef.current && !workTypeRef.current.contains(event.target as Node)) {
        setIsWorkTypeOpen(false);
      }
      if (workModeRef.current && !workModeRef.current.contains(event.target as Node)) {
        setIsWorkModeOpen(false);
      }
      if (minCurrencyRef.current && !minCurrencyRef.current.contains(event.target as Node)) {
        setIsMinCurrencyOpen(false);
      }
      if (maxCurrencyRef.current && !maxCurrencyRef.current.contains(event.target as Node)) {
        setIsMaxCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRegenerateAi = async () => {
    if (!jobId) {
      console.warn("No jobId available to regenerate AI description.");
      return;
    }

    // Stop the background polling loop permanently — user is now in manual control
    hasManuallyRegenerated.current = true;

    setIsAiGenerating(true);
    try {
      // Pass the current `role` from the input to ensure the AI uses the new role text.
      console.log('[Regenerate] Sending role to API:', role); // Debug: verify correct role is sent
      const response = await generateJobDescription(jobId, role);
      console.log('[Regenerate] API response:', response); // Debug: verify response structure

      const jobData = response.job || response;
      const aiData = jobData.ai_content || jobData; // ai_content is present on fresh generate

      let newDescription = "";

      // If the backend returns the already-formatted flat markdown description, use it directly.
      if (jobData.description && typeof jobData.description === 'string' && jobData.description.trim() !== '') {
        newDescription = jobData.description;
      } else {
        const aiData = jobData.ai_content || jobData; // Fallback in case raw AI fields are returned

        if (aiData.summary) {
          newDescription += `${aiData.summary}\n\n`;
        }

        // Description paragraph
        const descParagraph = aiData.description;
        if (descParagraph) {
          newDescription += `Description\n${descParagraph}\n\n`;
        }

        if (aiData.responsibilities && Array.isArray(aiData.responsibilities)) {
          newDescription += `Responsibilities\n${aiData.responsibilities.map((r: string) => `- ${r}`).join('\n')}\n\n`;
        }

        if (aiData.requirements && Array.isArray(aiData.requirements)) {
          newDescription += `Requirements\n${aiData.requirements.map((r: string) => `- ${r}`).join('\n')}\n\n`;
        }

        if (aiData.preferred_skills && Array.isArray(aiData.preferred_skills)) {
          newDescription += `Preferred Skills\n${aiData.preferred_skills.map((s: string) => `- ${s}`).join('\n')}\n\n`;
        }

        if (aiData.benefits && Array.isArray(aiData.benefits)) {
          newDescription += `Benefits\n${aiData.benefits.map((b: string) => `- ${b}`).join('\n')}\n\n`;
        }
      }

      newDescription = newDescription.trim();

      if (newDescription) {
        setDescription(newDescription);
      }
      
      // Update experience dropdown if AI provides a new range based on the new role
      if (jobData.experience_min != null && jobData.experience_max != null) {
        const min = parseInt(jobData.experience_min, 10);
        if (isNaN(min)) {
          setExperience('Junior (1-3 yrs)');
        } else if (min === 0) {
          setExperience('Fresher');
        } else if (min <= 2) {
          setExperience('Junior (1-3 yrs)');
        } else if (min <= 4) {
          setExperience('Mid-level (3-5 yrs)');
        } else {
          setExperience('Senior (5+ yrs)');
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to regenerate with AI:", error);
      let errMsg = "AI generation is temporarily unavailable. Please make sure the backend has a valid GEMINI_API_KEY configured in .env, or type the description manually.";
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      toast.error(errMsg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const buildDetailsObject = (): Partial<JobListing> => {
    return {
      id: initialDetails?.id,
      title: role,
      company,
      location,
      description,
      experience,
      work_type: workType,
      work_mode: workMode,
      salary_min: minSalary ? parseFloat(minSalary.replace(/,/g, '')) : undefined,
      salary_max: maxSalary ? parseFloat(maxSalary.replace(/,/g, '')) : undefined,
      salary_currency: currency,
    };
  };

  const handleSaveDraftClick = () => {
    onSaveDraft(buildDetailsObject());
  };

  const handleContinueClick = () => {
    setValidationError(null);
    if (role.trim().length < 5) {
      setValidationError("Job role/title must be at least 5 characters long");
      return;
    }
    if (description.trim().length < 100) {
      setValidationError("Job description must be at least 100 characters long");
      return;
    }
    onContinue(buildDetailsObject());
  };

  return (
    <div className="w-full max-w-[998px] mx-auto bg-white flex flex-col justify-start items-center gap-4 px-4 md:px-0 animate-in fade-in duration-300 pb-16">
      {/* Header Row */}
      <div className="self-stretch flex flex-row justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm flex-shrink-0"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6 text-left">Create job</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-left">Modify Job Details</div>
        </div>
      </div>

      {/* Form Fields Panel */}
      <div className="self-stretch p-0 md:p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4">
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch flex flex-col md:flex-row justify-center items-stretch md:items-start gap-4 md:gap-6">
          {/* Job Role */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Job Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Company Name */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Location */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Row 2: Job Description */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div className="self-stretch flex flex-row justify-between items-center gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left">Job Description</label>
            <button
              onClick={handleRegenerateAi}
              disabled={isAiGenerating}
              type="button"
              className="pb-px flex justify-start items-center gap-1.5 hover:opacity-85 text-indigo-500 transition-opacity active:scale-95"
            >
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
                alt="AI Icon"
                className={`w-5 h-5 ${isAiGenerating ? 'animate-magic-spin' : 'animate-pulse'}`}
              />
              <span className="text-indigo-500 text-base font-normal font-['Poppins'] leading-6">
                {isAiGenerating ? 'Generating...' : 'Regenerate with AI'}
              </span>
            </button>
          </div>

          <div className="self-stretch relative p-1 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden focus-within:outline-indigo-300 transition-colors shadow-sm">
            {isAiGenerating ? (
              <div className="w-full min-h-[250px] p-4 flex flex-col gap-5 bg-white select-none relative">
                {/* AI Loading Indicator Badge */}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-indigo-50/70 px-3 py-1.5 rounded-full border border-indigo-100">
                  <img
                    src="/assets/AI 2.svg"
                    alt="AI Icon"
                    className="w-4 h-4 animate-magic-spin"
                  />
                  <span className="text-[10px] font-bold text-indigo-600 font-['Poppins'] tracking-wider uppercase animate-pulse">
                    AI Generating
                  </span>
                </div>

                {/* Paragraph 1 Skeleton */}
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-slate-200/80 rounded-md w-1/4 animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-full animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-11/12 animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-5/6 animate-pulse" />
                </div>

                {/* Paragraph 2 Skeleton */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="h-4 bg-slate-200/80 rounded-md w-1/3 animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-full animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-4/5 animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-11/12 animate-pulse" />
                </div>

                {/* Paragraph 3 Skeleton */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="h-4 bg-slate-200/80 rounded-md w-1/5 animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-3/4 animate-pulse ml-4" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-5/6 animate-pulse ml-4" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-11/12 animate-pulse ml-4" />
                </div>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[250px] p-3 border-0 focus:outline-none focus:ring-0 resize-none font-['Poppins'] text-base text-black leading-relaxed overflow-hidden"
                placeholder="Job description details..."
              />
            )}
          </div>
        </div>

        {/* Row 3: Experience Level, Work Type, Work Mode */}
        {/* Row 3: Experience Level, Work Type, Work Mode */}
        <div className="self-stretch flex flex-col md:flex-row justify-center items-stretch md:items-start gap-4 md:gap-6">
          {/* Experience Level */}
          <div ref={experienceRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Experience Level</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsExperienceOpen(!isExperienceOpen)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 transition-colors shadow-sm text-left flex justify-between items-center"
              >
                <span>{experience}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isExperienceOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExperienceOpen && (
                <div className="absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  {['Fresher', 'Junior (1-3 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)', 'Other'].map((option) => {
                    const isSelected = experience === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setExperience(option);
                          setIsExperienceOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full"
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? 'text-indigo-500 font-semibold' : 'text-black'}`}>
                          {option}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Work Type */}
          <div ref={workTypeRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Work Type</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsWorkTypeOpen(!isWorkTypeOpen)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 transition-colors shadow-sm text-left flex justify-between items-center"
              >
                <span>{workType}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isWorkTypeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkTypeOpen && (
                <div className="absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  {['Full time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map((option) => {
                    const isSelected = workType === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setWorkType(option);
                          setIsWorkTypeOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full"
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? 'text-indigo-500 font-semibold' : 'text-black'}`}>
                          {option}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Work Mode */}
          <div ref={workModeRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Work Mode</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsWorkModeOpen(!isWorkModeOpen)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 transition-colors shadow-sm text-left flex justify-between items-center"
              >
                <span>{workMode}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isWorkModeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkModeOpen && (
                <div className="absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  {['Remote', 'Hybrid', 'Onsite'].map((option) => {
                    const isSelected = workMode === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setWorkMode(option);
                          setIsWorkModeOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full"
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? 'text-indigo-500 font-semibold' : 'text-black'}`}>
                          {option}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Row 4: Min Salary, Max Salary */}
        <div className="self-stretch flex flex-col sm:flex-row justify-center items-stretch sm:items-start gap-4 sm:gap-6">
          {/* Min Salary */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Min Salary (Annual)</label>
            <div ref={minCurrencyRef} className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors relative">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => {
                  setIsMinCurrencyOpen(!isMinCurrencyOpen);
                  setIsMaxCurrencyOpen(false);
                  setCurrencySearch('');
                }}
                className="flex items-center gap-1.5 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none cursor-pointer flex-shrink-0"
              >
                <span>{currency}</span>
                <Icon icon="lucide:chevron-down" className={`w-4 h-4 text-gray-500 transition-transform ${isMinCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMinCurrencyOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-hidden w-[280px]">
                  <div className="w-full px-1 pb-2">
                    <input
                      type="text"
                      placeholder="Search currency..."
                      autoFocus
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="w-full p-2 bg-slate-50 rounded-xl outline-none text-xs font-['Poppins'] text-black border border-slate-200 focus:border-indigo-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="w-full overflow-y-auto flex flex-col gap-1 max-h-[200px]">
                  {CURRENCIES.filter(c => {
                    const search = currencySearch.toLowerCase()
                      .replace(/yuro/g, 'euro')
                      .replace(/ruppies?/g, 'rupee')
                      .replace(/doller/g, 'dollar');
                    return c.code.toLowerCase().includes(search) || c.label.toLowerCase().includes(search);
                  }).map((c) => {
                    const isSelected = currency === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c.code);
                          setIsMinCurrencyOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full"
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 flex items-center gap-2 ${isSelected ? 'text-indigo-500 font-semibold' : 'text-black'}`}>
                          <span>{c.code} - {c.label}</span>
                          <span className="font-medium text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{c.symbol}</span>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Max Salary */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Max Salary (Annual)</label>
            <div ref={maxCurrencyRef} className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors relative">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => {
                  setIsMaxCurrencyOpen(!isMaxCurrencyOpen);
                  setIsMinCurrencyOpen(false);
                  setCurrencySearch('');
                }}
                className="flex items-center gap-1.5 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none cursor-pointer flex-shrink-0"
              >
                <span>{currency}</span>
                <Icon icon="lucide:chevron-down" className={`w-4 h-4 text-gray-500 transition-transform ${isMaxCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMaxCurrencyOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-hidden w-[280px]">
                  <div className="w-full px-1 pb-2">
                    <input
                      type="text"
                      placeholder="Search currency..."
                      autoFocus
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="w-full p-2 bg-slate-50 rounded-xl outline-none text-xs font-['Poppins'] text-black border border-slate-200 focus:border-indigo-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="w-full overflow-y-auto flex flex-col gap-1 max-h-[200px]">
                  {CURRENCIES.filter(c => {
                    const search = currencySearch.toLowerCase()
                      .replace(/yuro/g, 'euro')
                      .replace(/ruppies?/g, 'rupee')
                      .replace(/doller/g, 'dollar');
                    return c.code.toLowerCase().includes(search) || c.label.toLowerCase().includes(search);
                  }).map((c) => {
                    const isSelected = currency === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c.code);
                          setIsMaxCurrencyOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full"
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 flex items-center gap-2 ${isSelected ? 'text-indigo-500 font-semibold' : 'text-black'}`}>
                          <span>{c.code} - {c.label}</span>
                          <span className="font-medium text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{c.symbol}</span>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="self-stretch p-3 bg-red-50 border border-red-200 rounded-lg text-red-500 text-sm font-['Poppins'] text-center">
          {validationError}
        </div>
      )}

      {/* Footer Controls */}
      {/* Footer Controls */}
      <div className="self-stretch flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2 w-full gap-4">
        <button
          onClick={handleSaveDraftClick}
          type="button"
          className="px-4 py-2 hover:bg-slate-50 rounded-lg flex flex-col justify-center items-center text-gray-500 hover:text-gray-700 text-base font-medium font-['Poppins'] leading-6 transition-colors active:scale-95 w-full sm:w-auto"
        >
          Save Draft
        </button>
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onBack}
            type="button"
            className="w-full sm:w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95"
          >
            Back
          </button>
          <button
            onClick={handleContinueClick}
            type="button"
            className="w-full sm:w-36 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95 shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepJobDetails;
