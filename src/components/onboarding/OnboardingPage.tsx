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

// Maps backend onboarding_step string → frontend step number
const STEP_MAP: Record<string, number> = {
  PROFILE:   1,
  LOCATION:  2,
  ROLE:      3,
  DETAILS:   3, // substep handled separately
  INTERESTS: 4,
  SKILLS:    5,
};

export default function OnboardingPage() {
  const {
    step, setStep,
    userRole, setUserRole,
    showSubStep, setShowSubStep,
    selectedInterests, setSelectedInterests,
    selectedSkills, setSelectedSkills,
    isInitialized, setInitialized,
    setFullName, setAccountName, setInitialAccountName, setProfileImage,
    setLocation, setEducation, setWorkExperience,
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
          const u = profile.user;

          // ── Step 1: Profile data ────────────────────────────────────────
          if (u.name) setFullName(u.name);
          if (u.account_name) {
            setAccountName(u.account_name);
            setInitialAccountName(u.account_name);
          }
          if (u.avatar) setProfileImage(u.avatar);

          // ── Step 2: Location (structured) ──────────────────────────────
          if (u.location_place_id) {
            setLocation({
              placeId: u.location_place_id,
              formattedAddress: u.location_formatted || u.location || "",
              country: u.location_country || "",
              state: u.location_state || null,
              city: u.location_city || "",
              latitude: u.location_lat || null,
              longitude: u.location_lng || null,
            });
          }

          // ── Step 3: Role ────────────────────────────────────────────────
          if (u.user_role) setUserRole(u.user_role);

          // ── Step 3 Details: Education & Work ────────────────────────────
          if (profile.educations && profile.educations.length > 0) {
            const latestEd = profile.educations[0];
            setEducation(latestEd.school_name || "", latestEd.degree || "");
          }
          if (profile.experiences && profile.experiences.length > 0) {
            // experiences are returned grouped by company_name
            const latestExpGroup = profile.experiences[0];
            if (latestExpGroup.experiences && latestExpGroup.experiences.length > 0) {
              const latestExp = latestExpGroup.experiences[0];
              setWorkExperience(latestExp.company_name || "", latestExp.title || "");
            }
          }

          // ── Step 4: Interests (already submitted) ───────────────────────
          if (u.interest_names && u.interest_names.length > 0) {
            setSelectedInterests(u.interest_names);
          }

          // ── Step 5: Skills (already submitted) ─────────────────────────
          if (u.skill_names && u.skill_names.length > 0) {
            setSelectedSkills(u.skill_names);
          }

          // ── Restore step from backend ───────────────────────────────────
          const backendStep = u.onboarding_step;
          if (backendStep && STEP_MAP[backendStep] !== undefined) {
            setStep(STEP_MAP[backendStep]);
            if (backendStep === "DETAILS") setShowSubStep(false);
          }

          setInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize onboarding store:", error);
        toast.error("Failed to load profile data");
      }
    };

    initStore();
  }, [
    isInitialized, setFullName, setAccountName, setProfileImage, 
    setInitialized, setStep, setShowSubStep, setLocation, 
    setUserRole, setSelectedSkills, setSelectedInterests,
    setEducation, setWorkExperience
  ]);

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white" data-theme="light">
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
    <div className="min-h-screen bg-white overflow-hidden relative" data-theme="light">
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
              title="Add your skills to continue"
              subtitle="Help us match you with better opportunities"
              placeholder="Search"
              initialData={skillItems}
              actionLabel="Continue"
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
              maxSelection={15}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
