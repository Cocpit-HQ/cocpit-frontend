"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { verifyIdentity } from "@/services/api/settings";
import { useActiveProfile } from "@/context/ActiveProfileContext";

interface CompanyEditVerificationTabProps {
  onCancel: () => void;
  orgId: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function CompanyEditVerificationTab({ onCancel, orgId }: CompanyEditVerificationTabProps) {
  const [legalName, setLegalName] = useState("");
  const [incorpDay, setIncorpDay] = useState("");
  const [incorpMonth, setIncorpMonth] = useState("");
  const [incorpYear, setIncorpYear] = useState("");
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeProfile, refreshProfile, refreshCompanies } = useActiveProfile();
  const isVerified = activeProfile?.verification_status === "VERIFIED" || activeProfile?.verification_status === "DOMAIN_VERIFIED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationDoc) {
      toast.error("Please upload a verification document");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("documentType", "BRN"); // Assuming Business Registration Number
      formData.append("frontImage", verificationDoc);
      formData.append("legalName", legalName);
      formData.append("incorporationDay", incorpDay);
      formData.append("incorporationMonth", incorpMonth);
      formData.append("incorporationYear", incorpYear);

      const res = await verifyIdentity(formData, orgId);
      if (res.success) {
        toast.success("Verification details submitted successfully!");
        if (refreshProfile) await refreshProfile();
        if (refreshCompanies) await refreshCompanies();
        onCancel();
      } else {
        toast.error(res.message || "Failed to submit verification details");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting verification details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationDoc(file);
    }
  };

  const isDirty = legalName !== "" || incorpDay !== "" || incorpMonth !== "" || incorpYear !== "" || verificationDoc !== null;

  if (isVerified) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-6 py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <Icon icon="lucide:check-circle-2" className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your identity has been verified
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-[400px]">
            Your company profile is fully verified. You now have access to all premium features including posting jobs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8 font-poppins pt-4">
      
      {/* Top Row: Legal Name and Date of Incorporation side by side on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Company full legal name */}
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-[14px] font-semibold text-gray-900 dark:text-white">
            Company full legal name
          </label>
          <div className="relative w-full h-11">
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Nexsus Global System"
              className="w-full h-full px-4 border border-gray-300 dark:border-zinc-800 rounded-[24px] bg-white dark:bg-zinc-900/50 text-[14px] focus:outline-none focus:border-[#1A73E8] transition-colors dark:text-white"
            />
          </div>
        </div>

        {/* Date of incorporation */}
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-[14px] font-semibold text-gray-900 dark:text-white">
            Date of incorporation
          </label>
          <div className="flex flex-row gap-2 h-11 w-full">
            {/* Day */}
            <div className="relative w-1/3 h-full">
              <select
                value={incorpDay}
                onChange={(e) => setIncorpDay(e.target.value)}
                className="w-full h-full pl-4 pr-8 border border-gray-300 dark:border-zinc-800 rounded-[24px] bg-white dark:bg-zinc-900/50 text-[14px] focus:outline-none focus:border-[#1A73E8] transition-colors dark:text-white appearance-none cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <option value="" disabled>Date</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Month */}
            <div className="relative w-1/3 h-full">
              <select
                value={incorpMonth}
                onChange={(e) => setIncorpMonth(e.target.value)}
                className="w-full h-full pl-4 pr-8 border border-gray-300 dark:border-zinc-800 rounded-[24px] bg-white dark:bg-zinc-900/50 text-[14px] focus:outline-none focus:border-[#1A73E8] transition-colors dark:text-white appearance-none cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <option value="" disabled>Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Year */}
            <div className="relative w-1/3 h-full">
              <select
                value={incorpYear}
                onChange={(e) => setIncorpYear(e.target.value)}
                className="w-full h-full pl-4 pr-8 border border-gray-300 dark:border-zinc-800 rounded-[24px] bg-white dark:bg-zinc-900/50 text-[14px] focus:outline-none focus:border-[#1A73E8] transition-colors dark:text-white appearance-none cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <option value="" disabled>Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Verification Document */}
      <div className="flex flex-col gap-2 w-full pt-2">
        <label className="text-[14px] font-semibold text-gray-900 dark:text-white">
          Verification Document
        </label>
        
        {verificationDoc ? (
          <div className="w-full h-12 px-1 py-1 border border-gray-300 dark:border-zinc-800 rounded-full flex items-center justify-between bg-white dark:bg-zinc-900/50 gap-2 overflow-hidden pl-4 pr-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-6 h-6 rounded bg-gray-400 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                 <Icon icon="lucide:file-text" className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                {verificationDoc.name}
              </span>
            </div>
            
            <label
              htmlFor="file-input-change"
              className="text-[14px] text-[#1A73E8] font-medium cursor-pointer hover:underline flex-shrink-0"
            >
              Change
            </label>
            <input
              type="file"
              id="file-input-change"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="w-full">
            <label
              htmlFor="file-input-upload"
              className="w-full h-12 px-6 rounded-full border border-gray-300 dark:border-zinc-800 bg-transparent hover:border-[#1A73E8] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer select-none"
            >
              <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-[#6B7280]" />
            </label>
            <input
              type="file"
              id="file-input-upload"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end items-center gap-4 w-full mt-10">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-8 border border-[#9CA3AF] text-gray-700 dark:text-zinc-300 dark:border-zinc-700 rounded-[24px] font-medium text-[14px] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-950"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className={`h-10 px-8 rounded-[24px] font-semibold text-[14px] transition-colors flex items-center justify-center ${
            isDirty && !isSubmitting
              ? "bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-500/20"
              : "bg-[#E5E7EB] text-[#9CA3AF] dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

    </form>
  );
}
