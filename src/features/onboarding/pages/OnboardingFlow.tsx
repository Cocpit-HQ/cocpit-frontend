"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OnboardingLayout,
  StepBegin,
  StepProfile,
  StepLocationStatus,
  StepBackground,
  StepInterests,
  StepSkills,
  StepSuccess,
} from "../components";
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
import { useSession, signOut } from "next-auth/react";

const ONBOARDING_FLOW: Record<string | number, { next: any; prev: any }> = {
  0: { next: 1, prev: null },
  1: { next: 2, prev: 0 },
  2: { next: 3, prev: 1 },
  3: { next: 4, prev: 2 },
  4: { next: 5, prev: 3 },
  5: { next: null, prev: 4 },
};

// Maps backend onboarding_step string → frontend step number
const STEP_MAP: Record<string, number> = {
  IDENTITY:  1,
  PROFILE:   1,
  LOCATION:  2,
  ROLE:      3,
  DETAILS:   3,
  SKILLS:    4,
  INTERESTS: 5,
};

const stepToKey = (stepNum: number, _isSubStep?: boolean): string => {
  if (stepNum === 0) return "begin";
  if (stepNum === 1) return "profile";
  if (stepNum === 2) return "location";
  if (stepNum === 3) return "details";
  if (stepNum === 4) return "skills";
  if (stepNum === 5) return "interests";
  return "begin";
};

const keyToStep = (key: string): { step: number; showSubStep: boolean } => {
  switch (key) {
    case "begin": return { step: 0, showSubStep: false };
    case "profile": return { step: 1, showSubStep: false };
    case "location": return { step: 2, showSubStep: false };
    case "details":
    case "role":
    case "background":
    case "experience":
    case "education":
      return { step: 3, showSubStep: false };
    case "skills": return { step: 4, showSubStep: false };
    case "interests": return { step: 5, showSubStep: false };
    default: return { step: 0, showSubStep: false };
  }
};

const getPrevStep = (currentStep: number, _isSubStep: boolean, _role: string): { step: number; showSubStep: boolean } | null => {
  const config = ONBOARDING_FLOW[currentStep];
  if (!config || config.prev === null) return null;
  return { step: config.prev, showSubStep: false };
};

const isStepAhead = (stepA: number, subA: boolean, stepB: number, subB: boolean): boolean => {
  if (stepA > stepB) return true;
  if (stepA === stepB) {
    return subA && !subB;
  }
  return false;
};

const getMaxAllowedStep = (backendStep: string | null): { step: number; showSubStep: boolean } => {
  if (!backendStep || backendStep === "IDENTITY" || backendStep === "PROFILE") {
    return { step: 1, showSubStep: false };
  }
  const mappedStep = STEP_MAP[backendStep];
  if (mappedStep !== undefined) {
    return { step: mappedStep, showSubStep: false };
  }
  return { step: 5, showSubStep: false };
};

export default function OnboardingFlow() {
  const {
    step, setStep,
    userRole, setUserRole,
    showSubStep, setShowSubStep,
    selectedInterests, setSelectedInterests,
    selectedSkills, setSelectedSkills,
    isInitialized, setInitialized,
    setFullName, setAccountName, setInitialAccountName, setProfileImage, setDob, setIndustry,
    setLocation, setEducation, setWorkExperience,
    educationList,
    workExperienceList,
  } = useOnboardingStore();
  const { update } = useSession();

  const maxAllowedStepRef = useRef<{ step: number; showSubStep: boolean }>({ step: 1, showSubStep: false });

  const advanceMaxAllowedStep = (targetStep: number, targetSub: boolean) => {
    const currentMax = maxAllowedStepRef.current;
    if (isStepAhead(targetStep, targetSub, currentMax.step, currentMax.showSubStep)) {
      maxAllowedStepRef.current = { step: targetStep, showSubStep: targetSub };
    }
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeSession = sessionStorage.getItem("cocpit_active_onboarding_session");
      if (!activeSession) {
        // Tab was closed or navigated away -> session ended -> redirect to login page
        signOut({ redirect: false }).then(() => {
          window.location.href = "/";
        });
        return;
      }
    }
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
          if (u.dob) setDob(typeof u.dob === "string" ? u.dob.split("T")[0] : String(u.dob).split("T")[0]);

          // ── Step 2: Location (structured) ──────────────────────────────
          if (u.location_formatted || u.location || u.location_place_id) {
            setLocation({
              placeId: u.location_place_id || "loc-default",
              formattedAddress: u.location_formatted || u.location || "",
              country: u.location_country || "",
              state: u.location_state || null,
              city: u.location_city || "",
              latitude: u.location_lat || null,
              longitude: u.location_lng || null,
            });
          }

          // ── Step 2: Role & Industry ─────────────────────────────────────
          if (u.user_role) setUserRole(u.user_role);
          if (u.working_industry || u.industry) {
            setIndustry(u.working_industry || u.industry || null);
          }

          // ── Step 3 Details: Education & Work ────────────────────────────
          if (profile.educations && profile.educations.length > 0) {
            const latestEd = profile.educations[0];
            setEducation(latestEd.school_name || "", latestEd.degree || "");
          }
          if (profile.experiences && profile.experiences.length > 0) {
            const latestExpGroup = profile.experiences[0];
            if (latestExpGroup.experiences && latestExpGroup.experiences.length > 0) {
              const latestExp = latestExpGroup.experiences[0];
              setWorkExperience(latestExp.company_name || "", latestExp.title || "");
            } else if (latestExpGroup.company_name) {
              setWorkExperience(latestExpGroup.company_name, "");
            }
          }

          // ── Step 4: Interests ──────────────────────────────────────────
          if (u.interest_names && u.interest_names.length > 0) {
            setSelectedInterests(u.interest_names);
          }

          // ── Step 5: Skills ────────────────────────────────────────────
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
      window.history.pushState({ stepKey: "skills" }, "", "?step=skills");
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
    window.history.pushState({ stepKey: "skills" }, "", "?step=skills");
  };

  const handleInterestsSubmit = async (items: string[]) => {
    if (items.length < 3) {
      toast.error("Please select at least 3 interests");
      return;
    }
    if (items.length > 7) {
      toast.error("Please select at most 7 interests");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboardingInterests(items);
      await completeOnboarding();
      sessionStorage.removeItem("cocpit_onboarding_step");
      sessionStorage.removeItem("cocpit_active_onboarding_session");
      
      // Update NextAuth session so middleware knows we are onboarded
      await update({ onboarding_complete: true });
      
      setIsCompleted(true);
      toast.success("Onboarding completed!");
      setTimeout(() => {
        window.location.href = "/feed";
      }, 120000); // 2 minutes for testing
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      const message = error.response?.data?.message || "Failed to complete onboarding. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (activeStep: number, activeSubStep: boolean) => {
    if (isCompleted || activeStep >= 6) {
      return <StepSuccess redirectUrl="/profile" delayMs={120000} />; // 2 minutes for testing
    }

    return (
      <OnboardingLayout
        onBack={handleBack}
        showBack={activeStep > 0 || activeSubStep}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSubStep ? `substep-${userRole}` : `step-${activeStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex items-center justify-center w-full"
          >
            {activeStep === 0 && (
              <StepBegin onNext={handleNext} />
            )}
            {activeStep === 1 && (
              <StepProfile
                onNext={handleNext}
                onBack={handleBack}
                currentStep={1}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 2 && (
              <StepLocationStatus
                onNext={handleNext}
                onBack={handleBack}
                currentStep={2}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 3 && (
              <StepBackground
                onNext={handleNext}
                onBack={handleBack}
                currentStep={3}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 4 && (
              <StepSkills
                onNext={handleNext}
                onBack={handleBack}
                currentStep={4}
                totalSteps={totalSteps}
              />
            )}
            {activeStep === 5 && (
              <StepInterests
                onNext={() => setIsCompleted(true)}
                onBack={handleBack}
                currentStep={5}
                totalSteps={totalSteps}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </OnboardingLayout>
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
        } else {
          const params = new URLSearchParams(window.location.search);
          const urlStep = params.get("step");
          if (urlStep) {
            localSaved = keyToStep(urlStep);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (localSaved) {
      return renderStepContent(localSaved.step, localSaved.showSubStep);
    }

    return (
      <OnboardingLayout>
        <div className="w-[391px] min-h-[456px] rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-[#EC6229] border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-[#B8ADA8] font-['DM_Sans']">
            Loading your profile...
          </span>
        </div>
      </OnboardingLayout>
    );
  }

  if (isCompleted) {
    return (
      <OnboardingLayout showClose={false}>
        <StepSuccess />
      </OnboardingLayout>
    );
  }

  return renderStepContent(step, showSubStep);
}
