"use client";

import { useState } from "react";
import LetsBeginStep from "@/components/onboarding/LetsBeginStep";
import ProfileStep from "@/components/onboarding/ProfileStep";
import TellUsAboutYouStep from "@/components/onboarding/TellUsAboutYouStep";
import UserRoleStep from "@/components/onboarding/UserRoleStep";
import EducationStep from "@/components/onboarding/EducationStep";
import WorkExperienceStep from "@/components/onboarding/WorkExperienceStep";
import OpenToWorkStep from "@/components/onboarding/OpenToWorkStep";
import InterestsStep from "@/components/onboarding/InterestsStep";
import {
  completeOnboarding,
  saveOnboardingInterests,
  saveOnboardingSkills,
  saveOnboardingDetails,
} from "@/services/api/onboarding";
import { useOnboardingStore } from "@/store/onboarding.store";
import { getProfile } from "@/services/api/profile";
import { useEffect } from "react";

const INTERESTS_DATA = [
  "Artificial Intelligence", "Technology", "Marketing", "Startups",
  "Finance", "Content Creation", "Remote Work", "Design"
];

const SKILLS_DATA = [
  "React.js", "Node.js", "TypeScript", "Figma", "Python",
  "SQL", "OOPS", "UI Design", "UX Research", "DLDM"
];

export default function OnboardingPage() {
  const {
    step, setStep,
    userRole, setUserRole,
    showSubStep, setShowSubStep,
    selectedInterests, setSelectedInterests,
    selectedSkills, setSelectedSkills,
    isInitialized, setInitialized,
    setFullName, setAccountName, setProfileImage
  } = useOnboardingStore();

  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 5;

  // Initialize store from profile data once
  useEffect(() => {
    const initStore = async () => {
      if (isInitialized) return;

      try {
        const profile = await getProfile();
        if (profile && profile.user) {
          if (profile.user.name) setFullName(profile.user.name);
          if (profile.user.account_name) setAccountName(profile.user.account_name);
          if (profile.user.avatar) setProfileImage(profile.user.avatar);

          setInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize onboarding store:", error);
      }
    };

    initStore();
  }, [isInitialized, setFullName, setAccountName, setProfileImage, setInitialized]);

  const handleNext = () => setStep(Math.min(step + 1, totalSteps));

  const handleBack = () => {
    if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
      // Only show sub-step on back if the role actually has one
      if (userRole !== "unemployed") setShowSubStep(true);
    } else if (step === 3 && showSubStep) {
      setShowSubStep(false);
    } else {
      setStep(Math.max(step - 1, 0));
    }
  };

  const handleRoleSelect = async (role: string) => {
    setUserRole(role);
    if (role === "unemployed") {
      // Unemployed skips the sub-step — but still call saveDetails to advance
      // onboarding_step from DETAILS → INTERESTS on the backend
      setShowSubStep(false);
      try {
        await saveOnboardingDetails({ role: "unemployed" });
      } catch (error) {
        console.error("Failed to advance onboarding step for unemployed:", error);
        // Non-fatal: role was already saved, proceed anyway
      }
      setStep(4);
    } else {
      // All other roles have a sub-step to collect more info
      setShowSubStep(true);
    }
  };

  /**
   * Called by EducationStep, WorkExperienceStep, FreelancerStep, OpenToWorkStep
   * after their API call succeeds internally. We just advance to step 4.
   */
  const handleDetailsSubmit = () => {
    setShowSubStep(false);
    setStep(4);
  };

  /**
   * Called by the Skills InterestsStep (step 5) with the selected skills array.
   * Saves skills then completes onboarding.
   */
  const handleSkillsSubmit = async (skills: string[]) => {
    setIsSaving(true);
    try {
      await saveOnboardingSkills(skills);
      setSelectedSkills(skills);

      await completeOnboarding();

      setIsCompleted(true);
      setTimeout(() => {
        window.location.href = "/feed";
      }, 2000);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center" style={{ width: "208px", gap: "8px" }}>
          <img
            src="/assets/profilecompletion.svg"
            alt="Success"
            className="object-contain"
            style={{ width: "200px", height: "200px" }}
          />
          <h1 className="text-[28px] leading-tight font-bold m-0 p-0 text-center">
            <span className="text-[#6366F1]">You're</span>{" "}
            <span className="text-[#10b981]">all set</span>
          </h1>
          <p className="text-[#71717A] text-[13px] m-0 p-0 font-normal animate-pulse text-center">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {step === 0 && (
        <LetsBeginStep
          onNext={handleNext}
        />
      )}
      {step === 1 && (
        <ProfileStep
          onNext={handleNext}
          onBack={handleBack}
          currentStep={1}
          totalSteps={totalSteps}
        />
      )}
      {step === 2 && (
        <TellUsAboutYouStep
          onNext={handleNext}
          onBack={handleBack}
          currentStep={2}
          totalSteps={totalSteps}
        />
      )}
      {step === 3 && (
        !showSubStep ? (
          <UserRoleStep
            onNext={handleRoleSelect}
            onBack={handleBack}
            currentStep={3}
            totalSteps={totalSteps}
          />
        ) : (
          ["student", "fresher", "intern"].includes(userRole || "") ? (
            <EducationStep
              onNext={handleDetailsSubmit}
              onBack={handleBack}
              currentStep={3}
              totalSteps={totalSteps}
            />
          ) : userRole === "employed" || userRole === "self_employed" ? (
            <WorkExperienceStep
              onNext={handleDetailsSubmit}
              onBack={handleBack}
              currentStep={3}
              totalSteps={totalSteps}
            />
          ) : (
            <OpenToWorkStep
              onNext={handleDetailsSubmit}
              onBack={handleBack}
              currentStep={3}
              totalSteps={totalSteps}
            />
          )
        )
      )}
      {step === 4 && (
        <InterestsStep
          onNext={async (interests) => {
            setIsSaving(true);
            try {
              await saveOnboardingInterests(interests);
              setSelectedInterests(interests);
              handleNext();
            } catch (error) {
              console.error("Failed to save interests:", error);
            } finally {
              setIsSaving(false);
            }
          }}
          onBack={handleBack}
          currentStep={4}
          totalSteps={totalSteps}
          title="What are you interested in?"
          subtitle="Select a few to personalize your feed"
          placeholder="Search"
          initialData={INTERESTS_DATA}
          minSelection={3}
          initialSelected={selectedInterests}
          isLoading={isSaving}
        />
      )}
      {step === 5 && (
        <InterestsStep
          onNext={handleSkillsSubmit}
          onBack={handleBack}
          currentStep={5}
          totalSteps={totalSteps}
          title="What are your skills?"
          subtitle="List your top skills to help you stand out"
          placeholder="Search skills"
          initialData={SKILLS_DATA}
          actionLabel="Finish"
          minSelection={3}
          initialSelected={selectedSkills}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
