"use client";

import React, { useState, useEffect } from "react";
import { LeftArrowIcon, LoadingIcon } from "@/components/icons";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails, getEducationList, getCompanyList, SchoolOption, CompanyOption } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import UnderlineInput from "./UnderlineInput";
import PillButton from "./PillButton";

interface StepDetailsProps {
  onNext: () => void;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const FALLBACK_COMPANIES = ["Google", "Amazon", "Microsoft", "Netflix", "Apple", "Meta", "Uber", "Other"];
const FALLBACK_ROLES = ["Software Engineer", "Product Manager", "UI/UX Designer", "Data Scientist", "Marketing Manager", "Other"];
const JOB_TYPES = ["Full-time Job", "Internship", "Contract Work", "Part-time Job", "Freelance Projects", "Remote Work", "Other"];

export const StepDetails: React.FC<StepDetailsProps> = ({
  onNext,
  onBack,
  currentStep = 3,
  totalSteps = 5,
}) => {
  const {
    userRole,
    schoolName: storeSchool,
    degree: storeDegree,
    companyName: storeCompany,
    jobTitle: storeTitle,
    setEducation,
    setWorkExperience,
    educationList,
    workExperienceList,
  } = useOnboardingStore();

  const { toast } = useToast();

  const isStudent = ["student", "fresher", "intern"].includes(userRole || "");
  const isEmployed = ["employed", "self_employed"].includes(userRole || "");

  // Student state
  const [school, setSchool] = useState(storeSchool || "");
  const [degree, setDegree] = useState(storeDegree || "");

  // Employed state
  const [company, setCompany] = useState(storeCompany || "");
  const [jobTitle, setJobTitle] = useState(storeTitle || "");

  // Open to work state
  const [preferredRole, setPreferredRole] = useState(storeTitle || "");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeSchool) setSchool(storeSchool);
    if (storeDegree) setDegree(storeDegree);
    if (storeCompany) setCompany(storeCompany);
    if (storeTitle) {
      setJobTitle(storeTitle);
      setPreferredRole(storeTitle);
    }
  }, [storeSchool, storeDegree, storeCompany, storeTitle]);

  const isValid = isStudent
    ? school.trim() !== "" && degree.trim() !== ""
    : isEmployed
    ? company.trim() !== "" && jobTitle.trim() !== ""
    : preferredRole.trim() !== "";

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || !userRole || isSaving) return;

    setIsSaving(true);
    try {
      if (isStudent) {
        await saveOnboardingDetails({
          role: userRole,
          school_name: school,
          degree: degree,
          educations: educationList,
          experiences: workExperienceList,
        });
        setEducation(school, degree);
      } else if (isEmployed) {
        await saveOnboardingDetails({
          role: userRole,
          company_name: company,
          title: jobTitle,
          educations: educationList,
          experiences: workExperienceList,
        });
        setWorkExperience(company, jobTitle);
      } else {
        await saveOnboardingDetails({
          role: userRole,
          title: preferredRole,
          educations: educationList,
          experiences: workExperienceList,
        });
        setWorkExperience("", preferredRole);
      }

      onNext();
    } catch (error) {
      console.error("Failed to save details:", error);
      toast({
        title: "Error",
        description: "Failed to save details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-[391px] min-h-[480px] p-4 flex flex-col items-center gap-5 font-['DM_Sans',sans-serif] text-ds-text-primary select-none">
      {/* Title Section */}
      <div className="w-[359px] flex flex-col items-center justify-center p-0 gap-2 text-center">
        <span className="text-[12px] font-medium tracking-wide text-ds-accent uppercase">
          Step {currentStep} of {totalSteps}
        </span>
        <h1 className="text-[32px] font-bold font-['DM_Sans'] leading-[40px] tracking-tight">
          <span className="text-ds-text-primary">Tell us </span>
          <span className="text-ds-accent">more about you</span>
        </h1>
        <p className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-ds-text-secondary max-w-[320px]">
          {isStudent
            ? "Add your school or university and degree"
            : isEmployed
            ? "Add your current workplace and role"
            : "Add your preferred job role or target position"}
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleContinue} className="w-full flex flex-col items-center gap-2 mt-2">
        {isStudent ? (
          <>
            <UnderlineInput
              placeholder="School or University"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              disabled={isSaving}
              required
            />
            <UnderlineInput
              placeholder="Degree or Field of Study"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              disabled={isSaving}
              required
            />
          </>
        ) : isEmployed ? (
          <>
            <UnderlineInput
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={isSaving}
              required
            />
            <UnderlineInput
              placeholder="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isSaving}
              required
            />
          </>
        ) : (
          <UnderlineInput
            placeholder="Target Role (e.g. Frontend Developer)"
            value={preferredRole}
            onChange={(e) => setPreferredRole(e.target.value)}
            disabled={isSaving}
            required
          />
        )}

        {/* Action Row */}
        <div className="w-[260px] flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="w-9 h-9 rounded-full bg-ds-surface-1 hover:bg-ds-surface-2 flex items-center justify-center text-ds-text-primary transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Back"
          >
            <LeftArrowIcon size={16} className="w-4 h-4" />
          </button>

          <PillButton
            type="submit"
            disabled={!isValid || isSaving}
            isLoading={isSaving}
            label="Continue"
            className="!w-[212px]"
          />
        </div>
      </form>
    </div>
  );
};

export default StepDetails;
