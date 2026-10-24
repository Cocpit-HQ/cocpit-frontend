"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Check,
  Upload,
  Loader2,
  Building2,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  CalendarIcon,
  VerifyIcon,
  PdfFileIcon,
  ImageIcon,
  DeleteIcon,
} from "@/components/icons";
import { DarkCalendar } from "@/features/onboarding/components/DarkCalendar";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";
import { publishNewOrganization } from "../services/company-onboarding.api";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { getPreservedUserActorFromStorage } from "@/lib/actor-context";

interface StepVerificationProps {
  onNext: () => void;
  onBack?: () => void;
}

// Exactly 2 nations matching mobile configuration in Stage 2 Presence
const COUNTRY_OPTIONS = [
  {
    name: "India",
    flag: "🇮🇳",
    icon: "twemoji:flag-india",
    label: "India",
  },
  {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    icon: "twemoji:flag-united-arab-emirates",
    label: "UAE",
  },
];

const formatIsoToDisplay = (isoStr?: string): string => {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

export const StepVerification: React.FC<StepVerificationProps> = ({
  onNext,
  onBack,
}) => {
  const router = useRouter();
  const { activeProfile, refreshCompanies } = useActiveProfile();
  const {
    organizationType,
    organizationName,
    foundedYear,
    industry,
    logoFile,
    logoPreview,
    officialEmail,
    phoneCountryCode,
    phoneNumber,
    website,
    organizationSize,
    hqCountry,
    hqCity,
    headline,
    description,
    countryOfOperation,
    incorporationDate,
    documents,
    updateField,
    updateDocument,
    removeDocument,
    setCurrentStage,
    setApiError,
  } = useCompanyOnboardingStore();

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerPlacement, setDatePickerPlacement] = useState<"top" | "bottom">("bottom");
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close date picker on outside click & compute placement
  useEffect(() => {
    if (isDatePickerOpen && datePickerContainerRef.current) {
      const rect = datePickerContainerRef.current.getBoundingClientRect();
      const popoverHeight = 340;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < popoverHeight && spaceAbove > 150) {
        setDatePickerPlacement("top");
      } else {
        setDatePickerPlacement("bottom");
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        datePickerContainerRef.current &&
        !datePickerContainerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // Selected country details
  const selectedCountry = useMemo(() => {
    return (
      COUNTRY_OPTIONS.find(
        (c) =>
          c.name.toLowerCase() === (countryOfOperation || "").toLowerCase() ||
          c.label.toLowerCase() === (countryOfOperation || "").toLowerCase()
      ) || null
    );
  }, [countryOfOperation]);

  // Formatted date string for UI display
  const displayDate = useMemo(() => {
    return formatIsoToDisplay(incorporationDate);
  }, [incorporationDate]);

  // Current primary document
  const primaryDoc = documents[0] || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setUploadError(null);
    updateDocument(primaryDoc?.id || "doc-1", file);
    toast.success("Document attached successfully");
  };

  const handleRemoveDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryDoc) {
      removeDocument(primaryDoc.id);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append("name", organizationName || "Cocpit");
      formData.append("org_type", organizationType || "COMPANY");
      formData.append("entity_type", organizationType || "COMPANY");
      formData.append("type", organizationType || "COMPANY");
      if (foundedYear) formData.append("established_year", foundedYear);
      if (organizationType === "INSTITUTION") {
        if (industry) formData.append("institution_type", industry);
      } else {
        if (industry) formData.append("industry", industry);
      }
      if (officialEmail) formData.append("email", officialEmail);
      if (phoneNumber) formData.append("phone", `${phoneCountryCode}${phoneNumber}`);
      if (website) formData.append("website", website);
      formData.append("size", organizationSize || "1–10 members");
      formData.append("country", countryOfOperation || hqCountry || "India");
      if (hqCity) formData.append("city", hqCity);
      if (headline) formData.append("headline", headline);
      if (description) formData.append("description", description);
      if (incorporationDate) formData.append("incorporation_date", incorporationDate);

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (logoPreview && logoPreview.startsWith("data:")) {
        // Reconstruct File from persisted Data URL (after page refresh)
        try {
          const arr = logoPreview.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          const reconstructedFile = new File([u8arr], "organization-logo.png", { type: mime });
          formData.append("logo", reconstructedFile);
        } catch {
          // If reconstruction fails, logo won't be sent — non-blocking
        }
      }

      if (primaryDoc?.file) {
        formData.append("documents", primaryDoc.file);
      }

      let actorOverride: { 'x-actor-type': string; 'x-actor-id': string } | undefined = undefined;

      // When the user is currently acting as a COMPANY/ORGANIZATION,
      // preserve that org context for existing features, and explicitly execute
      // the creation call under the human USER actor key.
      if (activeProfile?.type === "COMPANY") {
        const preservedUser = getPreservedUserActorFromStorage();
        if (preservedUser?.id) {
          actorOverride = {
            'x-actor-type': 'USER',
            'x-actor-id': preservedUser.id,
          };
        }
      }

      const res = await publishNewOrganization(formData, actorOverride);
      if (res && ((res as any).success === false || (res as any).error)) {
        const backendMsg = (res as any).message || (res as any).error?.message || (res as any).error || "Failed to publish organization";
        toast.error(backendMsg);
        setApiError(backendMsg);
        setCurrentStage(5);
        return;
      }

      toast.success("Organization published successfully!");
      try {
        await refreshCompanies();
      } catch (e) {
        console.warn("Could not refresh companies immediately", e);
      }
      onNext();
    } catch (err: any) {
      console.error("Publish organization error:", err);
      const data = err?.response?.data;
      let errorMsg = "Failed to publish organization";
      if (typeof data === "string" && data.length < 300) {
        errorMsg = data;
      } else if (data?.message) {
        errorMsg = data.message;
      } else if (data?.error) {
        errorMsg = typeof data.error === "string" ? data.error : data.error?.message || errorMsg;
      } else if (data?.msg) {
        errorMsg = data.msg;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      setApiError(errorMsg);
      setCurrentStage(5);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto p-4 pt-1 pb-4 flex flex-col items-center gap-8 rounded-3xl select-none animate-in fade-in duration-300">
      {/* Title (800x48) */}
      <h1 className="w-full max-w-[800px] h-[48px] self-stretch flex items-center justify-center text-center font-['DM_Sans'] font-bold text-[32px] sm:text-[40px] leading-[48px] m-0 mb-2">
        <span className="text-ds-text-primary">Stage 3: </span>
        <span className="text-ds-accent ml-2">Verification</span>
      </h1>

      {/* Steper Box (618x48) */}
      <div
        data-amount="3"
        data-complete-steps="None"
        className="w-full max-w-[618px] h-[48px] flex flex-row justify-center items-start p-0"
      >
        {/* Step 1: Identity (Done) */}
        <div
          data-position="Start"
          data-state="Done"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-0.5" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <Check
                  className="size-3 text-white stroke-[2.5]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="flex-1 h-[2px] bg-ds-accent" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 1: Identity
            </span>
          </div>
        </div>

        {/* Step 2: Presence (Done) */}
        <div
          data-position="Middle"
          data-state="Done"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-[2px] bg-ds-accent" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <Check
                  className="size-3 text-white stroke-[2.5]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="flex-1 h-[2px] bg-ds-accent" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 2: Presence
            </span>
          </div>
        </div>

        {/* Step 3: Verification (Active) */}
        <div
          data-position="End"
          data-state="Active"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-[2px] bg-ds-accent" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <div className="size-2 rounded-full bg-ds-bg" />
              </div>
            </div>
            <div className="flex-1 h-0.5" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-accent text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 3: Verification
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Frame 2609639 (800px auto layout, gap 50px) */}
      <div className="w-full max-w-[800px] flex flex-col md:flex-row justify-between items-start p-0 gap-6 md:gap-[50px]">
        {/* Left Column: Frame 2609895 (449px auto layout, padding 24px 0px, gap 16px, order 0) */}
        <div className="w-full md:w-[449px] max-w-full flex flex-col justify-start items-center pt-6 pb-6 px-0 gap-4 flex-none order-0">
          {/* Field 1: Frame 2609989 (Country of Operation - 449x88, pb-[26px]) */}
          <div ref={countryDropdownRef} className="relative w-full self-stretch flex-none order-0 flex flex-col items-start pb-[26px] gap-2.5">
            <div
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className="w-full h-[62px] py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 self-stretch cursor-pointer transition-colors"
            >
              {/* Label */}
              <span className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 h-4 flex-none order-0">
                Country of Operation
              </span>
              {/* Frame 2609494: Dropdown Row (449x20) */}
              <div className="w-full h-5 flex flex-row justify-between items-center p-0 gap-2.5 self-stretch flex-none order-1">
                <div className="inline-flex items-center gap-2">
                  {selectedCountry ? (
                    <>
                      <Icon
                        icon={selectedCountry.icon}
                        width={16}
                        height={16}
                        className="w-4 h-4 flex-none shrink-0"
                        fallback={<span className="text-base leading-none select-none">{selectedCountry.flag}</span>}
                      />
                      <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-primary">
                        {selectedCountry.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-muted">
                      Select country
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-ds-text-primary transition-transform duration-200 ${
                    isCountryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Options */}
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-96 max-w-full p-1.5 bg-ds-bg rounded-xl border border-ds-border flex flex-col justify-start items-start gap-1 shadow-2xl animate-in fade-in duration-150">
                {COUNTRY_OPTIONS.map((item) => {
                  const isSelected =
                    (countryOfOperation || "India").toLowerCase() === item.name.toLowerCase() ||
                    (countryOfOperation || "").toLowerCase() === item.label.toLowerCase();
                  return (
                    <div
                      key={item.name}
                      onClick={() => {
                        updateField("countryOfOperation", item.name);
                        setIsCountryDropdownOpen(false);
                      }}
                      className="self-stretch h-9 px-3 rounded-lg inline-flex items-center justify-start gap-2.5 cursor-pointer transition-colors group"
                    >
                      <Icon
                        icon={item.icon}
                        width={16}
                        height={16}
                        className="w-4 h-4 flex-none shrink-0"
                        fallback={<span className="text-base leading-none select-none">{item.flag}</span>}
                      />
                      <span
                        className={`text-sm font-['DM_Sans'] leading-5 truncate transition-colors ${
                          isSelected
                            ? "text-ds-accent font-medium"
                            : "text-ds-text-secondary group-hover:text-ds-text-primary font-normal"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field 2: Frame 2609990 (Date of incorporation - 449x86, pb-[26px]) */}
          <div ref={datePickerContainerRef} className="relative w-full flex flex-col items-start p-0 pb-[26px] gap-2 self-stretch flex-none order-1">
            <div
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className="w-full h-[36px] py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-row justify-between items-center gap-1 cursor-pointer transition-colors"
            >
              <span
                className={`text-sm font-normal font-['DM_Sans'] leading-5 ${
                  displayDate ? "text-ds-text-primary" : "text-ds-text-muted"
                }`}
              >
                {displayDate || "Date of incorporation"}
              </span>

              {/* Calendar Icon matching exact Figma CSS */}
              <div className="w-5 h-5 flex items-center justify-center text-ds-text-muted hover:text-ds-text-primary transition-colors">
                <CalendarIcon
                  size={16}
                  className="w-4 h-4 shrink-0 order-1 grow-0 m-auto text-ds-text-muted hover:text-ds-text-primary"
                />
              </div>
            </div>

            {/* Note / Reserved Supporting Area (16px) */}
            <span className="w-full h-4 flex-none"></span>

            {/* Common User Onboarding DarkCalendar Popover */}
            {isDatePickerOpen && (
              <div
                className={`absolute left-0 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  datePickerPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                <DarkCalendar
                  value={incorporationDate || undefined}
                  maxDate={new Date()}
                  minYear={1900}
                  onChange={(isoDate) => {
                    updateField("incorporationDate", isoDate);
                    setIsDatePickerOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Documents Section Header (Frame 2609896 - 449x24) */}
          <div className="w-full h-6 flex flex-row justify-between items-center p-0 gap-2.5 self-stretch flex-none order-2">
            <span className="w-[90px] h-6 font-['DM_Sans'] font-semibold text-base leading-6 text-ds-text-primary flex-none order-0">
              Documents
            </span>
          </div>

          {/* Verification Document Upload Area (Frame 2609895 - 449px auto layout, gap 16px) */}
          <div className="w-full flex flex-col justify-end items-end p-0 gap-4 self-stretch flex-none order-3">
            <span className="w-full h-4 text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 self-stretch flex-none order-0">
              Verification Document
            </span>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Avatar / Upload Box (449x100) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[100px] p-4 bg-ds-surface-1 rounded-2xl flex flex-col justify-center items-center gap-2 self-stretch flex-none order-1 cursor-pointer transition-all border border-dashed border-ds-border hover:border-ds-accent/80 group overflow-hidden"
            >
              <div className="size-5 relative flex items-center justify-center">
                <Upload className="w-4 h-4 text-ds-text-primary group-hover:text-ds-accent transition-colors" />
              </div>
              <span className="text-center text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
                JPG, PNG, PDF · Max 5MB
              </span>
            </div>

            {uploadError && (
              <span className="w-full text-left text-xs text-ds-error font-['DM_Sans'] -mt-2">
                {uploadError}
              </span>
            )}

            {/* Uploaded Document Row below upload box (Frame 2609900) - 16px gap */}
            {primaryDoc?.file && (
              <div className="self-stretch w-full h-5 flex flex-row justify-between items-center gap-2.5 flex-none order-2">
                {/* Frame 2609899: Left side icon and name */}
                <div className="flex flex-row items-center gap-2 h-5 min-w-0">
                  {primaryDoc.file.type === "application/pdf" ? (
                    <PdfFileIcon
                      size={20}
                      className="w-5 h-5 shrink-0 order-0 grow-0 text-ds-text-primary"
                      fill="var(--ds-text-primary)"
                    />
                  ) : (
                    <ImageIcon
                      size={20}
                      className="w-5 h-5 shrink-0 order-0 grow-0 text-ds-text-primary"
                      fill="var(--ds-text-primary)"
                    />
                  )}
                  <span className="font-['DM_Sans'] text-xs font-normal leading-4 text-ds-text-primary truncate">
                    {primaryDoc.file.name}
                  </span>
                </div>

                {/* Right side: Delete Icon */}
                <button
                  type="button"
                  onClick={handleRemoveDoc}
                  aria-label="Delete document"
                  className="w-5 h-5 flex items-center justify-center shrink-0 order-1 grow-0 text-ds-error hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <DeleteIcon
                    size={20}
                    className="w-5 h-5 text-ds-error"
                    fill="currentColor"
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PREVIEW ON PROFILE & Did you know Box (300x420px as per Figma) */}
        <div className="w-full md:w-[300px] max-w-full md:max-w-[300px] md:h-[420px] p-6 rounded-3xl outline outline-1 outline-offset-[-1px] outline-ds-border bg-ds-surface-1/30 flex flex-col justify-start items-start gap-4 shrink-0">
          <span className="w-full text-left text-ds-text-secondary text-xs sm:text-sm font-normal font-['DM_Sans'] uppercase tracking-wider leading-5">
            PREVIEW ON PROFILE
          </span>

          {/* Profile Card with Exact Skeleton Spec */}
          <div className="w-full p-4 bg-ds-surface-1 rounded-xl flex flex-col justify-start items-start gap-4 overflow-hidden border border-ds-border">
            {/* Header: Logo, Name, Badge, Headline */}
            <div className="w-full inline-flex justify-start items-center gap-2">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={organizationName || "Cocpit"}
                  className="size-10 rounded-lg object-cover bg-ds-surface-2 shrink-0 border border-ds-border"
                />
              ) : (
                <div className="size-10 bg-ds-surface-2 rounded-lg flex items-center justify-center text-ds-text-muted shrink-0 border border-ds-border">
                  <Building2 className="w-5 h-5 text-ds-text-secondary" />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-start items-start min-w-0">
                <div className="w-full inline-flex justify-start items-center gap-1">
                  <span className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 truncate">
                    {organizationName || "Cocpit"}
                  </span>
                  {/* Verified Badge Icon (Figma spec: width 24px, height 24px, flex none, order 1, flex-grow 0) */}
                  <VerifyIcon
                    className="w-6 h-6 shrink-0 order-1 grow-0"
                    size={24}
                    fill="var(--ds-accent)"
                    aria-label="Verified organization badge"
                  />
                </div>
                <span className="w-full text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 truncate">
                  {headline || industry || "SaaS & FinTech Solutions"}
                </span>
              </div>
            </div>

            {/* Skeleton Content Bars as per Figma */}
            <div className="w-full flex flex-col justify-start items-start gap-2">
              <div className="w-36 h-2 bg-ds-border rounded-full" />
              <div className="w-full h-2 bg-ds-border rounded-full" />
              <div className="w-24 h-2 bg-ds-border rounded-full" />
            </div>

            {/* Partner Avatars & Count */}
            <div className="w-full pt-4 border-t border-ds-border flex justify-between items-center">
              <div className="flex justify-start items-center">
                <div className="size-6 bg-ds-surface-2 rounded-full border-2 border-ds-surface-1" />
                <div className="size-6 bg-ds-border rounded-full border-2 border-ds-surface-1 -ml-2" />
                <div className="size-6 bg-ds-bg rounded-full border-2 border-ds-surface-1 -ml-2" />
              </div>
              <span className="text-ds-accent text-xs font-medium font-['DM_Sans'] leading-4">
                1.2k Partners
              </span>
            </div>
          </div>

          {/* Did you know? Callout */}
          <div className="w-full mt-auto p-4 bg-ds-surface-1 rounded-lg border-l-[3px] border-ds-accent flex flex-col justify-start items-start">
            <p className="text-ds-text-primary text-sm font-['DM_Sans'] leading-5">
              <strong className="font-semibold text-ds-text-primary">
                Did you know?
              </strong>{" "}
              Verified organizations receive an average of 4x more inbound
              partnership inquiries than unverified peers.
            </p>
          </div>
        </div>
      </div>

      {/* Frame: Publish Button Box (Standard Control Height 36px) */}
      <div className="w-full max-w-[800px] h-[36px] flex justify-center items-center p-0">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-[260px] h-[36px] py-1.5 px-4 bg-ds-accent hover:opacity-90 disabled:opacity-60 text-white rounded-[100px] flex justify-center items-center gap-2.5 transition-all cursor-pointer ds-focus-ring"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="font-['DM_Sans'] font-medium text-base leading-6 text-white whitespace-nowrap">
                Publishing...
              </span>
            </>
          ) : (
            <span className="font-['DM_Sans'] font-medium text-base leading-6 text-white whitespace-nowrap">
              Publish
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export { StepVerification as Stage3Verification };
export default StepVerification;
