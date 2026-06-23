import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { useMyProfile } from '@/hooks/use-my-profile';

interface StepJobDetailsProps {
  initialRole: string;
  initialDetails?: Partial<JobListing>;
  onBack: () => void;
  onSaveDraft: (details: Partial<JobListing>) => Promise<void>;
  onContinue: (details: Partial<JobListing>) => Promise<void>;
}

export const StepJobDetails: React.FC<StepJobDetailsProps> = ({
  initialRole,
  initialDetails,
  onBack,
  onSaveDraft,
  onContinue,
}) => {
  const { data: profileData } = useMyProfile();
  const userProfile = profileData?.user;
  const hasPopulated = useRef(false);

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

  // AI loading and options state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom Dropdown Open States
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);
  const [isWorkModeOpen, setIsWorkModeOpen] = useState(false);

  // Dropdown Refs
  const experienceRef = useRef<HTMLDivElement>(null);
  const workTypeRef = useRef<HTMLDivElement>(null);
  const workModeRef = useRef<HTMLDivElement>(null);

  // Generate description template based on values
  const getAiGeneratedDescription = (
    jobRole: string,
    companyName: string,
    jobLocation: string,
    isRegen: boolean = false
  ) => {
    const displayCompany = companyName || '[Company Name]';
    const displayLocation = jobLocation || '[Location]';

    const isDesign =
      jobRole.toLowerCase().includes('design') ||
      jobRole.toLowerCase().includes('ui') ||
      jobRole.toLowerCase().includes('ux');

    if (isDesign) {
      return `Role: ${jobRole}
Location: ${displayLocation}

About the Role:
As a ${jobRole} at ${displayCompany}, you will be responsible for creating exceptional user experiences for our ${
        isRegen ? 'flagship enterprise solutions' : 'next-generation career networking platform'
      }. You will bridge the gap between user needs and business goals through data-driven design and intuitive interfaces.

Key Responsibilities:
- Design end-to-end user journeys for both mobile and web platforms.
- Create high-fidelity mockups and interactive prototypes using Figma.
- Collaborate with engineering teams to ensure pixel-perfect implementation.
- Conduct user research and usability testing to validate design decisions.
- Contribute to and maintain our evolving design system.

Requirements:
- 3+ years of experience in digital product design.
- Strong portfolio showcasing problem-solving and visual design skills.
- Mastery of design tools (Figma, Adobe Creative Suite).
- Understanding of HTML/CSS/JS constraints and opportunities.
- Excellent communication and presentation abilities.`;
    }

    return `Role: ${jobRole}
Location: ${displayLocation}

About the Role:
As a ${jobRole} at ${displayCompany}, you will play a key role in driving technical innovation and quality across our digital products. You will work closely with cross-functional teams to build next-generation features and scale our services.

Key Responsibilities:
- Architect, build, and maintain high-performance applications.
- Collaborate with design and product teams to translate requirements into robust solutions.
- Optimize systems for performance, responsiveness, and scalability.
- Implement security best practices and ensure data integrity.
- Participate in code reviews and advocate for engineering excellence.

Requirements:
- Proven experience in a similar ${jobRole} or related engineering position.
- Strong problem-solving abilities and deep technical knowledge.
- Hands-on experience with modern tech stacks, frameworks, and deployment workflows.
- Excellent communication and collaborative skills.
- Bachelor's degree in Computer Science, Engineering, or equivalent experience.`;
  };

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRegenerateAi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setDescription(getAiGeneratedDescription(role, company, location, true));
      setIsAiGenerating(false);
    }, 2000);
  };

  const buildDetailsObject = (): Partial<JobListing> => {
    return {
      id: initialDetails?.id,
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
    onContinue(buildDetailsObject());
  };

  return (
    <div className="w-[960px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-4 overflow-hidden animate-in fade-in duration-300 pb-16">
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6 text-left">Create job</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-left">Modify Job Details</div>
        </div>
      </div>

      {/* Form Fields Panel */}
      <div className="self-stretch p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4">
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Job Role */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Job Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Company Name */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Location */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
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
          <div className="self-stretch inline-flex justify-between items-start">
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
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Experience Level */}
          <div ref={experienceRef} className="flex-1 inline-flex flex-col justify-start items-start gap-2 relative">
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
                <div className="absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
          <div ref={workTypeRef} className="flex-1 inline-flex flex-col justify-start items-start gap-2 relative">
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
                <div className="absolute z-50 left-0 mt-2 w-72 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
          <div ref={workModeRef} className="flex-1 inline-flex flex-col justify-start items-start gap-2 relative">
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
                <div className="absolute z-50 left-0 mt-2 w-72 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Min Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Min Salary (Annual)</label>
            <div className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-0 p-0 pr-6 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-500 pointer-events-none -ml-5" />
              </div>
            </div>
          </div>

          {/* Max Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full">Max Salary (Annual)</label>
            <div className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 border-0 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-0 p-0 pr-6 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-500 pointer-events-none -ml-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="self-stretch inline-flex justify-between items-center mt-2 w-full">
        <button
          onClick={handleSaveDraftClick}
          type="button"
          className="px-4 py-2 hover:bg-slate-50 rounded-lg inline-flex flex-col justify-center items-center text-gray-500 hover:text-gray-700 text-base font-medium font-['Poppins'] leading-6 transition-colors active:scale-95"
        >
          Save Draft
        </button>
        <div className="flex justify-start items-center gap-2">
          <button
            onClick={onBack}
            type="button"
            className="w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95"
          >
            Back
          </button>
          <button
            onClick={handleContinueClick}
            type="button"
            className="w-36 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95 shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepJobDetails;
