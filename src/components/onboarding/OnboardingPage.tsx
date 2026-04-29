"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LetsBeginStep from "@/components/onboarding/LetsBeginStep";
import ProfileStep from "@/components/onboarding/ProfileStep";
import TellUsAboutYouStep from "@/components/onboarding/TellUsAboutYouStep";
import UserRoleStep from "@/components/onboarding/UserRoleStep";
import InterestsStep from "@/components/onboarding/InterestsStep";
import {
  completeOnboarding,
  saveOnboardingInterests,
  saveOnboardingSkills,
  saveOnboardingDetails,
  getOnboardingInterests,
  getOnboardingSkills,
} from "@/services/api/onboarding";
import { useOnboardingStore } from "@/store/onboarding.store";
import { getProfile } from "@/services/api/profile";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";

const EducationStep = lazy(() => import("@/components/onboarding/EducationStep"));
const WorkExperienceStep = lazy(() => import("@/components/onboarding/WorkExperienceStep"));
const OpenToWorkStep = lazy(() => import("@/components/onboarding/OpenToWorkStep"));

const ONBOARDING_FLOW: Record<string | number, { next: any; prev: any }> = {
  0: { next: 1, prev: null },
  1: { next: 2, prev: 0 },
  2: { next: 3, prev: 1 },
  3: { 
    next: (role: string) => role === "unemployed" ? 4 : "substep",
    prev: 2 
  },
  "substep": { 
    next: 4, 
    prev: 3 
  },
  4: { 
    next: 5, 
    prev: (role: string) => role === "unemployed" ? 3 : "substep" 
  },
  5: { next: null, prev: 4 }
};

export default function OnboardingPage() {
  const {
    step, setStep,
    userRole, setUserRole,
    showSubStep, setShowSubStep,
    selectedInterests, setSelectedInterests,
    selectedSkills, setSelectedSkills,
    isInitialized, setInitialized,
    setFullName, setAccountName, setInitialAccountName, setProfileImage
  } = useOnboardingStore();

  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Search State ─────────────────────────────────────────────────────────
  const [interestSearch, setInterestSearch] = useState("");
  const [debouncedInterestSearch, setDebouncedInterestSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [debouncedSkillSearch, setDebouncedSkillSearch] = useState("");

  // Debounce interest search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInterestSearch(interestSearch), 300);
    return () => clearTimeout(timer);
  }, [interestSearch]);

  // Debounce skill search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSkillSearch(skillSearch), 300);
    return () => clearTimeout(timer);
  }, [skillSearch]);

  const totalSteps = 5;

  // ── Interest Data Fetching (React Query) ──────────────────────────────────
  const {
    data: interestData,
    fetchNextPage: fetchNextInterests,
    hasNextPage: hasMoreInterests,
    isLoading: isLoadingInterests,
    isFetchingNextPage: isFetchingMoreInterests,
  } = useInfiniteQuery({
    queryKey: ["onboarding-interests", debouncedInterestSearch],
    queryFn: ({ pageParam }) => getOnboardingInterests({ q: debouncedInterestSearch, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.next_cursor || undefined,
    enabled: step === 4,
    refetchOnWindowFocus: false,
  });

  const interestItems = interestData?.pages.flatMap(page => page.data.items.map(i => i.name)) || [];

  // ── Skill Data Fetching (React Query) ─────────────────────────────────────
  const {
    data: skillData,
    fetchNextPage: fetchNextSkills,
    hasNextPage: hasMoreSkills,
    isLoading: isLoadingSkills,
    isFetchingNextPage: isFetchingMoreSkills,
  } = useInfiniteQuery({
    queryKey: ["onboarding-skills", debouncedSkillSearch],
    queryFn: ({ pageParam }) => getOnboardingSkills({ q: debouncedSkillSearch, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.next_cursor || undefined,
    enabled: step === 5,
    refetchOnWindowFocus: false,
  });

  const skillItems = skillData?.pages.flatMap(page => page.data.items.map(i => i.name)) || [];

  // Initialize store from profile data once
  useEffect(() => {
    const initStore = async () => {
      if (isInitialized) return;

      try {
        const profile = await getProfile();
        if (profile && profile.user) {
          if (profile.user.name) setFullName(profile.user.name);
          if (profile.user.account_name) {
            setAccountName(profile.user.account_name);
            setInitialAccountName(profile.user.account_name);
          }
          if (profile.user.avatar) setProfileImage(profile.user.avatar);

          setInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize onboarding store:", error);
        toast.error("Failed to load profile data");
      }
    };

    initStore();
  }, [isInitialized, setFullName, setAccountName, setProfileImage, setInitialized]);

  const navigate = (direction: "next" | "prev") => {
    const currentState = showSubStep ? "substep" : step;
    const config = ONBOARDING_FLOW[currentState];
    if (!config) return;

    const target = typeof config[direction] === "function" 
      ? config[direction](userRole || "") 
      : config[direction];

    if (target === null) return;

    if (target === "substep") {
      setShowSubStep(true);
      setStep(3);
    } else {
      setShowSubStep(false);
      setStep(target);
    }
  };

  const handleNext = () => navigate("next");
  const handleBack = () => navigate("prev");

  const handleRoleSelect = async (role: string) => {
    setUserRole(role);
    if (role === "unemployed") {
      setShowSubStep(false);
      try {
        await saveOnboardingDetails({ role: "unemployed" });
      } catch (error) {
        console.error("Failed to advance onboarding step for unemployed:", error);
        toast.error("Failed to save role. Please try again.");
        return;
      }
      setStep(4);
    } else {
      setShowSubStep(true);
    }
  };

  const handleDetailsSubmit = () => {
    setShowSubStep(false);
    setStep(4);
  };

  const handleInterestsSubmit = async () => {
    if (selectedInterests.length < 3) {
      toast.error("Please select at least 3 interests");
      return;
    }
    if (selectedInterests.length > 7) {
      toast.error("Please select at most 7 interests");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboardingInterests(selectedInterests);
      setStep(5);
    } catch (error: any) {
      console.error("Failed to save interests:", error);
      const message = error.response?.data?.message || "Failed to save interests. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkillsSubmit = async () => {
    if (selectedSkills.length < 3) {
      toast.error("Please select at least 3 skills");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboardingSkills(selectedSkills);
      await completeOnboarding();
      
      setIsCompleted(true);
      toast.success("Onboarding completed!");
      setTimeout(() => {
        window.location.href = "/feed";
      }, 2000);
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      const message = error.response?.data?.message || "Failed to complete onboarding. Please check your connection.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-white overflow-hidden relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={showSubStep ? `substep-${userRole}` : `step-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="min-h-screen"
        >
          {step === 0 && (
            <LetsBeginStep onNext={handleNext} />
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
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
                </div>
              }>
                {["student", "fresher", "intern"].includes(userRole || "") ? (
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
                )}
              </Suspense>
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
              placeholder="Search interests"
              initialData={interestItems}
              selectedItems={selectedInterests}
              onChange={setSelectedInterests}
              isLoading={isSubmitting}
              isFetchingInitial={isLoadingInterests}
              isLoadingMore={isFetchingMoreInterests}
              hasMore={hasMoreInterests}
              loadingText="Loading interests..."
              onLoadMore={fetchNextInterests}
              onSearchChange={setInterestSearch}
              minSelection={3}
              maxSelection={7}
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
              initialData={skillItems}
              actionLabel="Finish"
              selectedItems={selectedSkills}
              onChange={setSelectedSkills}
              isLoading={isSubmitting}
              isFetchingInitial={isLoadingSkills}
              isLoadingMore={isFetchingMoreSkills}
              hasMore={hasMoreSkills}
              loadingText="Loading skills..."
              onLoadMore={fetchNextSkills}
              onSearchChange={setSkillSearch}
              minSelection={3}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
