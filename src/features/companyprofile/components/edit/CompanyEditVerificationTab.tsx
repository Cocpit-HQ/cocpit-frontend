"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { companyService } from "@/services/organization.service";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      const res = await companyService.submitOrgVerification(orgId, formData);
      if (res.message) { // Assuming backend sends { message: "..." } on success
        toast.success(res.message || "Verification details submitted successfully!");
        if (refreshProfile) await refreshProfile();
        if (refreshCompanies) await refreshCompanies();
        onCancel();
      } else {
        toast.error("Failed to submit verification details");
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
    <form onSubmit={handleSubmit} className="w-full max-w-[928px] flex flex-col gap-[24px] font-poppins pt-4">
      
      {/* Top Row: Legal Name and Date of Incorporation side by side on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-[24px] w-full">
        {/* Company full legal name */}
        <div className="flex flex-col items-start p-[24px] gap-[8px] w-full md:w-[452px] bg-white dark:bg-[#121B2B] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
          <label className="w-full text-[14px] leading-[20px] font-medium text-black dark:text-white tracking-[0.14px]">
            Company full legal name
          </label>
          <div className="relative w-full h-[50px]">
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Nexsus Global System"
              className="w-full h-full px-4 border border-[#E0E0E7] dark:border-zinc-800 rounded-[24px] bg-transparent text-[16px] leading-[24px] focus:outline-none focus:border-[#1A73E8] transition-colors text-black dark:text-white"
            />
          </div>
        </div>

        {/* Date of incorporation */}
        <div className="flex flex-col items-start p-[24px] gap-[8px] w-full md:w-[452px] bg-white dark:bg-[#121B2B] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
          <label className="w-full text-[14px] leading-[20px] font-medium text-black dark:text-white tracking-[0.14px]">
            Date of incorporation
          </label>
          <div className="flex flex-row gap-[24px] h-[50px] w-full">
            {/* Day */}
            <div className="relative flex-1 h-full">
              <Select value={incorpDay} onValueChange={setIncorpDay}>
                <SelectTrigger className="w-full h-full pl-[16px] pr-[16px] border border-[#E0E0E7] dark:border-zinc-800 rounded-[24px] bg-transparent text-[16px] leading-[24px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#1A73E8] transition-colors cursor-pointer text-black dark:text-white data-[placeholder]:text-[#6B7280] dark:data-[placeholder]:text-[#6B7280] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-black dark:[&>svg]:text-white [&>svg]:opacity-100 flex items-center justify-between gap-2 shadow-none">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] border-[#E0E0E7] dark:border-zinc-800 rounded-[12px] shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {DAYS.map(d => <SelectItem key={d} value={d} className="cursor-pointer">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="relative flex-1 h-full">
              <Select value={incorpMonth} onValueChange={setIncorpMonth}>
                <SelectTrigger className="w-full h-full pl-[16px] pr-[16px] border border-[#E0E0E7] dark:border-zinc-800 rounded-[24px] bg-transparent text-[16px] leading-[24px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#1A73E8] transition-colors cursor-pointer text-black dark:text-white data-[placeholder]:text-[#6B7280] dark:data-[placeholder]:text-[#6B7280] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-black dark:[&>svg]:text-white [&>svg]:opacity-100 flex items-center justify-between gap-2 shadow-none">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] border-[#E0E0E7] dark:border-zinc-800 rounded-[12px] shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {MONTHS.map(m => <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="relative flex-1 h-full">
              <Select value={incorpYear} onValueChange={setIncorpYear}>
                <SelectTrigger className="w-full h-full pl-[16px] pr-[16px] border border-[#E0E0E7] dark:border-zinc-800 rounded-[24px] bg-transparent text-[16px] leading-[24px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#1A73E8] transition-colors cursor-pointer text-black dark:text-white data-[placeholder]:text-[#6B7280] dark:data-[placeholder]:text-[#6B7280] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-black dark:[&>svg]:text-white [&>svg]:opacity-100 flex items-center justify-between gap-2 shadow-none">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] border-[#E0E0E7] dark:border-zinc-800 rounded-[12px] shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {YEARS.map(y => <SelectItem key={y} value={y.toString()} className="cursor-pointer">{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Document */}
      <div className="flex flex-col items-start p-[24px] gap-[8px] w-full md:w-[928px] bg-white dark:bg-[#121B2B] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
        <label className="w-full text-[14px] leading-[20px] font-medium text-black dark:text-white tracking-[0.14px]">
          Verification Document
        </label>
        
        {verificationDoc ? (
          <div className="w-full h-[50px] px-[24px] py-[12px] border border-[#E0E0E7] dark:border-zinc-800 rounded-[24px] flex items-center justify-between bg-transparent gap-2 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-6 h-6 rounded bg-gray-400 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                 <Icon icon="lucide:file-text" className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-normal text-black dark:text-white tracking-[0.14px] truncate">
                {verificationDoc.name}
              </span>
            </div>
            
            <label
              htmlFor="file-input-change"
              className="text-[12px] text-[#1A73E8] font-normal cursor-pointer flex-shrink-0 tracking-[0.14px]"
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
              className="w-full h-[50px] rounded-[24px] border border-[#E0E0E7] dark:border-zinc-800 bg-transparent hover:border-[#1A73E8] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer select-none"
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
      <div className="flex justify-end items-center gap-4 w-full md:w-[928px] h-[40px] mt-[16px]">
        <button
          type="button"
          onClick={onCancel}
          className="flex justify-center items-center w-[140px] h-[40px] px-4 py-2 gap-[10px] bg-white dark:bg-zinc-950 border border-[#6B7280] rounded-[24px] text-[#6B7280] font-normal text-[14px] leading-[20px] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className={`flex justify-center items-center w-[140px] h-[40px] px-4 py-2 gap-[10px] rounded-[24px] font-normal text-[14px] leading-[20px] transition-colors ${
            isDirty && !isSubmitting
              ? "bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer"
              : "bg-[#E0E0E7] text-white dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

    </form>
  );
}
