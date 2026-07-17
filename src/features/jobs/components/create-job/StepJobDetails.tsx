import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { useMyProfile } from '@/hooks/use-my-profile';
import api from '@/lib/axios';
import { generateJobDescription, getIndustries, parseExperienceRange, resolveExperienceSelection } from '../../services/jobs.service';
import { useJobStore } from '@/store/job.store';
import { CURRENCIES } from '../../utils/currency.utils';
import { toast } from 'sonner';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface StepJobDetailsProps {
  jobId?: string | null;
  initialRole: string;
  initialDetails?: Partial<JobListing>;
  onBack: () => void;
  onSaveDraft: (details: Partial<JobListing>) => Promise<void>;
  onPublish: (details: Partial<JobListing>) => Promise<void>;
  onDeleteDraft?: () => void;
}

export const StepJobDetails: React.FC<StepJobDetailsProps> = ({
  jobId,
  initialRole,
  initialDetails,
  onBack,
  onSaveDraft,
  onPublish,
  onDeleteDraft,
}) => {
  const { setCreateJobDetails } = useJobStore();
  const { data: profileData } = useMyProfile();
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const userProfile = profileData?.user;
  const hasPopulated = useRef(false);
  const hasManuallyRegenerated = useRef(false); // Stops bg polling once user explicitly regenerates

  const companyNameFallback = activeProfile?.type === 'COMPANY' ? activeProfile.name : userProfile?.name;

  // Form fields
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialDetails?.company || companyNameFallback || '');
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
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [workType, setWorkType] = useState(normalizeWorkType(initialDetails?.work_type));
  const [workMode, setWorkMode] = useState(initialDetails?.work_mode || 'Hybrid');
  const [minSalary, setMinSalary] = useState(initialDetails?.salary_min ? String(initialDetails.salary_min) : '');
  const [maxSalary, setMaxSalary] = useState(initialDetails?.salary_max ? String(initialDetails.salary_max) : '');
  const [currency, setCurrency] = useState(initialDetails?.salary_currency || 'USD');
  const [industry, setIndustry] = useState(initialDetails?.industry || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(initialDetails?.ai_generation_count || 0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Safely populate defaults when the profile data resolves, if it wasn't cached instantly
  useEffect(() => {
    if (userProfile && !hasPopulated.current) {
      if (!company && !initialDetails?.company && companyNameFallback) {
        setCompany(companyNameFallback);
      }
      if (!location && !initialDetails?.location && userProfile.location) {
        setLocation(userProfile.location);
      }
      hasPopulated.current = true;
    }
  }, [userProfile, company, location, initialDetails]);

  // Sync form fields when initialDetails updates (e.g., after hydration on refresh)
  const hasHydratedFields = useRef(false);
  useEffect(() => {
    if (hasHydratedFields.current) return;
    if (!initialDetails || Object.keys(initialDetails).length === 0) return;

    // Only sync fields that are still empty (don't overwrite user edits)
    hasHydratedFields.current = true;

    if (initialDetails.title && !role) setRole(initialDetails.title);
    if (initialDetails.company && !company) setCompany(initialDetails.company);
    if (initialDetails.location && !location) setLocation(initialDetails.location);
    if (initialDetails.description && !description) setDescription(initialDetails.description);
    // Prefer resolving from the raw persisted range so a custom "Other" entry
    // (e.g. 12-14 yrs) reopens as Other with the exact values, instead of
    // trusting a display string that may have lossily bucketed it (e.g. "5+ Yrs").
    const resolvedExperience = resolveExperienceSelection(initialDetails.experience_min, initialDetails.experience_max);
    if (resolvedExperience) {
      setExperience(resolvedExperience.experience);
      if (resolvedExperience.minExperience != null) setMinExperience(String(resolvedExperience.minExperience));
      if (resolvedExperience.maxExperience != null) setMaxExperience(String(resolvedExperience.maxExperience));
    } else if (initialDetails.experience) {
      setExperience(normalizeExperience(initialDetails.experience));
    }
    if (initialDetails.work_type) setWorkType(normalizeWorkType(initialDetails.work_type));
    if (initialDetails.work_mode) setWorkMode(initialDetails.work_mode);
    if (initialDetails.salary_min) setMinSalary(String(initialDetails.salary_min));
    if (initialDetails.salary_max) setMaxSalary(String(initialDetails.salary_max));
    if (initialDetails.salary_currency) setCurrency(initialDetails.salary_currency);
    if (initialDetails.industry) setIndustry(initialDetails.industry);
  }, [initialDetails]);

  // Auto-save typed form fields directly into Zustand to trigger sessionStorage persist
  useEffect(() => {
    setCreateJobDetails({
      title: role,
      company: company,
      location: location,
      description: description,
      experience: experience === 'Other' ? `${minExperience}-${maxExperience} yrs` : experience,
      work_type: workType,
      work_mode: workMode,
      salary_min: minSalary ? Number(minSalary) : undefined,
      salary_max: maxSalary ? Number(maxSalary) : undefined,
      salary_currency: currency,
      industry: industry,
    });
  }, [role, company, location, description, experience, minExperience, maxExperience, workType, workMode, minSalary, maxSalary, currency, industry, setCreateJobDetails]);

  // Fetch background AI generation if description is empty, and get ai_generation_count
  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 6;
    const initialDescriptionEmpty = description.trim() === '';

    const fetchJob = async () => {
      // Stop if user has already explicitly clicked "Regenerate with AI"
      if (hasManuallyRegenerated.current) return;

      try {
        if (initialDescriptionEmpty) {
          setIsAiGenerating(true);
        }
        const response = await api.get(`/jobs/${jobId}`);
        const jobData = response.data;

        if (isMounted) {
          if (jobData.ai_generation_count !== undefined) {
            setRegenerateCount(jobData.ai_generation_count);
          }

          if (initialDescriptionEmpty && !hasManuallyRegenerated.current && jobData.description && jobData.description.trim() !== '') {
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
          } else if (initialDescriptionEmpty && !hasManuallyRegenerated.current && retryCount < maxRetries) {
            // If description is still empty, retry after 1.5 seconds
            retryCount++;
            setTimeout(fetchJob, 1500);
          } else if (initialDescriptionEmpty) {
            setIsAiGenerating(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch generated job details", error);
        if (isMounted && initialDescriptionEmpty) setIsAiGenerating(false);
      }
    };

    fetchJob();

    return () => { isMounted = false; };
  }, [jobId]); // intentionally omitting description so it doesn't re-trigger on user type

  // AI loading and options state
  const [isAiGenerating, setIsAiGenerating] = useState(() => {
    return !!jobId && (!initialDetails?.description || initialDetails.description.trim() === '');
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile-only wizard sub-step state
  type MobileSubStep = 'experience' | 'job-type' | 'work-mode' | 'location' | 'preview' | 'edit-job';
  const [mobileSubStep, setMobileSubStep] = useState<MobileSubStep>('experience');
  const MOBILE_STEPS: MobileSubStep[] = ['experience', 'job-type', 'work-mode', 'location'];
  const progressIndex = MOBILE_STEPS.indexOf(mobileSubStep as any);

  // Custom Dropdown Open States
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);
  const [isWorkModeOpen, setIsWorkModeOpen] = useState(false);
  const [isMinCurrencyOpen, setIsMinCurrencyOpen] = useState(false);
  const [isMaxCurrencyOpen, setIsMaxCurrencyOpen] = useState(false);
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<{ industry_name: string }[]>([]);
  const [currencySearch, setCurrencySearch] = useState('');

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      const data = await getIndustries();
      setAvailableIndustries(data);
    };
    fetchIndustries();
  }, []);

  // Dropdown Refs
  const experienceRef = useRef<HTMLDivElement>(null);
  const workTypeRef = useRef<HTMLDivElement>(null);
  const workModeRef = useRef<HTMLDivElement>(null);
  const minCurrencyRef = useRef<HTMLDivElement>(null);
  const maxCurrencyRef = useRef<HTMLDivElement>(null);
  const industryRef = useRef<HTMLDivElement>(null);

  // We no longer auto-prefill the description.
  // The user can type their own, or click "Regenerate with AI" to trigger it.

  // Auto-resize description textarea to prevent internal scrollbar
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (mobileTextareaRef.current) {
      if (!isDescriptionExpanded && mobileSubStep === 'preview') {
        mobileTextareaRef.current.style.height = '120px';
      } else {
        mobileTextareaRef.current.style.height = 'auto';
        mobileTextareaRef.current.style.height = `${mobileTextareaRef.current.scrollHeight}px`;
      }
    }
  }, [description, isAiGenerating, isDescriptionExpanded, mobileSubStep]);

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
      if (industryRef.current && !industryRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (!target.closest('#mobile-industry-sheet')) {
          setIsIndustryOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRegenerateAi = async () => {
    if (regenerateCount >= 3) return;
    if (!jobId) {
      console.warn("No jobId available to regenerate AI description.");
      return;
    }

    // Stop the background polling loop permanently — user is now in manual control
    hasManuallyRegenerated.current = true;

    setIsAiGenerating(true);
    try {
      // Pass the full form context for a richer AI generation
      const experienceLabel = experience === 'Other' ? `${minExperience}-${maxExperience} yrs` : experience;
      const { min: experienceMin, max: experienceMax } = parseExperienceRange(experienceLabel);
      const context = {
        role,
        company,
        location,
        experience: experienceLabel,
        work_type: workType,
        work_mode: workMode,
        experience_min: experienceMin,
        experience_max: experienceMax,
      };
      console.log('[Regenerate] Sending context to API:', context);
      const response = await generateJobDescription(jobId, context);
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
        // Only count towards the 3 limit if it was a fresh generation (not cached)
        const isCached = response.ai_metadata?.cached === true;
        if (!isCached) {
          setRegenerateCount(prev => prev + 1);
        }
      }
      
      // Sync the experience range from the persisted job — this is always an
      // echo of what we just sent (experience_min/experience_max come from the
      // form, never the AI), so this only matters when it differs from local
      // state (e.g. a value persisted in an earlier session).
      if (jobData.experience_min != null && jobData.experience_max != null) {
        const min = parseInt(jobData.experience_min, 10);
        const max = parseInt(jobData.experience_max, 10);
        if (experience === 'Other') {
          // Preserve the exact custom range instead of bucketing it into a
          // lossy preset (e.g. 6-12 must stay 6-12, not become "Senior (5+ yrs)" = 5-10).
          if (!isNaN(min)) setMinExperience(String(min));
          if (!isNaN(max)) setMaxExperience(String(max));
        } else if (isNaN(min)) {
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
      
      // If the backend 24h rate limit is hit, sync the frontend state so the button disables
      if (error.response?.status === 429) {
        setRegenerateCount(3);
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
      experience: experience === 'Other' ? `${minExperience}-${maxExperience} yrs` : experience,
      work_type: workType,
      work_mode: workMode,
      salary_min: minSalary ? parseFloat(minSalary.replace(/,/g, '')) : undefined,
      salary_max: maxSalary ? parseFloat(maxSalary.replace(/,/g, '')) : undefined,
      salary_currency: currency,
      industry,
    };
  };

  const handleSaveDraftClick = () => {
    setValidationError(null);
    if (minSalary && maxSalary) {
      const min = parseFloat(minSalary.replace(/,/g, ''));
      const max = parseFloat(maxSalary.replace(/,/g, ''));
      if (max < min) {
        setValidationError("Maximum salary cannot be less than minimum salary");
        return;
      }
    }
    onSaveDraft(buildDetailsObject());
  };

  const handlePublishClick = () => {
    setValidationError(null);
    if (role.trim().length < 5) {
      setValidationError("Job role/title must be at least 5 characters long");
      return;
    }
    if (description.trim().length < 100) {
      setValidationError("Job description must be at least 100 characters long");
      return;
    }

    if (minSalary && maxSalary) {
      const min = parseFloat(minSalary.replace(/,/g, ''));
      const max = parseFloat(maxSalary.replace(/,/g, ''));
      if (max < min) {
        setValidationError("Maximum salary cannot be less than minimum salary");
        return;
      }
    }

    onPublish(buildDetailsObject());
  };

  return (
    <div className={`w-full max-w-[998px] mx-auto bg-white flex flex-col justify-start items-center gap-4 animate-in fade-in duration-300 ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>

      {/* ── MOBILE WIZARD (< md) ── */}
      <div className={`flex md:hidden flex-col w-full min-h-[calc(100dvh-48px)] bg-white pb-32 ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>

        {/* Mobile Header */}
        {(mobileSubStep !== 'preview' && mobileSubStep !== 'edit-job') && (
          <div className="flex items-center gap-4 px-4 pt-4 pb-2">
            <button
              onClick={() => {
                if (mobileSubStep === 'experience') { onBack(); }
                else if (mobileSubStep === 'job-type') { setMobileSubStep('experience'); }
                else if (mobileSubStep === 'work-mode') { setMobileSubStep('job-type'); }
                else if (mobileSubStep === 'location') { setMobileSubStep('work-mode'); }
                else { setMobileSubStep('location'); }
              }}
              type="button"
              className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm flex-shrink-0 ${isCompanyMode ? 'dark:border-[#2A2D35] dark:bg-[#121B2B] dark:text-[#A1A8B3]' : 'dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#9CA3AF]'}`}
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-black dark:text-[#F9FAFB] text-xl font-bold font-['Poppins'] leading-tight">Create job</h2>
              <span className="text-gray-400 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins']">Tell us the role, AI will draft the rest</span>
            </div>
          </div>
        )}

        {/* Progress Bar — 4 segments for experience / job-type / work-mode / location */}
        {(mobileSubStep !== 'preview' && mobileSubStep !== 'edit-job') && (
          <div className="flex gap-2 px-4 pt-2 pb-4">
            {MOBILE_STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= progressIndex
                    ? (isCompanyMode ? 'bg-[#1A73E8]' : 'bg-[#6366F1]')
                    : 'bg-[#EEF2FF] dark:bg-[#1C2340]'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Sub-step: Experience ── */}
        {mobileSubStep === 'experience' && (
          <div className="flex flex-col gap-6 px-4 pt-4 flex-1">
            <h3 className="text-black dark:text-[#F9FAFB] text-[22px] font-bold font-['Poppins'] leading-tight">
              What level of experience are you looking for?
            </h3>
            <div className="flex flex-col gap-3">
              {['Fresher', 'Junior (1-3 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setExperience(opt); setMobileSubStep('job-type'); }}
                  className={`w-full h-16 rounded-3xl font-['Poppins'] text-sm font-medium transition-all active:scale-95 ${
                    experience === opt
                      ? (isCompanyMode ? 'bg-[#1A73E8] text-white shadow-md' : 'bg-[#6366F1] text-white shadow-md')
                      : 'bg-[#EEF2FF] text-[#6366F1] ' + (isCompanyMode ? 'dark:bg-[#121B2B] dark:text-[#4D9CFF]' : 'dark:bg-[#1C2340] dark:text-[#818CF8]')
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sub-step: Job Type ── */}
        {mobileSubStep === 'job-type' && (
          <div className="flex flex-col gap-6 px-4 pt-4 flex-1">
            <h3 className="text-black dark:text-[#F9FAFB] text-[22px] font-bold font-['Poppins'] leading-tight">
              What type of position are you hiring for?
            </h3>
            <div className="flex flex-col gap-3">
              {['Full time', 'Part time', 'Contract', 'Internship', 'Freelance'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setWorkType(opt); setMobileSubStep('work-mode'); }}
                  className={`w-full h-16 rounded-3xl font-['Poppins'] text-sm font-medium transition-all active:scale-95 ${
                    workType === opt
                      ? (isCompanyMode ? 'bg-[#1A73E8] text-white shadow-md' : 'bg-[#6366F1] text-white shadow-md')
                      : 'bg-[#EEF2FF] text-[#6366F1] ' + (isCompanyMode ? 'dark:bg-[#121B2B] dark:text-[#4D9CFF]' : 'dark:bg-[#1C2340] dark:text-[#818CF8]')
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sub-step: Work Mode ── */}
        {mobileSubStep === 'work-mode' && (
          <div className="flex flex-col gap-6 px-4 pt-4 flex-1">
            <h3 className="text-black dark:text-[#F9FAFB] text-[22px] font-bold font-['Poppins'] leading-tight">
              What is the preferred working mode for this role?
            </h3>
            <div className="flex flex-col gap-3">
              {['Remote', 'Hybrid', 'Onsite'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setWorkMode(opt); setMobileSubStep('location'); }}
                  className={`w-full h-16 rounded-3xl font-['Poppins'] text-sm font-medium transition-all active:scale-95 ${
                    workMode === opt
                      ? (isCompanyMode ? 'bg-[#1A73E8] text-white shadow-md' : 'bg-[#6366F1] text-white shadow-md')
                      : 'bg-[#EEF2FF] text-[#6366F1] ' + (isCompanyMode ? 'dark:bg-[#121B2B] dark:text-[#4D9CFF]' : 'dark:bg-[#1C2340] dark:text-[#818CF8]')
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sub-step: Location ── */}
        {mobileSubStep === 'location' && (
          <div className="flex flex-col gap-6 px-4 pt-4 flex-1">
            <h3 className="text-black dark:text-[#F9FAFB] text-[22px] font-bold font-['Poppins'] leading-tight">
              Where will this role be based?
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-black dark:text-[#9CA3AF] text-sm font-normal font-['Poppins']">Location</label>
              <div className={`w-full flex items-center justify-between bg-white border rounded-2xl px-4 py-3 shadow-sm ${
                isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340]'
              }`}>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className="flex-1 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] focus:outline-none"
                />
                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                      },
                      () => {}
                    );
                  }
                }}
                className={`self-end text-xs font-medium font-['Poppins'] transition-colors ${
                  isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-[#6366F1] dark:text-[#818CF8]'
                }`}
              >
                Use current location
              </button>
            </div>

            {/* Generate sticky CTA */}
            <div className={`fixed bottom-16 left-0 right-0 px-4 pb-4 backdrop-blur-sm z-[60] bg-white/90 ${isCompanyMode ? 'dark:bg-[#0F1115]/90' : 'dark:bg-[#0B0F19]/90'}`}>
              <button
                type="button"
                onClick={async () => {
                  setMobileSubStep('preview');
                  if (!isAiGenerating) {
                    await handleRegenerateAi();
                  }
                }}
                className={`w-full h-12 rounded-3xl font-['Poppins'] text-sm font-bold text-white shadow-md active:scale-95 transition-all ${
                  isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#6366F1]/90'
                }`}
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {/* ── Sub-step: Preview (AI result + Publish/Draft) ── */}
        {mobileSubStep === 'preview' && (
          <div className="flex flex-col gap-4 px-4 pt-2 flex-1 pb-24">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileSubStep('location')}
                  type="button"
                  className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm flex-shrink-0 ${isCompanyMode ? 'dark:border-[#2A2D35] dark:bg-[#121B2B] dark:text-[#A1A8B3]' : 'dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#9CA3AF]'}`}
                >
                  <Icon icon="lucide:arrow-left" className="w-5 h-5" />
                </button>
                <h3 className="text-black dark:text-[#F9FAFB] text-xl font-bold font-['Poppins']">Preview</h3>
              </div>
              <button onClick={() => onDeleteDraft?.()} type="button" className="p-2 -m-2 text-red-500 hover:text-red-600 transition-colors">
                <Icon icon="lucide:trash-2" className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#9CA3AF] font-['Poppins'] -mt-4 mb-2 ml-14">This is how candidates will see your job</p>
            
            {/* Summary Card */}
            <div className={`relative bg-white border shadow-sm rounded-2xl p-4 flex flex-col gap-2 ${
              isCompanyMode ? 'dark:bg-[#121B2B] border-slate-100 dark:border-[#2A2D35]' : 'dark:bg-[#1C2340] border-slate-100 dark:border-[#2E3445]'
            }`}>
              <button 
                onClick={() => setMobileSubStep('edit-job')}
                className="absolute top-4 right-4 p-2 -m-2 text-gray-500 dark:text-[#9CA3AF] hover:text-black dark:hover:text-[#F9FAFB] transition-colors"
              >
                <Icon icon="lucide:pencil" className="w-4 h-4" />
              </button>
              <h4 className="text-black dark:text-[#F9FAFB] text-lg font-bold font-['Poppins'] uppercase pr-8">{role || 'Untitled Role'}</h4>
              <p className="text-gray-500 dark:text-[#9CA3AF] text-sm font-medium font-['Poppins']">{company}</p>
              <p className="text-black dark:text-[#F9FAFB] text-sm font-semibold font-['Poppins'] mt-1">{workType}</p>
              <div className="flex items-center gap-2 text-black dark:text-[#F9FAFB] text-sm font-['Poppins'] mt-1">
                <Icon icon="lucide:briefcase" className="w-4 h-4" />
                <span>{experience}</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-[#F9FAFB] text-sm font-['Poppins'] mt-1">
                <Icon icon="lucide:map-pin" className="w-4 h-4" />
                <span>{workMode} - {location}</span>
              </div>
            </div>

            {/* AI Action Row */}
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleRegenerateAi}
                disabled={isAiGenerating || regenerateCount >= 3}
                className={`text-sm font-semibold font-['Poppins'] flex items-center gap-1.5 transition-opacity ${
                  regenerateCount >= 3
                    ? 'text-gray-400 cursor-not-allowed'
                    : (isCompanyMode ? 'text-[#1A73E8]' : 'text-[#6366F1] active:scale-95')
                }`}
              >
                <img src="/assets/AI 2.svg" alt="AI" className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(700%) hue-rotate(210deg)' }} />
                Regenerate with AI
              </button>
              <span className="text-xs text-gray-400 dark:text-[#9CA3AF] font-['Poppins']">*{3 - regenerateCount} regenerations max</span>
            </div>

            {/* Job Description */}
            <div className={`w-full p-4 rounded-xl border flex flex-col gap-2 ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 bg-blue-50/50 dark:bg-[#16365F]/30' : 'border-slate-200 dark:border-[#2E3445] bg-white dark:bg-[#1C2340]'
                }`}>
              <h3 className="text-black dark:text-[#F9FAFB] text-sm font-semibold font-['Poppins']">Job Description</h3>
              {isAiGenerating ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className={`w-8 h-8 rounded-full border-4 border-t-transparent animate-spin ${
                    isCompanyMode ? 'border-[#1A73E8]' : 'border-[#6366F1]'
                  }`} />
                </div>
              ) : (
                <>
                  <textarea
                    ref={mobileTextareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the role, responsibilities, requirements…"
                    className="w-full bg-transparent text-sm font-normal font-['Poppins'] text-black dark:text-[#F9FAFB] focus:outline-none resize-none leading-relaxed overflow-hidden"
                    style={{ minHeight: isDescriptionExpanded ? '120px' : '120px' }}
                  />
                  {description.length > 100 && (
                    <button 
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      type="button"
                      className={`self-start text-sm font-medium font-['Poppins'] mt-1 ${
                        isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-[#6366F1] dark:text-[#818CF8]'
                      }`}
                    >
                      {isDescriptionExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Extra Fields */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Industry type</label>
                <button
                  type="button"
                  onClick={() => setIsIndustryOpen(true)}
                  className={`w-full flex items-center justify-between bg-white border rounded-2xl px-4 py-3 shadow-sm text-left ${
                    isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340]'
                  }`}
                >
                  <span className={`flex-1 text-sm font-normal font-['Poppins'] truncate pr-2 ${
                    !industry ? 'text-gray-400' : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')
                  }`}>
                    {industry || 'Select industry...'}
                  </span>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Min salary (annual)</label>
                <div className={`w-full flex items-center bg-white border rounded-2xl overflow-hidden shadow-sm ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340]'
                }`}>
                  <span className="pl-4 text-gray-400 dark:text-[#9CA3AF] text-sm font-['Poppins']">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    placeholder="e.g. 1,200,000"
                    className="flex-1 min-w-0 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] px-2 py-3 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 pr-4 pl-2 border-l border-slate-200 dark:border-[#2E3445]">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-transparent text-black dark:text-[#F9FAFB] text-sm font-medium font-['Poppins'] focus:outline-none appearance-none"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code} className="text-black dark:text-[#F9FAFB] bg-white dark:bg-[#0B0F19]">{c.code}</option>)}
                    </select>
                    <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Max salary (annual)</label>
                <div className={`w-full flex items-center bg-white border rounded-2xl overflow-hidden shadow-sm ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340]'
                }`}>
                  <span className="pl-4 text-gray-400 dark:text-[#9CA3AF] text-sm font-['Poppins']">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    placeholder="e.g. 1,200,000"
                    className="flex-1 min-w-0 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] px-2 py-3 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 pr-4 pl-2 border-l border-slate-200 dark:border-[#2E3445]">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-transparent text-black dark:text-[#F9FAFB] text-sm font-medium font-['Poppins'] focus:outline-none appearance-none"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code} className="text-black dark:text-[#F9FAFB] bg-white dark:bg-[#0B0F19]">{c.code}</option>)}
                    </select>
                    <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation error */}
            {validationError && (
              <p className="text-red-500 text-xs font-['Poppins'] text-center mt-2">{validationError}</p>
            )}

            {/* Mobile action buttons (Sticky bottom for preview) */}
            <div className={`fixed bottom-[64px] left-0 right-0 px-4 py-3 backdrop-blur-md z-[60] border-t flex flex-col gap-3 bg-white/95 border-slate-100 ${
              isCompanyMode ? 'dark:bg-[#0F1115]/95 dark:border-[#2A2D35]' : 'dark:bg-[#0B0F19]/95 dark:border-[#2E3445]'
            }`}>
              <div className="text-center w-full">
                <button
                  type="button"
                  onClick={handleSaveDraftClick}
                  className="text-sm font-semibold font-['Poppins'] text-gray-500 dark:text-[#9CA3AF] hover:text-black dark:hover:text-[#F9FAFB] transition-colors p-2 -m-2"
                >
                  Save Draft
                </button>
              </div>
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setMobileSubStep('location')}
                  className={`flex-1 h-12 rounded-3xl font-['Poppins'] text-sm font-bold border active:scale-95 transition-all bg-white ${
                    isCompanyMode ? 'border-[#1A73E8] text-[#1A73E8] dark:bg-[#0F1115]' : 'border-[#6366F1] text-[#6366F1] dark:bg-[#0B0F19]'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePublishClick}
                  className={`flex-1 h-12 rounded-3xl font-['Poppins'] text-sm font-bold text-white shadow-md active:scale-95 transition-all ${
                    isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#6366F1]/90'
                  }`}
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-step: Edit Job (Form) ── */}
        {mobileSubStep === 'edit-job' && (
          <div className="flex flex-col gap-6 px-4 pt-4 flex-1 pb-24">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSubStep('preview')}
                type="button"
                className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm flex-shrink-0 ${isCompanyMode ? 'dark:border-[#2A2D35] dark:bg-[#121B2B] dark:text-[#A1A8B3]' : 'dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#9CA3AF]'}`}
              >
                <Icon icon="lucide:arrow-left" className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-black dark:text-[#F9FAFB] text-xl font-bold font-['Poppins'] leading-tight">Edit job</h2>
                <span className="text-gray-400 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins']">This is how candidates will see your job</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Job role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full bg-white border rounded-2xl px-4 py-3 shadow-sm text-black text-sm font-normal font-['Poppins'] focus:outline-none ${
                    isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B] dark:text-[#FFFFFF]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#F9FAFB]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Recruiter</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`w-full bg-white border rounded-2xl px-4 py-3 shadow-sm text-black text-sm font-normal font-['Poppins'] focus:outline-none ${
                    isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B] dark:text-[#FFFFFF]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#F9FAFB]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full bg-white border rounded-2xl px-4 py-3 shadow-sm text-black text-sm font-normal font-['Poppins'] focus:outline-none ${
                    isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30 dark:bg-[#121B2B] dark:text-[#FFFFFF]' : 'border-slate-200 dark:border-[#2E3445] dark:bg-[#1C2340] dark:text-[#F9FAFB]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Experience level</label>
                <div className={`w-full flex items-center justify-between bg-white dark:bg-[#1C2340] border rounded-2xl px-4 py-3 shadow-sm ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30' : 'border-slate-200 dark:border-[#2E3445]'
                }`}>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="flex-1 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] focus:outline-none appearance-none"
                  >
                    <option value="Fresher" className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>Fresher</option>
                    <option value="Junior (1-3 yrs)" className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>Junior (1-3 yrs)</option>
                    <option value="Mid-level (3-5 yrs)" className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>Mid-level (3-5 yrs)</option>
                    <option value="Senior (5+ yrs)" className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>Senior (5+ yrs)</option>
                  </select>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 flex-shrink-0 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Work type</label>
                <div className={`w-full flex items-center justify-between bg-white dark:bg-[#1C2340] border rounded-2xl px-4 py-3 shadow-sm ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30' : 'border-slate-200 dark:border-[#2E3445]'
                }`}>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="flex-1 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] focus:outline-none appearance-none"
                  >
                    {['Full time', 'Part time', 'Contract', 'Internship', 'Freelance'].map(opt => (
                      <option key={opt} value={opt} className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>{opt}</option>
                    ))}
                  </select>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 flex-shrink-0 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins']">Work mode</label>
                <div className={`w-full flex items-center justify-between bg-white dark:bg-[#1C2340] border rounded-2xl px-4 py-3 shadow-sm ${
                  isCompanyMode ? 'border-[#1A73E8]/30 dark:border-[#4D9CFF]/30' : 'border-slate-200 dark:border-[#2E3445]'
                }`}>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="flex-1 bg-transparent text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] focus:outline-none appearance-none"
                  >
                    {['Remote', 'Hybrid', 'Onsite'].map(opt => (
                      <option key={opt} value={opt} className={`text-black dark:text-[#F9FAFB] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>{opt}</option>
                    ))}
                  </select>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400 flex-shrink-0 pointer-events-none" />
                </div>
              </div>
            </div>



            {/* Mobile action buttons (Sticky bottom for edit form) */}
            <div className={`fixed bottom-[64px] left-0 right-0 px-4 py-3 backdrop-blur-md z-[60] border-t flex items-center gap-3 bg-white/95 border-slate-100 ${
              isCompanyMode ? 'dark:bg-[#0F1115]/95 dark:border-[#2A2D35]' : 'dark:bg-[#0B0F19]/95 dark:border-[#2E3445]'
            }`}>
              <button
                type="button"
                onClick={() => setMobileSubStep('preview')}
                className={`flex-1 h-12 rounded-3xl font-['Poppins'] text-sm font-bold border active:scale-95 transition-all bg-white ${
                  isCompanyMode ? 'border-[#1A73E8] text-[#1A73E8] dark:bg-[#0F1115]' : 'border-[#6366F1] text-[#6366F1] dark:bg-[#0B0F19]'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setMobileSubStep('preview')}
                className={`flex-1 h-12 rounded-3xl font-['Poppins'] text-sm font-bold text-white shadow-md active:scale-95 transition-all ${
                  isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#6366F1]/90'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP FORM (≥ md) — completely untouched ── */}
      {/* Mobile Industry Bottom Sheet (Rendered outside substeps so it works anywhere) */}
      {isIndustryOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[79] bg-black/50 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsIndustryOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div 
            id="mobile-industry-sheet" 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl md:hidden flex flex-col h-[85vh] animate-in slide-in-from-bottom-full duration-300 shadow-2xl bg-white border-t border-slate-100 ${
            isCompanyMode ? 'dark:bg-[#0F1115] dark:border-[#2A2D35]' : 'dark:bg-[#0B0F19] dark:border-[#2E3445]'
          }`}>
            {/* Sheet Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${
              isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'
            }`}>
              <h3 className={`text-lg font-semibold font-['Poppins'] text-slate-900 ${
                isCompanyMode ? 'dark:text-white' : 'dark:text-[#F9FAFB]'
              }`}>Select Industry</h3>
              <button 
                onClick={() => setIsIndustryOpen(false)}
                className={`p-2 -m-2 rounded-full transition-colors text-slate-400 hover:bg-slate-50 ${
                  isCompanyMode ? 'dark:text-[#A1A8B3] dark:hover:bg-[#121B2B]' : 'dark:text-[#9CA3AF] dark:hover:bg-[#1C2340]'
                }`}
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className={`px-4 py-3 border-b border-slate-100 ${
              isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'
            }`}>
              <div className="relative">
                <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm font-['Poppins'] transition-colors bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-indigo-400 ${
                    isCompanyMode 
                      ? 'dark:bg-[#121B2B] dark:text-white dark:placeholder-gray-500 dark:border-[#2A2D35] dark:focus:border-[#4D9CFF]' 
                      : 'dark:bg-[#1C2340] dark:text-[#F9FAFB] dark:placeholder-gray-500 dark:border-[#2E3445] dark:focus:border-[#818CF8]'
                  }`}
                />
              </div>
            </div>
            
            {/* Industry List */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
              {(() => {
                const searchLower = industrySearch.toLowerCase().trim();
                const filtered = availableIndustries.filter(i => 
                  i.industry_name.toLowerCase().includes(searchLower)
                );
                
                return filtered.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {filtered.map((item, idx) => {
                      const isSelected = industry === item.industry_name;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setIndustry(item.industry_name);
                            setIsIndustryOpen(false);
                            setIndustrySearch('');
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors bg-white hover:bg-slate-50 ${
                            isSelected 
                              ? (isCompanyMode ? 'bg-slate-50 dark:bg-[#121B2B]' : 'bg-slate-50 dark:bg-[#1C2340]') 
                              : (isCompanyMode ? 'dark:bg-transparent dark:active:bg-[#121B2B]' : 'dark:bg-transparent dark:active:bg-[#1C2340]')
                          }`}
                        >
                          <span className={`text-sm font-normal font-['Poppins'] ${
                            isSelected 
                              ? (isCompanyMode ? 'text-[#1A73E8] font-medium dark:text-[#4D9CFF]' : 'text-indigo-600 font-medium dark:text-[#818CF8]') 
                              : (isCompanyMode ? 'text-slate-700 dark:text-[#FFFFFF]' : 'text-slate-700 dark:text-[#F9FAFB]')
                          }`}>
                            {item.industry_name}
                          </span>
                          {isSelected && (
                            <Icon icon="lucide:check" className={`w-4 h-4 ${
                              isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-indigo-600 dark:text-[#818CF8]'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className={`text-sm font-['Poppins'] text-slate-500 ${
                      isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'
                    }`}>No industry found.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
      <div className="hidden md:flex flex-col w-full max-w-[998px] gap-4 px-0 pb-16">
      {/* Header Row */}
      <div className="self-stretch flex flex-row justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className={`w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 transition-colors active:scale-95 text-gray-500 shadow-sm flex-shrink-0 hover:bg-slate-50 ${isCompanyMode ? 'dark:border-[#2A2D35] dark:hover:bg-[#121B2B]' : 'dark:border-[#2E3445] dark:hover:bg-[#1C2340]'}`}
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col justify-start items-start">
          <div className={`text-black text-lg font-medium font-['Poppins'] leading-6 text-left ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Create job</div>
          <div className={`text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-left ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>Modify Job Details</div>
        </div>
      </div>

      {/* Form Fields Panel */}
      <div className={`self-stretch p-0 md:p-4 bg-white rounded-xl flex flex-col justify-start items-start gap-4 ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>
        {/* Row 1: Role, Company, Location */}
        <div className="self-stretch flex flex-col md:flex-row justify-center items-stretch md:items-start gap-4 md:gap-6">
          {/* Job Role */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Job Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 transition-colors shadow-sm ${
                isCompanyMode 
                  ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                  : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
              }`}
            />
          </div>

          {/* Recruiter Name */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Recruiter</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 transition-colors shadow-sm ${
                isCompanyMode 
                  ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                  : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
              }`}
            />
          </div>

          {/* Location */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 transition-colors shadow-sm ${
                isCompanyMode 
                  ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                  : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
              }`}
            />
          </div>
        </div>

        {/* Row 2: Experience Level, Work Type, Work Mode */}
        <div className="self-stretch flex flex-col md:flex-row justify-center items-stretch md:items-start gap-4 md:gap-6">
          {/* Experience Level */}
          <div ref={experienceRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Experience Level</label>
            {experience === 'Other' ? (
              <div className="w-full flex items-center gap-2">
                <div className={`flex-1 p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 flex items-center gap-2 shadow-sm transition-colors ${
                  isCompanyMode 
                    ? 'outline-blue-50 focus-within:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 focus-within:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
                  <span className="text-gray-400 text-sm font-['Poppins']">Min</span>
                  <input
                    type="number"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                    className={`w-full bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className={`flex-1 p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 flex items-center gap-2 shadow-sm transition-colors ${
                  isCompanyMode 
                    ? 'outline-blue-50 focus-within:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 focus-within:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
                  <span className="text-gray-400 text-sm font-['Poppins']">Max</span>
                  <input
                    type="number"
                    value={maxExperience}
                    onChange={(e) => setMaxExperience(e.target.value)}
                    className={`w-full bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setExperience('Fresher'); setIsExperienceOpen(false); }}
                  className={`p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] hover:bg-slate-50 transition-colors text-gray-500 flex-shrink-0 ${
                    isCompanyMode 
                      ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:hover:bg-[#121B2B]' 
                      : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:hover:bg-[#1C2340]'
                  }`}
                  title="Clear custom experience"
                >
                  <Icon icon="lucide:x" className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                  <button
                  type="button"
                  onClick={() => setIsExperienceOpen(!isExperienceOpen)}
                  className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 transition-colors shadow-sm text-left flex justify-between items-center ${
                    isCompanyMode 
                      ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                      : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
                  }`}
                >
                  <span>{experience}</span>
                  <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isExperienceOpen ? 'rotate-180' : ''}`} />
                </button>

                {isExperienceOpen && (
                  <div className={`absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
                    isCompanyMode 
                      ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                      : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                  }`}>
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
                          className={`self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                            isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                          }`}
                        >
                          <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-semibold dark:text-[#4D9CFF]' : 'text-indigo-500 font-semibold dark:text-[#818CF8]') : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')}`}>
                            {option}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Work Type */}
          <div ref={workTypeRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Work Type</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsWorkTypeOpen(!isWorkTypeOpen)}
                className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 transition-colors shadow-sm text-left flex justify-between items-center ${
                  isCompanyMode 
                    ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                    : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
                }`}
              >
                <span>{workType}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isWorkTypeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkTypeOpen && (
                <div className={`absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isCompanyMode 
                    ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
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
                        className={`self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                          isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                        }`}
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-semibold dark:text-[#4D9CFF]' : 'text-indigo-500 font-semibold dark:text-[#818CF8]') : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')}`}>
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
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Work Mode</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsWorkModeOpen(!isWorkModeOpen)}
                className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 transition-colors shadow-sm text-left flex justify-between items-center ${
                  isCompanyMode 
                    ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                    : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
                }`}
              >
                <span>{workMode}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isWorkModeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkModeOpen && (
                <div className={`absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isCompanyMode 
                    ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
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
                        className={`self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                          isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                        }`}
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 ${isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-semibold dark:text-[#4D9CFF]' : 'text-indigo-500 font-semibold dark:text-[#818CF8]') : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')}`}>
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

        {/* Row 3: Job Description */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div className="self-stretch flex flex-row justify-between items-center gap-2">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Job Description</label>
            <div className="relative group">
              <button
                onClick={handleRegenerateAi}
                disabled={isAiGenerating || regenerateCount >= 3}
                type="button"
                className={`pb-px flex justify-start items-center gap-1.5 transition-opacity ${
                  regenerateCount >= 3 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-indigo-500 hover:opacity-85 active:scale-95'
                }`}
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
                  className={`w-5 h-5 ${
                    isAiGenerating ? 'animate-magic-spin' : 
                    regenerateCount >= 3 ? 'grayscale opacity-50' : 'animate-pulse'
                  }`}
                />
                <span className={`text-base font-normal font-['Poppins'] leading-6 ${
                  regenerateCount >= 3 ? 'text-gray-400' : (isCompanyMode ? 'text-[#1A73E8]' : 'text-indigo-500')
                }`}>
                  {isAiGenerating ? 'Generating...' : 'Regenerate with AI'}
                </span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max z-50">
                <div className={`text-[14px] font-['Poppins'] font-medium px-[16px] py-[8px] rounded-[24px] bg-[#F4F6F8] text-black ${
                  isCompanyMode ? 'dark:bg-[#121B2B] dark:text-[#FFFFFF]' : 'dark:bg-[#1C2340] dark:text-[#F9FAFB]'
                }`}>
                  {regenerateCount >= 3 
                    ? "Limit reached. You can only regenerate 3 times per 24 hours." 
                    : "You can regenerate with AI up to 3 times."}
                </div>
              </div>
            </div>
          </div>

          <div className={`self-stretch relative p-1 bg-white rounded-xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-start overflow-hidden transition-colors shadow-sm ${
            isCompanyMode 
              ? 'outline-blue-50 focus-within:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
              : 'outline-indigo-50 focus-within:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
          }`}>
            {isAiGenerating ? (
              <div className={`w-full min-h-[250px] p-4 flex flex-col gap-5 select-none relative bg-white ${
                isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'
              }`}>
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
                className={`w-full min-h-[250px] p-3 border-0 focus:outline-none focus:ring-0 resize-none font-['Poppins'] text-base text-black leading-relaxed overflow-hidden bg-transparent ${
                  isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'
                }`}
                placeholder="Job description details..."
              />
            )}
          </div>
        </div>

        {/* Row 3: Experience Level, Work Type, Work Mode */}
        {/* Row 4: Industry type, Min Salary, Max Salary */}
        <div className="self-stretch flex flex-col sm:flex-row justify-center items-stretch sm:items-start gap-4 sm:gap-6">
          {/* Industry Type */}
          <div ref={industryRef} className="flex-1 flex flex-col justify-start items-start gap-2 relative">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Industry type</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsIndustryOpen(!isIndustryOpen)}
                className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 text-black text-base font-normal font-['Poppins'] leading-6 transition-colors shadow-sm text-left flex justify-between items-center ${
                  isCompanyMode 
                    ? 'outline-blue-50 focus:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35] dark:text-[#FFFFFF]' 
                    : 'outline-indigo-50 focus:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445] dark:text-[#F9FAFB]'
                }`}
              >
                <span>{industry || 'Select industry'}</span>
                <Icon icon="lucide:chevron-down" className={`w-5 h-5 text-gray-500 transition-transform ${isIndustryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isIndustryOpen && (
                <div className={`absolute z-50 left-0 mt-2 w-full p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isCompanyMode 
                    ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
                  <div className="w-full px-2 pt-2 pb-3">
                    <div className="relative">
                      <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search industries..."
                        value={industrySearch}
                        onChange={(e) => setIndustrySearch(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 bg-slate-50 rounded-full outline-none text-sm font-['Poppins'] text-slate-900 border border-slate-200 transition-colors ${
                          isCompanyMode 
                            ? 'focus:border-blue-300 dark:bg-[#121B2B] dark:border-[#2A2D35] dark:text-[#FFFFFF]' 
                            : 'focus:border-indigo-300 dark:bg-[#1C2340] dark:border-[#2E3445] dark:text-[#F9FAFB]'
                        }`}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="w-full max-h-[250px] overflow-y-auto flex flex-col gap-1 pr-1">
                    {(() => {
                      const searchLower = industrySearch.toLowerCase().trim();
                      const filtered = availableIndustries.filter(i => 
                        i.industry_name.toLowerCase().includes(searchLower)
                      );
                      
                      return (
                        <>
                          {filtered.length > 0 ? filtered.map((item, idx) => {
                            const isSelected = industry === item.industry_name;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setIndustry(item.industry_name);
                                  setIsIndustryOpen(false);
                                  setIndustrySearch('');
                                }}
                                className={`w-full px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl text-left transition-colors flex items-center justify-between group ${
                                  isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                                }`}
                              >
                                <span className={`text-sm font-normal font-['Poppins'] ${
                                  isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-medium dark:text-[#4D9CFF]' : 'text-indigo-600 font-medium dark:text-[#818CF8]') : (isCompanyMode ? 'text-slate-700 dark:text-[#FFFFFF]' : 'text-slate-700 dark:text-[#F9FAFB]')
                                }`}>
                                  {item.industry_name}
                                </span>
                                {isSelected && (
                                  <Icon icon="lucide:check" className={`w-4 h-4 ${isCompanyMode ? 'text-[#1A73E8]' : 'text-indigo-600'}`} />
                                )}
                              </button>
                            );
                          }) : (
                            searchLower ? (
                              <div className="flex flex-col gap-2 p-2">
                                <div className="text-center pb-1 text-slate-500 text-sm font-['Poppins']">
                                  No industry found.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIndustry('Other');
                                    setIsIndustryOpen(false);
                                    setIndustrySearch('');
                                  }}
                                  className={`w-full px-4 py-2.5 rounded-2xl text-left transition-colors flex items-center gap-2 group ${
                                    isCompanyMode 
                                      ? 'bg-blue-50 hover:bg-blue-100 dark:bg-[#16365F] dark:hover:bg-[#16365F]/80' 
                                      : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-[#252E54] dark:hover:bg-[#252E54]/80'
                                  }`}
                                >
                                  <div className="flex-1 flex flex-col">
                                    <span className={`text-sm font-medium font-['Poppins'] ${isCompanyMode ? 'text-[#1A73E8]' : 'text-indigo-700'}`}>
                                      Select &quot;Other&quot;
                                    </span>
                                  </div>
                                </button>
                              </div>
                            ) : null
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Min Salary */}
          <div className="flex-1 flex flex-col justify-start items-start gap-2">
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Min Salary (Annual)</label>
            <div ref={minCurrencyRef} className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 inline-flex justify-between items-center gap-2 shadow-sm transition-colors relative ${
              isCompanyMode 
                ? 'outline-blue-50 focus-within:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                : 'outline-indigo-50 focus-within:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
            }`}>
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className={`flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
              />
              <button
                type="button"
                onClick={() => {
                  setIsMinCurrencyOpen(!isMinCurrencyOpen);
                  setIsMaxCurrencyOpen(false);
                  setCurrencySearch('');
                }}
                className={`flex items-center gap-1.5 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none cursor-pointer flex-shrink-0 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
              >
                <span>{currency}</span>
                <Icon icon="lucide:chevron-down" className={`w-4 h-4 text-gray-500 transition-transform ${isMinCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMinCurrencyOpen && (
                <div className={`absolute right-0 top-full z-50 mt-2 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-hidden w-[280px] ${
                  isCompanyMode 
                    ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
                  <div className="w-full px-1 pb-2">
                    <input
                      type="text"
                      placeholder="Search currency..."
                      autoFocus
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className={`w-full p-2 bg-slate-50 rounded-xl outline-none text-xs font-['Poppins'] text-black border border-slate-200 transition-colors ${
                        isCompanyMode 
                          ? 'focus:border-blue-300 dark:bg-[#121B2B] dark:border-[#2A2D35] dark:text-[#FFFFFF]' 
                          : 'focus:border-indigo-300 dark:bg-[#1C2340] dark:border-[#2E3445] dark:text-[#F9FAFB]'
                      }`}
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
                        className={`self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                          isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                        }`}
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 flex items-center gap-2 ${isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-semibold dark:text-[#4D9CFF]' : 'text-indigo-500 font-semibold dark:text-[#818CF8]') : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')}`}>
                          <span>{c.code} - {c.label}</span>
                          <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] ${
                            isCompanyMode ? 'bg-slate-100 text-gray-500 dark:bg-[#121B2B] dark:text-[#A1A8B3]' : 'bg-slate-100 text-gray-500 dark:bg-[#1C2340] dark:text-[#9CA3AF]'
                          }`}>{c.symbol}</span>
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
            <label className={`text-black text-sm font-normal font-['Poppins'] leading-5 text-left w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Max Salary (Annual)</label>
            <div ref={maxCurrencyRef} className={`w-full p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] border-0 inline-flex justify-between items-center gap-2 shadow-sm transition-colors relative ${
              isCompanyMode 
                ? 'outline-blue-50 focus-within:outline-blue-300 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                : 'outline-indigo-50 focus-within:outline-indigo-300 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
            }`}>
              <input
                type="text"
                placeholder="e.g. 1,200,000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className={`flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none focus:ring-0 placeholder-gray-400 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
              />
              <button
                type="button"
                onClick={() => {
                  setIsMaxCurrencyOpen(!isMaxCurrencyOpen);
                  setIsMinCurrencyOpen(false);
                  setCurrencySearch('');
                }}
                className={`flex items-center gap-1.5 text-black text-base font-normal font-['Poppins'] leading-6 focus:outline-none cursor-pointer flex-shrink-0 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}
              >
                <span>{currency}</span>
                <Icon icon="lucide:chevron-down" className={`w-4 h-4 text-gray-500 transition-transform ${isMaxCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMaxCurrencyOpen && (
                <div className={`absolute right-0 top-full z-50 mt-2 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-hidden w-[280px] ${
                  isCompanyMode 
                    ? 'outline-blue-50 dark:bg-[#0F1115] dark:outline-[#2A2D35]' 
                    : 'outline-indigo-50 dark:bg-[#0B0F19] dark:outline-[#2E3445]'
                }`}>
                  <div className="w-full px-1 pb-2">
                    <input
                      type="text"
                      placeholder="Search currency..."
                      autoFocus
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className={`w-full p-2 bg-slate-50 rounded-xl outline-none text-xs font-['Poppins'] text-black border border-slate-200 transition-colors ${
                        isCompanyMode 
                          ? 'focus:border-blue-300 dark:bg-[#121B2B] dark:border-[#2A2D35] dark:text-[#FFFFFF]' 
                          : 'focus:border-indigo-300 dark:bg-[#1C2340] dark:border-[#2E3445] dark:text-[#F9FAFB]'
                      }`}
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
                        className={`self-stretch px-4 py-2 bg-white hover:bg-slate-50 rounded-3xl inline-flex justify-start items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                          isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#1C2340]'
                        }`}
                      >
                        <div className={`text-sm font-normal font-['Poppins'] leading-5 flex items-center gap-2 ${isSelected ? (isCompanyMode ? 'text-[#1A73E8] font-semibold dark:text-[#4D9CFF]' : 'text-indigo-500 font-semibold dark:text-[#818CF8]') : (isCompanyMode ? 'text-black dark:text-[#FFFFFF]' : 'text-black dark:text-[#F9FAFB]')}`}>
                          <span>{c.code} - {c.label}</span>
                          <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] ${
                            isCompanyMode ? 'bg-slate-100 text-gray-500 dark:bg-[#121B2B] dark:text-[#A1A8B3]' : 'bg-slate-100 text-gray-500 dark:bg-[#1C2340] dark:text-[#9CA3AF]'
                          }`}>{c.symbol}</span>
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
      <div className="self-stretch flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2 w-full gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {onDeleteDraft && (
            <button
              onClick={onDeleteDraft}
              type="button"
              className="text-red-400 hover:text-red-500 text-sm font-medium font-['Poppins'] transition-colors active:scale-95 text-left"
            >
              Delete draft
            </button>
          )}
          <button
            onClick={handleSaveDraftClick}
            type="button"
            className="text-gray-500 hover:text-gray-700 text-sm font-medium font-['Poppins'] transition-colors active:scale-95 text-left"
          >
            Save draft
          </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onBack}
            type="button"
            className={`w-full sm:w-32 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all active:scale-95 ${
              isCompanyMode ? 'outline-blue-400 text-[#1A73E8]' : 'outline-indigo-400 text-indigo-400'
            }`}
          >
            Back
          </button>
          <button
            onClick={handlePublishClick}
            type="button"
            className={`w-full sm:w-32 h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center text-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm ${
              isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            Publish
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default StepJobDetails;
