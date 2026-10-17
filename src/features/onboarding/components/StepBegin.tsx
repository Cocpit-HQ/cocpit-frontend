"use client";

import React, { useState, useRef } from "react";
import { UploadIcon, TextFormattingIcon, LoadingIcon, PdfFileIcon } from "@/components/icons";
import { parseResume } from "@/services/api/onboarding";
import { useOnboardingStore } from "@/store/onboarding.store";
import { toast } from "sonner";
import PillButton from "./PillButton";

interface StepBeginProps {
  onNext: () => void;
}

export const StepBegin: React.FC<StepBeginProps> = ({ onNext }) => {
  const [selected, setSelected] = useState<"upload" | "manual" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showErrorToast = (message: string) => {
    toast.error(message);
  };

  const {
    setParsedResumeData,
    setFullName,
    setAccountName,
    setUserRole,
    setEducation,
    setWorkExperience,
    setEducationList,
    setWorkExperienceList,
    setSelectedSkills,
  } = useOnboardingStore();

  const handleUploadCardClick = () => {
    if (isParsing) return;
    setSelected("upload");
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  const handleManualCardClick = () => {
    if (isParsing) return;
    setSelected("manual");
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf"];

      if (!validTypes.includes(file.type) && !file.name.match(/\.pdf$/i)) {
        setError("*Upload PDF only");
        showErrorToast("Please upload a PDF file.");
        setSelectedFile(null);
        setSelected(null);
        e.target.value = "";
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        setSelectedFile(file);
        setSelected("upload");
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(`File is too large (${sizeMB}MB).`);
        e.target.value = "";
        return;
      }

      setError(null);
      setSelectedFile(file);
      setSelected("upload");
    }
  };

  const handleContinue = async () => {
    if (isParsing) return;

    if (selected === "manual") {
      onNext();
      return;
    }

    if (selected === "upload") {
      if (!selectedFile) {
        fileInputRef.current?.click();
        return;
      }

      // Hit the parser API on Continue button click
      try {
        setIsParsing(true);
        const res = await parseResume(selectedFile);
        if (res.success && res.data) {
          const parsed = res.data;
          setParsedResumeData(parsed);

          // Reset stale data before applying fresh resume
          setUserRole(null);
          setEducation("", "");
          setWorkExperience("", "");
          setEducationList([]);
          setWorkExperienceList([]);
          setSelectedSkills([]);

          if (parsed.profile?.fullName) setFullName(parsed.profile.fullName);
          if (parsed.profile?.accountName) setAccountName(parsed.profile.accountName);
          if (parsed.inferredRole) setUserRole(parsed.inferredRole);

          if (parsed.education?.length > 0) {
            setEducation(parsed.education[0].schoolName || "", parsed.education[0].degree || "");
            setEducationList(parsed.education);
          }
          if (parsed.workExperience?.length > 0) {
            setWorkExperience(
              parsed.workExperience[0].companyName || "",
              parsed.workExperience[0].jobTitle || ""
            );
            setWorkExperienceList(parsed.workExperience);
          }
          if (parsed.skills?.length > 0) {
            setSelectedSkills(parsed.skills.slice(0, 7));
          }

          toast.success("Resume parsed successfully!");
          onNext();
        } else {
          setError("Failed to parse resume reliably.");
          showErrorToast("Could not parse resume data.");
          // Still allow proceeding manually
          onNext();
        }
      } catch (err: any) {
        console.error("Resume parse error", err);
        setError("Parsing failed. You can fill manually.");
        showErrorToast(err?.response?.data?.message || "Failed to parse resume.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-4 gap-8 sm:gap-5 w-full max-w-[391px] h-full sm:h-auto min-h-[456px] sm:rounded-[24px] font-['DM_Sans',sans-serif] text-ds-text-primary select-none flex-1">
      {/* Hidden File Input for PDF Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
      />

      {/* Frame 2608511: Title Section */}
      <div className="w-full max-w-[359px] flex flex-col items-center justify-center p-0 gap-2 text-center mt-4 sm:mt-0">
        <h1 className="w-full font-['DM_Sans'] font-bold text-[32px] sm:text-[40px] leading-[40px] sm:leading-[48px] text-center text-ds-text-primary tracking-normal m-0 p-0">
          <span className="text-ds-text-primary">Set up your </span>
          <span className="text-ds-accent">profile</span>
        </h1>
        <p className="w-full font-['DM_Sans'] font-medium text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] text-center text-ds-text-primary self-stretch m-0 p-0">
          Create your profile so people can discover who you are and what you do
        </p>
      </div>

      {/* Frame 2609478: Input / Selection Area */}
      <div className="w-full max-w-[214px] sm:w-[214px] flex flex-col items-center p-0 gap-3">
        {/* Upload Resume Option: Empty State vs Uploaded File State */}
        {!selectedFile ? (
          <button
            type="button"
            onClick={handleUploadCardClick}
            className={`w-full h-[112px] flex flex-col items-center justify-center py-2 px-3 gap-3 rounded-[16px] transition-all cursor-pointer border outline-none ${
              selected === "upload"
                ? "bg-ds-surface-2 border-ds-accent"
                : "bg-transparent border-transparent hover:bg-ds-surface-2"
            }`}
          >
            {/* Upload Icon Frame */}
            <div className="w-5 h-5 flex flex-row justify-center items-center p-[2px] gap-[10px]">
              <UploadIcon size={20} className="w-5 h-5 text-ds-text-primary" />
            </div>

            {/* Upload Resume Text Area */}
            <div className="w-full flex flex-col items-center justify-center p-0 gap-2">
              <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
                Upload your resume
              </span>
              <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-ds-text-secondary whitespace-nowrap">
                Let AI fill in your profile from your resume
              </span>
              <span className="font-['DM_Sans'] font-medium text-[10px] leading-[12px] text-center text-ds-text-secondary">
                PDF only (max 5MB)
              </span>
            </div>
          </button>
        ) : (
          /* Uploaded File Selected State */
          <div
            onClick={handleUploadCardClick}
            className={`group relative w-full h-[112px] py-2 px-3 rounded-[16px] border flex flex-col justify-center items-center gap-1 cursor-pointer transition-all box-border overflow-hidden ${
              selected === "upload"
                ? error?.includes("too large")
                  ? "bg-ds-surface-1 border-[#E5484D]"
                  : "bg-ds-surface-1 border-ds-accent"
                : "bg-transparent border-transparent hover:bg-ds-surface-1"
            }`}
          >
            <div className="flex flex-col justify-center items-center gap-1 w-full">
              <div className="flex flex-col justify-center items-center gap-1 w-full">
                {/* PDF Icon Frame */}
                <div className="w-7 h-7 flex items-center justify-center rounded-lg">
                  <PdfFileIcon size={22} className="w-[22px] h-[22px] text-ds-text-primary" />
                </div>

                <div className="text-ds-text-primary text-xs font-medium font-['DM_Sans'] leading-4 max-w-[170px] truncate text-center">
                  {selectedFile.name}
                </div>
              </div>

              {error?.includes("too large") && (
                <div className="flex flex-col items-center">
                  <span className="text-[#E5484D] text-[10px] leading-[12px] font-['DM_Sans'] font-normal text-center">
                    {error}
                  </span>
                  <span className="text-[#E5484D] text-[10px] leading-[12px] font-['DM_Sans'] font-normal text-center">
                    Maximum size is 5MB
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className={`text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4 hover:text-ds-accent transition-colors cursor-pointer ${error?.includes("too large") ? "" : "mt-0.5"}`}
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Frame 2608505: OR Separator */}
        <div className="w-full h-4 flex flex-row justify-center items-center p-0 gap-2">
          <div className="flex-1 h-0 border-t border-ds-border" />
          <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-ds-text-muted">
            Or
          </span>
          <div className="flex-1 h-0 border-t border-ds-border" />
        </div>

        {/* Frame 2609474: Manual Setup Option */}
        <button
          type="button"
          onClick={handleManualCardClick}
          className={`w-full h-[92px] flex flex-col items-center justify-center py-2 px-3 gap-3 rounded-[16px] transition-all cursor-pointer border outline-none ${
            selected === "manual"
              ? "bg-ds-surface-2 border-ds-accent"
              : "bg-transparent border-transparent hover:bg-ds-surface-2"
          }`}
        >
          {/* Text formatting Icon Frame */}
          <div className="w-5 h-5 flex flex-row justify-center items-center p-[2px] gap-[10px]">
            <TextFormattingIcon size={20} className="w-5 h-5 text-ds-text-primary" />
          </div>

          {/* Frame 2609475: Manual Setup Text Area */}
          <div className="w-full flex flex-col items-center justify-center p-0 gap-2">
            <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
              Set up manually
            </span>
            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-ds-text-secondary">
              Add your details step by step
            </span>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <div className="w-full max-w-[260px] h-[36px] mt-auto sm:mt-0 pb-8 sm:pb-0 flex items-center justify-center">
        <PillButton
          type="button"
          disabled={!selected || isParsing || (selected === "upload" && !!error && error.includes("too large"))}
          isLoading={isParsing}
          onClick={handleContinue}
          label={isParsing ? "Parsing resume..." : "Continue"}
        />
      </div>
    </div>
  );
};

export default StepBegin;
