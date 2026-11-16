'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { LeftArrowIcon, DownArrowIcon, LoadingIcon, CloseCrossIcon, CyphexAIIcon } from '@/components/icons';
import { JobListing } from '../../types/jobs.types';
import * as jobsService from '../../services/jobs.service';
import { getOnboardingOptions } from '@/services/api/onboarding';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyProfile } from '@/hooks/use-my-profile';
import {
  searchPlaces,
  getPlaceDetails,
  reverseGeocode,
  PlacesSuggestion,
} from '@/services/api/location';
import { POPULAR_LOCATIONS } from '@/data/staticLocations';
import { useDebounce } from '@/hooks/use-debounce';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EditJobMobileScreen } from './EditJobMobileScreen';
import { useJobStore } from '@/store/job.store';

interface CreateJobMobileWizardProps {
  jobId?: string | null;
  initialRole: string;
  initialDetails?: Partial<JobListing>;
  onBack: () => void;
  onClose?: () => void;
  onSaveDraft: (details: Partial<JobListing>) => Promise<void>;
  onPublish: (details: Partial<JobListing>) => Promise<void>;
  onDeleteDraft?: () => void;
}

type MobileStep = 'experience' | 'work-type' | 'work-mode' | 'location' | 'preview';

const EXPERIENCE_OPTIONS = [
  'Fresher',
  'Junior (1-3 yrs)',
  'Mid-level (3-5 yrs)',
  'Senior (5+ yrs)',
];

const WORK_TYPE_OPTIONS = [
  'Full time',
  'Part time',
  'Contract',
  'Internship',
  'Freelance',
];

const WORK_MODE_OPTIONS = [
  'Remote',
  'Hybrid',
  'Onsite',
];

export const CreateJobMobileWizard: React.FC<CreateJobMobileWizardProps> = ({
  jobId: initialJobId,
  initialRole,
  initialDetails,
  onBack,
  onClose,
  onSaveDraft,
  onPublish,
  onDeleteDraft,
}) => {
  const { activeProfile } = useActiveProfile();
  const { data: profileData } = useMyProfile();
  const userProfile = profileData?.user;
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const companyNameFallback = isCompanyMode ? activeProfile?.name : userProfile?.name;

  // Manage active draft jobId
  const [currentJobId, setCurrentJobId] = useState<string | null>(initialJobId || initialDetails?.id || null);

  // If initialDetails already has an AI-generated description (editing an existing draft), start on preview
  const isExistingCompleteDraft = Boolean(initialDetails?.description && initialDetails.description.trim().length > 30);
  const [currentStep, setCurrentStep] = useState<MobileStep>(isExistingCompleteDraft ? 'preview' : 'experience');

  // Sequential Form State
  const [role, setRole] = useState(initialRole || initialDetails?.title || 'UI/UX Designer');
  const [company, setCompany] = useState(initialDetails?.company || companyNameFallback || 'Driftline Digital');
  const [experience, setExperience] = useState(initialDetails?.experience || '');
  const [workType, setWorkType] = useState(initialDetails?.work_type || '');
  const [workMode, setWorkMode] = useState(initialDetails?.work_mode || '');
  const [location, setLocation] = useState(initialDetails?.location || '');
  const [description, setDescription] = useState(initialDetails?.description || '');

  // Google Places Autocomplete state
  const sessionToken = useRef<string>(uuidv4());
  const [locationQuery, setLocationQuery] = useState(initialDetails?.location || '');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<PlacesSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [industry, setIndustry] = useState(initialDetails?.industry || 'Technology');
  const [minSalary, setMinSalary] = useState(initialDetails?.salary_min ? String(initialDetails.salary_min) : '');
  const [maxSalary, setMaxSalary] = useState(initialDetails?.salary_max ? String(initialDetails.salary_max) : '');

  // UI States
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [backendIndustries, setBackendIndustries] = useState<{ id: string; label: string }[]>([]);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const debouncedIndustrySearch = useDebounce(industrySearchQuery, 250);
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const industrySearchInputRef = useRef<HTMLInputElement>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);

  // Google Places search effect
  useEffect(() => {
    const q = debouncedLocationQuery.trim();
    if (!q || q.length < 2) {
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

  // Close location & industry dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setIsIndustryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live debounced search effect for industry options
  useEffect(() => {
    if (!isIndustryDropdownOpen) return;
    let isCurrent = true;
    setIsLoadingIndustries(true);

    getOnboardingOptions('industries', debouncedIndustrySearch.trim() || undefined, undefined, 50)
      .then((data: any) => {
        if (isCurrent && Array.isArray(data)) {
          setBackendIndustries(
            data.map((item: any) => ({
              id: item.slug || item.id || item.label,
              label: item.label,
            }))
          );
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

  // Focus search input on open
  useEffect(() => {
    if (isIndustryDropdownOpen) {
      industrySearchInputRef.current?.focus({ preventScroll: true });
    }
  }, [isIndustryDropdownOpen]);

  // Update company name fallback
  useEffect(() => {
    if (!company && companyNameFallback) {
      setCompany(companyNameFallback);
    }
  }, [companyNameFallback, company]);

  // Static popular locations when query < 2 chars, API results when searching
  const isLocationQueryShort = debouncedLocationQuery.trim().length < 2;
  const locationSuggestions = useMemo(() => {
    if (isLocationQueryShort) {
      return POPULAR_LOCATIONS.map((loc) => ({
        id: String(loc.id),
        lineText: loc.state && loc.state.toLowerCase() !== loc.city.toLowerCase()
          ? `${loc.city}, ${loc.state}, ${loc.country}`
          : `${loc.city}, ${loc.country}`,
        raw: loc,
        kind: 'static' as const,
      }));
    }
    return placesSuggestions.map((place) => ({
      id: place.placeId,
      lineText: place.description || place.displayName,
      raw: place,
      kind: 'api' as const,
    }));
  }, [isLocationQueryShort, debouncedLocationQuery, placesSuggestions]);

  // Location selection matching standard onboarding/profile behavior
  const handleLocationSelect = async (item: { id: string; lineText: string; raw: any; kind: 'static' | 'api' }) => {
    setIsLocationDropdownOpen(false);
    setLocationQuery(item.lineText);
    setLocation(item.lineText);

    if (item.kind === 'api') {
      try {
        const details = await getPlaceDetails(item.id, sessionToken.current, true);
        sessionToken.current = uuidv4();
        if (details) {
          const fullAddress =
            details.formattedAddress ||
            [details.street, details.sublocality, details.city, details.state, details.country].filter(Boolean).join(', ') ||
            item.lineText;
          setLocationQuery(fullAddress);
          setLocation(fullAddress);
        }
      } catch (err) {
        console.error('Failed to get place details:', err);
      }
    }
  };

  // Geolocation trigger with real reverse geocoding API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your device.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude, true);
          if (result) {
            const locText = result.formattedAddress || [result.city, result.country].filter(Boolean).join(', ');
            setLocationQuery(locText);
            setLocation(locText);
            toast.success(`Location detected: ${locText}`);
          } else {
            toast.error('Could not detect city. Please type it manually.');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          toast.error('Failed to detect location.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Location permission denied or unavailable.');
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Main Action: Triggered ONLY when clicking "Generate" on Screen 4
  // For mobile: sends ALL step data to backend in POST /jobs call!
  const handleGenerateClick = async () => {
    setIsAiGenerating(true);
    try {
      let activeId = currentJobId;
      let createdJobData: any = null;

      const effectiveExp = experience || 'Junior (1-3 yrs)';
      const { min: expMin, max: expMax } = jobsService.parseExperienceRange(effectiveExp);

      // 1. Initialize draft in database with ALL mobile step data
      if (!activeId) {
        const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
        const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

        const detailsPayload = {
          location: location || 'Remote',
          job_type: workType || 'Full time',
          work_mode: workMode || 'Hybrid',
          experience_label: effectiveExp,
          experience_min: expMin,
          experience_max: expMax,
        };

        const result = await jobsService.initializeJobDraftWithDetails(role, actorType, actorId, detailsPayload);
        if (result.id) {
          activeId = result.id;
          setCurrentJobId(result.id);
          // Sync generated draft ID to global store so parent delete/save operations have the active ID
          useJobStore.getState().setCreateJobId(result.id);
        }
        createdJobData = result.job;
      }

      // 2. Hydrate any fields backend already returned (like auto-generated AI description or draft values)
      if (createdJobData) {
        if (createdJobData.description && typeof createdJobData.description === 'string' && createdJobData.description.trim() !== '') {
          setDescription(createdJobData.description.trim());
        }
        if (createdJobData.industry) {
          setIndustry(createdJobData.industry);
        }
        if (createdJobData.salary_min) {
          setMinSalary(String(createdJobData.salary_min));
        }
        if (createdJobData.salary_max) {
          setMaxSalary(String(createdJobData.salary_max));
        }
      }

      // 3. If description is not yet populated, call generateJobDescription with full context
      if (activeId && (!createdJobData?.description || createdJobData.description.trim() === '')) {
        const context = {
          role: role || 'UI/UX Designer',
          company: company || 'Company',
          location: location || 'Remote',
          experience: effectiveExp,
          work_type: workType || 'Full time',
          work_mode: workMode || 'Hybrid',
          experience_min: expMin,
          experience_max: expMax,
        };

        const response = await jobsService.generateJobDescription(activeId, context);
        const jobData = response.job || response;
        let newDesc = '';

        if (jobData.description && typeof jobData.description === 'string' && jobData.description.trim() !== '') {
          newDesc = jobData.description;
        } else {
          const aiData = jobData.ai_content || jobData;
          if (aiData.summary) newDesc += `${aiData.summary}\n\n`;
          if (aiData.description) newDesc += `Description\n${aiData.description}\n\n`;
          if (aiData.responsibilities && Array.isArray(aiData.responsibilities)) {
            newDesc += `Responsibilities\n${aiData.responsibilities.map((r: string) => `- ${r}`).join('\n')}\n\n`;
          }
          if (aiData.requirements && Array.isArray(aiData.requirements)) {
            newDesc += `Requirements\n${aiData.requirements.map((r: string) => `- ${r}`).join('\n')}\n\n`;
          }
        }

        newDesc = newDesc.trim();
        if (newDesc) {
          setDescription(newDesc);
        }
      }

      // 4. Move to Preview page
      setCurrentStep('preview');
    } catch (err) {
      console.error('Failed to generate job:', err);
      toast.error('Failed to generate description, showing preview.');
      setCurrentStep('preview');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Regenerate with AI button handler on Preview Screen
  const handleRegenerateWithAi = async () => {
    if (!currentJobId) return;
    setIsAiGenerating(true);
    try {
      const effectiveExp = experience || 'Junior (1-3 yrs)';
      const { min: expMin, max: expMax } = jobsService.parseExperienceRange(effectiveExp);
      const context = {
        role: role || 'UI/UX Designer',
        company: company || 'Company',
        location: location || 'Remote',
        experience: effectiveExp,
        work_type: workType || 'Full time',
        work_mode: workMode || 'Hybrid',
        experience_min: expMin,
        experience_max: expMax,
      };
      const response = await jobsService.generateJobDescription(currentJobId, context);
      const jobData = response.job || response;
      if (jobData.description && typeof jobData.description === 'string') {
        setDescription(jobData.description.trim());
        setIsDirty(true);
        toast.success('Description regenerated');
      }
    } catch (err) {
      console.error('Failed to regenerate description:', err);
      toast.error('Regeneration failed.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Navigation Backwards in flow
  const handleStepBack = () => {
    if (currentStep === 'experience') {
      onBack();
    } else if (currentStep === 'work-type') {
      setCurrentStep('experience');
    } else if (currentStep === 'work-mode') {
      setCurrentStep('work-type');
    } else if (currentStep === 'location') {
      setCurrentStep('work-mode');
    } else if (currentStep === 'preview') {
      // From preview page / after creating or opening a draft, Back ALWAYS returns to the job listings list!
      if (onClose) {
        onClose();
      } else {
        onBack();
      }
    }
  };

  // Save Draft (Triggered by Save draft button when isDirty === true; guards against invalid salary ranges)
  const handleSaveDraftClick = async () => {
    if (!isSalaryValid) return;
    setIsSavingDraft(true);
    try {
      const effectiveExp = experience || 'Junior (1-3 yrs)';
      const { min: expMin, max: expMax } = jobsService.parseExperienceRange(effectiveExp);
      const payload: Partial<JobListing> = {
        id: currentJobId || undefined,
        title: role || 'UI/UX Designer',
        company: company || 'Company',
        experience: effectiveExp,
        work_type: workType || 'Full time',
        work_mode: workMode || 'Hybrid',
        location: location || 'Remote',
        description,
        industry,
        salary_min: minSalary ? Number(minSalary.replace(/[^0-9]/g, '')) : undefined,
        salary_max: maxSalary ? Number(maxSalary.replace(/[^0-9]/g, '')) : undefined,
        experience_min: expMin,
        experience_max: expMax,
      };
      await onSaveDraft(payload);
      setIsDirty(false);

    } catch (err) {
      console.error('Failed to save draft:', err);
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish Job (Guards against publishing when validation fails or required fields are incomplete)
  const handlePublishClick = async () => {
    if (!isPublishEnabled) return;
    setIsPublishing(true);
    try {
      const effectiveExp = experience || 'Junior (1-3 yrs)';
      const { min: expMin, max: expMax } = jobsService.parseExperienceRange(effectiveExp);
      const payload: Partial<JobListing> = {
        id: currentJobId || undefined,
        title: role || 'UI/UX Designer',
        company: company || 'Company',
        experience: effectiveExp,
        work_type: workType || 'Full time',
        work_mode: workMode || 'Hybrid',
        location: location || 'Remote',
        description,
        industry,
        salary_min: minSalary ? Number(minSalary.replace(/[^0-9]/g, '')) : undefined,
        salary_max: maxSalary ? Number(maxSalary.replace(/[^0-9]/g, '')) : undefined,
        experience_min: expMin,
        experience_max: expMax,
      };
      await onPublish(payload);
    } catch (err) {
      console.error('Failed to publish job:', err);
      toast.error('Failed to publish job.');
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Formats salary values into clean compact abbreviations ('k', 'm', 'b').
   * Strips formatting/commas (e.g. "20,000" -> "20k", "1,200,000" -> "1.2m").
   */
  const formatSalaryCompact = (val?: string): string => {
    if (!val) return '0';
    const cleanNum = Number(val.replace(/[^0-9.]/g, ''));
    if (!cleanNum || isNaN(cleanNum) || cleanNum === 0) return '0';

    if (cleanNum >= 1_000_000_000) {
      return `${(cleanNum / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}b`;
    }
    if (cleanNum >= 1_000_000) {
      return `${(cleanNum / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
    }
    if (cleanNum >= 1_000) {
      return `${(cleanNum / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${cleanNum}`;
  };

  /**
   * Computed preview salary: defaults to "0 - 0" if neither is set, otherwise "${min} - ${max}".
   */
  const displaySalary = useMemo(() => {
    const formattedMin = formatSalaryCompact(minSalary);
    const formattedMax = formatSalaryCompact(maxSalary);
    if (formattedMin === '0' && formattedMax === '0') {
      return '0 - 0';
    }
    return `${formattedMin} - ${formattedMax}`;
  }, [minSalary, maxSalary]);

  // ==========================================
  // FORM VALIDATION & REACTIVE LOCK LOGIC (Aligned with desktop StepJobDetails)
  // Provides real-time inline errors and dynamically locks the Publish button.
  // ==========================================
  const parsedMinSalary = minSalary ? parseFloat(minSalary.toString().replace(/,/g, '')) : undefined;
  const parsedMaxSalary = maxSalary ? parseFloat(maxSalary.toString().replace(/,/g, '')) : undefined;
  const isSalaryRangeInvalid =
    parsedMinSalary !== undefined &&
    parsedMaxSalary !== undefined &&
    parsedMaxSalary < parsedMinSalary;
  const isSalaryValid = !isSalaryRangeInvalid;

  // Description Validation: Error if entered but below 200 characters, or exceeds 10,000 characters
  const isDescriptionError =
    (description.trim().length > 0 && description.trim().length < 200) ||
    description.length >= 10000;

  // Publish Button Active State: Inactive/disabled when validation errors exist or requirements unmet
  const isPublishEnabled =
    role.trim().length >= 2 &&
    description.trim().length >= 200 &&
    description.length <= 10000 &&
    location.trim().length > 0 &&
    industry.trim().length > 0 &&
    workType.trim().length > 0 &&
    workMode.trim().length > 0 &&
    isSalaryValid;

  // ==========================================
  // SCREENS 1 - 4: QUESTIONNAIRE
  // ==========================================
  if (currentStep !== 'preview') {
    const progressWidth =
      currentStep === 'experience'
        ? 'w-[90px]'
        : currentStep === 'work-type'
        ? 'w-[180px]'
        : currentStep === 'work-mode'
        ? 'w-[270px]'
        : 'w-[360px]';

    return (
      <div className="w-full min-h-screen flex flex-col items-center relative pt-4 pb-8 px-4 font-dm-sans bg-ds-bg overflow-y-auto">
        {/* Frame 2609713: Top Nav Bar (Left Arrow Back + Right Cancel X) */}
        <div className="w-full max-w-[360px] flex flex-row justify-between items-center h-6 shrink-0">
          <button
            onClick={handleStepBack}
            type="button"
            aria-label="Back"
            className="inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
            <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">Back</span>
          </button>
          <button
            onClick={onClose || onBack}
            type="button"
            aria-label="Cancel"
            className="text-ds-text-primary hover:text-ds-accent transition-colors p-1 bg-transparent border-none outline-none cursor-pointer"
          >
            <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Frame 2610015: Outer Container (width: 392px, padding: 10px 16px, gap: 10px, 49px below Back) */}
        <div className="w-full max-w-[392px] flex flex-col items-center px-4 py-2.5 gap-2.5 mt-[49px]">
          {/* Container (Inner Container: width: 360px, padding: 20px 0px 40px, gap: 20px) */}
          <div className="w-full max-w-[360px] flex flex-col items-center pt-5 pb-10 gap-5">
            {/* Frame 33: Progress Bar (360px x 6px, bg-ds-surface-2 track, bg-ds-accent indicator) */}
            <div className="w-[360px] h-[6px] bg-ds-surface-2 rounded-lg overflow-hidden relative shrink-0">
              <div className={`h-full bg-ds-accent rounded-l-lg transition-all duration-300 ${progressWidth}`} />
          </div>

          {/* SCREEN 1: What level of experience are you looking for? */}
          {currentStep === 'experience' && (
            <div className="w-full flex flex-col items-center gap-5 animate-in fade-in duration-200">
              <h2 className="w-[360px] text-center text-ds-text-secondary text-base font-semibold leading-6 font-dm-sans">
                What level of experience are you looking for?
              </h2>
              <div className="w-full flex flex-col items-center gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const isSelected = experience === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setExperience(opt);
                        setTimeout(() => setCurrentStep('work-type'), 100);
                      }}
                      className={`w-[260px] h-9 px-3 py-1.5 rounded-full flex items-center justify-center font-dm-sans text-base font-medium leading-6 transition-all active:scale-95 cursor-pointer outline-none ${
                        isSelected
                          ? 'bg-ds-surface-1 border border-ds-accent text-ds-text-primary'
                          : 'bg-ds-surface-1 hover:bg-ds-surface-2 text-ds-text-primary border-none'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 2: What type of position are you hiring for? */}
          {currentStep === 'work-type' && (
            <div className="w-full flex flex-col items-center gap-5 animate-in fade-in duration-200">
              <h2 className="w-[360px] text-center text-ds-text-secondary text-base font-semibold leading-6 font-dm-sans">
                What type of position are you hiring for?
              </h2>
              <div className="w-full flex flex-col items-center gap-3">
                {WORK_TYPE_OPTIONS.map((opt) => {
                  const isSelected = workType === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setWorkType(opt);
                        setTimeout(() => setCurrentStep('work-mode'), 100);
                      }}
                      className={`w-[260px] h-9 px-3 py-1.5 rounded-full flex items-center justify-center font-dm-sans text-base font-medium leading-6 transition-all active:scale-95 cursor-pointer outline-none ${
                        isSelected
                          ? 'bg-ds-surface-1 border border-ds-accent text-ds-text-primary'
                          : 'bg-ds-surface-1 hover:bg-ds-surface-2 text-ds-text-primary border-none'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 3: What is the preferred working mode for this role? */}
          {currentStep === 'work-mode' && (
            <div className="w-full flex flex-col items-center gap-5 animate-in fade-in duration-200">
              <h2 className="w-[360px] text-center text-ds-text-secondary text-base font-semibold leading-6 font-dm-sans">
                What is the preferred working mode for this role?
              </h2>
              <div className="w-full flex flex-col items-center gap-3">
                {WORK_MODE_OPTIONS.map((opt) => {
                  const isSelected = workMode === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setWorkMode(opt);
                        setTimeout(() => setCurrentStep('location'), 100);
                      }}
                      className={`w-[260px] h-9 px-3 py-1.5 rounded-full flex items-center justify-center font-dm-sans text-base font-medium leading-6 transition-all active:scale-95 cursor-pointer outline-none ${
                        isSelected
                          ? 'bg-ds-surface-1 border border-ds-accent text-ds-text-primary'
                          : 'bg-ds-surface-1 hover:bg-ds-surface-2 text-ds-text-primary border-none'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 4: Location & Generate */}
          {currentStep === 'location' && (
            <div className="w-full flex flex-col items-center gap-5 animate-in fade-in duration-200">
              <div ref={locationDropdownRef} className="w-[360px] flex flex-col items-start gap-2 relative">
                {/* Standard Cocpit Location Trigger matching onboarding & user/org profile */}
                <div className={`w-full py-2 border-b flex flex-col justify-center items-start gap-1 transition-colors relative ${
                  isLocationDropdownOpen ? 'border-ds-accent' : 'border-ds-border hover:border-ds-text-muted'
                }`}>
                  <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
                    Location
                  </label>
                  <div className="w-full flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocationQuery(val);
                        setLocation(val);
                        setIsLocationDropdownOpen(true);
                      }}
                      onFocus={() => setIsLocationDropdownOpen(true)}
                      placeholder="Location"
                      autoComplete="off"
                      className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
                    />
                    <div className="flex items-center shrink-0">
                      {isSearchingPlaces ? (
                        <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth text-ds-text-secondary" />
                      ) : locationQuery ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationQuery('');
                            setLocation('');
                            setIsLocationDropdownOpen(true);
                          }}
                          className="p-0.5 text-ds-text-muted hover:text-ds-text-primary cursor-pointer bg-transparent border-none"
                        >
                          <CloseCrossIcon size={14} className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className={`w-4 h-4 flex items-center justify-center text-ds-text-secondary transition-transform duration-200 cursor-pointer ${
                            isLocationDropdownOpen ? 'rotate-180' : ''
                          }`}
                        >
                          <DownArrowIcon size={16} className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Standard Cocpit Dropdown Menu identical to Onboarding & Profile */}
                {isLocationDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-full py-2 bg-ds-bg rounded-xl px-2 flex flex-col justify-start gap-1.5 shadow-2xl border border-ds-border animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-full max-h-[220px] overflow-y-auto flex flex-col gap-1 scrollbar-hide pr-1">
                      {isSearchingPlaces ? (
                        <div className="py-3 text-center text-ds-text-muted text-xs font-sans flex items-center justify-center gap-2">
                          <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth" />
                          <span>Searching locations...</span>
                        </div>
                      ) : locationSuggestions.length > 0 ? (
                        locationSuggestions.map((item) => {
                          const isSelected = location === item.lineText;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleLocationSelect(item)}
                              className={`w-full text-left font-sans text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate ${
                                isSelected
                                  ? 'text-ds-accent font-medium bg-ds-surface-1'
                                  : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1'
                              }`}
                            >
                              <span className="truncate">{item.lineText}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-3 text-center text-ds-text-muted text-xs font-sans">
                          No locations found for &quot;{locationQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingLocation}
                  className="text-ds-accent text-xs font-normal leading-4 font-dm-sans bg-transparent border-none p-0 cursor-pointer hover:underline inline-flex items-center gap-1.5"
                >
                  {isDetectingLocation && <LoadingIcon className="w-3 h-3 animate-spin-smooth text-ds-accent" />}
                  <span>{isDetectingLocation ? 'Detecting current location...' : 'Use current location'}</span>
                </button>
              </div>

              {/* Generate Button: 260px x 36px (Figma spec: background: ds-surface-1 or ds-accent) */}
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={isAiGenerating}
                className="w-[260px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex items-center justify-center font-dm-sans text-base font-medium leading-6 transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent mt-3"
              >
                {isAiGenerating ? (
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <span>Generate</span>
                )}
              </button>
            </div>
          )}
          </div>
        </div>

        <div className="h-6 shrink-0" />
      </div>
    );
  }

  // ==========================================
  // ==========================================
  // EDIT JOB SCREEN (Figma: edit job 393px x 877px)
  // ==========================================
  if (isEditingJob) {
    return (
      <EditJobMobileScreen
        initialData={{
          role,
          company,
          location,
          workMode,
          experience,
          workType,
        }}
        onSave={(data) => {
          setRole(data.role);
          setCompany(data.company);
          setLocation(data.location);
          setLocationQuery(data.location);
          setWorkMode(data.workMode);
          setExperience(data.experience);
          setWorkType(data.workType);
          setIsEditingJob(false);
          setIsDirty(true);
          toast.success('Job details updated');
        }}
        onCancel={() => setIsEditingJob(false)}
      />
    );
  }

  // SCREEN 5: PREVIEW PAGE (Figma: Preview page 393px x 979px)
  // ==========================================
  return (
    <div className="w-full min-h-screen flex flex-col items-center relative py-6 px-4 font-dm-sans bg-ds-bg overflow-y-auto">
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
      {/* Top Nav Bar */}
      <div className="w-full max-w-[360px] flex flex-row justify-between items-center h-6 mb-4 shrink-0">
        <button
          onClick={onClose || onBack}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">Back</span>
        </button>
        <button
          onClick={onClose || onBack}
          type="button"
          aria-label="Cancel"
          className="text-ds-text-primary hover:text-ds-accent transition-colors p-1 bg-transparent border-none outline-none cursor-pointer"
        >
          <Icon icon="solar:close-linear" className="w-5 h-5 shrink-0" />
        </button>
      </div>

      {/* Frame 2610015: Main Preview Content Container */}
      <div className="w-full max-w-[360px] flex flex-col items-center gap-5 pb-12">
        {/* Frame 2608873: Job Title + Company + Edit Pencil */}
        <div className="w-full flex flex-row items-center justify-between gap-2">
          <div className="flex-1 flex flex-col items-start min-w-0">
            {isEditingRole ? (
              <input
                type="text"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setIsDirty(true);
                }}
                onBlur={() => setIsEditingRole(false)}
                autoFocus
                className="w-full bg-ds-surface-1 border border-ds-border rounded px-2 py-1 text-ds-text-primary text-base font-semibold leading-6 font-dm-sans"
              />
            ) : (
              <h2 className="w-full text-ds-text-primary text-base font-semibold leading-6 font-dm-sans truncate">
                {role || 'UI/UX Designer'}
              </h2>
            )}
            <span className="text-ds-text-primary text-sm font-medium leading-5 font-dm-sans truncate">
              {company || 'Driftline Digital'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingJob(true)}
            aria-label="Edit title"
            className="p-1 text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none cursor-pointer shrink-0"
          >
            <Icon icon="lucide:pencil" className="size-5" />
          </button>
        </div>

        {/* Frame 2608881: 4 Summary Metric Cards (2x2 Grid) */}
        <div className="w-full p-2 bg-transparent rounded-2xl flex flex-col gap-3">
          {/* Row 1: Experience & Work Mode */}
          <div className="w-full flex flex-row items-center justify-between gap-4">
            {/* Experience */}
            <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
              <div className="flex items-center gap-2 text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
                <Icon icon="lucide:briefcase" className="size-4 shrink-0" />
                <span>Experience</span>
              </div>
              <span className="text-ds-text-primary text-base font-normal leading-6 font-dm-sans truncate">
                {experience || '0-2Yrs'}
              </span>
            </div>

            {/* Work Mode */}
            <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
              <div className="flex items-center gap-2 text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
                <Icon icon="lucide:map-pin" className="size-4 shrink-0" />
                <span>Work mode</span>
              </div>
              <span className="text-ds-text-primary text-base font-normal leading-6 font-dm-sans truncate">
                {workMode || 'Hybrid'}
              </span>
            </div>
          </div>

          {/* Row 2: Work Type & Salary */}
          <div className="w-full flex flex-row items-center justify-between gap-4">
            {/* Work Type */}
            <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
              <div className="flex items-center gap-2 text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
                <Icon icon="lucide:calendar" className="size-4 shrink-0" />
                <span>Work type</span>
              </div>
              <span className="text-ds-text-primary text-base font-normal leading-6 font-dm-sans truncate">
                {workType || 'Full Time'}
              </span>
            </div>

            {/* Salary */}
            <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
              <div className="flex items-center gap-2 text-ds-text-secondary text-xs font-normal leading-4 font-dm-sans">
                <Icon icon="lucide:dollar-sign" className="size-4 shrink-0" />
                <span>Salary</span>
              </div>
              <span className="text-ds-text-primary text-base font-normal leading-6 font-dm-sans truncate">
                {displaySalary}
              </span>
            </div>
          </div>
        </div>

        {/* Frame 2608778: AI Rewrite Header, Regenerate button, and Description Textarea with inline error handling (matching desktop StepJobDetails) */}
        <div className="w-full flex flex-col items-start gap-2.5">
          {/* Header row: Rewrite with AI label on left + Regenerate with AI button on right */}
          <div className="w-full flex items-center justify-between">
            <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
              Rewrite with AI
            </span>
            <button
              type="button"
              onClick={handleRegenerateWithAi}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-1.5 text-ds-accent hover:opacity-85 active:scale-95 transition-all text-sm font-medium font-dm-sans leading-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border-none p-0"
            >
              <CyphexAIIcon
                size={20}
                className={`w-4 h-4 text-ds-accent shrink-0 ${isAiGenerating ? 'animate-cyphex' : ''}`}
              />
              <span>{isAiGenerating ? 'Generating...' : 'Regenerate with AI'}</span>
            </button>
          </div>

          {/* Description Textarea with 200 character minimum validation, 10,000 character counter, and red inline error message (matching desktop) */}
          <div
            className={cn(
              "w-full relative border-b transition-colors pb-3 flex flex-col gap-1.5",
              isDescriptionError
                ? "border-ds-error"
                : "border-ds-border focus-within:border-ds-accent"
            )}
          >
            <label className="text-ds-text-muted text-xs font-medium font-dm-sans leading-4">
              Job description
            </label>
            {isAiGenerating ? (
              <div className="w-full min-h-[140px] flex flex-col gap-3 py-2">
                <div className="h-4 bg-ds-surface-1/90 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-ds-surface-1/80 rounded w-full animate-pulse" />
                <div className="h-4 bg-ds-surface-1/70 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-ds-surface-1/80 rounded w-2/3 animate-pulse" />
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                maxLength={10000}
                placeholder="Write a job description, including the role overview, key responsibilities, required skills, and qualifications..."
                rows={5}
                className="w-full min-h-[140px] bg-transparent text-sm font-normal text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-relaxed outline-none resize-none"
              />
            )}
            <div className="flex items-center justify-end w-full">
              <span
                className={cn(
                  "text-[11px] font-medium font-dm-sans transition-colors",
                  description.length >= 10000 ? "text-ds-error" : "text-ds-text-muted"
                )}
              >
                {description.length}/10000
              </span>
            </div>
            {isDescriptionError && (
              <span className="text-ds-error text-xs font-dm-sans leading-4 mt-1">
                {description.length >= 10000
                  ? "Job description cannot exceed 10,000 characters"
                  : "Job description must contain at least 200 characters"}
              </span>
            )}
          </div>
        </div>

        {/* Frame 2609988: Additional Form Inputs */}
        <div className="w-full flex flex-col items-start gap-3">
          {/* Industry Type Dropdown matching Cocpit standard */}
          <div
            ref={industryDropdownRef}
            className={`w-full py-2 border-b flex flex-col justify-center items-start gap-1 relative transition-colors ${
              isIndustryDropdownOpen ? 'border-ds-accent' : 'border-ds-border hover:border-ds-text-muted'
            }`}
          >
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Industry type
            </label>
            <div
              onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
              className="w-full flex flex-row justify-between items-center cursor-pointer select-none"
            >
              <span className="text-ds-text-primary text-sm font-normal leading-5 font-dm-sans">
                {industry || 'Technology'}
              </span>
              <div
                className={`w-4 h-4 flex items-center justify-center text-ds-text-secondary transition-transform duration-200 ${
                  isIndustryDropdownOpen ? 'rotate-180' : ''
                }`}
              >
                <DownArrowIcon size={16} className="w-4 h-4" />
              </div>
            </div>

            {/* Standard Cocpit Dropdown with Search */}
            {isIndustryDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full p-2.5 bg-ds-bg rounded-xl border border-ds-border shadow-2xl flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar */}
                <div className="w-full px-2.5 py-1.5 rounded-lg bg-ds-surface-1 border border-ds-border focus-within:border-ds-accent flex items-center gap-2 transition-colors">
                  <Icon icon="lucide:search" className="w-3.5 h-3.5 text-ds-text-secondary shrink-0" />
                  <input
                    ref={industrySearchInputRef}
                    type="text"
                    value={industrySearchQuery}
                    onChange={(e) => setIndustrySearchQuery(e.target.value)}
                    placeholder="Search industry..."
                    autoComplete="off"
                    className="w-full bg-transparent text-sm text-ds-text-primary placeholder:text-ds-text-muted font-dm-sans leading-normal py-0.5 outline-none"
                  />
                  {industrySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIndustrySearchQuery('')}
                      className="text-ds-text-secondary hover:text-ds-text-primary p-0.5 bg-transparent border-none cursor-pointer flex items-center justify-center outline-none"
                    >
                      <CloseCrossIcon size={14} className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div className="w-full max-h-48 overflow-y-auto flex flex-col gap-1 scrollbar-hide pr-1">
                  {isLoadingIndustries ? (
                    <div className="w-full py-4 text-center text-ds-text-muted text-xs font-dm-sans flex items-center justify-center gap-2">
                      <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth" />
                      <span>Loading industries...</span>
                    </div>
                  ) : backendIndustries.length > 0 ? (
                    backendIndustries.map((opt) => {
                      const isSelected = (industry || '').toLowerCase() === opt.label.toLowerCase();
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setIndustry(opt.label);
                            setIsDirty(true);
                            setIsIndustryDropdownOpen(false);
                            setIndustrySearchQuery('');
                          }}
                          className={`w-full text-left font-sans text-sm font-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate ${
                            isSelected
                              ? 'text-ds-accent font-medium bg-ds-surface-1'
                              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="w-full py-4 text-center text-ds-text-muted text-xs font-dm-sans">
                      No industries found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Min Salary Input with Currency Symbol (matching desktop StepJobDetails) */}
          <div className="w-full py-2 border-b border-ds-border focus-within:border-ds-accent transition-colors flex flex-col justify-center items-start gap-1">
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Min salary (annual)
            </label>
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-sm font-normal text-ds-text-muted font-dm-sans select-none">₹</span>
              <input
                type="text"
                value={minSalary}
                onChange={(e) => {
                  setMinSalary(e.target.value.replace(/[^0-9,]/g, ''));
                  setIsDirty(true);
                }}
                placeholder="1,200,000"
                className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
              />
            </div>
          </div>

          {/* Max Salary Input with Range Validation and Inline Error (matching desktop StepJobDetails) */}
          <div
            className={cn(
              "w-full py-2 border-b flex flex-col justify-center items-start gap-1 relative transition-colors",
              isSalaryRangeInvalid ? "border-ds-error" : "border-ds-border focus-within:border-ds-accent"
            )}
          >
            <label className="text-ds-text-secondary text-xs font-medium leading-4 font-dm-sans">
              Max salary (annual)
            </label>
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-sm font-normal text-ds-text-muted font-dm-sans select-none">₹</span>
              <input
                type="text"
                value={maxSalary}
                onChange={(e) => {
                  setMaxSalary(e.target.value.replace(/[^0-9,]/g, ''));
                  setIsDirty(true);
                }}
                placeholder="1,200,000"
                className="w-full bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0 font-dm-sans"
              />
            </div>
            {isSalaryRangeInvalid && (
              <span className="text-ds-error text-xs font-dm-sans leading-4 mt-1">
                Maximum salary must be greater than or equal to minimum salary
              </span>
            )}
          </div>
        </div>

        {/* Frame 2609956: Bottom Action Buttons (width: 360px, height: 48px, gap: 8px) */}
        <div className="w-full max-w-[360px] h-12 flex flex-row justify-end items-center gap-2 pt-2 shrink-0">
          {/* Primary emphasis button: Publish is locked/inactive when validation fails, active when all requirements met */}
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={!isPublishEnabled || isPublishing}
            className={cn(
              "w-[115px] h-9 px-3 py-1.5 rounded-full flex items-center justify-center font-dm-sans font-medium text-base leading-6 whitespace-nowrap shrink-0 transition-all border-none outline-none",
              isPublishEnabled && !isPublishing
                ? "bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-ds-accent"
                : "bg-ds-surface-1 text-ds-text-muted cursor-not-allowed opacity-50"
            )}
          >
            {isPublishing ? (
              <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
            ) : (
              <span className="whitespace-nowrap">Publish</span>
            )}
          </button>

          {/* Secondary button: Save draft when dirty, Delete draft when clean */}
          {isDirty ? (
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSavingDraft}
              className="w-[115px] h-9 px-3 py-1.5 border border-ds-border hover:bg-ds-surface-1 active:scale-95 text-ds-text-primary rounded-full flex items-center justify-center font-dm-sans font-medium text-base leading-6 whitespace-nowrap shrink-0 transition-all cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-50"
            >
              <span className="whitespace-nowrap">{isSavingDraft ? 'Saving...' : 'Save draft'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeleteDraft || onBack}
              className="w-[115px] h-9 px-3 py-1.5 border border-ds-border hover:bg-ds-surface-1 active:scale-95 text-ds-text-primary rounded-full flex items-center justify-center font-dm-sans font-medium text-base leading-6 whitespace-nowrap shrink-0 transition-all cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              <span className="whitespace-nowrap">Delete draft</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobMobileWizard;
