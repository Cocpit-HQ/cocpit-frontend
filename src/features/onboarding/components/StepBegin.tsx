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
        toast.error("Please upload a PDF file.");
        setSelectedFile(null);
        setSelected(null);
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
            setSelectedSkills(parsed.skills.slice(0, 15));
          }

          toast.success("Resume parsed successfully!");
          onNext();
        } else {
          setError("Failed to parse resume reliably.");
          toast.error("Could not parse resume data.");
          // Still allow proceeding manually
          onNext();
        }
      } catch (err: any) {
        console.error("Resume parse error", err);
        setError("Parsing failed. You can fill manually.");
        toast.error(err?.response?.data?.message || "Failed to parse resume.");
        onNext();
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 gap-5 w-[391px] min-h-[456px] rounded-[24px] font-['DM_Sans',sans-serif] text-[#FFECE6] select-none">
      {/* Hidden File Input for PDF Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
      />

      {/* Frame 2608511: Title Section */}
      <div className="w-[359px] h-[104px] flex flex-col items-center justify-center p-0 gap-2 text-center">
        <h1 className="text-[32px] font-bold font-['DM_Sans'] leading-[40px] tracking-tight">
          <span className="text-[#FFECE6]">Set up your </span>
          <span className="text-[#EC6229]">profile</span>
        </h1>
        <p className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-[#FFECE6] max-w-[320px]">
          Create your profile so people can discover who you are and what you do
        </p>
      </div>

      {/* Frame 2609478: Input / Selection Area */}
      <div className="w-[214px] flex flex-col items-center p-0 gap-3">
        {/* Upload Resume Option: Empty State vs Uploaded File State */}
        {!selectedFile ? (
          <button
            type="button"
            onClick={handleUploadCardClick}
            className={`w-[214px] h-[112px] flex flex-col items-center justify-center py-2 px-3 gap-3 rounded-[16px] transition-colors cursor-pointer border-none outline-none ${
              selected === "upload" ? "bg-[#2C2C33]" : "bg-transparent hover:bg-[#2C2C33]"
            }`}
          >
            {/* Upload Icon Frame */}
            <div className="w-5 h-5 flex flex-row justify-center items-center p-[2px] gap-[10px]">
              <UploadIcon size={20} className="w-5 h-5 text-[#FFECE6]" />
            </div>

            {/* Upload Resume Text Area */}
            <div className="w-[190px] h-[64px] flex flex-col items-center justify-center p-0 gap-2">
              <span className="w-[152px] h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[#FFECE6] text-center">
                Upload your resume
              </span>
              <span className="w-[190px] h-[12px] font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-[#B8ADA8]">
                Let AI fill in your profile from your resume
              </span>
              <span className="w-[41px] h-[12px] font-['DM_Sans'] font-medium text-[10px] leading-[12px] text-center text-[#B8ADA8]">
                PDF only
              </span>
            </div>
          </button>
        ) : (
          /* Uploaded File Selected State */
          <div
            onClick={handleUploadCardClick}
            className="w-40 px-3 py-2 bg-zinc-900 rounded-2xl outline outline-1 outline-offset-[-0.50px] outline-[#EC6229] flex flex-col justify-start items-center gap-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
          >
            <div className="flex flex-col justify-start items-center gap-1.5">
              <div className="flex flex-col justify-start items-center gap-0.5">
                <div className="w-5 h-5 flex items-center justify-center text-[#FFECE6]">
                  <PdfFileIcon size={18} className="w-[18px] h-[18px] text-[#FFECE6]" />
                </div>
                <div className="text-[#FFECE6] text-[10px] font-normal font-['DM_Sans'] leading-3 max-w-[130px] truncate text-center">
                  {selectedFile.name}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-[#FFECE6] text-xs font-normal font-['DM_Sans'] leading-4 hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Frame 2608505: OR Separator */}
        <div className="w-[208px] h-4 flex flex-row justify-center items-center p-0 gap-2">
          <div className="w-[89px] h-0 border-t border-[#2C2C33]" />
          <span className="w-[14px] h-[16px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-[#2C2C33]">
            Or
          </span>
          <div className="w-[89px] h-0 border-t border-[#2C2C33]" />
        </div>

        {/* Frame 2609474: Manual Setup Option */}
        <button
          type="button"
          onClick={handleManualCardClick}
          className={`w-[214px] h-[92px] flex flex-col items-center justify-center py-2 px-3 gap-3 rounded-[16px] transition-colors cursor-pointer border-none outline-none ${
            selected === "manual" ? "bg-[#2C2C33]" : "bg-transparent hover:bg-[#2C2C33]"
          }`}
        >
          {/* Text formatting Icon Frame */}
          <div className="w-5 h-5 flex flex-row justify-center items-center p-[2px] gap-[10px]">
            <TextFormattingIcon size={20} className="w-5 h-5 text-[#FFECE6]" />
          </div>

          {/* Frame 2609475: Manual Setup Text Area */}
          <div className="w-[190px] h-[44px] flex flex-col items-center justify-center p-0 gap-2">
            <span className="w-[121px] h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[#FFECE6] text-center">
              Set up manually
            </span>
            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-[#B8ADA8]">
              Add your details step by step
            </span>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <div className="flex flex-col items-center justify-center">
        <PillButton
          type="button"
          disabled={!selected || isParsing}
          isLoading={isParsing}
          onClick={handleContinue}
          label={isParsing ? "Parsing resume..." : "Continue"}
        />
      </div>
    </div>
  );
};

export default StepBegin;
