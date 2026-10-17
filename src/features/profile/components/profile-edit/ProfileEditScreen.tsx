"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LeftArrowIcon, CloseIcon } from "@/components/icons";
import { LeaveConfirmationModal } from "@/components/shared";
import {
  useMyProfile,
  useProfileMutation,
  useAvatarMutations,
  useSkillMutations,
} from "@/hooks/use-my-profile";
import { useBodyScrollLock } from "@/hooks";
import {
  uploadCoverPhoto,
  deleteCoverPhoto,
  uploadResume,
  deleteResume,
} from "@/features/profile/services/profile.service";
import { getIndustries } from "@/features/jobs/services/jobs.service";
import { checkAccountNameAvailability } from "@/services/api/onboarding";
import { EditAvatarModal } from "@/features/profile/components/EditAvatarModal";
import { EditCoverPhoto } from "@/features/profile/components/EditCoverPhoto";
import type { UserData } from "@/types/user";
import type { Experience, Education, Project } from "@/types/entities";
import { cn } from "@/lib/utils";

// Modular Subcomponents
import { ProfileEditHeader } from "@/features/profile/components/profile-edit/ProfileEditHeader";
import { ProfileEditTabs, PROFILE_EDIT_TABS, type ProfileEditTabKey } from "@/features/profile/components/profile-edit/ProfileEditTabs";
import { ProfileEditMediaSection } from "@/features/profile/components/profile-edit/ProfileEditMediaSection";
import { ProfileEditForm, type ProfileFormData } from "@/features/profile/components/profile-edit/ProfileEditForm";
import { ProfileEditSkillsTab } from "@/features/profile/components/profile-edit/ProfileEditSkillsTab";
import { ProfileEditExperienceTab } from "@/features/profile/components/profile-edit/ProfileEditExperienceTab";
import { ProfileEditEducationTab } from "@/features/profile/components/profile-edit/ProfileEditEducationTab";
import { ProfileEditProjectTab } from "@/features/profile/components/profile-edit/ProfileEditProjectTab";

const normalizeAvailability = (value?: string | null) => {
  if (value === "Immediate") return "Immediately";
  if (value === "30 Days") return "15 to 30 days";
  return value || "";
};

export interface ProfileEditScreenProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: ProfileEditTabKey;
  initialMode?: "list" | "form";
  selectedId?: string | null;
}

export function ProfileEditScreen({
  isOpen = true,
  onClose,
  initialTab = "profile",
  initialMode = "list",
  selectedId = null,
}: ProfileEditScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = (searchParams?.get("tab") as ProfileEditTabKey) || initialTab;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(isOpen && mounted);

  const [activeTab, setActiveTab] = useState<ProfileEditTabKey>(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("profile_edit_active_tab") as ProfileEditTabKey;
      if (savedTab && PROFILE_EDIT_TABS.some((t) => t.key === savedTab)) {
        return savedTab;
      }
    }
    return PROFILE_EDIT_TABS.some((t) => t.key === tabParam) ? tabParam : "profile";
  });

  useEffect(() => {
    sessionStorage.setItem("profile_edit_active_tab", activeTab);
  }, [activeTab]);


  const { data: profileData } = useMyProfile();
  const user = profileData?.user as UserData | undefined;

  // Mutations
  const updateProfileMutation = useProfileMutation();
  const avatarMutations = useAvatarMutations();
  const skillMutations = useSkillMutations();

  const userSkills = useMemo(() => {
    if (!profileData?.skills) return [];
    return profileData.skills
      .map((s: any) => (typeof s === "string" ? s : s.name || s.skill_name))
      .filter(Boolean);
  }, [profileData?.skills]);

  // Flattened experiences for the edit tab
  const flatExperiences = useMemo<Experience[]>(() => {
    if (!profileData?.experiences) return [];
    return profileData.experiences.flatMap((group: any) => {
      const groupName = group.company_name || group.company || "";
      const groupLogo = group.logo_url || group.company_logo || null;
      const groupSkills =
        group.skills ||
        group.experience_skills ||
        group.skills_used ||
        group.skill_names ||
        [];
      const innerExps =
        Array.isArray(group.experiences) && group.experiences.length > 0
          ? group.experiences
          : [group];
      return innerExps.map((exp: any, idx: number) => ({
        ...exp,
        is_nested_role: idx > 0 || !!exp.parent_id || !!exp.is_nested_role,
        skills:
          exp.skills ||
          exp.experience_skills ||
          exp.skills_used ||
          exp.skill_names ||
          groupSkills ||
          [],
        company_name: exp.company_name || groupName,
        company_logo: exp.company_logo || groupLogo,
      }));
    });
  }, [profileData?.experiences]);

  const educations = useMemo<Education[]>(
    () => profileData?.educations || [],
    [profileData?.educations]
  );
  const projects = useMemo<Project[]>(
    () => profileData?.projects || [],
    [profileData?.projects]
  );

  const [tabSubtitle, setTabSubtitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTabSubtitle(undefined);
  }, [activeTab]);

  // Media Staged State
  const [stagedCoverPreview, setStagedCoverPreview] = useState<string | null>(null);
  const [stagedCoverFile, setStagedCoverFile] = useState<File | null>(null);
  const [isCoverDeleted, setIsCoverDeleted] = useState(false);

  const [stagedAvatarPreview, setStagedAvatarPreview] = useState<string | null>(null);
  const [stagedAvatarFile, setStagedAvatarFile] = useState<File | null>(null);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);

  // Resume Staged State
  const [stagedResumeFile, setStagedResumeFile] = useState<File | null>(null);
  const [isResumeDeleted, setIsResumeDeleted] = useState(false);

  // Modals state
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [coverInitialFile, setCoverInitialFile] = useState<File | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [avatarInitialFile, setAvatarInitialFile] = useState<File | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    account_name: "",
    headline: "",
    website: "",
    location: "",
    status: "",
    open_to: "",
    availability: "",
    work_preference: "",
    industry: "",
    about: "",
  });

  const [initialFormData, setInitialFormData] = useState<ProfileFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Industries
  const [availableIndustries, setAvailableIndustries] = useState<{ industry_name: string }[]>([]);

  // Username availability
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Initialize form and media data when user data is available
  useEffect(() => {
    if (user) {
      const ACCOUNT_TYPE_TO_ROLE_ID: Record<string, string> = {
        // Map DB labels to numeric IDs (matching dropdown API)
        student: "1",
        Student: "1",
        fresher: "2",
        Fresher: "2",
        intern: "3",
        Intern: "3",
        self_employed: "4",
        "Self Employed": "4",
        "Self employed": "4",
        "Self-employed": "4",
        employed: "5",
        Employee: "5",
        Employed: "5",
        unemployed: "6",
        Unemployed: "6",
        "Currently not working": "6",
      };
      const rawAccountType = (user as any).account_type || "";
      const initialStatus = ACCOUNT_TYPE_TO_ROLE_ID[rawAccountType] || "5";

      const rawAccountName = user.account_name || "";
      const cleanAccountName = rawAccountName.startsWith("@")
        ? rawAccountName.slice(1)
        : rawAccountName;

      const data: ProfileFormData = {
        name: user.name || "",
        account_name: cleanAccountName,
        headline: user.headline || "",
        website: user.website || "",
        location: user.location || "",
        status: initialStatus,
        open_to: user.open_to || "",
        availability: normalizeAvailability(user.availability),
        work_preference: user.work_preference || "",
        industry: (user as any).industry || "",
        about: user.about || (user as any).about_text || "",
      };

      setFormData(data);
      setInitialFormData(data);
      setStagedAvatarPreview(user.avatar || null);
      setStagedCoverPreview(user.cover_image || null);
      setStagedResumeFile(null);
      setIsResumeDeleted(false);
    }
  }, [user]);

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await getIndustries();
        setAvailableIndustries(data || []);
      } catch (err) {
        console.error("Failed to fetch industries", err);
      }
    };
    fetchIndustries();
  }, []);

  // Check username availability on change
  useEffect(() => {
    if (!initialFormData || !formData.account_name) return;

    if (formData.account_name === initialFormData.account_name) {
      setIsUsernameAvailable(true);
      return;
    }

    if (formData.account_name.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const isAvailable = await checkAccountNameAvailability(formData.account_name);
        setIsUsernameAvailable(isAvailable);
      } catch {
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.account_name, initialFormData]);

  // Has changes check (form fields or staged media/resume changes)
  const hasChanges = useMemo(() => {
    if (!initialFormData) return false;
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const avatarChanged = stagedAvatarFile !== null || isAvatarDeleted;
    const coverChanged = stagedCoverFile !== null || isCoverDeleted;
    const resumeChanged = stagedResumeFile !== null || isResumeDeleted;
    return formChanged || avatarChanged || coverChanged || resumeChanged;
  }, [
    formData,
    initialFormData,
    stagedAvatarFile,
    isAvatarDeleted,
    stagedCoverFile,
    isCoverDeleted,
    stagedResumeFile,
    isResumeDeleted,
  ]);

  // Form input change handler
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    if (field === "account_name") {
      const sanitized = value
        .replace(/^@/, "")
        .replace(/\s/g, "_")
        .replace(/[^a-zA-Z0-9_.]/g, "")
        .toLowerCase();
      setFormData((prev) => ({ ...prev, account_name: sanitized }));
      setErrors((prev) => ({ ...prev, account_name: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Discard Confirmation Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Close / Dismiss
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/profile");
    }
  };

  const handleCloseWithCheck = () => {
    const nestedHasChanges = registeredBackFnRef.current ? (registeredBackFnRef.current as any).hasChanges : false;

    if ((activeTab === "profile" && hasChanges) || (activeTab !== "profile" && nestedHasChanges)) {
      setIsLeaveModalOpen(true);
    } else {
      handleClose();
    }
  };

  const clearAllDrafts = () => {
    if (typeof window === "undefined") return;
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("profile_draft_") || key.startsWith("profile_edit_edu_")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }
  };

  const handleCancel = () => {
    clearAllDrafts();
    if (initialFormData) {
      setFormData(initialFormData);
    }
    setStagedAvatarFile(null);
    setStagedAvatarPreview(user?.avatar || null);
    setIsAvatarDeleted(false);
    setStagedCoverFile(null);
    setStagedCoverPreview(user?.cover_image || null);
    setIsCoverDeleted(false);
    setStagedResumeFile(null);
    setIsResumeDeleted(false);
    handleClose();
  };

  const handleCancelWithCheck = () => {
    if (hasChanges) {
      setIsLeaveModalOpen(true);
    } else {
      handleClose();
    }
  };

  // Back button registration for nested tabs/forms
  const registeredBackFnRef = useRef<(() => void) | null>(null);

  const handleRegisterBackAction = useCallback((fn: (() => void) | null) => {
    registeredBackFnRef.current = fn;
  }, []);

  const handleBackClick = () => {
    if (registeredBackFnRef.current) {
      registeredBackFnRef.current();
    }
  };

  const showBackButton = Boolean(tabSubtitle);

  // Resume handlers
  const handleSelectResume = (file: File) => {
    setStagedResumeFile(file);
    setIsResumeDeleted(false);
    toast.success("Resume uploaded successfully");
  };

  const handleRemoveResume = () => {
    setStagedResumeFile(null);
    const hasInitialResume = Boolean(
      profileData?.resume?.url ||
      (profileData?.resume as any)?.file_url ||
      profileData?.resume?.originalName ||
      (profileData?.resume as any)?.name ||
      (profileData?.resume as any)?.file_name
    );
    setIsResumeDeleted(hasInitialResume);
  };

  // Final Save handler - commits all profile, media, and resume changes
  const handleSave = async () => {
    if (!hasChanges || isSaving || isUsernameAvailable === false) return;

    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Full name must be at least 3 characters";
    }

    const usernameRegex = /^[a-z0-9_.]{3,25}$/;
    if (!formData.account_name || !usernameRegex.test(formData.account_name)) {
      newErrors.account_name = "Username must be 3-25 characters and contain only lowercase letters, numbers, underscores, or dots";
    }

    if (!formData.headline || formData.headline.trim() === '') {
      newErrors.headline = "Headline is required";
    } else if (formData.headline.length > 120) {
      newErrors.headline = "Headline cannot exceed 120 characters";
    }

    if (formData.about && formData.about.length > 500) {
      newErrors.about = "About cannot exceed 500 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    } else {
      setErrors({});
    }

    setIsSaving(true);
    try {
      // 1. Upload Avatar if staged
      if (stagedAvatarFile) {
        const avatarFd = new FormData();
        avatarFd.append("avatar", stagedAvatarFile);
        await avatarMutations.upload.mutateAsync(avatarFd);
      } else if (isAvatarDeleted) {
        await avatarMutations.remove.mutateAsync();
      }

      // 2. Upload Cover if staged
      if (stagedCoverFile) {
        const coverFd = new FormData();
        coverFd.append("cover", stagedCoverFile);
        await uploadCoverPhoto(coverFd);
      } else if (isCoverDeleted) {
        await deleteCoverPhoto();
        toast.success("Cover photo removed.");
      }

      // 3. Upload or Delete Resume if staged
      if (stagedResumeFile) {
        const resumeFd = new FormData();
        resumeFd.append("resume", stagedResumeFile);
        await uploadResume(resumeFd);
      } else if (isResumeDeleted) {
        await deleteResume();
      }

      // 4. Update Profile fields
      const formFieldsChanged = Object.keys(formData).filter(
        (k) => formData[k as keyof ProfileFormData] !== initialFormData?.[k as keyof ProfileFormData]
      );
      
      const isOnlyAboutChanged = 
        formFieldsChanged.length === 1 && 
        formFieldsChanged[0] === "about" && 
        !stagedAvatarFile && !isAvatarDeleted && 
        !stagedCoverFile && !isCoverDeleted && 
        !stagedResumeFile && !isResumeDeleted;

      const toastMessage = isOnlyAboutChanged 
        ? "About info saved successfully!" 
        : "Your basic profile has been saved.";

      await updateProfileMutation.mutateAsync({
        name: formData.name,
        account_name: formData.account_name,
        headline: formData.headline,
        website: formData.website,
        location: formData.location,
        status: formData.status,
        open_to: formData.open_to,
        availability: formData.availability,
        work_preference: formData.work_preference,
        industry: formData.industry,
        about: formData.about,
      }, {
        onSuccess: () => {
          toast.success(toastMessage);
        }
      });

      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setInitialFormData(formData);
      setStagedAvatarFile(null);
      setIsAvatarDeleted(false);
      setStagedCoverFile(null);
      setIsCoverDeleted(false);
      setStagedResumeFile(null);
      setIsResumeDeleted(false);
      // Stay on the form page; do not auto-close
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar handlers
  const handleOpenAvatarModal = () => {
    if (stagedAvatarPreview || user?.avatar) {
      setAvatarInitialFile(null);
      setIsEditAvatarOpen(true);
    } else {
      avatarFileInputRef.current?.click();
    }
  };

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarInitialFile(file);
      setIsEditAvatarOpen(true);
    }
    e.target.value = "";
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const avatarFd = new FormData();
      avatarFd.append("avatar", file);
      await avatarMutations.upload.mutateAsync(avatarFd);
      setStagedAvatarFile(null);
      setIsAvatarDeleted(false);
      setIsEditAvatarOpen(false);
      setAvatarInitialFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile photo updated successfully.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload profile photo");
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await avatarMutations.remove.mutateAsync();
      setStagedAvatarFile(null);
      setStagedAvatarPreview(null);
      setIsAvatarDeleted(false);
      setIsEditAvatarOpen(false);
      setAvatarInitialFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile photo removed.");
    } catch (err) {
      console.error("Avatar delete error:", err);
      toast.error("Failed to delete profile photo");
    }
  };

  // Cover handlers
  const handleOpenCoverModal = () => {
    if (stagedCoverPreview || user?.cover_image) {
      setCoverInitialFile(null);
      setIsEditCoverOpen(true);
    } else {
      coverFileInputRef.current?.click();
    }
  };

  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverInitialFile(file);
      setIsEditCoverOpen(true);
    }
    e.target.value = "";
  };

  const handleCoverUpload = async (fd: FormData): Promise<{ coverUrl: string }> => {
    try {
      const res = await uploadCoverPhoto(fd);
      const newUrl = res?.coverUrl || "";
      setStagedCoverPreview(newUrl);
      setStagedCoverFile(null);
      setIsCoverDeleted(false);
      setIsEditCoverOpen(false);
      setCoverInitialFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      return { coverUrl: newUrl };
    } catch (err) {
      console.error("Cover upload error:", err);
      toast.error("Failed to upload cover photo");
      setIsEditCoverOpen(false);
      return { coverUrl: "" };
    }
  };

  const handleCoverDelete = async () => {
    try {
      await deleteCoverPhoto();
      setStagedCoverFile(null);
      setStagedCoverPreview(null);
      setIsCoverDeleted(false);
      setIsEditCoverOpen(false);
      setCoverInitialFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err) {
      console.error("Cover delete error:", err);
      toast.error("Failed to delete cover photo");
    }
  };

  // Skills Save handler
  const handleSaveSkills = async (newSkills: string[]) => {
    setIsSaving(true);
    try {
      await skillMutations.sync.mutateAsync({ skills: newSkills });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err: any) {
      console.error("Save skills error:", err);
      toast.error(err?.response?.data?.message || "Failed to update skills");
    } finally {
      setIsSaving(false);
    }
  };

  const [headerAction, setHeaderAction] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    setTabSubtitle(undefined);
    setHeaderAction(null);
  }, [activeTab]);

  const [resetKey, setResetKey] = useState(0);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[50] h-[100dvh] max-h-[100dvh] w-full bg-ds-bg text-ds-text-primary font-dm-sans flex flex-col items-center overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] scrollbar-hide select-text animate-in fade-in-90 duration-200">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 w-full bg-ds-bg z-[60] px-4 py-4 border-b border-ds-border flex items-center justify-between touch-none">
         <div className="flex-1 flex justify-start">
           {showBackButton && (
             <button onClick={handleBackClick} className="p-2 -ml-2 text-ds-text-primary hover:bg-ds-surface-1 rounded-full transition-colors">
                <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary" />
             </button>
           )}
         </div>
         <div className="flex-1 flex justify-center text-[16px] font-medium text-ds-text-primary whitespace-nowrap">
           {tabSubtitle || "Edit profile"}
         </div>
         <div className="flex-1 flex justify-end">
           <button onClick={handleCloseWithCheck} className="p-2 -mr-2 text-ds-text-primary hover:bg-ds-surface-1 rounded-full transition-colors">
              <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary rotate-45 opacity-0 absolute pointer-events-none" /> {/* Spacer trick to balance center */}
              <CloseIcon size={20} className="w-5 h-5 text-ds-text-primary" />
           </button>
         </div>
      </div>

      {/* Top-Left Back Button (Desktop) */}
      {showBackButton && (
        <button
          type="button"
          onClick={handleBackClick}
          aria-label="Back"
          className="hidden md:flex fixed top-4 left-4 md:top-[40px] md:left-[40px] z-[60] w-[65px] h-[24px] flex-row items-center p-0 gap-[8px] cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
            <LeftArrowIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary" />
          </div>
          <span className="w-[37px] h-[24px] font-dm-sans font-medium text-[16px] leading-[24px] text-center text-ds-text-primary shrink-0">
            Back
          </span>
        </button>
      )}

      {/* Centered Main Container */}
      <div
        className={cn(
          "w-full px-4 sm:px-6 md:px-8 pt-4 md:pt-[60px] pb-[60px] flex flex-col items-center gap-[20px] relative transition-opacity mx-auto",
          tabSubtitle ? "max-w-[640px]" : "max-w-[800px]"
        )}
      >
        {/* Top Header & Close Button */}
        <div className="flex w-full">
          <ProfileEditHeader
            userName={formData.name || user?.name}
            avatarUrl={stagedAvatarPreview}
            subTitle={tabSubtitle}
            headerAction={headerAction}
            onClose={handleCloseWithCheck}
          />
        </div>

        {/* Frame 2609617: Navigation Tabs - ONLY shown in list mode / profile view */}
        {!tabSubtitle && (
          <ProfileEditTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setTabSubtitle(undefined);
              setHeaderAction(null);
              
              if (tab === "experience") {
                sessionStorage.removeItem("profile_edit_exp_mode");
                sessionStorage.removeItem("profile_edit_exp_id");
                sessionStorage.removeItem("profile_edit_exp_adding_role");
              } else if (tab === "education") {
                sessionStorage.removeItem("profile_edit_edu_mode");
                sessionStorage.removeItem("profile_edit_edu_id");
                sessionStorage.removeItem("profile_draft_edu_new");
              } else if (tab === "project") {
                sessionStorage.removeItem("profile_edit_proj_mode");
                sessionStorage.removeItem("profile_edit_proj_id");
              }
              
              setActiveTab(tab);
            }}
          />
        )}

        {/* Active Tab Content */}
        {activeTab === "profile" ? (
          <div className="w-full flex flex-col items-center">
            {/* Cover & Profile Avatar Section */}
            <ProfileEditMediaSection
              coverImage={stagedCoverPreview}
              avatarImage={stagedAvatarPreview}
              userName={formData.name || user?.name}
              onEditCover={handleOpenCoverModal}
              onEditAvatar={handleOpenAvatarModal}
            />

            {/* Frame 2609638: Form Fields Section */}
            <ProfileEditForm
              formData={formData}
              onChange={handleInputChange}
              onSave={handleSave}
              onCancel={handleCancelWithCheck}
              resumeInfo={profileData?.resume}
              stagedResumeFile={stagedResumeFile}
              isResumeDeleted={isResumeDeleted}
              onSelectResume={handleSelectResume}
              onRemoveResume={handleRemoveResume}
              isSaving={isSaving}
              hasChanges={hasChanges}
              isUsernameAvailable={isUsernameAvailable}
              isCheckingUsername={isCheckingUsername}
              availableIndustries={availableIndustries}
              errors={errors}
            />
          </div>
        ) : activeTab === "skills" ? (
          <ProfileEditSkillsTab
            skills={userSkills}
            onSave={handleSaveSkills}
            onCancel={handleCancelWithCheck}
            isSaving={isSaving}
          />
        ) : activeTab === "experience" ? (
          <ProfileEditExperienceTab
            key={`exp-${resetKey}`}
            experiences={flatExperiences}
            initialMode={resetKey === 0 && activeTab === initialTab ? initialMode : "list"}
            selectedId={resetKey === 0 && activeTab === initialTab ? selectedId : null}
            onSubTitleChange={setTabSubtitle}
            onHeaderActionChange={setHeaderAction}
            onRegisterBackAction={handleRegisterBackAction}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            }}
            onCancel={handleCancelWithCheck}
          />
        ) : activeTab === "education" ? (
          <ProfileEditEducationTab
            key={`edu-${resetKey}`}
            educations={educations}
            initialMode={resetKey === 0 && activeTab === initialTab ? initialMode : "list"}
            selectedId={resetKey === 0 && activeTab === initialTab ? selectedId : null}
            onSubTitleChange={setTabSubtitle}
            onRegisterBackAction={handleRegisterBackAction}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            }}
            onCancel={handleCancelWithCheck}
          />
        ) : activeTab === "project" ? (
          <ProfileEditProjectTab
            key={`proj-${resetKey}`}
            projects={projects}
            initialMode={resetKey === 0 && activeTab === initialTab ? initialMode : "list"}
            selectedId={resetKey === 0 && activeTab === initialTab ? selectedId : null}
            onSubTitleChange={setTabSubtitle}
            onRegisterBackAction={handleRegisterBackAction}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            }}
            onCancel={handleCancelWithCheck}
          />
        ) : null}
      </div>

      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={coverFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleCoverFileSelected}
      />
      <input
        type="file"
        ref={avatarFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleAvatarFileSelected}
      />

      {/* Cover Image Editor Modal */}
      {isEditCoverOpen && (
        <EditCoverPhoto
          isOpen={isEditCoverOpen}
          onClose={() => {
            setIsEditCoverOpen(false);
            setCoverInitialFile(null);
          }}
          coverImage={stagedCoverPreview}
          initialFile={coverInitialFile}
          onUpload={handleCoverUpload}
          onDelete={handleCoverDelete}
        />
      )}

      {/* Avatar Image Editor Modal */}
      {isEditAvatarOpen && (
        <EditAvatarModal
          isOpen={isEditAvatarOpen}
          onClose={() => {
            setIsEditAvatarOpen(false);
            setAvatarInitialFile(null);
          }}
          currentAvatarUrl={stagedAvatarPreview}
          initialFile={avatarInitialFile}
          onUpload={handleAvatarUpload}
          onDelete={handleAvatarDelete}
        />
      )}

      {/* Leave Confirmation Modal (same as reset password cross confirmation) */}
      <LeaveConfirmationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave without saving?"
        description="Your changes will be lost"
        confirmText="Stay"
        cancelText="Leave"
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          handleCancel();
        }}
      />
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}

export default ProfileEditScreen;
