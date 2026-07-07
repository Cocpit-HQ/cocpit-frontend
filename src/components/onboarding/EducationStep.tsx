"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingDetails, getEducationList, SchoolOption } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import styles from "./EducationStep.module.css";
import OnboardingDropdown from "./OnboardingDropdown";

interface EducationStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function EducationStep({ onNext, onBack, currentStep, totalSteps }: EducationStepProps) {
  const { userRole, schoolName: storeSchool, degree: storeDegree, setEducation } = useOnboardingStore();
  const { toast } = useToast();
  const [education, setEducationLocal] = useState(storeSchool || "");
  const [schoolOrgId, setSchoolOrgId] = useState<string | null>(null);
  const [specialization, setSpecializationLocal] = useState(storeDegree || "");
  const [isSaving, setIsSaving] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState<(string | SchoolOption)[]>([]);
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch school_names and degrees from the backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const data = await getEducationList();
        if (!isMounted) return;
        setSchoolOptions(data.schools || []);
        setProgramOptions(data.degrees || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch education list:", error);
        toast({
          title: "Error",
          description: "Failed to load education options.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const isValid = education !== "" && specialization !== "";

  const handleContinue = async () => {
    if (!isValid || !userRole) return;

    setIsSaving(true);
    try {
      await saveOnboardingDetails({
        role: userRole,
        school_name: education,   // Selected school → school_name
        school_org_id: schoolOrgId,
        degree: specialization,   // Selected program → degree
      });
      
      setEducation(education, specialization);
      onNext();
    } catch (error) {
      console.error("Failed to save education details:", error);
      toast({
        title: "Error",
        description: "Failed to save your education details. Please try again.",
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
            label="School / University"
            placeholder={loadingOptions ? "Loading schools..." : "Select your school"}
            options={schoolOptions}
            value={education}
            onChange={(val, opt) => {
              setEducationLocal(val);
              setSchoolOrgId(opt?.org_id || null);
            }}
            disabled={loadingOptions}
          />

          <OnboardingDropdown
            label="Program"
            placeholder={loadingOptions ? "Loading programs..." : "Select your program"}
            options={programOptions}
            value={specialization}
            onChange={(val) => setSpecializationLocal(val)}
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
