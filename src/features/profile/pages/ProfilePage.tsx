
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAvatarMutations,
  useEducationMutations,
  useExperienceMutations,
  useMyProfile,
  useProfileMutation,
  useProjectMutations,
  useSkillMutations,
} from "@/hooks/use-my-profile";
import {
  getUserPosts,
  deletePost as apiDeletePost,
  uploadCoverPhoto,
  deleteCoverPhoto,
} from "../services/profile.service";

// Core Layout & Header Components
import { ProfileCoverSection } from "../components/ProfileCoverSection";
import { ProfileUserBio } from "../components/ProfileUserBio";
import { ProfileAboutSection } from "../components/ProfileAboutSection";
import { FullPageError /* [CLEANUP:UNUSED] SomethingWentWrong */ } from "../components/ProfileEmptyStates";
import { AddIcon } from "@/components/icons";

// Tab Content Components
import { ProfilePostsTab } from "../components/tabs/ProfilePostsTab";
import { ProfileExperienceTab } from "../components/tabs/ProfileExperienceTab";
import { ProfileEducationTab } from "../components/tabs/ProfileEducationTab";
import { ProfileProjectsTab } from "../components/tabs/ProfileProjectsTab";
import { ProfileSkillsTab } from "../components/tabs/ProfileSkillsTab";

// Modals
import { ProfileEditScreen, type ProfileEditTabKey } from "../components/profile-edit";
import { DownloadProfileScreen } from "../components/download-profile";
// [CLEANUP:UNUSED] import { EditProfileModal } from "../components/EditProfileModal";
import { EditAvatarModal } from "../components/EditAvatarModal";
import EditCoverPhoto from "../components/EditCoverPhoto";
import { ContactInfoModal } from "../components/ContactInfoModal";
import { FollowListModal } from "../components/FollowListModal";
import AddExperienceForm, { type SavedRole } from "../components/AddExperienceForm";
import AddEducationForm from "../components/AddEducationForm";
import AddProjectForm from "../components/AddProjectForm";
import { SkillModal } from "../components/SkillModal";
import { ViewAvatarModal } from "../commonProfileComponents/ViewAvatarModal";
import { CreatePostModal } from "@/features/feed/components/create-post";
import { useUIStore } from "@/store/ui.store";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import type { Education, Experience, Post, Project } from "@/types/entities";
import type { SkillResponse } from "@/types/user";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { useScrollRestoration, saveScrollPosition } from "@/hooks/use-scroll-restoration";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profileData, isLoading, isError: isProfileError, refetch: refetchProfile } = useMyProfile();

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("profile_edit_modal_open") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("profile_edit_modal_open", String(isEditProfileModalOpen));
      if (!isEditProfileModalOpen) {
        // Clean up drafts when modal is completely closed from the outside
        sessionStorage.removeItem("profile_edit_active_tab");
        sessionStorage.removeItem("profile_edit_exp_mode");
        sessionStorage.removeItem("profile_edit_exp_id");
        sessionStorage.removeItem("profile_edit_exp_adding_role");
        sessionStorage.removeItem("profile_edit_exp_has_visited");
        sessionStorage.removeItem("profile_edit_edu_mode");
        sessionStorage.removeItem("profile_edit_edu_id");
        sessionStorage.removeItem("profile_edit_edu_has_visited");
        sessionStorage.removeItem("profile_edit_proj_mode");
        sessionStorage.removeItem("profile_edit_proj_id");
        sessionStorage.removeItem("profile_edit_proj_has_visited");
      }
    }
  }, [isEditProfileModalOpen]);

  const [editInitialTab, setEditInitialTab] = useState<ProfileEditTabKey>("profile");
  const [editInitialMode, setEditInitialMode] = useState<"list" | "form">("list");
  const [editSelectedId, setEditSelectedId] = useState<string | null>(null);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [avatarInitialFile, setAvatarInitialFile] = useState<File | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [coverInitialFile, setCoverInitialFile] = useState<File | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isShareProfileModalOpen, setIsShareProfileModalOpen] = useState(false);
  const [isDownloadProfileOpen, setIsDownloadProfileOpen] = useState(false);
  const [downloadPdfUrl, setDownloadPdfUrl] = useState<string | null>(null);

  const [editingExperiences, setEditingExperiences] = useState<Experience[] | undefined>(undefined);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSavingExperience, setIsSavingExperience] = useState(false);

  // Mutations
  const updateProfileMutation = useProfileMutation();
  const expMutations = useExperienceMutations();
  const eduMutations = useEducationMutations();
  const projMutations = useProjectMutations();
  const skillMutations = useSkillMutations();
  const avatarMutations = useAvatarMutations();

  // User & sub-entities
  const user = profileData?.user;
  
  const flatExperiences = useMemo<Experience[]>(() => profileData?.experiences || [], [profileData?.experiences]);

  const educations = useMemo<Education[]>(() => profileData?.educations || [], [profileData?.educations]);
  const projects = useMemo<Project[]>(() => profileData?.projects || [], [profileData?.projects]);
  const skills = useMemo<SkillResponse[]>(() => (profileData?.skills || []) as SkillResponse[], [profileData?.skills]);
  const resume = profileData?.resume;
  const profileScore = profileData?.profile_score?.score ?? 82;

  const handleDeleteSkill = useCallback(
    async (skillToDelete: string) => {
      const currentSkills = skills
        .map((s) => (typeof s === "string" ? s : s.name || (s as any).skill_name))
        .filter(Boolean);
      if (currentSkills.length <= 3) {
        toast.info("Minimum 3 skills must be present");
        return;
      }
      const updatedSkills = currentSkills.filter((s) => s !== skillToDelete);
      try {
        await skillMutations.sync.mutateAsync({ skills: updatedSkills });
        refetchProfile();
      } catch (err: any) {
        toast.error("Failed to remove skill");
      }
    },
    [skills, skillMutations.sync, refetchProfile]
  );


  // Posts Query
  const { data: userPostsData, isError: isPostsError, refetch: refetchPosts } = useQuery({
    queryKey: ["userPosts", user?.id],
    queryFn: () => getUserPosts({ limit: 50 }),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const posts = useMemo<Post[]>(() => {
    return (userPostsData?.posts || []).map(mapProfilePostToPost);
  }, [userPostsData]);

  // Restore scroll position when profile and posts are loaded
  useScrollRestoration(!isLoading && (userPostsData !== undefined || isPostsError));

  // Handlers for edit profile
  const handleUpdateProfile = useCallback(
    async (data: any) => {
      try {
        await updateProfileMutation.mutateAsync(data);
        setIsEditProfileModalOpen(false);
      } catch (error) {
        console.error("Failed to update profile:", error);
        toast.error("Failed to update profile");
      }
    },
    [updateProfileMutation]
  );

  // Handlers for avatar upload/delete
  const handleOpenAvatarModal = () => {
    if (user?.avatar) {
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
      const formData = new FormData();
      formData.append("avatar", file);
      await avatarMutations.upload.mutateAsync(formData);
      setIsEditAvatarOpen(false);
      setAvatarInitialFile(null);
    } catch {
      toast.error("Failed to upload profile photo");
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await avatarMutations.remove.mutateAsync();
      setIsEditAvatarOpen(false);
      setAvatarInitialFile(null);
    } catch {
      toast.error("Failed to remove profile photo");
    }
  };

  // Handlers for cover photo upload/delete
  const handleOpenCoverModal = () => {
    if (user?.cover_image) {
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

  const handleCoverUpload = async (formData: FormData): Promise<{ coverUrl: string }> => {
    try {
      const res = await uploadCoverPhoto(formData);
      setIsEditCoverOpen(false);
      setCoverInitialFile(null);
      return { coverUrl: res.coverUrl };
    } catch {
      toast.error("Failed to upload cover photo");
      throw new Error("Failed to upload cover photo");
    }
  };

  const handleCoverDelete = async () => {
    try {
      await deleteCoverPhoto();
      setIsEditCoverOpen(false);
      setCoverInitialFile(null);
    } catch {
      toast.error("Failed to delete cover photo");
    }
  };

  // Handlers for experience
  const handleSaveExperience = async (roles: SavedRole[], deletedIds: string[]) => {
    setIsSavingExperience(true);
    try {
      const operations: any[] = [];
      const createOps: any[] = [];
      const updateMap = new Map<string, any>();

      roles.forEach((role) => {
        if (!role.experience_id) {
          createOps.push({
            type: "CREATE",
            data: {
              title: role.title,
              company_name: role.company_name,
              location: role.location,
              work_mode: role.work_mode,
              work_type: role.work_type,
              start_date: role.start_date,
              end_date: role.is_current ? undefined : role.end_date,
              is_current: role.is_current,
              description: role.description,
              org_id: role.org_id,
            },
          });
        } else {
          updateMap.set(role.experience_id, {
            title: role.title,
            company_name: role.company_name,
            location: role.location,
            work_mode: role.work_mode,
            work_type: role.work_type,
            start_date: role.start_date,
            end_date: role.is_current ? undefined : role.end_date,
            is_current: role.is_current,
            description: role.description,
            org_id: role.org_id,
          });
        }
      });

      deletedIds.forEach((delId) => {
        operations.push({ type: "DELETE", id: delId });
      });

      for (const [id, data] of updateMap.entries()) {
        operations.push({ type: "UPDATE", id, data });
      }
      operations.push(...createOps);

      if (operations.length > 0) {
        await expMutations.batchUpdate.mutateAsync({
          operations,
          version: user?.version ?? 0,
        });
      }

      setIsAddExperienceModalOpen(false);
      setEditingExperiences(undefined);
    } catch (err: any) {
      console.error("Failed to save experience:", err);
      
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const roleFieldErrors: Record<number, Record<string, string>> = {};
        const globalMessages: string[] = [];

        backendErrors.forEach((errorObj) => {
          if (errorObj.entityId) {
            const index = roles.findIndex((r) => r.experience_id === errorObj.entityId);
            if (index !== -1) {
              if (!roleFieldErrors[index]) roleFieldErrors[index] = {};
              let field = errorObj.path.split('.').pop() || "";
              if (field === 'start_date') field = 'startDate';
              if (field === 'end_date') field = 'endDate';
              if (field === 'is_current') field = 'isCurrent';
              roleFieldErrors[index][field] = errorObj.message;
            } else {
               globalMessages.push(errorObj.message);
            }
          } else {
            globalMessages.push(errorObj.message);
          }
        });

        const customErr = new Error("Validation Failed") as any;
        customErr.roleFieldErrors = Object.keys(roleFieldErrors).length > 0 ? roleFieldErrors : null;
        customErr.globalMessages = globalMessages;
        throw customErr;
      }
      
      toast.error(err?.response?.data?.message || "Failed to save experience");
      throw err;
    } finally {
      setIsSavingExperience(false);
    }
  };

  const handleDeleteExperience = async (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;
    try {
      if (ids.length === 1) {
        await expMutations.remove.mutateAsync(ids[0]);
      } else {
        await expMutations.batchUpdate.mutateAsync({
          requestId: crypto.randomUUID(),
          operations: ids.map((id) => ({ type: "DELETE", id })),
          version: user?.version ?? 0,
        });
      }
      setIsAddExperienceModalOpen(false);
      setEditingExperiences(undefined);
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  // Handlers for education
  const handleSaveEducation = async (data: Partial<Education>) => {
    try {
      if (editingEducation) {
        await eduMutations.update.mutateAsync({
          id: editingEducation.education_id,
          payload: data,
        });
      } else {
        await eduMutations.add.mutateAsync(data as any);
      }
      setIsAddEducationModalOpen(false);
      setEditingEducation(null);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((e) => {
          let field = e.path;
          if (field === 'start_date') field = 'startDate';
          if (field === 'end_date') field = 'endDate';
          if (field === 'school_name') field = 'school_name';
          fieldErrors[field] = e.message;
        });
        const customErr = new Error("Validation Failed") as any;
        customErr.fieldErrors = Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
        throw customErr;
      }
      toast.error(err?.response?.data?.message || "Failed to save education");
      throw err;
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await eduMutations.remove.mutateAsync(id);
      setIsAddEducationModalOpen(false);
      setEditingEducation(null);
    } catch {
      toast.error("Failed to delete education");
    }
  };

  // Handlers for project
  const handleSaveProject = async (data: Project) => {
    try {
      if (editingProject) {
        await projMutations.update.mutateAsync({ id: editingProject.project_id, payload: data });
      } else {
        await projMutations.add.mutateAsync(data);
        toast.success("Project added successfully");
      }
      setIsAddProjectModalOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((e) => {
          let field = e.path;
          if (field === 'start_date') field = 'startDate';
          if (field === 'end_date') field = 'endDate';
          if (field === 'team_size') field = 'teamSize';
          fieldErrors[field] = e.message;
        });
        const customErr = new Error("Validation Failed") as any;
        customErr.fieldErrors = Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
        throw customErr;
      }
      toast.error(err?.response?.data?.message || "Failed to save project");
      throw err;
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projMutations.remove.mutateAsync(id);
      toast.success("Project removed successfully");
      setIsAddProjectModalOpen(false);
      setEditingProject(null);
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleDeletePost = useCallback(async (id: string) => {
    // The actual API call and toast are handled by FeedPost -> usePostOptions -> useFeed.
    // We just need to refresh our local posts list to remove the deleted post from the UI immediately.
    queryClient.setQueryData(["userPosts", user?.id], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.filter((p: any) => p.id !== id && p.id?.toString() !== id)
      };
    });
    refetchPosts();
  }, [queryClient, user?.id, refetchPosts]);

  useEffect(() => {
    const onPostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id) {
        handleDeletePost(customEvent.detail.id);
      }
    };
    window.addEventListener("postDeleted", onPostDeleted);
    return () => {
      window.removeEventListener("postDeleted", onPostDeleted);
    };
  }, [handleDeletePost]);


  const openFollowList = (tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  };

  // Refresh all queries on retry
  const handleRefreshAll = async () => {
    try {
      await Promise.allSettled([
        refetchProfile(),
        refetchPosts(),
      ]);
    } catch {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[var(--ds-bg)] flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-ds-bg text-ds-text-primary font-dm-sans px-4 select-text">
        <FullPageError
          title="Unable to load profile"
          description="Something went wrong. Please check your connection and try again"
          onRetry={handleRefreshAll}
        />
      </div>
    );
  }

  const handleShareProfile = () => {
    setIsShareProfileModalOpen(true);
  };

  const handleDownloadProfile = async () => {
    if (!user?.id) return;
    try {
      const toastId = toast.loading("Generating your resume...");
      
      const { downloadProfileResumePdf } = await import("@/services/api/profile");
      const { blob } = await downloadProfileResumePdf(user.id);
      
      const url = window.URL.createObjectURL(blob);
      setDownloadPdfUrl(url);
      setIsDownloadProfileOpen(true);
      
      // Automatically trigger the download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `resume-${(user as any)?.first_name || (user as any)?.username || "profile"}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      toast.dismiss(toastId);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Failed to fetch resume:", error);
      toast.error("Failed to load resume preview.");
    }
  };

  const handleScoreActionClick = (action: string) => {
    switch (action) {
      case "edit-profile":
        setEditInitialTab("profile");
        setIsEditProfileModalOpen(true);
        break;
      case "add-skills":
        setEditInitialTab("skills");
        setEditInitialMode("list");
        setEditSelectedId(null);
        setIsEditProfileModalOpen(true);
        break;
      case "add-experience":
        setEditInitialTab("experience");
        setEditInitialMode("form");
        setEditSelectedId("new");
        setIsEditProfileModalOpen(true);
        break;
      case "add-project":
        setEditInitialTab("project");
        setEditInitialMode("form");
        setEditSelectedId("new");
        setIsEditProfileModalOpen(true);
        break;
      case "add-education":
        setEditInitialTab("education");
        setEditInitialMode("form");
        setEditSelectedId("new");
        setIsEditProfileModalOpen(true);
        break;
      case "add-avatar":
      case "add-cover":
        setEditInitialTab("profile");
        setIsEditProfileModalOpen(true);
        break;
    }
  };

  const handleCreatePost = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("scroll-/feed", "0");
      sessionStorage.removeItem("cocpit_last_interacted_post_id");
      sessionStorage.removeItem("cocpit_last_interacted_post_viewport_top");
    }
    router.push("/feed");
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans px-4 sm:px-6 md:px-8 pt-0 sm:-mt-5 pb-6 sm:pb-8 md:pb-10 md:pr-[253px] select-text">
      {/* 800px Centered Main Profile Container */}
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-5">
        {/* Cover + Profile Image + Action Buttons */}
        <ProfileCoverSection
          coverImage={user?.cover_image}
          avatarImage={user?.avatar}
          userName={user?.name}
          isOwnProfile={true}
          completionPercentage={profileScore}
          breakdown={profileData?.profile_score?.breakdown}
          hasExperience={(flatExperiences?.length ?? 0) > 0 || ((profileData?.experiences as any)?.length ?? 0) > 0}
          hasEducation={(educations?.length ?? 0) > 0 || ((profileData?.educations as any)?.length ?? 0) > 0}
          hasProjects={(projects?.length ?? 0) > 0 || ((profileData?.projects as any)?.length ?? 0) > 0}
          hasSkills={(skills?.length ?? 0) > 0 || ((profileData?.skills as any)?.length ?? 0) > 0}
          hasAvatar={Boolean(user?.avatar)}
          hasCoverImage={Boolean(user?.cover_image)}
          hasBasicInfo={Boolean(user?.about || user?.about_text)}
          onActionClick={handleScoreActionClick}
          onEditProfile={() => {
            setEditInitialTab("profile");
            setIsEditProfileModalOpen(true);
          }}
          onContactInfo={() => setIsContactInfoModalOpen(true)}
          onShareProfile={handleShareProfile}
          onDownloadProfile={handleDownloadProfile}
        />

        {/* User Details & Stats */}
        <ProfileUserBio
          fullName={user?.name}
          userName={user?.account_name || user?.name?.toLowerCase().replace(/\s+/g, ".")}
          role={user?.headline || user?.job_title || undefined}
          location={user?.location || undefined}
          openTo={user?.open_to || undefined}
          availability={user?.availability || undefined}
          workPreference={user?.work_preference || undefined}
          website={user?.website || undefined}
          followersCount={user?.followers_count ?? 0}
          followingCount={user?.following_count ?? 0}
          connectionsCount={user?.connections_count ?? 0}
          onOpenFollowers={() => openFollowList("followers")}
          onOpenFollowing={() => openFollowList("following")}
          onOpenConnections={() => openFollowList("connections")}
        />

        {/* About Section */}
        <ProfileAboutSection
          bio={user?.about || user?.about_text}
          isOwnProfile={true}
          onEditBio={() => {
            setEditInitialTab("profile");
            setIsEditProfileModalOpen(true);
          }}
        />

        {/* Divider */}
        <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

        {/* 1. Post Section */}
        <div className="w-full flex flex-col items-start gap-4">
          <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
            <div className="w-[43px] h-[24px] text-ds-text-primary text-base font-semibold font-dm-sans leading-6 flex-none order-0 grow-0">
              Posts
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem("scroll-/feed", "0");
                  sessionStorage.removeItem("cocpit_last_interacted_post_id");
                  sessionStorage.removeItem("cocpit_last_interacted_post_viewport_top");
                  if (window.innerWidth < 768) {
                    useUIStore.getState().setActiveModal('create-post');
                  }
                  router.push("/feed");
                }
              }}
              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none order-1"
              title="Create Post"
            >
              <AddIcon className="w-5 h-5 text-ds-text-primary" />
            </button>
          </div>
          <div className="w-full px-4 md:px-0 md:pl-5">
            <ProfilePostsTab
              posts={posts}
              isOwnProfile={true}
              isError={isPostsError}
              onRetry={() => refetchPosts()}
              onDeletePost={handleDeletePost}
              onUpdatePost={() => refetchPosts()}
              onCreatePost={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem("scroll-/feed", "0");
                  sessionStorage.removeItem("cocpit_last_interacted_post_id");
                  sessionStorage.removeItem("cocpit_last_interacted_post_viewport_top");
                  if (window.innerWidth < 768) {
                    useUIStore.getState().setActiveModal('create-post');
                  }
                  router.push("/feed");
                }
              }}
              onSeeAll={() => {
                saveScrollPosition("profile");
                router.push("/profile/posts");
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

        {/* 2. Skills Section */}
        <ProfileSkillsTab
          skills={skills}
          isOwnProfile={true}
          isError={isProfileError}
          onRetry={() => refetchProfile()}
          onDeleteSkill={handleDeleteSkill}
          onAddSkills={() => {
            setEditInitialTab("skills");
            setIsEditProfileModalOpen(true);
          }}
          onEditSkills={() => {
            setEditInitialTab("skills");
            setIsEditProfileModalOpen(true);
          }}
        />

        {/* Divider */}
        <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

        {/* 3. Experience Section */}
        <div className="w-full flex flex-col items-start gap-4">
          <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
            <div className="w-[87px] h-[24px] text-ds-text-primary text-base font-semibold font-dm-sans leading-6 flex-none order-0 grow-0">
              Experience
            </div>
            <button
              type="button"
              onClick={() => {
                setEditInitialTab("experience");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer flex-none order-1"
              title="Add Experience"
            >
              <AddIcon className="w-5 h-5 text-ds-text-primary" />
            </button>
          </div>
          <div className="w-full px-4 md:px-0 md:pl-5">
            <ProfileExperienceTab
              experiences={flatExperiences}
              isOwnProfile={true}
              isError={isProfileError}
              onRetry={() => refetchProfile()}
              onEditExperience={(exp, isNestedGroup) => {
                setEditInitialTab("experience");
                setEditInitialMode(isNestedGroup ? "list" : "form");
                setEditSelectedId(isNestedGroup ? null : exp.experience_id);
                setIsEditProfileModalOpen(true);
              }}
              onAddExperience={() => {
                setEditInitialTab("experience");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

        {/* 4. Education Section */}
        <div className="w-full flex flex-col items-start gap-4">
          <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
            <div className="w-[79px] h-[24px] text-ds-text-primary text-base font-semibold font-dm-sans leading-6 flex-none order-0 grow-0">
              Education
            </div>
            <button
              type="button"
              onClick={() => {
                setEditInitialTab("education");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer flex-none order-1"
              title="Add Education"
            >
              <AddIcon className="w-5 h-5 text-ds-text-primary" />
            </button>
          </div>
          <div className="w-full px-4 md:px-0 md:pl-5">
            <ProfileEducationTab
              educations={educations}
              isOwnProfile={true}
              isError={isProfileError}
              onRetry={() => refetchProfile()}
              onEditEducation={(edu) => {
                setEditInitialTab("education");
                setEditInitialMode("form");
                setEditSelectedId(edu.education_id);
                setIsEditProfileModalOpen(true);
              }}
              onAddEducation={() => {
                setEditInitialTab("education");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

        {/* 5. Project Section */}
        <div className="w-full flex flex-col items-start gap-4">
          <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
            <div className="w-[56px] h-[24px] text-ds-text-primary text-base font-semibold font-dm-sans leading-6 flex-none order-0 grow-0">
              Project
            </div>
            <button
              type="button"
              onClick={() => {
                setEditInitialTab("project");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer flex-none order-1"
              title="Add Project"
            >
              <AddIcon className="w-5 h-5 text-ds-text-primary" />
            </button>
          </div>
          <div className="w-full px-4 md:px-0 md:pl-5">
            <ProfileProjectsTab
              projects={projects}
              isOwnProfile={true}
              isError={isProfileError}
              onRetry={() => refetchProfile()}
              onEditProject={(proj) => {
                setEditInitialTab("project");
                setEditInitialMode("form");
                setEditSelectedId(proj.project_id);
                setIsEditProfileModalOpen(true);
              }}
              onAddProject={() => {
                setEditInitialTab("project");
                setEditInitialMode("form");
                setEditSelectedId("new");
                setIsEditProfileModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      {isDownloadProfileOpen && downloadPdfUrl && (
        <DownloadProfileScreen
          isOpen={isDownloadProfileOpen}
          onClose={() => {
            setIsDownloadProfileOpen(false);
            if (downloadPdfUrl) {
              window.URL.revokeObjectURL(downloadPdfUrl);
              setDownloadPdfUrl(null);
            }
          }}
          pdfUrl={downloadPdfUrl}
        />
      )}

      {isEditProfileModalOpen && (
        <ProfileEditScreen
          isOpen={isEditProfileModalOpen}
          initialTab={editInitialTab}
          initialMode={editInitialMode}
          selectedId={editSelectedId}
          onClose={() => setIsEditProfileModalOpen(false)}
        />
      )}

      {isEditCoverOpen && (
        <EditCoverPhoto
          isOpen={isEditCoverOpen}
          onClose={() => {
            setIsEditCoverOpen(false);
            setCoverInitialFile(null);
          }}
          coverImage={user?.cover_image || null}
          initialFile={coverInitialFile}
          onUpload={handleCoverUpload}
          onDelete={handleCoverDelete}
        />
      )}

      {/* Hidden file input for empty state cover picker */}
      <input
        type="file"
        ref={coverFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleCoverFileSelected}
      />

      {isEditAvatarOpen && (
        <EditAvatarModal
          isOpen={isEditAvatarOpen}
          onClose={() => {
            setIsEditAvatarOpen(false);
            setAvatarInitialFile(null);
          }}
          currentAvatarUrl={user?.avatar || null}
          initialFile={avatarInitialFile}
          onUpload={handleAvatarUpload}
          onDelete={handleAvatarDelete}
        />
      )}

      {/* Hidden file input for empty state avatar picker */}
      <input
        type="file"
        ref={avatarFileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleAvatarFileSelected}
      />

      {isViewAvatarOpen && (
        <ViewAvatarModal
          isOpen={isViewAvatarOpen}
          onClose={() => setIsViewAvatarOpen(false)}
          avatarUrl={user?.avatar || null}
        />
      )}

      {isContactInfoModalOpen && (
        <ContactInfoModal
          isOpen={isContactInfoModalOpen}
          onClose={() => setIsContactInfoModalOpen(false)}
          user={user || null}
          isOwnProfile={true}
        />
      )}

      {isFollowListModalOpen && (
        <FollowListModal
          isOpen={isFollowListModalOpen}
          onClose={() => setIsFollowListModalOpen(false)}
          initialTab={activeFollowTab}
          userId={user?.id || ""}
          userName={user?.name || user?.account_name || ""}
          isOwnProfile={true}
        />
      )}

      {isAddExperienceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overscroll-contain">
          <div className="bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y">
            <AddExperienceForm
              onCancel={() => {
                setIsAddExperienceModalOpen(false);
                setEditingExperiences(undefined);
              }}
              onSave={handleSaveExperience}
              onDelete={handleDeleteExperience}
              initialExperiences={editingExperiences}
              isSaving={isSavingExperience}
              existingExperiences={flatExperiences}
            />
          </div>
        </div>
      )}

      {isAddEducationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overscroll-contain">
          <div className="bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y">
            <AddEducationForm
              onCancel={() => {
                setIsAddEducationModalOpen(false);
                setEditingEducation(null);
              }}
              onSave={handleSaveEducation}
              onDelete={handleDeleteEducation}
              initialData={editingEducation}
              existingEducations={educations}
            />
          </div>
        </div>
      )}

      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AddProjectForm
              onCancel={() => {
                setIsAddProjectModalOpen(false);
                setEditingProject(null);
              }}
              onSave={handleSaveProject}
              onDelete={handleDeleteProject}
              initialData={editingProject}
            />
          </div>
        </div>
      )}

      {isSkillModalOpen && (
        <SkillModal
          isOpen={isSkillModalOpen}
          onClose={() => setIsSkillModalOpen(false)}
          initialSkills={skills.map((s) => (typeof s === "string" ? s : s.name || (s as any).skill_name))}
          onSave={async (newSkills) => {
            try {
              await skillMutations.sync.mutateAsync({ skills: newSkills });
              setIsSkillModalOpen(false);
            } catch {
              toast.error("Failed to update skills");
            }
          }}
        />
      )}

      {isCreatePostModalOpen && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => {
            setIsCreatePostModalOpen(false);
            refetchPosts();
          }}
        />
      )}

      {isShareProfileModalOpen && (
        <CocpitShareModel
          isOpen={isShareProfileModalOpen}
          onClose={() => setIsShareProfileModalOpen(false)}
          profileId={user?.id}
          entityType="profile"
          entityId={user?.id}
          customUrl={`/profile/${user?.account_name || user?.id}`}
        />
      )}
    </div>
  );
}
