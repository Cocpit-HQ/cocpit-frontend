import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';

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
  // Form fields
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialDetails?.company || 'Starlight Technologies');
  const [location, setLocation] = useState(initialDetails?.location || 'Mumbai, India');
  const [description, setDescription] = useState(initialDetails?.description || '');
  const [experience, setExperience] = useState(initialDetails?.experience || '0 - 2 years');
  const [workType, setWorkType] = useState(initialDetails?.work_type || 'Full-time');
  const [workMode, setWorkMode] = useState(initialDetails?.work_mode || 'Hybrid');
  const [minSalary, setMinSalary] = useState(initialDetails?.salary_min ? String(initialDetails.salary_min) : '');
  const [maxSalary, setMaxSalary] = useState(initialDetails?.salary_max ? String(initialDetails.salary_max) : '');
  const [currency, setCurrency] = useState(initialDetails?.salary_currency || 'USD');

  // AI loading and options state
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Generate description template based on values
  const getAiGeneratedDescription = (
    jobRole: string,
    companyName: string,
    jobLocation: string,
    isRegen: boolean = false
  ) => {
    const isDesign =
      jobRole.toLowerCase().includes('design') ||
      jobRole.toLowerCase().includes('ui') ||
      jobRole.toLowerCase().includes('ux');

    if (isDesign) {
      return `Role: ${jobRole}
Location: ${jobLocation}

About the Role:
As a ${jobRole} at ${companyName}, you will be responsible for creating exceptional user experiences for our ${
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
Location: ${jobLocation}

About the Role:
As a ${jobRole} at ${companyName}, you will play a key role in driving technical innovation and quality across our digital products. You will work closely with cross-functional teams to build next-generation features and scale our services.

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

  // Prefill description on load or if fields change (before edit)
  useEffect(() => {
    // Only prefill if the user has not custom edited the description yet
    if (!description) {
      setDescription(getAiGeneratedDescription(role, company, location));
    }
  }, [role, company, location]);

  const handleRegenerateAi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setDescription(getAiGeneratedDescription(role, company, location, true));
      setIsAiGenerating(false);
    }, 1200);
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
    <div className="w-[960px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6">Create job</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Modify Job Details</div>
        </div>
      </div>

      {/* Form Fields Panel */}
      <div className="self-stretch p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4 border border-[#EEF2FF]">
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Job Role */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Job Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Company Name */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>

          {/* Location */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Row 2: Job Description */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div className="self-stretch inline-flex justify-between items-start">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Job Description</label>
            <button
              onClick={handleRegenerateAi}
              disabled={isAiGenerating}
              type="button"
              className="pb-px flex justify-start items-center gap-1.5 hover:opacity-85 text-indigo-500 transition-opacity active:scale-95"
            >
              <Icon
                icon={isAiGenerating ? "line-md:loading-twotone-loop" : "solar:magic-stick-linear"}
                className={`w-5 h-5 text-indigo-500 ${isAiGenerating ? '' : 'animate-pulse'}`}
              />
              <span className="text-indigo-500 text-base font-normal font-['Poppins'] leading-6">
                {isAiGenerating ? 'Drafting...' : 'Regenerate with AI'}
              </span>
            </button>
          </div>

          <div className="self-stretch relative p-1 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start overflow-hidden focus-within:outline-indigo-300 transition-colors shadow-sm">
            {isAiGenerating ? (
              <div className="w-full min-h-[250px] flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                <Icon icon="solar:magic-stick-bold animate-bounce" className="w-8 h-8 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 animate-pulse font-['Poppins']">
                  AI is updating the job description details...
                </span>
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[250px] p-3 border-0 focus:outline-none focus:ring-0 resize-none font-['Poppins'] text-base text-black leading-relaxed"
                placeholder="Job description details..."
              />
            )}
          </div>
        </div>

        {/* Row 3: Experience Level, Work Type, Work Mode */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Experience Level */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Experience Level</label>
            <div className="relative w-full">
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 appearance-none text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 cursor-pointer pr-10 shadow-sm"
              >
                <option value="0 - 2 years">0 - 2 years</option>
                <option value="2 - 5 years">2 - 5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black flex items-center">
                <Icon icon="lucide:chevron-down" className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Work Type */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Work Type</label>
            <div className="relative w-full">
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 appearance-none text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 cursor-pointer pr-10 shadow-sm"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black flex items-center">
                <Icon icon="lucide:chevron-down" className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Work Mode */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Work Mode</label>
            <div className="relative w-full">
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 appearance-none text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-indigo-300 focus:ring-0 cursor-pointer pr-10 shadow-sm"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black flex items-center">
                <Icon icon="lucide:chevron-down" className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Min Salary, Max Salary */}
        <div className="self-stretch inline-flex justify-center items-start gap-6">
          {/* Min Salary */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Min Salary (Annual)</label>
            <div className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center gap-1 border-l border-indigo-50/100 pl-2">
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
            <label className="text-black text-sm font-normal font-['Poppins'] leading-5">Max Salary (Annual)</label>
            <div className="w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-between items-center gap-2 shadow-sm focus-within:outline-indigo-300 transition-colors">
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <div className="flex items-center gap-1 border-l border-indigo-50/100 pl-2">
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
      <div className="self-stretch inline-flex justify-between items-center mt-2">
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
            className="w-36 h-10 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 text-white text-sm font-semibold font-['Poppins'] leading-5 transition-all active:scale-95 shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepJobDetails;
