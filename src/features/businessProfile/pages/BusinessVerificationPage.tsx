"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { X, Upload, FileText } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../services/businessProfile.service";
import { BusinessBuildingIcon, CalendarIcon } from "@/components/icons";
import { DarkCalendar } from "@/features/onboarding/components/DarkCalendar";
import toast from "react-hot-toast";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function BusinessVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const queryClient = useQueryClient();

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
    router.push(`/organization/${rawSlug}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    toast.success("Document attached successfully");
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
      queryClient.invalidateQueries({ queryKey: ["company", rawSlug] });
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
      {/* Top right close button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed top-8 right-8 md:top-10 md:right-10 z-[70] p-2 text-ds-text-primary hover:opacity-75 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-full"
        aria-label="Close verification screen"
      >
        <X className="w-5 h-5 text-ds-text-primary" />
      </button>

      {/* Main Container (matching Figma w-[640px] centered) */}
      <div className="w-full max-w-[640px] mx-auto px-4 pt-[60px] pb-24 flex flex-col items-center gap-10 relative">
        {/* Header Breadcrumb */}
        <div className="self-stretch inline-flex justify-start items-center gap-2">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6">
              {orgName}
            </span>
            <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            <span className="text-ds-text-muted text-base font-normal font-['DM_Sans'] leading-6">
              Verify your account
            </span>
          </div>
        </div>

        {/* Conditional Screen View */}
        {showStatusView ? (
          /* Image 3: Account Verification Status List */
          <div className="self-stretch flex flex-col items-start gap-4 animate-in fade-in-50 duration-150">
            {isVerified && (
              <div className="self-stretch flex items-center justify-between py-3 border-b border-ds-border">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                    Account verification
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                    Your identity has been verified
                  </span>
                </div>
                <span className="text-ds-success text-sm font-medium font-['DM_Sans'] leading-5">
                  Verified
                </span>
              </div>
            )}

            {isSubmitted && (
              <div className="self-stretch flex items-center justify-between py-3 border-b border-ds-border">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                    Account verification
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                    Document sent for verification
                  </span>
                </div>
                <span className="text-ds-text-muted text-sm font-medium font-['DM_Sans'] leading-5">
                  Submitted
                </span>
              </div>
            )}

            {/* Optional Re-upload CTA */}
            <div className="self-stretch flex justify-center items-center mt-6">
              <button
                type="button"
                onClick={() => setIsEditingForm(true)}
                className="h-9 px-4 rounded-[100px] border border-ds-border text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5 hover:bg-ds-surface-1 transition-colors cursor-pointer"
              >
                Submit New Document
              </button>
            </div>
          </div>
        ) : (
          /* Image 2 & Image 4: Verification Form */
          <div className="self-stretch flex flex-col items-start gap-10">
            {/* Row 1: Legal Name & Incorporation Date */}
            <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10">
              {/* Organization legal full name */}
              <div className="flex-1 w-full py-2 border-b border-ds-border focus-within:border-ds-accent transition-colors flex flex-col justify-center items-start gap-1">
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
                className="flex-1 w-full py-2 border-b border-ds-border focus-within:border-ds-accent transition-colors flex flex-col justify-center items-start gap-1 relative"
              >
                <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Incorporation date
                </label>
                <div
                  onClick={() => setIsDatePickerOpen((prev) => !prev)}
                  className="self-stretch flex justify-between items-center cursor-pointer select-none"
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
                    className={`text-sm font-normal font-['DM_Sans'] leading-5 ${
                      displayDate
                        ? "text-ds-text-primary"
                        : "text-ds-text-muted"
                    }`}
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
              <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
                <label className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Verification document
                </label>

                {selectedFile ? (
                  /* Filled State (Image 4): Document name + Change link */
                  <div className="self-stretch flex justify-between items-center py-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-ds-text-primary shrink-0" />
                      <span className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-[260px] sm:max-w-[420px]">
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-ds-accent text-sm font-medium font-['DM_Sans'] leading-5 hover:underline cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Empty State (Image 2): Centered Upload Icon */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="self-stretch flex justify-center items-center py-2 cursor-pointer group"
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
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Character counter / supporting area placeholder */}
              <div className="h-4 min-h-[16px] text-xs text-ds-text-muted"></div>
            </div>

            {/* Row 3: Action Buttons (Submit & Cancel) */}
            <div className="self-stretch inline-flex justify-center items-center gap-2">
              {canSubmit ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-9 px-5 bg-ds-accent text-white text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] hover:brightness-110 active:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-9 w-20 px-3 bg-ds-surface-2 text-ds-text-muted text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] cursor-not-allowed flex items-center justify-center"
                >
                  Submit
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 rounded-[100px] border border-ds-border text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
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
