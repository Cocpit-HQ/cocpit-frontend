"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { X, Upload } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../services/businessProfile.service";
import { BusinessBuildingIcon, CalendarIcon, PdfFileIcon } from "@/components/icons";
import { DarkCalendar } from "@/features/onboarding/components/DarkCalendar";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useActiveProfile } from "@/context/ActiveProfileContext";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function BusinessVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const queryClient = useQueryClient();
  const { updateActiveProfile, refreshProfile, refreshCompanies } = useActiveProfile();

  const [mounted, setMounted] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [incorporationDate, setIncorporationDate] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mounted]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
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

  // Fetch organization profile data
  const { data: profileData } = useQuery({
    queryKey: ["orgProfile", rawSlug],
    queryFn: () => businessProfileService.getOrgProfile(rawSlug),
  });

  const org = profileData?.org || profileData || {};
  const orgId =
    org.org_id || org.company_id || org.id || profileData?.orgId || rawSlug;
  const orgName = org.name || "";
  const logoUrl = org.logo_url || org.logoUrl || undefined;

  // Initialize legal name from org data
  useEffect(() => {
    if (org.name && !legalName) {
      setLegalName(org.legal_name || org.name || "");
    }
    if (org.incorporation_date && !incorporationDate) {
      setIncorporationDate(org.incorporation_date);
    }
  }, [org.name, org.legal_name, org.incorporation_date]);

  const isVerified = Boolean(
    org.isVerified ||
    org.is_verified ||
    org.verification_status === "VERIFIED" ||
    org.verification_status === "DOMAIN_VERIFIED" ||
    org.verification_status === "DOCUMENT_VERIFIED"
  );

  const isSubmitted = Boolean(
    org.verification_status === "PENDING" ||
    org.verification_status === "SUBMITTED" ||
    org.verification_status === "UNDER_REVIEW" ||
    justSubmitted
  );

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/organization/${rawSlug}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    toast.success("Document attached successfully");
    e.target.value = "";
  };

  const displayDate = useMemo(() => {
    if (!incorporationDate) return "";
    try {
      const parts = incorporationDate.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        return `${month}/${day}/${year}`;
      }
      const d = new Date(incorporationDate);
      if (!isNaN(d.getTime())) {
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      }
      return incorporationDate;
    } catch {
      return incorporationDate;
    }
  }, [incorporationDate]);

  const canSubmit = Boolean(selectedFile && legalName.trim() && incorporationDate);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const trimmedLegalName = legalName.trim();

      // Send all common backend field names for Company Full Legal Name
      formData.append("legalName", trimmedLegalName);
      formData.append("legal_name", trimmedLegalName);
      formData.append("company_legal_name", trimmedLegalName);
      formData.append("companyLegalName", trimmedLegalName);
      formData.append("company_full_legal_name", trimmedLegalName);
      formData.append("companyFullLegalName", trimmedLegalName);
      formData.append("full_legal_name", trimmedLegalName);
      formData.append("fullLegalName", trimmedLegalName);
      formData.append("name", trimmedLegalName);

      // Send all common backend field names for Date of Incorporation
      if (incorporationDate) {
        formData.append("incorporationDate", incorporationDate);
        formData.append("incorporation_date", incorporationDate);
        formData.append("dateOfIncorporation", incorporationDate);
        formData.append("date_of_incorporation", incorporationDate);

        let day = "";
        let monthName = "";
        let year = "";

        const parts = incorporationDate.split("-");
        if (parts.length === 3) {
          year = parts[0];
          const mIdx = parseInt(parts[1], 10) - 1;
          monthName = MONTH_NAMES[mIdx] || parts[1];
          day = parts[2];
        } else {
          const d = new Date(incorporationDate);
          if (!isNaN(d.getTime())) {
            year = String(d.getFullYear());
            monthName = MONTH_NAMES[d.getMonth()];
            day = String(d.getDate()).padStart(2, "0");
          }
        }

        if (day) {
          formData.append("incorporationDay", day);
          formData.append("incorpDay", day);
        }
        if (monthName) {
          formData.append("incorporationMonth", monthName);
          formData.append("incorpMonth", monthName);
        }
        if (year) {
          formData.append("incorporationYear", year);
          formData.append("incorpYear", year);
        }
      }

      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      await businessProfileService.submitVerification(orgId, formData);
      toast.success("Verification documents submitted successfully!");
      setJustSubmitted(true);
      setIsEditingForm(false);
      queryClient.invalidateQueries({ queryKey: ["orgProfile", rawSlug] });
      queryClient.invalidateQueries({ queryKey: ["orgProfile"] });
      queryClient.invalidateQueries({ queryKey: ["company", rawSlug] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["companyPrivacySettings"] });
      queryClient.invalidateQueries({ queryKey: ["activeProfile"] });

      if (updateActiveProfile) {
        updateActiveProfile({
          verification_status: "VERIFIED",
          is_identity_verified: true,
        });
      }

      if (refreshProfile) {
        void refreshProfile();
      }
      if (refreshCompanies) {
        void refreshCompanies();
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cocpit:refresh-actor-context"));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit verification";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  // Decide whether to show Status View (Image 3) or Form View (Image 2 & 4)
  const showStatusView = (isVerified || isSubmitted) && !isEditingForm;

  const content = (
    <div className="fixed inset-0 z-[60] min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] flex flex-col items-center overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200">
      {/* Desktop Close button (hidden on mobile, fixed top-right on desktop) */}
      <button
        type="button"
        onClick={handleClose}
        className="hidden sm:flex fixed top-8 right-8 md:top-10 md:right-10 z-[70] p-2 text-ds-text-primary hover:opacity-75 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-full"
        aria-label="Close verification screen"
      >
        <X className="w-5 h-5 text-ds-text-primary" />
      </button>

      {/* Main Container: pt-4 sm:pt-[60px] pb-24 max-w-[640px] */}
      <div className="w-full max-w-[640px] mx-auto px-4 pt-4 sm:pt-[60px] pb-24 flex flex-col items-center gap-5 relative">
        {/* Desktop Header Breadcrumb (Frame 2609631 - hidden on mobile) */}
        <div className="hidden sm:inline-flex self-stretch justify-start items-center gap-2 h-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={orgName}
              className="w-8 h-8 rounded-lg object-cover bg-ds-surface-1 border border-ds-border shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-ds-surface-2 border border-ds-border flex items-center justify-center shrink-0">
              <BusinessBuildingIcon
                className="w-4 h-4 text-ds-text-primary"
                size={16}
              />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap h-6">
            <span className="text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6">
              {orgName}
            </span>
            <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            <span className="text-ds-text-muted text-base font-normal font-['DM_Sans'] leading-6">
              Verify your account
            </span>
          </div>
        </div>

        {/* Mobile Header Bar (Matching Figma Mobile Frame: Logo, Name, Close X) */}
        <div className="sm:hidden self-stretch h-8 flex justify-between items-center">
          <div className="flex justify-start items-center gap-2 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="size-8 rounded-lg object-cover bg-ds-surface-1 border border-ds-border shrink-0"
              />
            ) : (
              <div className="size-8 rounded-lg bg-ds-surface-2 border border-ds-border flex items-center justify-center shrink-0">
                <BusinessBuildingIcon
                  className="w-4 h-4 text-ds-text-primary"
                  size={16}
                />
              </div>
            )}
            <span className="text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              {orgName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 -mr-1 text-ds-text-primary hover:opacity-75 transition-opacity cursor-pointer focus:outline-none shrink-0"
            aria-label="Close verification screen"
          >
            <X className="w-5 h-5 text-ds-text-primary" />
          </button>
        </div>

        {/* Mobile Tab Switcher (Profile, About, Verification) */}
        <div className="sm:hidden self-stretch inline-flex justify-start items-center gap-3">
          {/* Profile Tab */}
          <button
            type="button"
            onClick={() => router.push(`/organization/${rawSlug}/edit?tab=profile`)}
            className="inline-flex flex-col justify-start items-center cursor-pointer group focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
              <span className="text-base font-medium font-['DM_Sans'] leading-6 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors">
                Profile
              </span>
            </div>
            <div className="self-stretch h-[2px] bg-transparent" />
          </button>

          {/* About Tab */}
          <button
            type="button"
            onClick={() => router.push(`/organization/${rawSlug}/edit?tab=about`)}
            className="inline-flex flex-col justify-start items-center cursor-pointer group focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
              <span className="text-base font-medium font-['DM_Sans'] leading-6 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors">
                About
              </span>
            </div>
            <div className="self-stretch h-[2px] bg-transparent" />
          </button>

          {/* Verification Tab (Active) */}
          <button
            type="button"
            className="inline-flex flex-col justify-start items-center cursor-default focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="self-stretch px-3 py-1.5 flex flex-col justify-center items-center gap-2.5">
              <span className="text-base font-medium font-['DM_Sans'] leading-6 text-ds-text-primary">
                Verification
              </span>
            </div>
            <div className="self-stretch h-[2px] bg-ds-accent" />
          </button>
        </div>

        {/* Conditional Screen View */}
        {showStatusView ? (
          /* Account Verification Status List (Matching Figma Design) */
          <div className="self-stretch flex flex-col items-start gap-4 animate-in fade-in-50 duration-150">
            {/* Identity Verified Row */}
            <div className="self-stretch flex items-center justify-between py-3">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                  Account verification
                </span>
                <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                  Your identity has been verified
                </span>
              </div>
              <span className="text-ds-success text-sm font-medium font-['DM_Sans'] leading-5 shrink-0">
                Verified
              </span>
            </div>

            {/* Document Verification Row */}
            <div className="self-stretch flex items-center justify-between py-2 sm:py-3">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                  Account verification
                </span>
                <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                  Document sent for verification
                </span>
              </div>
              <span className="text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 shrink-0">
                Submitted
              </span>
            </div>
          </div>
        ) : (
          /* Form View: Single Column on Mobile, 2-Column Row 1 on Desktop */
          <div className="self-stretch flex flex-col items-start gap-5">
            {/* Row 1: Legal Name & Incorporation Date */}
            <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-5 sm:gap-10 sm:h-[62px]">
              {/* Organization legal full name */}
              <div className="flex-1 w-full py-2 border-b border-ds-border focus-within:border-ds-accent transition-colors flex flex-col justify-center items-start gap-[10px]">
                <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Organization legal full name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Organization legal full name"
                  className="w-full bg-transparent border-none outline-none text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 placeholder:text-ds-text-muted p-0"
                />
              </div>

              {/* Incorporation date */}
              <div
                ref={datePickerRef}
                className="flex-1 w-full py-2 border-b border-ds-border focus-within:border-ds-accent transition-colors flex flex-col justify-center items-start gap-[10px] relative"
              >
                <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Incorporation date
                </label>
                <div
                  onClick={() => setIsDatePickerOpen((prev) => !prev)}
                  className="self-stretch flex justify-between items-center cursor-pointer select-none h-5"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsDatePickerOpen((prev) => !prev);
                    }
                  }}
                  aria-label="Select incorporation date"
                >
                  <span
                    className={cn(
                      "text-sm font-normal font-['DM_Sans'] leading-5",
                      displayDate
                        ? "text-ds-text-primary"
                        : "text-ds-text-muted"
                    )}
                  >
                    {displayDate || "Select"}
                  </span>
                  <div className="w-4 h-4 relative flex items-center justify-center">
                    <CalendarIcon
                      size={16}
                      className="w-4 h-4 text-ds-text-primary"
                    />
                  </div>
                </div>

                {/* Calendar Popover */}
                {isDatePickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <DarkCalendar
                      value={incorporationDate || undefined}
                      maxDate={new Date()}
                      maxYear={new Date().getFullYear()}
                      minYear={1900}
                      onChange={(isoDate) => {
                        setIncorporationDate(isoDate);
                        setIsDatePickerOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Verification Document Upload */}
            <div className="self-stretch flex flex-col justify-start items-end gap-2">
              <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-[10px] h-[58px]">
                <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Verification document
                </label>

                {selectedFile ? (
                  /* Filled State: Document name + Change link */
                  <div className="self-stretch flex justify-between items-center h-4">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <PdfFileIcon
                        size={16}
                        className="w-4 h-4 text-ds-text-primary shrink-0"
                        fill="currentColor"
                      />
                      <span className="text-ds-text-primary text-xs sm:text-sm font-medium sm:font-normal font-['DM_Sans'] leading-4 sm:leading-5 truncate max-w-[220px] sm:max-w-[420px]">
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-ds-accent text-xs sm:text-sm font-medium font-['DM_Sans'] leading-4 sm:leading-5 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Empty State: Centered Upload Icon */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="self-stretch flex justify-center items-center h-4 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                      }
                    }}
                    aria-label="Upload verification document"
                  >
                    <Upload className="w-4 h-4 text-ds-text-primary group-hover:text-ds-accent transition-colors" />
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Reserved Supporting Area / 0/120 Placeholder */}
              <div className="h-4 min-h-[16px] text-xs text-ds-bg select-none" aria-hidden="true">
                0/120
              </div>
            </div>

            {/* Row 3: Action Buttons */}
            <div className="self-stretch inline-flex justify-center items-center gap-2 h-9">
              {canSubmit ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-20 h-9 px-3 py-1.5 bg-ds-accent text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] hover:brightness-110 active:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
                >
                  {isSubmitting ? "..." : "Submit"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-20 h-9 px-3 py-1.5 bg-ds-surface-1 text-ds-text-muted text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  Submit
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-20 h-9 px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default BusinessVerificationPage;
