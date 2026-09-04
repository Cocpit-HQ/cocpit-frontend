"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  saveOnboardingDetails,
  getCompanyList,
  getEducationList,
  CompanyOption,
  SchoolOption,
} from "@/services/api/onboarding";
import OnboardingProgressBar from "./OnboardingProgressBar";
import OnboardingDropdown, { DropdownOption } from "./OnboardingDropdown";
import PillButton from "./PillButton";

interface StepBackgroundProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const FALLBACK_ORGANIZATIONS: DropdownOption[] = [
  { id: "Google", label: "Google" },
  { id: "Microsoft", label: "Microsoft" },
  { id: "Amazon", label: "Amazon" },
  { id: "Apple", label: "Apple" },
  { id: "Meta", label: "Meta" },
  { id: "Netflix", label: "Netflix" },
  { id: "Uber", label: "Uber" },
  { id: "Infosys", label: "Infosys" },
  { id: "TCS", label: "TCS" },
  { id: "Wipro", label: "Wipro" },
];

const FALLBACK_ROLES: DropdownOption[] = [
  { id: "Software Engineer", label: "Software Engineer" },
  { id: "Product Manager", label: "Product Manager" },
  { id: "UI/UX Designer", label: "UI/UX Designer" },
  { id: "Human Resources", label: "Human Resources" },
  { id: "Data Scientist", label: "Data Scientist" },
  { id: "Marketing Manager", label: "Marketing Manager" },
  { id: "Business Analyst", label: "Business Analyst" },
  { id: "Project Manager", label: "Project Manager" },
  { id: "Sales Executive", label: "Sales Executive" },
  { id: "Intern", label: "Intern" },
];

const FALLBACK_SCHOOLS: DropdownOption[] = [
  { id: "Harvard University", label: "Harvard University" },
  { id: "Stanford University", label: "Stanford University" },
  { id: "MIT", label: "MIT" },
  { id: "IIT Bombay", label: "IIT Bombay" },
  { id: "IIT Delhi", label: "IIT Delhi" },
  { id: "IIT Madras", label: "IIT Madras" },
  { id: "IIM Ahmedabad", label: "IIM Ahmedabad" },
  { id: "IIM Bangalore", label: "IIM Bangalore" },
  { id: "Shivaji University", label: "Shivaji University" },
  { id: "Pune University", label: "Pune University" },
  { id: "Mumbai University", label: "Mumbai University" },
];

const FALLBACK_PROGRAMS: DropdownOption[] = [
  { id: "Bachelor of Technology", label: "Bachelor of Technology" },
  { id: "Bachelor of Engineering", label: "Bachelor of Engineering" },
  { id: "Bachelor of Science", label: "Bachelor of Science" },
  { id: "Bachelor of Commerce", label: "Bachelor of Commerce" },
  { id: "Bachelor of Arts", label: "Bachelor of Arts" },
  { id: "Master of Business Administration", label: "Master of Business Administration" },
  { id: "Master of Science", label: "Master of Science" },
  { id: "Master of Technology", label: "Master of Technology" },
  { id: "Doctor of Philosophy (PhD)", label: "Doctor of Philosophy (PhD)" },
  { id: "Diploma", label: "Diploma" },
];

export const StepBackground: React.FC<StepBackgroundProps> = ({
  onNext,
  currentStep = 3,
  totalSteps = 5,
}) => {
  const {
    userRole,
    companyName: storeCompany,
    jobTitle: storeTitle,
    schoolName: storeSchool,
    degree: storeDegree,
    setWorkExperience,
    setEducation,
    educationList,
    workExperienceList,
    isInitialized,
  } = useOnboardingStore();

  const { toast } = useToast();

  // Determine branch: Experience vs. Education
  const isExperienceBranch = useMemo(() => {
    if (!userRole) return false;
    const normalizedRole = userRole.toLowerCase().trim().replace(/[- ]/g, "_");
    return ["employed", "self_employed", "intern"].includes(normalizedRole);
  }, [userRole]);

  // Form selections
  const [selectedCompany, setSelectedCompany] = useState<string>(storeCompany || "");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(storeTitle || "");

  const [selectedSchool, setSelectedSchool] = useState<string>(storeSchool || "");
  const [selectedSchoolOrgId, setSelectedSchoolOrgId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>(storeDegree || "");

  // Options & Loaders
  const [companyOptions, setCompanyOptions] = useState<DropdownOption[]>(FALLBACK_ORGANIZATIONS);
  const [roleOptions, setRoleOptions] = useState<DropdownOption[]>(FALLBACK_ROLES);
  const [schoolOptions, setSchoolOptions] = useState<DropdownOption[]>(FALLBACK_SCHOOLS);
  const [programOptions, setProgramOptions] = useState<DropdownOption[]>(FALLBACK_PROGRAMS);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single-shot initial hydration from store on mount / profile load
  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (isInitialized && !isHydratedRef.current) {
      isHydratedRef.current = true;
      if (storeCompany) setSelectedCompany(storeCompany);
      if (storeTitle) setSelectedRole(storeTitle);
      if (storeSchool) setSelectedSchool(storeSchool);
      if (storeDegree) setSelectedProgram(storeDegree);
    }
  }, [isInitialized, storeCompany, storeTitle, storeSchool, storeDegree]);

  // Fetch initial Companies & Roles on mount
  useEffect(() => {
    if (!isExperienceBranch) return;
    let isCancelled = false;
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await getCompanyList();
        if (!isCancelled && res) {
          if (Array.isArray(res.companies) && res.companies.length > 0) {
            const seen = new Set<string>();
            const unique: DropdownOption[] = [];
            for (const c of res.companies) {
              if (c.name && !seen.has(c.name.toLowerCase())) {
                seen.add(c.name.toLowerCase());
                unique.push({ id: c.name, label: c.name, data: c });
              }
            }
            if (unique.length > 0) setCompanyOptions(unique);
          }
          if (Array.isArray(res.titles) && res.titles.length > 0) {
            const seen = new Set<string>();
            const unique: DropdownOption[] = [];
            for (const t of res.titles) {
              if (t && !seen.has(t.toLowerCase())) {
                seen.add(t.toLowerCase());
                unique.push({ id: t, label: t });
              }
            }
            if (unique.length > 0) setRoleOptions(unique);
          }
        }
      } catch (err) {
        // Fallback options remain active
      } finally {
        if (!isCancelled) setLoadingCompanies(false);
      }
    };

    fetchCompanies();
    return () => {
      isCancelled = true;
    };
  }, [isExperienceBranch]);

  // Fetch initial Schools & Programs on mount
  useEffect(() => {
    if (isExperienceBranch) return;
    let isCancelled = false;
    const fetchEducations = async () => {
      setLoadingSchools(true);
      try {
        const res = await getEducationList();
        if (!isCancelled && res) {
          if (Array.isArray(res.schools) && res.schools.length > 0) {
            const seen = new Set<string>();
            const unique: DropdownOption[] = [];
            for (const s of res.schools) {
              if (s.name && !seen.has(s.name.toLowerCase())) {
                seen.add(s.name.toLowerCase());
                unique.push({ id: s.name, label: s.name, data: s });
              }
            }
            if (unique.length > 0) setSchoolOptions(unique);
          }
          if (Array.isArray(res.degrees) && res.degrees.length > 0) {
            const seen = new Set<string>();
            const unique: DropdownOption[] = [];
            for (const d of res.degrees) {
              if (d && !seen.has(d.toLowerCase())) {
                seen.add(d.toLowerCase());
                unique.push({ id: d, label: d });
              }
            }
            if (unique.length > 0) setProgramOptions(unique);
          }
        }
      } catch (err) {
        // Fallback options remain active
      } finally {
        if (!isCancelled) setLoadingSchools(false);
      }
    };

    fetchEducations();
    return () => {
      isCancelled = true;
    };
  }, [isExperienceBranch]);

  // Form validity
  const isFormValid = useMemo(() => {
    if (isExperienceBranch) {
      return !!selectedCompany.trim() && !!selectedRole.trim();
    } else {
      return !!selectedSchool.trim() && !!selectedProgram.trim();
    }
  }, [isExperienceBranch, selectedCompany, selectedRole, selectedSchool, selectedProgram]);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || !userRole || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isExperienceBranch) {
        await saveOnboardingDetails({
          role: userRole,
          company_name: selectedCompany.trim(),
          title: selectedRole.trim(),
          org_id: selectedOrgId,
          educations: educationList,
          experiences: workExperienceList,
        });
        setWorkExperience(selectedCompany.trim(), selectedRole.trim());
      } else {
        await saveOnboardingDetails({
          role: userRole,
          school_name: selectedSchool.trim(),
          degree: selectedProgram.trim(),
          school_org_id: selectedSchoolOrgId,
          educations: educationList,
          experiences: workExperienceList,
        });
        setEducation(selectedSchool.trim(), selectedProgram.trim());
      }

      onNext();
    } catch (error: any) {
      console.error("Failed to save background details:", error);
      const msg = error.response?.data?.message || "Failed to save details. Please try again.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-sans text-ds-text-primary select-none relative">
      {/* Centered Vertical Stack: Progress Bar + 20px gap + Main Content Container */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Frame 41: Progress Bar (Step 3 of 5) */}
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Frame 1: Main Content Container (497px x 370px, padding 16px, gap 20px, rounded 24px) */}
        <div className="w-[497px] h-[370px] p-4 flex flex-col items-center gap-5 rounded-[24px] box-border">
          {/* Header Section */}
          <div className="w-full flex flex-col items-center p-0 gap-2 text-center">
            <h1 className="w-full font-sans font-bold text-[40px] leading-[48px] text-center text-ds-text-primary tracking-normal m-0 p-0">
              Tell us your <span className="text-ds-accent">background</span>
            </h1>
            <p className="w-full font-sans font-semibold text-[16px] leading-[24px] text-center text-ds-text-primary m-0 p-0">
              {isExperienceBranch ? "Add your experience" : "Add your education"}
            </p>
          </div>

          {/* Figma Inputs Container: w-64 inline-flex flex-col justify-start items-center gap-3 */}
          <form
            onSubmit={handleSubmit}
            className="w-64 inline-flex flex-col justify-start items-center gap-3 mt-1"
          >
            {isExperienceBranch ? (
              <>
                {/* Input 1: Organization */}
                <div className="h-14 flex flex-col justify-start items-start gap-2.5">
                  <OnboardingDropdown
                    id="organization-dropdown"
                    placeholder="Organization"
                    value={selectedCompany}
                    displayValue={selectedCompany}
                    options={companyOptions}
                    onSelect={(opt) => {
                      const val = opt ? opt.label : "";
                      setSelectedCompany(val);
                      setSelectedOrgId(opt?.data?.org_id || null);
                      setWorkExperience(val, selectedRole);
                    }}
                    searchable
                    isLoading={loadingCompanies}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Input 2: Role */}
                <div className="h-14 flex flex-col justify-start items-start gap-2.5">
                  <OnboardingDropdown
                    id="role-dropdown"
                    placeholder="Role"
                    value={selectedRole}
                    displayValue={selectedRole}
                    options={roleOptions}
                    onSelect={(opt) => {
                      const val = opt ? opt.label : "";
                      setSelectedRole(val);
                      setWorkExperience(selectedCompany, val);
                    }}
                    searchable
                    disabled={isSubmitting}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Input 1: School or university */}
                <div className="h-14 flex flex-col justify-start items-start gap-2.5">
                  <OnboardingDropdown
                    id="school-dropdown"
                    placeholder="School or university"
                    value={selectedSchool}
                    displayValue={selectedSchool}
                    options={schoolOptions}
                    onSelect={(opt) => {
                      const val = opt ? opt.label : "";
                      setSelectedSchool(val);
                      setSelectedSchoolOrgId(opt?.data?.org_id || null);
                      setEducation(val, selectedProgram);
                    }}
                    searchable
                    isLoading={loadingSchools}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Input 2: Program */}
                <div className="h-14 flex flex-col justify-start items-start gap-2.5">
                  <OnboardingDropdown
                    id="program-dropdown"
                    placeholder="Program"
                    value={selectedProgram}
                    displayValue={selectedProgram}
                    options={programOptions}
                    onSelect={(opt) => {
                      const val = opt ? opt.label : "";
                      setSelectedProgram(val);
                      setEducation(selectedSchool, val);
                    }}
                    searchable
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            {/* Continue Button (Frame: 260px x 36px) */}
            <div className="w-64 flex justify-center mt-2">
              <PillButton
                type="submit"
                disabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
                label="Continue"
                className="!w-64 !h-[36px]"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StepBackground;
