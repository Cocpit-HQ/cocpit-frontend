"use client";

import { useState } from "react";
import LetsBeginStep from "@/components/onboarding/LetsBeginStep";
import ProfileStep from "@/components/onboarding/ProfileStep";
import TellUsAboutYouStep from "@/components/onboarding/TellUsAboutYouStep";
import UserRoleStep from "@/components/onboarding/UserRoleStep";
import EducationStep from "@/components/onboarding/EducationStep";
import WorkExperienceStep from "@/components/onboarding/WorkExperienceStep";
import FreelancerStep from "@/components/onboarding/FreelancerStep";
import OpenToWorkStep from "@/components/onboarding/OpenToWorkStep";
import InterestsStep from "@/components/onboarding/InterestsStep";
import { completeOnboarding, saveRole, saveDetails, saveInterests, saveSkills } from "@/services/api/onboarding";

const INTERESTS_DATA = [
  "Design", "Tech", "Marketing", "AI", "Startups",
  "Finance", "Content", "Remote jobs", "Product", "Engineering"
];

const SKILLS_DATA = [
  "React.js", "Node.js", "TypeScript", "Figma", "Python",
  "SQL", "OOPS", "UI Design", "UX Research", "DLDM"
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showSubStep, setShowSubStep] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const totalSteps = 5;

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));

  const handleBack = () => {
    if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
      setShowSubStep(true);
    } else if (step === 3 && showSubStep) {
      setShowSubStep(false);
    } else {
      setStep((s) => Math.max(s - 1, 0));
    }
  };

  const handleRoleSelect = async (role: string) => {
    try {
      await saveRole({ role });
      setUserRole(role);
      if (role === "student" || role === "working" || role === "freelancer" || role === "open_to_work") {
        setShowSubStep(true);
      } else {
        handleNext();
      }
    } catch (err) {
      console.error("Failed to save role:", err);
    }
  };

  const handleDetailsSubmit = async (details: any) => {
    try {
      // Map frontend roles to backend enum
      const roleMap: Record<string, string> = {
        working: "employed",
        freelancer: "self_employed",
        open_to_work: "unemployed",
        student: "student",
      };
      
      const mappedRole = userRole ? (roleMap[userRole] || userRole) : "unemployed";
      // Strip null values so Zod optional() fields don't receive explicit nulls
      const cleanDetails = Object.fromEntries(
        Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      await saveDetails({ role: mappedRole, ...cleanDetails });
      handleNext();
    } catch (err) {
      console.error("Failed to save details:", err);
    }
  };

  const handleInterestsSubmit = async (interests: string[]) => {
    try {
      await saveInterests({ interests });
      handleNext();
    } catch (err) {
      console.error("Failed to save interests:", err);
    }
  };

  const handleSkillsSubmit = async (skills: string[]) => {
    try {
      await saveSkills({ skills });
      handleFinish();
    } catch (err) {
      console.error("Failed to save skills:", err);
    }
  };

  const handleFinish = async () => {
    try {
      await completeOnboarding();
      setIsCompleted(true);
      // Automatically redirect after 2 seconds to feed
      setTimeout(() => {
        window.location.href = "/feed";
      }, 2000);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
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
            <span className="text-[#6366F1]">You’re</span>{" "}
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
          userRole === "student" ? (
            <EducationStep
              onNext={handleDetailsSubmit}
              onBack={handleBack}
              currentStep={3}
              totalSteps={totalSteps}
            />
          ) : userRole === "working" ? (
            <WorkExperienceStep
              onNext={handleDetailsSubmit}
              onBack={handleBack}
              currentStep={3}
              totalSteps={totalSteps}
            />
          ) : userRole === "freelancer" ? (
            <FreelancerStep
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
          onNext={handleInterestsSubmit}
          onBack={handleBack}
          currentStep={4}
          totalSteps={totalSteps}
          title="What are you interested in?"
          subtitle="Select a few to personalize your feed"
          placeholder="Search"
          initialData={INTERESTS_DATA}
          minSelection={4}
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
          minSelection={4}
        />
      )}
    </div>
  );
}
