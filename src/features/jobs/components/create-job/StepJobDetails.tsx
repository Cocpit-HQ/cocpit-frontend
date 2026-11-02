import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ChevronDown, Search, MapPin, Loader2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useDebounce } from '@/hooks/use-debounce';
import {
  searchPlaces,
  getPlaceDetails,
  PlacesSuggestion,
  StructuredLocation,
} from '@/services/api/location';
import { getOnboardingOptions } from '@/services/api/onboarding';
import { cn } from '@/lib/utils';
import { JobListing } from '../../types/jobs.types';
import { useMyProfile } from '@/hooks/use-my-profile';
import api from '@/lib/axios';
import { generateJobDescription, parseExperienceRange, resolveExperienceSelection } from '../../services/jobs.service';
import { useJobStore } from '@/store/job.store';
import { toast } from 'sonner';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { CyphexAIIcon, LeftArrowIcon } from '@/components/icons';
import { companyService } from '@/services/organization.service';

interface StepJobDetailsProps {
  jobId?: string | null;
  initialRole: string;
  initialDetails?: Partial<JobListing>;
  onBack: () => void;
  onClose?: () => void;
  onSaveDraft: (details: Partial<JobListing>) => Promise<void>;
  onPublish: (details: Partial<JobListing>) => Promise<void>;
  onDeleteDraft?: () => void;
}

const EXPERIENCE_OPTIONS = [
  'Fresher',
  'Junior (1-3 yrs)',
  'Mid-level (3-5 yrs)',
  'Senior (5+ yrs)',
];

const WORK_TYPE_OPTIONS = [
  'Full time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
];

const WORK_MODE_OPTIONS = [
  'Remote',
  'Hybrid',
  'Onsite',
];

export const StepJobDetails: React.FC<StepJobDetailsProps> = ({
  jobId,
  initialRole,
  initialDetails,
  onBack,
  onClose,
  onSaveDraft,
  onPublish,
  onDeleteDraft,
}) => {
  const { setCreateJobDetails } = useJobStore();
  const { data: profileData } = useMyProfile();
  const { activeProfile, userCompanies } = useActiveProfile();
  const activeCompany = userCompanies?.find(
    (c) => (c.org_id || c.company_id) === activeProfile?.id
  );
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const userProfile = profileData?.user;
  const hasPopulated = useRef(false);
  const hasHydratedFields = useRef(false);
  const hasManuallyRegenerated = useRef(false);

  const companyNameFallback = isCompanyMode ? activeProfile?.name : userProfile?.name;

  // Form state
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialDetails?.company || companyNameFallback || '');
  const [location, setLocation] = useState(initialDetails?.location || '');
  const [description, setDescription] = useState(initialDetails?.description || '');

  // Location search state - exact same API as BusinessEditProfileTab
  const sessionToken = useRef(uuidv4());
  const [locationQuery, setLocationQuery] = useState(initialDetails?.location || '');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<PlacesSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const normalizeExperience = (exp: string | undefined): string => {
    if (!exp) return 'Fresher';
    if (exp === '0 - 2 years') return 'Fresher';
    if (exp === '2 - 5 years') return 'Mid-level (3-5 yrs)';
    if (exp === '5+ years') return 'Senior (5+ yrs)';
    return exp;
  };

  const normalizeWorkType = (wt: string | undefined): string => {
    if (!wt) return 'Full time';
    if (wt === 'Full-time' || wt === 'Full time') return 'Full time';
    if (wt === 'Part time' || wt === 'Part-time') return 'Part-time';
    return wt;
  };

  const [experience, setExperience] = useState(normalizeExperience(initialDetails?.experience));
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [workType, setWorkType] = useState(normalizeWorkType(initialDetails?.work_type));
  const [workMode, setWorkMode] = useState(initialDetails?.work_mode || 'Hybrid');
  const [minSalary, setMinSalary] = useState(initialDetails?.salary_min ? String(initialDetails.salary_min) : '');
  const [maxSalary, setMaxSalary] = useState(initialDetails?.salary_max ? String(initialDetails.salary_max) : '');
  const [currency] = useState(initialDetails?.salary_currency || 'INR');
  const [industry, setIndustry] = useState(initialDetails?.industry || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(initialDetails?.ai_generation_count || 0);

  // Industry custom dropdown state with cursor-based 50 batch pagination
  const [backendIndustries, setBackendIndustries] = useState<{ id: string; label: string }[]>([]);
  const [industryCursor, setIndustryCursor] = useState<string | null>(null);
  const [hasMoreIndustries, setHasMoreIndustries] = useState(false);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const [isLoadingMoreIndustries, setIsLoadingMoreIndustries] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const industrySearchInputRef = useRef<HTMLInputElement>(null);
  const industryListboxRef = useRef<HTMLDivElement>(null);
  const debouncedIndustrySearch = useDebounce(industrySearchQuery, 250);

  // Dropdown UI states
  const [isWorkModeOpen, setIsWorkModeOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);

  const workModeRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const workTypeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if we are editing an existing draft
  const isExistingDraft = Boolean(initialDetails?.id || (jobId && initialDetails?.title));

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch available industries and company's industry on mount
  useEffect(() => {
    let isCancelled = false;
    const initIndustries = async () => {
      setIsLoadingIndustries(true);
      try {
        const [onboardingData, comp] = await Promise.all([
          getOnboardingOptions('industries', undefined, undefined, 50).catch(() => [] as any),
          isCompanyMode && activeProfile?.slug && (!initialDetails?.industry || industry === 'Technology')
            ? companyService.getCompany(activeProfile.slug).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!isCancelled) {
          if (Array.isArray(onboardingData) && onboardingData.length > 0) {
            setBackendIndustries(
              onboardingData.map((item: any) => ({
                id: item.slug || item.id || item.label,
                label: item.label,
              }))
            );
            setIndustryCursor((onboardingData as any).nextCursor || null);
            setHasMoreIndustries(Boolean((onboardingData as any).hasMore));
          }
          const compInd = comp?.industry || comp?.institution_type;
          if (compInd && !initialDetails?.industry && !industry) {
            setIndustry(compInd);
          }
        }
      } catch (err) {
        console.error('Failed to load industries:', err);
      } finally {
        if (!isCancelled) setIsLoadingIndustries(false);
      }
    };

    initIndustries();
    return () => {
      isCancelled = true;
    };
  }, [isCompanyMode, activeProfile?.slug, initialDetails?.industry]);

  // Single Consolidated Hydration & Defaults Effect
  useEffect(() => {
    // 1. Company fallback when profile is available
    if ((userProfile || activeProfile) && !hasPopulated.current) {
      if (!company && !initialDetails?.company && companyNameFallback) {
        setCompany(companyNameFallback);
      }
      hasPopulated.current = true;
    }

    // 2. Hydrate from initialDetails when passed
    if (!hasHydratedFields.current && initialDetails && Object.keys(initialDetails).length > 0) {
      hasHydratedFields.current = true;
      if (initialDetails.title && !role) setRole(initialDetails.title);
      if (initialDetails.company && !company) setCompany(initialDetails.company);
      if (initialDetails.location && !location) {
        setLocation(initialDetails.location);
        setLocationQuery(initialDetails.location);
      }
      if (initialDetails.description && !description) setDescription(initialDetails.description);

      const resolvedExperience = resolveExperienceSelection(initialDetails.experience_min, initialDetails.experience_max);
      if (resolvedExperience) {
        setExperience(normalizeExperience(resolvedExperience.experience));
        if (resolvedExperience.minExperience != null) setMinExperience(String(resolvedExperience.minExperience));
        if (resolvedExperience.maxExperience != null) setMaxExperience(String(resolvedExperience.maxExperience));
      } else if (initialDetails.experience) {
        setExperience(normalizeExperience(initialDetails.experience));
      }
      if (initialDetails.work_type) setWorkType(normalizeWorkType(initialDetails.work_type));
      if (initialDetails.work_mode) setWorkMode(initialDetails.work_mode);
      if (initialDetails.salary_min) setMinSalary(String(initialDetails.salary_min));
      if (initialDetails.salary_max) setMaxSalary(String(initialDetails.salary_max));
      if (initialDetails.industry) {
        setIndustry(initialDetails.industry);
        setIndustrySearchQuery(initialDetails.industry);
      }
    }
  }, [userProfile, activeProfile, initialDetails, companyNameFallback]);

  // AI loading state
  const [isAiGenerating, setIsAiGenerating] = useState(() => {
    return !!jobId && (!initialDetails?.description || initialDetails.description.trim() === '');
  });

  // Background fetch AI description if empty
  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 6;
    const initialDescriptionEmpty = description.trim() === '';

    const fetchJob = async () => {
      if (hasManuallyRegenerated.current) return;
      try {
        if (initialDescriptionEmpty) setIsAiGenerating(true);
        const response = await api.get(`/jobs/${jobId}`);
        const jobData = response.data;

        if (isMounted) {
          if (jobData.ai_generation_count !== undefined) {
            setRegenerateCount(jobData.ai_generation_count);
          }
          if (jobData.industry) {
            setIndustry((prev) => prev || jobData.industry);
            setIndustrySearchQuery((prev) => prev || jobData.industry);
          }

          if (initialDescriptionEmpty && !hasManuallyRegenerated.current && jobData.description && jobData.description.trim() !== '') {
            setDescription(jobData.description);
            setIsAiGenerating(false);

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
  }, [jobId]);

  // Google Places Autocomplete search effect matching BusinessEditProfileTab
  useEffect(() => {
    const q = debouncedLocationQuery.trim();
    if (!q || q.length < 3) {
      setPlacesSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    let isActive = true;
    setIsSearchingPlaces(true);

    searchPlaces(q, sessionToken.current, undefined, true)
      .then((results) => {
        if (isActive) {
          setPlacesSuggestions(results || []);
        }
      })
      .catch((err) => {
        console.error('Google Places search error:', err);
        if (isActive) setPlacesSuggestions([]);
      })
      .finally(() => {
        if (isActive) setIsSearchingPlaces(false);
      });

    return () => {
      isActive = false;
    };
  }, [debouncedLocationQuery]);

  const handleLocationSelect = useCallback(
    async (place: PlacesSuggestion) => {
      setIsLocationDropdownOpen(false);
      setIsDirty(true);
      const fallbackText = place.description || place.displayName || '';
      setLocationQuery(fallbackText);
      setLocation(fallbackText);

      if (place.placeId) {
        try {
          const details = await getPlaceDetails(place.placeId, sessionToken.current, true);
          sessionToken.current = uuidv4();
          if (details) {
            const fullAddress =
              details.formattedAddress ||
              [details.street, details.sublocality, details.city, details.state, details.country].filter(Boolean).join(', ') ||
              fallbackText;
            setLocationQuery(fullAddress);
            setLocation(fullAddress);
          }
        } catch (err) {
          console.error('Failed to get place details:', err);
        }
      }
    },
    []
  );

  // Live debounced search effect for industry
  useEffect(() => {
    if (!isIndustryDropdownOpen) return;
    let isCurrent = true;
    setIsLoadingIndustries(true);

    getOnboardingOptions('industries', debouncedIndustrySearch.trim() || undefined, undefined, 50)
      .then((res) => {
        if (isCurrent) {
          setBackendIndustries(
            res.map((item: any) => ({
              id: item.slug || item.id || item.label,
              label: item.label,
            }))
          );
          setIndustryCursor(res.nextCursor || null);
          setHasMoreIndustries(Boolean(res.hasMore));
        }
      })
      .catch((err) => {
        console.error('Failed to search industries:', err);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingIndustries(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedIndustrySearch, isIndustryDropdownOpen]);

  // Focus search input smoothly without causing viewport jump/shake
  useEffect(() => {
    if (isIndustryDropdownOpen) {
      industrySearchInputRef.current?.focus({ preventScroll: true });
    }
  }, [isIndustryDropdownOpen]);

  // Load more via cursor when scrolling to bottom of list
  const handleIndustryScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (isLoadingMoreIndustries || !hasMoreIndustries || !industryCursor) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setIsLoadingMoreIndustries(true);
      try {
        const res = await getOnboardingOptions(
          'industries',
          debouncedIndustrySearch.trim() || undefined,
          industryCursor,
          50
        );
        setBackendIndustries((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = res
            .filter((item: any) => !existingIds.has(item.slug || item.id || item.label))
            .map((item: any) => ({
              id: item.slug || item.id || item.label,
              label: item.label,
            }));
          return [...prev, ...newItems];
        });
        setIndustryCursor(res.nextCursor || null);
        setHasMoreIndustries(Boolean(res.hasMore));
      } catch (err) {
        console.error('Failed to load more industries:', err);
      } finally {
        setIsLoadingMoreIndustries(false);
      }
    }
  }, [isLoadingMoreIndustries, hasMoreIndustries, industryCursor, debouncedIndustrySearch]);

  const handleSelectIndustry = useCallback((val: string) => {
    setIndustry(val);
    setIndustrySearchQuery('');
    setIsDirty(true);
    setIsIndustryDropdownOpen(false);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workModeRef.current && !workModeRef.current.contains(event.target as Node)) {
        setIsWorkModeOpen(false);
      }
      if (experienceRef.current && !experienceRef.current.contains(event.target as Node)) {
        setIsExperienceOpen(false);
      }
      if (workTypeRef.current && !workTypeRef.current.contains(event.target as Node)) {
        setIsWorkTypeOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setIsIndustryDropdownOpen(false);
        setIndustrySearchQuery('');
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(140, e.target.scrollHeight)}px`;
  };

  const handleRegenerateAi = async () => {
    if (regenerateCount >= 3) return;
    if (!jobId) {
      console.warn("No jobId available to regenerate AI description.");
      return;
    }

    hasManuallyRegenerated.current = true;
    setIsAiGenerating(true);
    try {
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

      const response = await generateJobDescription(jobId, context);
      const jobData = response.job || response;

      let newDescription = "";
      if (jobData.description && typeof jobData.description === 'string' && jobData.description.trim() !== '') {
        newDescription = jobData.description;
      } else {
        const aiData = jobData.ai_content || jobData;
        if (aiData.summary) newDescription += `${aiData.summary}\n\n`;
        if (aiData.description) newDescription += `Description\n${aiData.description}\n\n`;
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
        setIsDirty(true);
        if (!response.ai_metadata?.cached) {
          setRegenerateCount((prev) => prev + 1);
        }
      }
    } catch (error: any) {
      console.error("Failed to regenerate with AI:", error);
      let errMsg = "AI generation is temporarily unavailable. Please configure GEMINI_API_KEY or write manually.";
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
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
      id: initialDetails?.id || jobId || undefined,
      title: role,
      company,
      location,
      description,
      experience: experience === 'Other' ? `${minExperience}-${maxExperience} yrs` : experience,
      work_type: workType,
      work_mode: workMode,
      salary_min: minSalary ? parseFloat(minSalary.replace(/,/g, '')) : undefined,
      salary_max: maxSalary ? parseFloat(maxSalary.replace(/,/g, '')) : undefined,
      salary_currency: currency || 'INR',
      industry,
    };
  };

  const handleSaveDraftClick = async () => {
    setValidationError(null);
    if (minSalary && maxSalary) {
      const min = parseFloat(minSalary.replace(/,/g, ''));
      const max = parseFloat(maxSalary.replace(/,/g, ''));
      if (max < min) {
        setValidationError("Maximum salary cannot be less than minimum salary");
        return;
      }
    }
    try {
      setIsSavingDraft(true);
      await onSaveDraft(buildDetailsObject());
      setIsDirty(false);
    } catch (err) {
      console.error("Save draft error:", err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishClick = () => {
    setValidationError(null);
    if (role.trim().length < 2) {
      setValidationError("Job role/title must be at least 2 characters long");
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

  const parsedMinSalary = minSalary ? parseFloat(minSalary.replace(/,/g, '')) : undefined;
  const parsedMaxSalary = maxSalary ? parseFloat(maxSalary.replace(/,/g, '')) : undefined;
  const isSalaryValid =
    (!parsedMinSalary && !parsedMaxSalary) ||
    (parsedMinSalary !== undefined && parsedMaxSalary !== undefined && parsedMaxSalary >= parsedMinSalary);

  const isPublishEnabled =
    role.trim().length >= 2 &&
    description.trim().length >= 100 &&
    location.trim().length > 0 &&
    industry.trim().length > 0 &&
    workType.trim().length > 0 &&
    workMode.trim().length > 0 &&
    isSalaryValid;

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary flex flex-col relative select-none overflow-y-auto">
      {/* Dynamic Keyframes for smooth clockwise Cyphex spin loader */}
      <style jsx global>{`
        @keyframes cyphex-spin {
          0% {
            transform: rotate(0deg);
          }
          45% {
            transform: rotate(200deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-cyphex {
          animation: cyphex-spin 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Fixed Back Navigation: Top 40px, Left 40px - use chevron icon and secondary hover color per design system */}
      <button
        onClick={onBack}
        type="button"
        aria-label="Back"
        className="fixed top-[40px] left-[40px] z-50 inline-flex items-center gap-2 p-0 text-ds-text-primary text-base font-medium font-dm-sans leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span>Back</span>
      </button>

      {/* Fixed Close Navigation: Top 40px, Right 40px - Never scrolls */}
      <button
        onClick={onClose || onBack}
        type="button"
        aria-label="Close"
        className="fixed top-[40px] right-[40px] z-50 text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer p-1 select-none bg-transparent border-none outline-none"
      >
        <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
      </button>

      {/* Main Form Container (Figma: top-[60px], centered w-[640px]) */}
      <div className="w-full max-w-[640px] mx-auto pt-10 sm:pt-[60px] pb-8 px-4 sm:px-0 flex flex-col items-stretch gap-6 sm:gap-7">
        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
            Create job
          </h1>
        </div>

        {/* Form Fields Stack */}
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* Row 1: Job role & Recruiter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {/* Job role */}
            <div className="border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5">
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Job role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Website Redesign"
                className="w-full bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-5 outline-none"
              />
            </div>

            {/* Recruiter */}
            <div className="border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5">
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Recruiter
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Acme Inc."
                className="w-full bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-5 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Location & Work mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {/* Location with Google Places autocomplete matching BusinessEditProfileTab */}
            <div
              ref={locationDropdownRef}
              className="relative border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5"
            >
              <label
                htmlFor="job-location-input"
                className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4 cursor-pointer"
              >
                Location
              </label>
              <div className="w-full inline-flex justify-between items-center gap-2">
                <input
                  id="job-location-input"
                  type="text"
                  value={locationQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocationQuery(val);
                    setLocation(val);
                    setIsDirty(true);
                    if (val.trim().length >= 3) {
                      setIsLocationDropdownOpen(true);
                    } else {
                      setIsLocationDropdownOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (locationQuery.trim().length >= 3) {
                      setIsLocationDropdownOpen(true);
                    }
                  }}
                  placeholder="e.g. Mumbai, India"
                  autoComplete="off"
                  maxLength={255}
                  className="w-full bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-5 outline-none cursor-text"
                />
                {isSearchingPlaces ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-accent shrink-0" />
                ) : (
                  <Search className="w-4 h-4 text-ds-text-secondary shrink-0" />
                )}
              </div>

              {/* Places suggestions dropdown */}
              {isLocationDropdownOpen && locationQuery.trim().length >= 3 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full sm:w-[300px] max-w-[calc(100vw-32px)] p-3 bg-[#030303] rounded-[8px] border border-[#2C2C33] shadow-2xl flex flex-col gap-3 z-50 animate-in fade-in duration-150 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {isSearchingPlaces ? (
                    <div className="w-full py-2 flex items-center justify-center gap-2 text-xs text-ds-text-muted font-dm-sans">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-accent" />
                      <span>Searching Google Places...</span>
                    </div>
                  ) : placesSuggestions.length > 0 ? (
                    placesSuggestions.map((place) => (
                      <div
                        key={place.placeId}
                        onClick={() => handleLocationSelect(place)}
                        className="w-full flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary cursor-pointer transition-colors font-dm-sans"
                      >
                        <MapPin className="w-4 h-4 text-ds-accent shrink-0" />
                        <span className="truncate">
                          {place.description || place.displayName}
                        </span>
                      </div>
                    ))
                  ) : debouncedLocationQuery.trim().length >= 3 ? (
                    <div className="w-full py-2 text-center text-xs text-ds-text-muted font-dm-sans">
                      No locations found
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Work mode */}
            <div
              ref={workModeRef}
              className="relative border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5 cursor-pointer"
              onClick={() => setIsWorkModeOpen(!isWorkModeOpen)}
            >
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4 cursor-pointer">
                Work mode
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-ds-text-primary font-dm-sans leading-5">
                  {workMode || 'Hybrid'}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`w-4 h-4 text-ds-text-muted transition-transform duration-200 ${
                    isWorkModeOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isWorkModeOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] h-[116px] max-w-[calc(100vw-32px)] bg-[#030303] border border-[#2C2C33] rounded-[8px] p-3 flex flex-col justify-between shadow-2xl z-40 box-border">
                  {WORK_MODE_OPTIONS.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkMode(mode);
                        setIsDirty(true);
                        setIsWorkModeOpen(false);
                      }}
                      className={`w-full text-left text-sm font-dm-sans transition-colors cursor-pointer ${
                        workMode === mode
                          ? 'text-ds-accent font-medium'
                          : 'text-ds-text-secondary hover:text-ds-text-primary'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Experience level & Work type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {/* Experience level */}
            <div
              ref={experienceRef}
              className="relative border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5 cursor-pointer"
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
            >
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4 cursor-pointer">
                Experience level
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-ds-text-primary font-dm-sans leading-5">
                  {experience || 'Fresher'}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`w-4 h-4 text-ds-text-muted transition-transform duration-200 ${
                    isExperienceOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isExperienceOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] h-[152px] max-w-[calc(100vw-32px)] bg-[#030303] border border-[#2C2C33] rounded-[8px] p-3 flex flex-col justify-between shadow-2xl z-40 box-border">
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExperience(exp);
                        setIsDirty(true);
                        setIsExperienceOpen(false);
                      }}
                      className={`w-full text-left text-sm font-dm-sans transition-colors cursor-pointer ${
                        experience === exp
                          ? 'text-ds-accent font-medium'
                          : 'text-ds-text-secondary hover:text-ds-text-primary'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Work type */}
            <div
              ref={workTypeRef}
              className="relative border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5 cursor-pointer"
              onClick={() => setIsWorkTypeOpen(!isWorkTypeOpen)}
            >
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4 cursor-pointer">
                Work type
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-ds-text-primary font-dm-sans leading-5">
                  {workType || 'Full time'}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`w-4 h-4 text-ds-text-muted transition-transform duration-200 ${
                    isWorkTypeOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isWorkTypeOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] h-[188px] max-w-[calc(100vw-32px)] bg-[#030303] border border-[#2C2C33] rounded-[8px] p-3 flex flex-col justify-between shadow-2xl z-40 box-border">
                  {WORK_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkType(type);
                        setIsDirty(true);
                        setIsWorkTypeOpen(false);
                      }}
                      className={`w-full text-left text-sm font-dm-sans transition-colors cursor-pointer ${
                        workType === type
                          ? 'text-ds-accent font-medium'
                          : 'text-ds-text-secondary hover:text-ds-text-primary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: AI Rewrite Header & Job Description */}
          <div className="flex flex-col gap-2.5">
            {/* Header row with Cyphex AI Regenerate button */}
            <div className="flex items-center justify-between">
              <span className="text-ds-text-primary text-base font-normal sm:font-medium font-dm-sans leading-6">
                Rewrite with AI
              </span>
              <button
                type="button"
                onClick={handleRegenerateAi}
                disabled={isAiGenerating || regenerateCount >= 3}
                className="inline-flex items-center gap-1.5 text-ds-accent hover:opacity-85 active:scale-95 transition-all text-sm font-medium font-dm-sans leading-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CyphexAIIcon
                  className={`w-4 h-4 text-ds-accent shrink-0 ${isAiGenerating ? 'animate-cyphex' : ''}`}
                />
                <span>
                  {isAiGenerating
                    ? 'Generating...'
                    : regenerateCount > 0
                    ? `Regenerate with AI (${3 - regenerateCount} left)`
                    : 'Regenerate with AI'}
                </span>
              </button>
            </div>

            {/* Description Textarea or Skeleton while generating */}
            <div className="border-b border-ds-border focus-within:border-ds-accent transition-colors pb-3 flex flex-col gap-1.5">
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Job description
              </label>
              {isAiGenerating ? (
                <div className="w-full min-h-[140px] flex flex-col gap-3 py-2">
                  <div className="h-4 bg-ds-surface-1/90 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-ds-surface-1/80 rounded w-full animate-pulse" />
                  <div className="h-4 bg-ds-surface-1/70 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-ds-surface-1/80 rounded w-2/3 animate-pulse" />
                  <div className="h-4 bg-ds-surface-1/70 rounded w-4/5 animate-pulse" />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Write a job description, including the role overview, key responsibilities, required skills, and qualifications..."
                  rows={5}
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                  className="w-full min-h-[140px] bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-relaxed outline-none resize-none"
                />
              )}
            </div>
          </div>

          {/* Row 5: Industry type, Min salary, Max salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Industry Selection with Cursor-based 50 Batch Pagination & Search */}
            <div
              ref={industryDropdownRef}
              className="min-w-0 relative border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5 cursor-pointer select-none"
              onClick={() => {
                setIsIndustryDropdownOpen((prev) => !prev);
              }}
            >
              <span className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Industry type
              </span>
              <div className="w-full inline-flex justify-between items-center gap-2">
                <span className={cn(
                  "text-sm font-normal font-dm-sans leading-5 truncate",
                  industry ? "text-ds-text-primary" : "text-ds-text-muted"
                )}>
                  {industry || "Select industry"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-ds-text-muted transition-transform duration-200 shrink-0",
                    isIndustryDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </div>

              {/* Industry Dropdown Menu with Search & Infinite Scroll */}
              {isIndustryDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-ds-bg rounded-2xl border border-ds-border shadow-2xl flex flex-col gap-2 z-50 overflow-hidden"
                >
                  {/* Search input with search icon & clear button */}
                  <div className="w-full flex items-center gap-2 border-b border-ds-border pb-2 px-1">
                    <Search className="w-3.5 h-3.5 text-ds-text-muted shrink-0" />
                    <input
                      ref={industrySearchInputRef}
                      type="text"
                      value={industrySearchQuery}
                      onChange={(e) => setIndustrySearchQuery(e.target.value)}
                      placeholder="Search industries..."
                      className="w-full bg-transparent text-sm text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-normal py-0.5 outline-none"
                    />
                    {industrySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setIndustrySearchQuery("")}
                        aria-label="Clear search" className="text-ds-text-secondary hover:text-ds-text-primary p-0.5 bg-transparent border-none cursor-pointer flex items-center justify-center outline-none focus-visible:text-ds-accent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable listbox with cursor pagination */}
                  <div
                    ref={industryListboxRef}
                    role="listbox"
                    onScroll={handleIndustryScroll}
                    className="self-stretch flex flex-col justify-start items-start gap-1 max-h-48 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {isLoadingIndustries ? (
                      <div className="w-full py-4 text-center text-ds-text-muted text-xs font-dm-sans flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-accent" />
                        <span>Loading industries...</span>
                      </div>
                    ) : backendIndustries.length > 0 ? (
                      <>
                        {backendIndustries.map((opt) => {
                          const isSelected =
                            (industry || "").toLowerCase() === opt.label.toLowerCase() ||
                            (industry || "").toLowerCase() === opt.id.toLowerCase();
                          return (
                            <div
                              key={opt.id}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectIndustry(opt.label)}
                              className="self-stretch inline-flex justify-between items-center cursor-pointer select-none transition-colors"
                            >
                              <span
                                title={opt.label}
                                className={cn(
                                  "text-sm font-dm-sans leading-5 transition-colors cursor-pointer truncate",
                                  isSelected
                                    ? "text-ds-accent font-medium"
                                    : "text-ds-text-secondary hover:text-ds-text-primary"
                                )}
                              >
                                {opt.label}
                              </span>
                            </div>
                          );
                        })}
                        {isLoadingMoreIndustries && (
                          <div className="w-full py-2 text-center text-xs text-ds-text-muted font-dm-sans flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin text-ds-accent" />
                            <span>Loading more...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full py-4 text-center text-ds-text-muted text-xs font-dm-sans">
                        No industries found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Min salary */}
            <div className="min-w-0 border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5">
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Min salary (annual)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-normal text-ds-text-muted font-dm-sans select-none">₹</span>
                <input
                  type="text"
                  value={minSalary}
                  onChange={(e) => {
                    setMinSalary(e.target.value.replace(/[^0-9,]/g, ''));
                    setIsDirty(true);
                  }}
                  placeholder="1,200,000"
                  className="w-full bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-5 outline-none"
                />
              </div>
            </div>

            {/* Max salary */}
            <div className="min-w-0 border-b border-ds-border focus-within:border-ds-accent transition-colors pb-2 flex flex-col justify-center gap-1.5">
              <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
                Max salary (annual)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-normal text-ds-text-muted font-dm-sans select-none">₹</span>
                <input
                  type="text"
                  value={maxSalary}
                  onChange={(e) => {
                    setMaxSalary(e.target.value.replace(/[^0-9,]/g, ''));
                    setIsDirty(true);
                  }}
                  placeholder="1,200,000"
                  className="w-full bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-5 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="text-rose-400 text-xs text-center font-dm-sans py-1">
            {validationError}
          </div>
        )}

        {/* Footer Actions: Centered Publish & Draft actions (Figma: Frame 2609476 w-[238px] h-[36px] gap-[8px]) */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="w-[238px] h-[36px] flex flex-row justify-center items-center gap-2">
            <button
              onClick={handlePublishClick}
              type="button"
              disabled={!isPublishEnabled}
              className={`w-[115px] h-[36px] px-3 py-1.5 rounded-[100px] flex justify-center items-center text-base font-medium font-dm-sans leading-6 transition-all select-none ${
                isPublishEnabled
                  ? 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer shadow-sm'
                  : 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed opacity-50'
              }`}
            >
              Publish
            </button>

            {isDirty ? (
              <button
                onClick={handleSaveDraftClick}
                type="button"
                disabled={isSavingDraft}
                className="w-[115px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border text-ds-text-primary hover:border-ds-text-secondary hover:bg-ds-surface-1/50 active:scale-95 text-base font-medium font-dm-sans leading-6 flex justify-center items-center transition-all cursor-pointer select-none whitespace-nowrap disabled:opacity-50"
              >
                {isSavingDraft ? 'Saving...' : 'Save draft'}
              </button>
            ) : (
              <button
                onClick={onDeleteDraft || handleSaveDraftClick}
                type="button"
                className="w-[115px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border text-ds-text-primary hover:border-ds-text-secondary hover:bg-ds-surface-1/50 active:scale-95 text-base font-medium font-dm-sans leading-6 flex justify-center items-center transition-all cursor-pointer select-none whitespace-nowrap"
              >
                Delete draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepJobDetails;
