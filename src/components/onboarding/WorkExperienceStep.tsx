"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails, getCompanyList, CompanyOption } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import styles from "./WorkExperienceStep.module.css";
import OnboardingDropdown from "./OnboardingDropdown";

interface WorkExperienceStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

// Static fallback if API returns no data
const FALLBACK_COMPANIES = [
  "Google", "Amazon", "Microsoft", "Netflix",
  "Apple", "Meta", "Uber", "Other",
];

const FALLBACK_ROLES = [
  "Software Engineer", "Product Manager", "UI/UX Designer",
  "Data Scientist", "Marketing Manager", "Sales Representative",
  "Project Manager", "Other",
];

export default function WorkExperienceStep({ onNext, onBack, currentStep, totalSteps }: WorkExperienceStepProps) {
  const { 
    userRole, 
    companyName: storeCompany, 
    jobTitle: storeTitle, 
    setWorkExperience 
  } = useOnboardingStore();
  
  const { toast } = useToast();
  const [company, setCompanyLocal] = useState(storeCompany || "");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRoleLocal] = useState(storeTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<(string | CompanyOption)[]>(FALLBACK_COMPANIES);
  const [roleOptions, setRoleOptions] = useState<string[]>(FALLBACK_ROLES);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch live company names and titles from the backend on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await getCompanyList();
        if (data.companies && data.companies.length > 0) {
          setCompanyOptions(data.companies);
        }
        if (data.titles && data.titles.length > 0) {
          setRoleOptions(data.titles);
        }
      } catch (error) {
        // Keep fallback options on error — no crash
        console.error("Failed to fetch company list:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const isValid = company !== "" && role !== "";

  const handleContinue = async () => {
    if (!isValid || !userRole) return;

    setIsSaving(true);
    try {
      await saveOnboardingDetails({
        role: userRole,
        company_name: company,
        title: role,
        org_id: orgId,
      });
      
      setWorkExperience(company, role);
      onNext();
    } catch (error) {
      console.error("Failed to save work details:", error);
      toast({
        title: "Error",
        description: "Failed to save your work details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.PNG" alt="Cocpit Logo" height={56} className={styles.logo} />
          </div>
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle Group */}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Tell us more about you</h1>
          <p className={styles.subtitle}>This helps us show relevant opportunities</p>
        </div>

        {/* Form */}
        <div className={styles.form}>
          <OnboardingDropdown
            label="Company"
            placeholder="Where do you work?"
            options={companyOptions}
            value={company}
            onChange={(val, opt) => {
              setCompanyLocal(val);
              setOrgId(opt?.org_id || null);
            }}
            disabled={loadingOptions}
          />

          <OnboardingDropdown
            label="Role"
            placeholder="Your job title"
            options={roleOptions}
            value={role}
            onChange={(val) => setRoleLocal(val)}
            disabled={loadingOptions}
          />
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!isValid || isSaving || loadingOptions}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
