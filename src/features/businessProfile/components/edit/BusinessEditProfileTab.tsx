/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronDown, Search, MapPin, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useDebounce } from "@/hooks/use-debounce";
import { STATIC_LOCATIONS, StaticLocation } from "@/data/staticLocations";
import {
  searchPlaces,
  getPlaceDetails,
  PlacesSuggestion,
  StructuredLocation,
} from "@/services/api/location";
import { InteractiveLocationMap } from "@/features/company-onboarding/components/InteractiveLocationMap";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { useToast } from "@/hooks/use-toast";
import { useBusinessEditStore } from "../../store/useBusinessEditStore";
import { INDUSTRY_OPTIONS, INSTITUTION_INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS } from "@/constants/organizationOptions";
import { getOnboardingOptions } from "@/services/api/onboarding";
import { CocpitUserProfileImageEditor } from "@/shared/commonComponents/CocpitUserProfileImageEditor";
import { CocpitUserCoverImageEditor } from "@/shared/commonComponents/CocpitUserCoverImageEditor";
import { BusinessBuildingIcon, ProfileEditIcon } from "@/components/icons";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { cn } from "@/lib/utils";

interface BusinessEditProfileTabProps {
  onCancel: () => void;
  orgId: string;
  currentLogoUrl?: string;
  currentCoverUrl?: string;
  currentOrgName?: string;
}

const normalizeIndustry = (
  val: string | undefined,
  isInst: boolean
): string => {
  if (!val) {
    return isInst ? INSTITUTION_INDUSTRY_OPTIONS[0].label : "";
  }
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();

  // 1. For Institutions: match against institution options (School, College, University, Coaching, Tuition)
  if (isInst) {
    const matchedInst = INSTITUTION_INDUSTRY_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower
    );
    return matchedInst ? matchedInst.label : trimmed;
  }

  // 2. For Companies: if it is a legacy snake_case slug (e.g. "software_saas"), map to label
  const legacyMatch = INDUSTRY_OPTIONS.find((opt) => opt.value.toLowerCase() === lower);
  if (legacyMatch) return legacyMatch.label;

  // 3. Otherwise: show the industry directly as it came from the backend
  return trimmed;
};

const getCompanySizeLabel = (val?: string): string => {
  if (!val) return "";
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  const matched = COMPANY_SIZE_OPTIONS.find(
    (opt) =>
      opt.label.toLowerCase() === lower ||
      opt.value.toLowerCase() === lower ||
      opt.label.replace(/–/g, "-").toLowerCase() === lower.replace(/–/g, "-")
  );
  return matched ? matched.label : trimmed;
};

export default function BusinessEditProfileTab({
  onCancel,
  orgId,
  currentLogoUrl,
  currentCoverUrl,
  currentOrgName,
}: BusinessEditProfileTabProps) {
  const { slug } = useParams() as { slug: string };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshCompanies, refreshProfile } = useActiveProfile();

  const [modalType, setModalType] = useState<"logo" | "cover" | null>(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["orgProfile", slug],
    queryFn: () => businessProfileService.getOrgProfile(slug),
  });

  const { profileDraft, setProfileDraft, clearProfileDraft, hydrateProfileDraft } = useBusinessEditStore();
  const formData = profileDraft;

  const isInstitution =
    (profileData?.org || profileData)?.entity_type === "INSTITUTION" ||
    (profileData?.org || profileData)?.entityType === "INSTITUTION" ||
    Boolean((profileData?.org || profileData)?.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(((profileData?.org || profileData)?.industry || "").toLowerCase().trim());

  const [initialData, setInitialData] = useState<{
    name: string;
    industry: string;
    foundedYear: string;
    size: string;
    website: string;
    country: string;
    city: string;
    headline: string;
  } | null>(null);

  const sessionToken = useRef(uuidv4());
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState(formData.city || "");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  const [placesSuggestions, setPlacesSuggestions] = useState<PlacesSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Industry custom dropdown states (Matching StepIdentity)
  const [backendIndustries, setBackendIndustries] = useState<{ id: string; label: string }[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState(formData.industry || "");
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const industryInputRef = useRef<HTMLInputElement>(null);

  // Organization Size custom dropdown states (Matching StepPresence)
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch industries from onboarding API for companies
  useEffect(() => {
    if (isInstitution) return;
    let isCancelled = false;

    const fetchIndustries = async () => {
      setIsLoadingIndustries(true);
      try {
        const data = await getOnboardingOptions("industries");
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setBackendIndustries(
            data.map((item) => ({ id: item.id || item.label, label: item.label }))
          );
        }
      } catch (err) {
        console.error("Failed to load industries from backend API:", err);
      } finally {
        if (!isCancelled) setIsLoadingIndustries(false);
      }
    };

    fetchIndustries();
    return () => {
      isCancelled = true;
    };
  }, [isInstitution]);

  // Sync industrySearchQuery when industry in store changes
  useEffect(() => {
    if (formData.industry && !isIndustryDropdownOpen) {
      setIndustrySearchQuery(formData.industry);
    }
  }, [formData.industry, isIndustryDropdownOpen]);

  const activeIndustryOptions = useMemo(() => {
    if (isInstitution) {
      return INSTITUTION_INDUSTRY_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }));
    }
    if (backendIndustries.length > 0) {
      return backendIndustries;
    }
    return INDUSTRY_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }));
  }, [isInstitution, backendIndustries]);

  const filteredIndustries = useMemo(() => {
    if (!industrySearchQuery.trim()) return activeIndustryOptions;
    const q = industrySearchQuery.toLowerCase().trim();
    return activeIndustryOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [activeIndustryOptions, industrySearchQuery]);

  const handleSelectIndustry = useCallback((val: string) => {
    setProfileDraft({ industry: val });
    setIndustrySearchQuery(val);
    setIsIndustryDropdownOpen(false);
  }, [setProfileDraft]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
      if (
        industryDropdownRef.current &&
        !industryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsIndustryDropdownOpen(false);
        setIndustrySearchQuery(formData.industry || "");
      }
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSizeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formData.industry]);

  // Keep locationQuery in sync with store when formData.city updates
  useEffect(() => {
    if (formData.city && !locationQuery) {
      const tokens = formData.city.split(",").map((s: string) => s.trim()).filter(Boolean);
      const deduped = tokens.filter((t: string, idx: number) => tokens.indexOf(t) === idx).join(", ");
      setLocationQuery(deduped || formData.city);
    }
  }, [formData.city, locationQuery]);

  // Google Places Autocomplete search effect matching onboarding
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
        console.error("Google Places search error:", err);
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
    async (loc: PlacesSuggestion | StaticLocation | string) => {
      setIsLocationDropdownOpen(false);

      if (typeof loc === "string") {
        setLocationQuery(loc);
        setProfileDraft({ city: loc });
        return;
      }

      // Static location from curated list
      if ("formattedAddress" in loc) {
        const fullText = loc.formattedAddress || loc.city;
        setLocationQuery(fullText);
        setProfileDraft({
          city: fullText,
          country: loc.country || formData.country,
        });
        if (loc.latitude != null) setLatitude(loc.latitude);
        if (loc.longitude != null) setLongitude(loc.longitude);
        return;
      }

      // Google Places suggestion
      const fallbackText = loc.description || loc.displayName || "";
      setLocationQuery(fallbackText);
      setProfileDraft({ city: fallbackText });

      if (loc.placeId) {
        try {
          const details = await getPlaceDetails(loc.placeId, sessionToken.current, true);
          sessionToken.current = uuidv4();
          if (details) {
            const fullAddress =
              details.formattedAddress ||
              [details.street, details.sublocality, details.city, details.state, details.country].filter(Boolean).join(", ") ||
              fallbackText;
            setLocationQuery(fullAddress);
            setProfileDraft({
              city: fullAddress,
              country: details.country || formData.country,
            });
            if (details.latitude != null) setLatitude(details.latitude);
            if (details.longitude != null) setLongitude(details.longitude);
          }
        } catch (err) {
          console.error("Failed to get place details:", err);
        }
      }
    },
    [formData.country, setProfileDraft]
  );

  const handleMapLocationChange = useCallback(
    (loc: StructuredLocation) => {
      const fullAddress =
        loc.formattedAddress ||
        [loc.street, loc.sublocality || loc.village, loc.city, loc.state, loc.country]
          .filter(Boolean)
          .join(", ");
      if (fullAddress) {
        setLocationQuery(fullAddress);
        setProfileDraft({
          city: fullAddress,
          country: loc.country || formData.country,
        });
      }
      if (loc.latitude != null) setLatitude(loc.latitude);
      if (loc.longitude != null) setLongitude(loc.longitude);
    },
    [formData.country, setProfileDraft]
  );

  const filteredPopularLocations = useMemo(
    () =>
      STATIC_LOCATIONS.filter((loc) =>
        locationQuery.trim()
          ? (loc.formattedAddress || loc.city)
              .toLowerCase()
              .includes(locationQuery.toLowerCase().trim())
          : true
      ).slice(0, 8),
    [locationQuery]
  );

  useEffect(() => {
    if (profileData) {
      const org = profileData.org || profileData;
      const isInst =
        org.entity_type === "INSTITUTION" ||
        org.entityType === "INSTITUTION" ||
        Boolean(org.institution_type) ||
        ["school", "college", "university", "coaching", "tuition", "higher education"].includes((org.industry || "").toLowerCase().trim());

      // In edit profile, show the full address so the user can see and edit the exact location
      const fullAddress = (org.location_formatted || org.location || org.headquarter || org.city || "").trim();

      const newForm = {
        name: org.name || "",
        industry: normalizeIndustry(isInst ? org.institution_type : org.industry, isInst),
        foundedYear: org.established_year?.toString() || org.founded?.toString() || "",
        size: getCompanySizeLabel(org.size || org.employeeCount),
        website: org.website || org.websiteUrl || "",
        country: org.country || "India",
        city: fullAddress,
        headline: org.headline || org.tagline || "",
      };
      setInitialData(newForm);
      setLocationQuery(fullAddress);
      hydrateProfileDraft({ ...newForm }, slug);

      if (org.latitude != null) setLatitude(org.latitude);
      if (org.longitude != null) setLongitude(org.longitude);
    }
  }, [profileData, slug, hydrateProfileDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "foundedYear") {
      const sanitized = value.replace(/\D/g, "").slice(0, 4);
      setProfileDraft({ [name]: sanitized });
      return;
    }
    setProfileDraft({ [name]: value });
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl || null);
  const [stagedLogoFile, setStagedLogoFile] = useState<File | null>(null);
  const [isLogoDeleted, setIsLogoDeleted] = useState(false);

  const [coverPreview, setCoverPreview] = useState<string | null>(currentCoverUrl || null);
  const [stagedCoverFile, setStagedCoverFile] = useState<File | null>(null);
  const [isCoverDeleted, setIsCoverDeleted] = useState(false);

  const [modalFile, setModalFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentLogoUrl !== undefined) {
      setLogoPreview(currentLogoUrl || null);
    }
  }, [currentLogoUrl]);

  useEffect(() => {
    if (currentCoverUrl !== undefined) {
      setCoverPreview(currentCoverUrl || null);
    }
  }, [currentCoverUrl]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModalFile(file);
      setModalType("logo");
    }
    e.target.value = "";
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModalFile(file);
      setModalType("cover");
    }
    e.target.value = "";
  };

  const handleLogoClick = () => {
    if (!logoPreview) {
      logoFileInputRef.current?.click();
    } else {
      setModalFile(null);
      setModalType("logo");
    }
  };

  const handleCoverClick = () => {
    if (!coverPreview) {
      coverFileInputRef.current?.click();
    } else {
      setModalFile(null);
      setModalType("cover");
    }
  };

  const isMediaDirty =
    Boolean(stagedLogoFile) ||
    isLogoDeleted ||
    Boolean(stagedCoverFile) ||
    isCoverDeleted;

  const isLocationChanged = Boolean(
    initialData && (
      (locationQuery || "").trim().toLowerCase() !== (initialData.city || "").trim().toLowerCase() ||
      (profileDraft.city || "").trim().toLowerCase() !== (initialData.city || "").trim().toLowerCase()
    )
  );

  const isFieldsDirty = Boolean(
    initialData && (
      (profileDraft.name || "").trim() !== (initialData.name || "").trim() ||
      (profileDraft.industry || "").trim() !== (initialData.industry || "").trim() ||
      (profileDraft.foundedYear || "").trim() !== (initialData.foundedYear || "").trim() ||
      (profileDraft.size || "").trim() !== (initialData.size || "").trim() ||
      (profileDraft.website || "").trim() !== (initialData.website || "").trim() ||
      profileDraft.country !== initialData.country ||
      isLocationChanged ||
      (profileDraft.headline || "").trim() !== (initialData.headline || "").trim()
    )
  );

  const isLocationValid = Boolean((locationQuery || formData.city || "").trim());
  const isNameValid = Boolean((formData.name || "").trim().length >= 2);
  const isFormValid = isLocationValid && isNameValid;

  const isDirty = Boolean(initialData) && (isFieldsDirty || isMediaDirty);
  const canSave = isDirty && isFormValid && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    try {
      // 1. Upload or Delete Logo if staged
      if (stagedLogoFile) {
        await businessProfileService.uploadLogo(orgId, stagedLogoFile);
      } else if (isLogoDeleted) {
        await businessProfileService.deleteLogo(orgId);
      }

      // 2. Upload or Delete Cover if staged
      if (stagedCoverFile) {
        await businessProfileService.uploadCover(orgId, stagedCoverFile);
      } else if (isCoverDeleted) {
        await businessProfileService.deleteCover(orgId);
      }

      // 3. Update Profile text fields if changed
      const locRaw = (locationQuery || formData.city || "").trim();
      const locationTokens = locRaw
        ? locRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      const locationFormatted = locationTokens
        .filter((t: string, idx: number) => locationTokens.indexOf(t) === idx)
        .join(", ") || locRaw;

      if (isFieldsDirty || (initialData && locationFormatted !== initialData.city)) {
        const response = await businessProfileService.updateOrgProfile(orgId, {
          name: formData.name,
          headline: formData.headline,
          industry: formData.industry,
          size: formData.size,
          website: formData.website,
          country: formData.country,
          city: locationFormatted,
          location: locationFormatted,
          formattedAddress: locationFormatted,
          headquarter: locationFormatted,
          latitude: latitude,
          longitude: longitude,
          established_year: parseInt(formData.foundedYear) || undefined,
        });

        queryClient.setQueryData(["orgProfile", slug], (old: any) => {
          if (!old) return old;
          const wrapped = "org" in old;
          const prevOrg = wrapped ? old.org : old;
          const serverOrg = response?.organization || response?.org;
          const displayLoc = serverOrg?.location || locationFormatted;
          const nextOrg = {
            ...prevOrg,
            ...serverOrg,
            city: displayLoc,
            location: displayLoc,
            headquarter: displayLoc,
            location_formatted: locationFormatted,
            latitude: latitude ?? prevOrg.latitude,
            longitude: longitude ?? prevOrg.longitude,
          };
          return wrapped ? { ...old, org: nextOrg } : nextOrg;
        });

        queryClient.setQueryData(["companyProfile", slug], (old: any) => {
          if (!old) return old;
          const wrapped = "org" in old;
          const prevOrg = wrapped ? old.org : old;
          const serverOrg = response?.organization || response?.org;
          const displayLoc = serverOrg?.location || locationFormatted;
          const nextOrg = {
            ...prevOrg,
            ...serverOrg,
            city: displayLoc,
            location: displayLoc,
            headquarter: displayLoc,
            location_formatted: locationFormatted,
            latitude: latitude ?? prevOrg.latitude,
            longitude: longitude ?? prevOrg.longitude,
          };
          return wrapped ? { ...old, org: nextOrg } : nextOrg;
        });

        queryClient.setQueryData(["orgAbout", slug], (old: any) => {
          if (!old) return old;
          const prevAbout = old.about || old;
          const nextAbout = {
            ...prevAbout,
            city: locationFormatted,
            location: locationFormatted,
            headquarter: locationFormatted,
          };
          return "about" in old ? { ...old, about: nextAbout } : nextAbout;
        });
      }

      toast({
        title: "Success",
        description: "Profile changes saved successfully!",
      });

      setStagedLogoFile(null);
      setIsLogoDeleted(false);
      setStagedCoverFile(null);
      setIsCoverDeleted(false);

      setLocationQuery(locationFormatted);
      setProfileDraft({ city: locationFormatted });

      setInitialData({
        name: formData.name,
        industry: formData.industry,
        foundedYear: formData.foundedYear,
        size: formData.size,
        website: formData.website,
        country: formData.country,
        city: locationFormatted,
        headline: formData.headline,
      });

      hydrateProfileDraft(
        {
          name: formData.name,
          industry: formData.industry,
          foundedYear: formData.foundedYear,
          size: formData.size,
          website: formData.website,
          country: formData.country,
          city: locationFormatted,
          headline: formData.headline,
        },
        slug
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orgProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["companyProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["orgAbout"] }),
        queryClient.invalidateQueries({ queryKey: ["switchableCompanies"] }),
      ]);
      await refreshCompanies?.();
      await refreshProfile?.();
    } catch (error: any) {
      console.error("Save profile error:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      hydrateProfileDraft({ ...initialData }, slug);
      setLocationQuery(initialData.city);
    }
    onCancel();
  };

  if (isLoading) {
    return <div className="py-10 text-center text-ds-text-muted font-['DM_Sans']">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-10 pb-12 sm:pb-0">
      {/* Media: Cover Banner & Avatar matching Figma Frame 2609634 (w-full / 800px, h-[268px] relative) */}
      <div className="w-full h-40 sm:h-[268px] relative select-none">
        {/* Banner: 800px x 200px, top-0, rounded-2xl on desktop; h-28 rounded-lg on mobile */}
        <div
          className={cn(
            "w-full max-w-[800px] h-28 sm:h-[200px] left-0 top-0 absolute rounded-lg sm:rounded-2xl overflow-hidden flex flex-col justify-center items-center",
            coverPreview ? "" : "bg-ds-surface-1 border border-ds-border"
          )}
        >
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover banner"
              onDoubleClick={() => coverFileInputRef.current?.click()}
              title="Double-click to change banner"
              className="w-full h-full object-cover rounded-lg sm:rounded-2xl cursor-pointer"
            />
          ) : (
            <div
              onClick={handleCoverClick}
              className="w-full h-full flex flex-col justify-center items-center pl-[92px] pr-12 sm:px-4 gap-1 sm:gap-2 p-2 sm:p-[10px] cursor-pointer"
            >
              <div className="text-center text-ds-text-primary text-xs sm:text-base font-medium font-['DM_Sans'] leading-4 sm:leading-6">
                Add banner
              </div>
              <div className="text-center text-ds-text-secondary text-[11px] sm:text-xs font-normal font-['DM_Sans'] leading-4">
                Recommended: 16:9 · At least 1200 × 675 px · JPG, PNG
              </div>
            </div>
          )}

          {/* Cover Edit Button: right-4 bottom-2 on mobile, right-4 bottom-4 inside banner on desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCoverClick();
            }}
            className="absolute right-3 sm:right-4 bottom-2 sm:bottom-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--ds-surface-1)]/90 backdrop-blur-sm p-1 sm:p-1.5 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md border border-[var(--ds-border)]"
            aria-label="Edit cover photo"
          >
            <ProfileEditIcon size={18} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ds-accent)]" />
          </button>
        </div>

        {/* Square Avatar: 80x80 left-4 top-[72px] on mobile; 120px x 120px, left-[20px] top-[140px] on desktop */}
        <div className="absolute left-4 top-[72px] sm:left-[20px] sm:top-[140px] w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-xl sm:rounded-[12px] shrink-0 z-10">
          <div
            className={cn(
              "w-full h-full rounded-xl sm:rounded-[12px] overflow-hidden flex flex-col justify-center items-center border border-[var(--ds-border)]/40 sm:border-0",
              logoPreview ? "" : "bg-[var(--ds-surface-2)]"
            )}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt={formData.name || "Organization logo"}
                onDoubleClick={() => logoFileInputRef.current?.click()}
                title="Double-click to change logo"
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <button
                type="button"
                onClick={handleLogoClick}
                aria-label="Add organization logo"
                className="w-full h-full flex flex-col justify-center items-center cursor-pointer bg-transparent border-none p-2 sm:p-[10px]"
              >
                <BusinessBuildingIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--ds-text-primary)] flex-none" />
              </button>
            )}
          </div>

          {/* Avatar Edit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLogoClick();
            }}
            className="absolute -right-1 -bottom-1 sm:-right-2 sm:-bottom-2 w-7 h-7 sm:w-[34px] sm:h-[34px] rounded-full bg-[var(--ds-surface-1)] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md border border-[var(--ds-border)] sm:border-0"
            aria-label="Edit organization logo"
          >
            <ProfileEditIcon size={18} className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-[var(--ds-accent)]" />
          </button>
        </div>
      </div>

      {/* Form Fields: Minimalist Underline Style matching Figma ref (w-full within 616px) */}
      <div className="w-full max-w-[616px] mx-auto flex flex-col justify-start items-start gap-10">
        
        {/* Row 1: Organization Name & Industry */}
        <div className="self-stretch inline-flex flex-col sm:flex-row justify-start items-center gap-10">
          {/* Organization Name */}
          <div className="w-full sm:w-72 py-2 border-b border-ds-border inline-flex flex-col justify-center items-start gap-2.5">
            <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              {isInstitution ? "Institution name" : "Organization name"}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={isInstitution ? "Institution name" : "Organization name"}
              required
              minLength={2}
              maxLength={100}
              className="w-full text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>

          {/* Industry Selection with Search & Custom Dropdown matching StepIdentity */}
          <div
            ref={industryDropdownRef}
            className="w-full sm:w-72 relative"
          >
            <div
              onClick={() => {
                industryInputRef.current?.focus({ preventScroll: true });
                setIsIndustryDropdownOpen(true);
              }}
              className={cn(
                "w-full py-2 border-b flex flex-col justify-center items-start gap-2.5 transition-colors cursor-text",
                isIndustryDropdownOpen ? "border-ds-accent" : "border-ds-border hover:border-ds-text-muted"
              )}
            >
              <label
                htmlFor="industry-search-input"
                className="text-left text-ds-text-secondary font-['DM_Sans'] text-xs font-medium leading-4 cursor-pointer"
              >
                {isInstitution ? "Institution type" : "Industry"}
              </label>
              <div className="self-stretch inline-flex justify-between items-center">
                <input
                  id="industry-search-input"
                  ref={industryInputRef}
                  type="text"
                  value={industrySearchQuery}
                  onChange={(e) => {
                    setIndustrySearchQuery(e.target.value);
                    if (!isIndustryDropdownOpen) setIsIndustryDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsIndustryDropdownOpen(true);
                  }}
                  placeholder={isInstitution ? "Select institution type" : "Select industry"}
                  autoComplete="off"
                  className="w-full bg-transparent font-['DM_Sans'] text-sm leading-5 focus:outline-none placeholder:text-ds-text-muted text-ds-text-primary cursor-text"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Toggle industry options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsIndustryDropdownOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setTimeout(() => industryInputRef.current?.focus({ preventScroll: true }), 0);
                      }
                      return next;
                    });
                  }}
                  className="p-1 -mr-1 flex items-center justify-center cursor-pointer text-ds-text-primary focus:outline-none"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isIndustryDropdownOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Industry Dropdown Menu */}
            {isIndustryDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-full p-3 bg-ds-bg rounded-2xl border border-ds-border shadow-2xl inline-flex flex-col justify-start items-center gap-3 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div
                  role="listbox"
                  className="self-stretch flex flex-col justify-start items-start gap-1 max-h-48 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {isLoadingIndustries ? (
                    <div className="w-full py-3 text-center text-ds-text-muted text-sm font-['DM_Sans']">
                      Loading industries...
                    </div>
                  ) : filteredIndustries.length > 0 ? (
                    filteredIndustries.map((opt) => {
                      const isSelected =
                        (formData.industry || "").toLowerCase() === opt.label.toLowerCase() ||
                        (formData.industry || "").toLowerCase() === opt.id.toLowerCase();
                      return (
                        <div
                          key={opt.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectIndustry(opt.label)}
                          className="self-stretch h-9 inline-flex justify-between items-center px-2 rounded-lg cursor-pointer group select-none"
                        >
                          <span
                            title={opt.label}
                            className={cn(
                              "justify-start text-sm font-normal font-['DM_Sans'] leading-5 transition-colors cursor-pointer truncate",
                              isSelected
                                ? "text-ds-accent font-medium"
                                : "text-ds-text-secondary group-hover:text-ds-text-primary"
                            )}
                          >
                            {opt.label}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full py-3 text-center text-ds-text-muted text-sm font-['DM_Sans']">
                      No options found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Founded Year & Organization Size */}
        <div className="self-stretch inline-flex flex-col sm:flex-row justify-start items-center gap-10">
          {/* Founded Year */}
          <div className="w-full sm:w-72 py-2 border-b border-ds-border inline-flex flex-col justify-center items-start gap-2.5">
            <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              Founded year
            </label>
            <input
              type="text"
              name="foundedYear"
              value={formData.foundedYear}
              onChange={handleChange}
              placeholder="e.g. 2026"
              maxLength={4}
              inputMode="numeric"
              className="w-full text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>

          {/* Organization Size Custom Dropdown matching StepPresence */}
          <div ref={sizeDropdownRef} className="w-full sm:w-72 relative">
            <div
              onClick={() => setIsSizeDropdownOpen((prev) => !prev)}
              className={cn(
                "w-full py-2 border-b flex flex-col justify-center items-start gap-2.5 cursor-pointer transition-colors",
                isSizeDropdownOpen ? "border-ds-accent" : "border-ds-border hover:border-ds-text-muted"
              )}
            >
              <span className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                Organization size
              </span>
              <div className="w-full inline-flex justify-between items-center">
                <span
                  className={cn(
                    "text-sm font-normal font-['DM_Sans'] leading-5",
                    formData.size ? "text-ds-text-primary" : "text-ds-text-muted"
                  )}
                >
                  {getCompanySizeLabel(formData.size) || "Select size"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-ds-text-primary transition-transform duration-200",
                    isSizeDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </div>
            </div>

            {/* Dropdown Options */}
            {isSizeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-full p-1.5 bg-ds-bg rounded-xl border border-ds-border inline-flex flex-col justify-start items-center gap-1 overflow-hidden shadow-2xl animate-in fade-in duration-150">
                <div
                  className="self-stretch flex flex-col justify-start items-start gap-1 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {COMPANY_SIZE_OPTIONS.map((opt) => {
                    const isSelected = getCompanySizeLabel(formData.size) === opt.label;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setProfileDraft({ size: opt.label });
                          setIsSizeDropdownOpen(false);
                        }}
                        className="self-stretch h-9 px-3 rounded-lg inline-flex justify-between items-center cursor-pointer group select-none"
                      >
                        <span
                          className={cn(
                            "text-sm font-['DM_Sans'] leading-5 truncate transition-colors cursor-pointer",
                            isSelected
                              ? "text-ds-accent font-medium"
                              : "text-ds-text-secondary group-hover:text-ds-text-primary font-normal"
                          )}
                        >
                          {opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Headline with character counter */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              Headline
            </label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              maxLength={255}
              placeholder="SaaS and Fintech Solutions"
              className="self-stretch text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>
          <div className="text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
            {formData.headline?.length || 0}/255
          </div>
        </div>

        {/* Row 4: Link */}
        <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
          <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
            Link
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.example.com"
            maxLength={255}
            className="self-stretch text-ds-accent text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none placeholder:text-ds-text-muted"
          />
        </div>

        {/* Row 5: Headquarter Location */}
        <div ref={locationDropdownRef} className="self-stretch py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 relative transition-colors">
          <label
            htmlFor="headquarter-location-input"
            className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
          >
            Headquarter location
          </label>
          <div className="w-full inline-flex justify-between items-center gap-2">
            <input
              id="headquarter-location-input"
              type="text"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setProfileDraft({ city: e.target.value });
                if (!isLocationDropdownOpen) setIsLocationDropdownOpen(true);
              }}
              onFocus={() => setIsLocationDropdownOpen(true)}
              placeholder="Search headquarter location..."
              maxLength={255}
              className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted cursor-text"
            />
            {isSearchingPlaces ? (
              <Loader2 className="w-4 h-4 animate-spin text-ds-accent shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-ds-text-secondary shrink-0" />
            )}
          </div>

          {/* Suggestions list */}
          {isLocationDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full p-2 bg-ds-bg rounded-xl border border-ds-border shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in duration-150 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none]">
              {isSearchingPlaces ? (
                <div className="w-full py-3 flex items-center justify-center gap-2 text-xs text-ds-text-muted font-['DM_Sans']">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-accent" />
                  <span>Searching Google Places...</span>
                </div>
              ) : placesSuggestions.length > 0 ? (
                placesSuggestions.map((place) => (
                  <div
                    key={place.placeId}
                    onClick={() => handleLocationSelect(place)}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors font-['DM_Sans']"
                  >
                    <MapPin className="w-4 h-4 text-ds-accent shrink-0" />
                    <span className="truncate">
                      {place.description || place.displayName}
                    </span>
                  </div>
                ))
              ) : debouncedLocationQuery.trim().length >= 2 ? (
                <div className="w-full py-3 text-center text-xs text-ds-text-muted font-['DM_Sans']">
                  No locations found
                </div>
              ) : filteredPopularLocations.length > 0 ? (
                <>
                  <div className="px-3 py-1 text-[11px] font-medium text-ds-text-muted uppercase tracking-wider font-['DM_Sans']">
                    Popular Locations
                  </div>
                  {filteredPopularLocations.map((loc) => {
                    const label = typeof loc === "string" ? loc : loc.formattedAddress || loc.city;
                    return (
                      <div
                        key={typeof loc === "string" ? loc : loc.id}
                        onClick={() => handleLocationSelect(loc)}
                        className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors font-['DM_Sans']"
                      >
                        <MapPin className="w-4 h-4 text-ds-text-muted shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="w-full py-3 text-center text-xs text-ds-text-muted font-['DM_Sans']">
                  No locations found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Draggable Map (h-[132px] on mobile with +20px clearance, h-56 on desktop) */}
        <div className="self-stretch h-[132px] sm:h-56 rounded-2xl overflow-hidden border border-ds-border">
          <InteractiveLocationMap
            locationAddress={locationQuery.trim() || formData.city || ""}
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleMapLocationChange}
            className="!w-full !h-[132px] sm:!h-56 !rounded-2xl !border-0"
          />
        </div>

      </div>

      {/* Action Buttons: Centered */}
      <div className="inline-flex justify-center items-start gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className={cn(
            "w-20 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-6 transition-colors",
            !canSave
              ? "bg-ds-surface-1 text-ds-text-muted cursor-not-allowed"
              : "bg-ds-accent text-white hover:opacity-90 cursor-pointer"
          )}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-[100px] border border-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Mobile bottom clearance: matches About tab clearance for Safari/Chrome navigation bar */}
      <div className="w-full h-[max(20px,env(safe-area-inset-bottom,20px))] sm:hidden shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Hidden file inputs for direct file picker */}
      <input
        type="file"
        ref={logoFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleLogoFileChange}
      />
      <input
        type="file"
        ref={coverFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleCoverFileChange}
      />

      {/* Photo Upload Modals (Stage changes only, API called on form Save) */}
      <CocpitUserProfileImageEditor
        isOpen={modalType === "logo"}
        onClose={() => {
          setModalType(null);
          setModalFile(null);
        }}
        initialImage={modalFile ? null : logoPreview}
        initialFile={modalFile}
        shape="square"
        title="Add organization logo"
        hideRemoveButton={true}
        onSave={(dataUrl, file) => {
          if (file) {
            setStagedLogoFile(file);
            setLogoPreview(dataUrl);
            setIsLogoDeleted(false);
          } else if (!dataUrl) {
            setLogoPreview(null);
            setStagedLogoFile(null);
            setIsLogoDeleted(true);
          }
          setModalFile(null);
          setModalType(null);
        }}
        onRemove={() => {
          setLogoPreview(null);
          setStagedLogoFile(null);
          setIsLogoDeleted(true);
          setModalFile(null);
          setModalType(null);
        }}
      />

      <CocpitUserCoverImageEditor
        isOpen={modalType === "cover"}
        onClose={() => {
          setModalType(null);
          setModalFile(null);
        }}
        initialImage={modalFile ? null : coverPreview}
        initialFile={modalFile}
        title="Add banner"
        onSave={(dataUrl, file) => {
          if (file) {
            setStagedCoverFile(file);
            setCoverPreview(dataUrl);
            setIsCoverDeleted(false);
          } else if (!dataUrl) {
            setCoverPreview(null);
            setStagedCoverFile(null);
            setIsCoverDeleted(true);
          }
          setModalFile(null);
          setModalType(null);
        }}
        onRemove={() => {
          setCoverPreview(null);
          setStagedCoverFile(null);
          setIsCoverDeleted(true);
          setModalFile(null);
          setModalType(null);
        }}
      />
    </form>
  );
}
