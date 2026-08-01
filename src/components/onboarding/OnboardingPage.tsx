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
import { useForceLightTheme } from "@/hooks/use-force-light-theme";

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

const stepToKey = (stepNum: number, isSubStep: boolean): string => {
  if (stepNum === 0) return "begin";
  if (stepNum === 1) return "profile";
  if (stepNum === 2) return "location";
  if (stepNum === 3) return isSubStep ? "details" : "role";
  if (stepNum === 4) return "interests";
  if (stepNum === 5) return "skills";
  return "begin";
};

const keyToStep = (key: string): { step: number; showSubStep: boolean } => {
  switch (key) {
    case "begin": return { step: 0, showSubStep: false };
    case "profile": return { step: 1, showSubStep: false };
    case "location": return { step: 2, showSubStep: false };
    case "role": return { step: 3, showSubStep: false };
    case "details": return { step: 3, showSubStep: true };
    case "interests": return { step: 4, showSubStep: false };
    case "skills": return { step: 5, showSubStep: false };
    default: return { step: 0, showSubStep: false };
  }
};

const getPrevStep = (currentStep: number, isSubStep: boolean, role: string): { step: number; showSubStep: boolean } | null => {
  const currentState = isSubStep ? "substep" : currentStep;
  const config = ONBOARDING_FLOW[currentState];
  if (!config || config.prev === null) return null;

  const target = typeof config.prev === "function"
    ? config.prev(role)
    : config.prev;

  if (target === "substep") {
    return { step: 3, showSubStep: true };
  } else {
    return { step: target, showSubStep: false };
  }
};

const isStepAhead = (stepA: number, subA: boolean, stepB: number, subB: boolean): boolean => {
  if (stepA > stepB) return true;
  if (stepA === stepB) {
    return subA && !subB;
  }
  return false;
};

const getMaxAllowedStep = (backendStep: string | null): { step: number; showSubStep: boolean } => {
  if (!backendStep) {
    return { step: 0, showSubStep: false };
  }
  if (backendStep === "DETAILS") {
    return { step: 3, showSubStep: true };
  }
  const mappedStep = STEP_MAP[backendStep];
  if (mappedStep !== undefined) {
    return { step: mappedStep, showSubStep: false };
  }
  return { step: 5, showSubStep: false };
};

export default function OnboardingPage() {
  useForceLightTheme();
  const {
    step, setStep,
    userRole, setUserRole,
    showSubStep, setShowSubStep,
    selectedInterests, setSelectedInterests,
    selectedSkills, setSelectedSkills,
    isInitialized, setInitialized,
    setFullName, setAccountName, setInitialAccountName, setProfileImage,
    setLocation, setEducation, setWorkExperience,
    educationList, setEducationList,
    workExperienceList, setWorkExperienceList,
    parsedResumeData,
  } = useOnboardingStore();

  const maxAllowedStepRef = useRef<{ step: number; showSubStep: boolean }>({ step: 1, showSubStep: false });

  const advanceMaxAllowedStep = (targetStep: number, targetSub: boolean) => {
    const currentMax = maxAllowedStepRef.current;
    if (isStepAhead(targetStep, targetSub, currentMax.step, currentMax.showSubStep)) {
      maxAllowedStepRef.current = { step: targetStep, showSubStep: targetSub };
    }
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Save current validated step to sessionStorage
  useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem(
        "cocpit_onboarding_step",
        JSON.stringify({ step, showSubStep })
      );
    }
  }, [step, showSubStep, isInitialized]);

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

          // ── Restore step from URL or backend ─────────────────────────────
          const params = new URLSearchParams(window.location.search);
          const urlStep = params.get("step");
          let initialStep = 0;
          let initialSub = false;

          const maxStep = getMaxAllowedStep(u.onboarding_step || null);
          maxAllowedStepRef.current = maxStep;

          if (urlStep) {
            const { step: targetStep, showSubStep: targetSub } = keyToStep(urlStep);
            initialStep = targetStep;
            initialSub = targetSub;
          } else {
            initialStep = maxStep.step;
            initialSub = maxStep.showSubStep;
          }

          if (isStepAhead(initialStep, initialSub, maxStep.step, maxStep.showSubStep)) {
            initialStep = maxStep.step;
            initialSub = maxStep.showSubStep;
          }

          setStep(initialStep);
          setShowSubStep(initialSub);

          // ── Inject previous step history state if loading step > 0 ───────
          const historyState = window.history.state;
          if (initialStep > 0 || initialSub) {
            if (!historyState || historyState.stepKey !== stepToKey(initialStep, initialSub)) {
              const prev = getPrevStep(initialStep, initialSub, u.user_role || "");
              if (prev) {
                const prevKey = stepToKey(prev.step, prev.showSubStep);
                const currentKey = stepToKey(initialStep, initialSub);
                window.history.replaceState({ stepKey: prevKey }, "", `?step=${prevKey}`);
                window.history.pushState({ stepKey: currentKey }, "", `?step=${currentKey}`);
              } else {
                const currentKey = stepToKey(initialStep, initialSub);
                window.history.replaceState({ stepKey: currentKey }, "", `?step=${currentKey}`);
              }
            }
          } else {
            const currentKey = stepToKey(initialStep, initialSub);
            if (urlStep && urlStep !== currentKey) {
              window.history.replaceState({ stepKey: currentKey }, "", `?step=${currentKey}`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize onboarding store:", error);
        toast.error("Failed to load profile data. You can still set up your profile manually.");
      } finally {
        setInitialized(true);
      }
    };

    initStore();
  }, [
    isInitialized, setFullName, setAccountName, setProfileImage, 
    setInitialized, setStep, setShowSubStep, setLocation, 
    setUserRole, setSelectedSkills, setSelectedInterests,
    setEducation, setWorkExperience
  ]);

  // ── Popstate listener for back/forward navigation ─────────────────────────
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const stepParam = event.state?.stepKey || params.get("step");
      
      let targetStep = 0;
      let targetSub = false;
      if (stepParam) {
        const parsed = keyToStep(stepParam);
        targetStep = parsed.step;
        targetSub = parsed.showSubStep;
      }

      const maxAllowed = maxAllowedStepRef.current;
      if (isStepAhead(targetStep, targetSub, maxAllowed.step, maxAllowed.showSubStep)) {
        setStep(maxAllowed.step);
        setShowSubStep(maxAllowed.showSubStep);
        const maxKey = stepToKey(maxAllowed.step, maxAllowed.showSubStep);
        window.history.replaceState({ stepKey: maxKey }, "", `?step=${maxKey}`);
      } else {
        setStep(targetStep);
        setShowSubStep(targetSub);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setStep, setShowSubStep]);

  const navigate = (direction: "next" | "prev") => {
    const currentState = showSubStep ? "substep" : step;
    const config = ONBOARDING_FLOW[currentState];
    if (!config) return;

    const target = typeof config[direction] === "function" 
      ? config[direction](userRole || "") 
      : config[direction];

    if (target === null) return;

    let nextStep = step;
    let nextSubStep = false;

    if (target === "substep") {
      nextSubStep = true;
      nextStep = 3;
    } else {
      nextSubStep = false;
      nextStep = target;
    }

    if (direction === "next") {
      advanceMaxAllowedStep(nextStep, nextSubStep);
    }

    setShowSubStep(nextSubStep);
    setStep(nextStep);

    // Push state to browser history
    const key = stepToKey(nextStep, nextSubStep);
    window.history.pushState({ stepKey: key }, "", `?step=${key}`);
  };

  const handleNext = () => navigate("next");
  const handleBack = () => navigate("prev");

  const handleRoleSelect = async (role: string) => {
    setUserRole(role);

    if (role === "unemployed") {
      setShowSubStep(false);
      try {
        await saveOnboardingDetails({ 
          role: "unemployed",
          educations: educationList,
          experiences: workExperienceList,
        });
      } catch (error) {
        console.error("Failed to advance onboarding step for unemployed:", error);
        toast.error("Failed to save role. Please try again.");
        return;
      }
      advanceMaxAllowedStep(4, false);
      setStep(4);
      window.history.pushState({ stepKey: "interests" }, "", "?step=interests");
    } else {
      advanceMaxAllowedStep(3, true);
      setShowSubStep(true);
      window.history.pushState({ stepKey: "details" }, "", "?step=details");
    }
  };

  const handleDetailsSubmit = () => {
    advanceMaxAllowedStep(4, false);
    setShowSubStep(false);
    setStep(4);
    window.history.pushState({ stepKey: "interests" }, "", "?step=interests");
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
      advanceMaxAllowedStep(5, false);
      setStep(5);
      window.history.pushState({ stepKey: "skills" }, "", "?step=skills");
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
      sessionStorage.removeItem("cocpit_onboarding_step");
      
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

  const renderStepContent = (activeStep: number, activeSubStep: boolean) => {
    return (
      <div className="min-h-screen bg-white overflow-hidden relative" data-theme="light">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSubStep ? `substep-${userRole}` : `step-${activeStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="min-h-screen"
          >
            {activeStep === 0 && (
              <LetsBeginStep onNext={handleNext} />
            )}
            {activeStep === 1 && (
              <ProfileStep
                onNext={handleNext}
                onBack={handleBack}
                currentStep={1}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 2 && (
              <TellUsAboutYouStep
                onNext={handleNext}
                onBack={handleBack}
                currentStep={2}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 3 && (
              !activeSubStep ? (
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
            {activeStep === 4 && (
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
            {activeStep === 5 && (
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
  };

  if (!hasMounted) {
    return null;
  }

  if (!isInitialized) {
    let localSaved: { step: number; showSubStep: boolean } | null = null;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("cocpit_onboarding_step");
        if (saved) {
          localSaved = JSON.parse(saved);
        }
      } catch (e) {
        // ignore
      }
    }

    if (localSaved) {
      return renderStepContent(localSaved.step, localSaved.showSubStep);
    }

    return (
      <div className="min-h-screen bg-white overflow-hidden relative flex flex-col items-center justify-center p-4" data-theme="light">
        <div className="w-full max-w-[480px] bg-white rounded-2xl border border-zinc-100 p-6 md:p-8 space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-zinc-200 rounded-xl"></div>
            <div className="space-y-2 w-32">
              <div className="h-3 bg-zinc-200 rounded w-16 ml-auto"></div>
              <div className="h-1.5 bg-zinc-200 rounded w-32"></div>
            </div>
          </div>

          {/* Heading Skeleton */}
          <div className="space-y-3 pt-4">
            <div className="h-7 bg-zinc-200 rounded w-48"></div>
            <div className="h-4 bg-zinc-200 rounded w-72"></div>
          </div>

          {/* Large Card Options or Avatar Skeleton */}
          <div className="space-y-4 pt-2">
            <div className="h-32 bg-zinc-100 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center p-6 space-y-3">
              <div className="w-10 h-10 bg-zinc-200 rounded-full"></div>
              <div className="h-4 bg-zinc-200 rounded w-36"></div>
              <div className="h-3 bg-zinc-200 rounded w-24"></div>
            </div>
            
            <div className="h-16 bg-zinc-100 rounded-xl border border-zinc-200 flex items-center px-6 space-x-4">
              <div className="w-8 h-8 bg-zinc-200 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-200 rounded w-28"></div>
                <div className="h-3 bg-zinc-200 rounded w-44"></div>
              </div>
            </div>
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="h-3.5 bg-zinc-200 rounded w-20"></div>
              <div className="h-11 bg-zinc-100 rounded-lg border border-zinc-200"></div>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex items-center space-x-3 pt-6">
            <div className="w-11 h-11 bg-zinc-100 rounded-lg border border-zinc-200"></div>
            <div className="flex-1 h-11 bg-zinc-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

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

  return renderStepContent(step, showSubStep);
}
