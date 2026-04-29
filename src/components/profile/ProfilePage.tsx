"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Menu, LogOut, Edit2, CheckCircle, GraduationCap, Briefcase, Pencil, Plus, Building2, FileText, Copy, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils"

import SuggestionsPanel from "@/components/home/SuggestionsPanel"
import type { Page } from "@/types/common"
import { CompanyRoleModal } from "@/components/profile/parts/CompanyRoleModal"
import { CompanyRolesList } from "@/components/profile/parts/CompanyRolesList"
import { UniversalShareModal } from "@/components/share/UniversalShareModal"
import { MoreVertical, Share2, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddExperienceForm from "@/components/profile/AddExperienceForm"
import AddEducationForm from "@/components/profile/AddEducationForm"
import { SkillModal } from "@/components/profile/SkillModal"
import type { Experience, Education } from "@/types/entities"
import { ProfileIdentity } from "@/types/profile"
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips"
import { LivingResume } from "@/components/profile/LivingResume"
import { SkillProofPill } from "@/components/profile/SkillProofPill"
import { useFeed } from "@/hooks/use-feed"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { FeedPost } from "@/features/feed/components/FeedPost"
import PostCard from "@/components/shared/PostCard"
import { getUserPosts } from "@/services/api/profile"
import { deletePost as apiDeletePost, toggleLike } from "@/services/api/posts"
import { toggleSavePost } from "@/services/api/savedPost"
import { UserData, Skill, AddSkillsPayload } from "@/types/user"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import type { Post } from "@/types/entities"
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal"
import { EditAvatarModal } from "@/components/profile/EditAvatarModal"
import EditCoverPhoto from "@/components/profile/EditCoverPhoto"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"
import { EditableExperienceItem } from "@/components/profile/parts/EditableExperienceItem"
import { EditableEducationItem } from "@/components/profile/parts/EditableEducationItem"
import { ContactInfoModal } from "@/components/profile/ContactInfoModal"
import { FollowListModal } from "@/components/profile/FollowListModal"
import { getProfileStats } from "@/services/api/social"
import { useQuery } from "@tanstack/react-query"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"

import { EditProfileModal } from "@/components/profile/parts/EditProfileModal"
import { useMyProfile, useExperienceMutations, useEducationMutations, useSkillMutations, useAvatarMutations, useProfileMutation } from "@/components/profile/hooks/use-my-profile"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

const ProfilePostCard = ({ post, isOwnPost, onDelete }: { post: any, isOwnPost?: boolean, onDelete?: (id: string) => void }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || post.stats?.likes || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);

  const image = post.image_url ||
    post.imageSrc ||
    (post.media && post.media.length > 0 ? post.media[0].url : null) ||
    (post.images && post.images.length > 0 ? (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url) : null);

  const handleLike = async () => {
    try {
      const res = await toggleLike(post.id || post.post_id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await toggleSavePost(post.id || post.post_id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
    } catch (err) {
      toast.error("Failed to update save status");
    }
  };

  return (
    <div className="w-[285.33px] h-[488px] bg-[#FFFFFF] border border-slate-100 rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] py-2 flex flex-col gap-2 relative flex-shrink-0">
      {/* Header section - full width flex row */}
      <div className="w-full px-4 pt-2 flex items-center justify-between z-10">
        {/* Left section: Avatar + Text details */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            <img
              src={post.authorAvatar || post.userAvatar || "/assets/avatar.png"}
              alt={post.author || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {post.author || "Anonymous"}
            </span>
            <span className="text-[10px] text-slate-500 truncate">
              {post.location || "Location"}
            </span>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-slate-50 rounded-full transition-colors outline-none">
                <Icon icon="la:user-tag" className="w-[24px] h-[24px] text-[#6366F1]" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[180px] h-[136px] p-2 bg-white border-[#C7D2FE] rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              align="end"
              sideOffset={8}
            >
              <div className="flex flex-col gap-3">
                {/* Tagged users would go here, fetching from API if possible */}
                <div className="flex items-center gap-2 px-2 py-1">
                   <span className="text-[12px] text-slate-400">No tags yet</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-slate-50 rounded-full transition-colors outline-none">
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-[24px] h-[24px] text-[#000000]" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[180px] h-[136px] p-2 bg-white border-[#C7D2FE] rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              align="end"
              sideOffset={8}
            >
              <div className="flex flex-col gap-3">
                {/* Edit Post */}
                {isOwnPost && (
                  <button 
                    onClick={() => toast.info("Redirecting to editor...")}
                    className="flex items-center justify-between w-full group transition-colors px-2"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-[#000000]">Edit post</span>
                    <Icon icon="eva:edit-outline" className="w-[24px] h-[24px] text-[#000000]" />
                  </button>
                )}

                {/* Make Private */}
                {isOwnPost && (
                  <button 
                    onClick={() => toast.info("Privacy toggle coming soon")}
                    className="flex items-center justify-between w-full group transition-colors px-2"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-[#000000]">Make private</span>
                    <Icon icon="fluent:eye-hide-24-regular" className="w-[24px] h-[24px] text-[#000000]" />
                  </button>
                )}

                {/* Delete Post */}
                {isOwnPost && (
                  <button 
                    onClick={() => onDelete?.(post.id || post.post_id)}
                    className="flex items-center justify-between w-full group transition-colors px-2"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-red-400">Delete post</span>
                    <Icon icon="fluent:delete-32-regular" className="w-[24px] h-[24px] text-red-400" />
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
      </div>
    </div>

      <div className="px-4 py-1">
        <p className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)] line-clamp-2">
          {post.content || "No content available"}
        </p>
        <p className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] mt-1">
          {post.timeAgo || "Just now"}
        </p>
      </div>

      {/* Image Section */}
      <div className="px-4 flex-1 min-h-0">
        <div className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100/50">
          {image ? (
            <img
              src={image}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
              <Icon icon="solar:gallery-linear" className="w-12 h-12 opacity-20" />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 mt-auto border-t border-slate-50/50">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className="flex items-center gap-1.5 hover:text-[#6366F1] transition-colors group"
            >
              <Icon 
                icon={isLiked ? "solar:like-bold" : "solar:like-outline"} 
                className={cn("w-[24px] h-[24px] group-active:scale-110 transition-transform", isLiked ? "text-[#6366F1]" : "text-[#000000]")} 
              />
              <span className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)]">{likesCount}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-[#6366F1] transition-colors group">
              <Icon icon="hugeicons:comment-01" className="w-[24px] h-[24px] text-[#000000] group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)]">{post.comments_count || post.stats?.comments || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-[#6366F1] transition-colors group">
              <Icon icon="hugeicons:repost" className="w-[24px] h-[24px] text-[#000000] group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)]">{post.share_count || 0}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-[#6366F1] transition-colors group">
              <Icon icon="fluent:share-32-regular" className="w-[24px] h-[24px] text-[#000000] group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)]">{post.share_count || 0}</span>
            </button>
            <button 
              onClick={handleBookmark}
              className="flex items-center gap-1.5 hover:text-[#6366F1] transition-colors group"
            >
              <Icon 
                icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-outline"} 
                className={cn("w-[24px] h-[24px] group-active:scale-110 transition-transform", isSaved ? "text-[#6366F1]" : "text-[#000000]")} 
              />
              <span className="text-[12px] leading-[16px] text-[#000000] font-normal font-[family-name:var(--font-poppins)]">{post.saves_count || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const router = useRouter()

  // New TanStack Query Hook
  const { data: profileData, isLoading } = useMyProfile();

  // Mutation Hooks
  const expMutations = useExperienceMutations();
  const eduMutations = useEducationMutations();
  const skillMutations = useSkillMutations();
  const avatarMutations = useAvatarMutations();
  const updateProfileMutation = useProfileMutation();

  // Live profile stats (includes company follows in following_count)
  const { data: profileStats } = useQuery({
    queryKey: ['profileStats', profileData?.user?.id],
    queryFn: () => getProfileStats(profileData!.user.id),
    enabled: !!profileData?.user?.id,
    staleTime: 1000 * 30,
  });

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");

  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const handleUpdateProfile = useCallback(async (data: any) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setIsEditProfileModalOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }, [updateProfileMutation]);

  const [selectedRole, setSelectedRole] = useState<import("@/types/user").CompanyRole | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleRoleClick = useCallback((role: import("@/types/user").CompanyRole) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  }, []);

  const { togglePostVisibility } = useFeed(false);
  const { isCompany } = useActiveProfile();
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isPostsExpanded, setIsPostsExpanded] = useState(false);
  const { logout } = useAuth();

  const experiences = useMemo(() => profileData?.experiences || [], [profileData]);
  const educations = useMemo(() => profileData?.educations || [], [profileData]);
  const skills = useMemo(() => profileData?.skills || [], [profileData]);

  // Merge company_roles into user object for ProfileHeader
  const user = useMemo(() => profileData?.user ? {
    ...profileData.user,
    company_roles: profileData.company_roles || [],
  } : null, [profileData]);

  // Update cover image when profile loads
  useEffect(() => {
    if (profileData?.user?.cover_image) {
      setCoverImage(profileData.user.cover_image);
    }
  }, [profileData]);

  // Keep posts separate for now as it uses different pagination logic
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getUserPosts({ limit: 4 });
        const mappedPosts = response.posts.map(mapProfilePostToPost);
        setPreviewPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch profile posts", error);
      }
    };
    fetchPosts();
  }, []);

  const handleDeletePost = useCallback(async (id: string) => {
    const previousPosts = [...previewPosts];
    setPreviewPosts((prev) => prev.filter((post) => post.id !== id));
    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error("Failed to delete post", error);
      setPreviewPosts(previousPosts);
    }
  }, [previewPosts]);

  const handleToggleVisibility = useCallback((id: string) => {
    setPreviewPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
        : post
    ));
    togglePostVisibility(id);
  }, [togglePostVisibility]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    await avatarMutations.upload.mutateAsync(formData);
  }, [avatarMutations.upload]);

  const handleAvatarDelete = useCallback(async () => {
    await avatarMutations.remove.mutateAsync();
  }, [avatarMutations.remove]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/");
  }, [logout, router]);

  const [isSavingSkills, setIsSavingSkills] = useState(false);

  const handleSaveSkills = useCallback(async (newSkills: string[]) => {
    setIsSavingSkills(true);
    try {
      const normalizedNewSkills = newSkills.map(s => s.trim()).filter(s => s !== "");
      const currentSkillNames = skills.map(s => s.name);

      const skillsToAdd = normalizedNewSkills.filter(newSkill =>
        !currentSkillNames.some(curr => curr.toLowerCase() === newSkill.toLowerCase())
      );

      const skillsToRemove = skills.filter(curr =>
        !normalizedNewSkills.some(newSkill => newSkill.toLowerCase() === curr.name.toLowerCase())
      );

      if (skillsToAdd.length > 0) {
        await skillMutations.add.mutateAsync({ name: skillsToAdd });
      }

      if (skillsToRemove.length > 0) {
        await Promise.all(skillsToRemove.map(s => skillMutations.remove.mutateAsync(s.skill_id)));
      }

      setIsAddSkillModalOpen(false);
      toast.success("Skills updated successfully");
    } catch (error: any) {
      console.error("Failed to save skills", error);
      toast.error(error.response?.data?.message || "Failed to save skills. Please try again.");
    } finally {
      setIsSavingSkills(false);
    }
  }, [skills, skillMutations.add, skillMutations.remove]);

  const handleDeleteSkill = useCallback((skillName: string) => {
    const skill = skills.find(s => s.name === skillName);
    if (skill) {
      skillMutations.remove.mutate(skill.skill_id);
    }
  }, [skills, skillMutations.remove]);

  const handleSaveExperience = async (data: Partial<Experience>) => {
    if (editingExperience) {
      await expMutations.update.mutateAsync({
        id: editingExperience.experience_id,
        payload: {
          title: data.title,
          company_name: data.company_name,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          is_current: !data.end_date,
          description: data.description,
        }
      });
    } else {
      await expMutations.add.mutateAsync({
        title: data.title!,
        company_name: data.company_name!,
        location: data.location!,
        start_date: data.start_date!,
        end_date: data.end_date!,
        is_current: !data.end_date,
        description: data.description!,
      });
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteExperience = async (id: string) => {
    await expMutations.remove.mutateAsync(id);
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  }

  const handleSaveEducation = async (data: Partial<Education>) => {
    if (editingEducation) {
      await eduMutations.update.mutateAsync({
        id: editingEducation.education_id,
        payload: {
          school_name: data.school_name,
          degree: data.degree,
          field_of_study: data.field_of_study,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description,
        }
      });
    } else {
      const payload: any = {
        school_name: data.school_name!,
        degree: data.degree!,
        field_of_study: data.field_of_study!,
        start_date: data.start_date!,
        description: data.description!,
      };
      if (data.end_date) payload.end_date = data.end_date;
      await eduMutations.add.mutateAsync(payload);
    }
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    await eduMutations.remove.mutateAsync(id);
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  }

  const profileIdentity: ProfileIdentity = {
    openTo: (user?.open_to as any) || "Full-time",
    availability: (user?.availability as any) || "Immediate",
    workPreference: (user?.work_preference as any) || "Hybrid",
  };

  const latestEducation = user?.latest_education || educations[0] || null;
  const latestExperience = experiences[0] || null;

  const scrollToEducation = () => {
    document.getElementById("education-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToExperience = () => {
    document.getElementById("experience-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const openFollowList = (tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[960px] mx-auto pt-0 md:pt-8 pb-20 md:pb-12 px-4 md:px-0">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="overflow-hidden relative" style={{ borderRadius: '24px', border: 'none', outline: 'none', background: '#FFFFFF' }}>

            <EditCoverPhoto coverImage={coverImage} setCoverImage={setCoverImage}>
              <div className="absolute top-3 right-3 md:hidden z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/50 backdrop-blur-sm border-white/20 text-white">
                    <DropdownMenuItem onSelect={() => router.push("/settings")}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push("/analytics")}>
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden md:flex absolute top-3 right-3 gap-2 z-10">
                <button onClick={() => router.push('/analytics')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                  View Analytics
                </button>


              </div>
            </EditCoverPhoto>

            <div className="px-0 pb-0">
              <div className="flex items-start justify-between -mt-[40px]">
                <div className="relative group ml-[38px]">
                  <div
                    className="w-[80px] h-[80px] rounded-full border-4 border-white bg-card overflow-hidden flex-shrink-0 cursor-pointer shadow-sm"
                    onClick={() => setIsViewAvatarOpen(true)}
                  >
                    <img
                      src={user?.avatar ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditAvatarOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10"
                    aria-label="Edit Profile Picture"
                  >
                    <img src="/assets/edit.png" alt="Edit" className="w-[32px] h-[32px]" />
                  </button>
                </div>

                <div className="md:hidden mt-16 flex gap-2">


                </div>

                <div className="hidden md:flex flex-col items-end mt-16">
                  <button
                    onClick={() => setIsContactInfoModalOpen(true)}
                    className="absolute top-[170px] right-[10px] w-[87px] h-[20px] text-[#6B7280] hover:text-[#4B5563] transition-colors flex items-center justify-center"
                    style={{ fontFamily: "'Poppins', sans-serif", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}
                  >
                    Contact info
                  </button>
                </div>
              </div>

              {/* Stats Section with exact spec-compliant dimensions and padding [between profile and profileidentitychip*/}
              <div className="hidden md:block w-full h-[90px] pt-[16px] pr-[16px] pb-[16px] pl-[40px] mt-[16px] mb-0">
                <div className="flex gap-[24px] items-center">
                  <div
                    onClick={() => openFollowList("following")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-[#EEF2FF] rounded-[24px] cursor-pointer hover:bg-[#E0E7FF] transition-all border border-transparent"
                  >
                    <span className="text-[14px] text-[#111827] font-[family-name:var(--font-poppins)]">Following</span>
                    <span className="text-[16px] font-semibold text-[#6366F1] font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                  </div>
                  <div
                    onClick={() => openFollowList("followers")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-[#EEF2FF] rounded-[24px] cursor-pointer hover:bg-[#E0E7FF] transition-all border border-transparent"
                  >
                    <span className="text-[14px] text-[#111827] font-[family-name:var(--font-poppins)]">Followers</span>
                    <span className="text-[16px] font-semibold text-[#6366F1] font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                  </div>
                  <div
                    onClick={() => openFollowList("connections")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-[#EEF2FF] rounded-[24px] cursor-pointer hover:bg-[#E0E7FF] transition-all border border-transparent"
                  >
                    <span className="text-[14px] text-[#111827] font-[family-name:var(--font-poppins)]">Connection</span>
                    <span className="text-[16px] font-semibold text-[#6366F1] font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start w-full min-h-[217px] pt-[16px] pr-[16px] pb-[16px] pl-[40px] gap-[100px]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-nowrap">
                    <h1 className="text-[24px] font-semibold text-[#000000] leading-[32px] font-[family-name:var(--font-poppins)] tracking-tight whitespace-nowrap">{user?.name}</h1>

                    {/* Company Roles Static Display */}
                    {(() => {
                      const visibleRoles = user?.company_roles?.filter(r => r.is_role_visible) || [];
                      if (visibleRoles.length === 0) return null;

                      return (
                        <div className="flex items-center gap-2 flex-nowrap">
                          <div className="flex items-center gap-[10px] px-[16px] py-[8px] bg-[#E0E7FF] rounded-[24px] border border-[#C7D2FE] flex-shrink-0 w-fit h-[36px]">
                            <Icon icon="solar:buildings-linear" className="w-5 h-5 text-[#6366F1]" />
                            <span className="text-[12px] font-normal text-[#6366F1] leading-[16px] font-[family-name:var(--font-poppins)] whitespace-nowrap">
                              {visibleRoles[0].role} at {visibleRoles[0].name}
                            </span>
                          </div>

                          {visibleRoles.length > 1 && (
                            <span className="text-[12px] font-medium text-slate-500 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              + {visibleRoles.length - 1} more
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <p className="text-[16px] font-normal text-[#000000] leading-[24px] font-[family-name:var(--font-poppins)] mb-4">
                    {user?.headline}
                  </p>

                  <div className="flex flex-col gap-0.5 mb-4">
                    {user?.location && (
                      <div className="flex items-center gap-2 text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)]">
                        <span>{user?.location}</span>
                      </div>
                    )}
                    {user?.website && (
                      <div className="flex items-center gap-2 text-[12px] font-normal text-[#6366F1] leading-[16px] font-[family-name:var(--font-poppins)] hover:underline">
                        <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>
                      </div>
                    )}
                  </div>

                  <ProfileIdentityChips initialIdentity={profileIdentity} />
                </div>

                <div className="hidden md:flex items-start gap-[24px] pt-0 shrink-0 w-[308px] h-[185px]">
                  <div className="flex flex-col gap-4">
                    {/* Latest Education/Experience display logic with refined styling */}
                    {latestExperience && (
                      <div onClick={scrollToExperience} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center flex-shrink-0">
                            <Icon icon="hugeicons:job-search" className="w-6 h-6 text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[16px] font-normal text-[#000000] leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.company_name}</span>
                            <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.title}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {latestEducation && (
                      <div onClick={scrollToEducation} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center flex-shrink-0">
                            <Icon icon="qlementine-icons:education-24" className="w-6 h-6 text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[16px] font-normal text-[#000000] leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">
                              {/* @ts-ignore */}
                              {latestEducation.school_name || latestEducation.school || 'University'}
                            </span>
                            <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestEducation.degree}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center w-6 h-6 text-[#6366F1] outline-none border-none focus:outline-none">
                          <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        alignOffset={0}
                        className="w-[180px] h-[136px] !rounded-tl-[24px] !rounded-tr-none !rounded-br-[24px] !rounded-bl-[24px] border border-[#C7D2FE] p-[8px] bg-[#FFFFFF] flex flex-col gap-1"
                      >
                        <DropdownMenuItem
                          onClick={() => setIsEditProfileModalOpen(true)}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-[#6366F1] focus:text-white rounded-xl outline-none group transition-colors"
                        >
                          <span className="text-sm font-medium text-[#6B7280] group-focus:text-white">Edit profile</span>
                          <Edit2 className="w-4 h-4 text-[#6B7280] group-focus:text-white transition-colors" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsShareModalOpen(true)}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-[#6366F1] focus:text-white rounded-xl outline-none group transition-colors"
                        >
                          <span className="text-sm font-medium text-[#6B7280] group-focus:text-white">Share profile</span>
                          <Share2 className="w-4 h-4 text-[#6B7280] group-focus:text-white transition-colors" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Profile link copied");
                          }}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-[#6366F1] focus:text-white rounded-xl outline-none group transition-colors"
                        >
                          <span className="text-sm font-medium text-[#6B7280] group-focus:text-white">Copy profile</span>
                          <Copy className="w-4 h-4 text-[#6B7280] group-focus:text-white transition-colors" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="w-full min-h-[110px] pr-[16px] pb-[20px] pl-[40px] flex flex-col gap-[16px] mt-[16px]">
              <h2 className="w-[904px] h-[26px] font-[family-name:var(--font-poppins)] font-medium text-[18px] leading-[26px] tracking-normal text-[#000000] flex items-center m-0 p-0">About</h2>
              <p className="w-[904px] h-[48px] font-[family-name:var(--font-poppins)] font-normal text-[16px] leading-[24px] tracking-normal text-[#000000] overflow-hidden m-0 p-0">
                {user?.about}
              </p>
            </div>

            {/* Living Resume Section */}
            <div className="mt-[16px]">
              <LivingResume 
                experiences={experiences} 
                skills={skills.map(s => s.name)} 
                resumeName={profileData?.resume?.originalName} 
                resumeUrl={profileData?.resume?.url}
              />
            </div>

            {/* Posts Section */}
            <div
              className="w-[960px] mx-auto bg-transparent mt-[16px] transition-all duration-500 ease-in-out overflow-hidden"
              style={{ minHeight: isPostsExpanded ? 'auto' : '564px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pt-4 pb-4 px-10">
                <h2 className="text-[18px] leading-[26px] text-[#000000] font-medium font-[family-name:var(--font-poppins)]">Post</h2>
                {previewPosts.length > 3 && (
                  <button
                    onClick={() => {
                      setIsPostsExpanded(!isPostsExpanded);
                      if (isPostsExpanded) {
                        document.getElementById('posts-section-top')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-[78px] h-[36px] flex items-center justify-center px-4 py-2 border border-[#818CF8] rounded-[24px] bg-white text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#818CF8] whitespace-nowrap hover:bg-slate-50 transition-all duration-200"
                  >
                    {isPostsExpanded ? 'Show less' : 'See all'}
                  </button>
                )}
              </div>

              {/* Anchor for scroll to top */}
              <div id="posts-section-top" />

              {/* Posts Wrapper */}
              <div
                className={`pl-10 pr-4 transition-all duration-500 ease-in-out ${isPostsExpanded
                    ? "grid grid-cols-3 gap-[24px] pb-10"
                    : "flex flex-row gap-[24px]"
                  }`}
              >
                {(isPostsExpanded ? previewPosts : previewPosts.slice(0, 3)).map((post, index) => (
                  <div
                    key={post.id || index}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProfilePostCard
                      post={post}
                      isOwnPost={!isCompany}
                      onDelete={handleDeletePost}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Section */}
            <div 
              className="w-[960px] mx-auto bg-white mt-[16px] rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] pr-[24px] pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-[#000000] font-medium font-[family-name:var(--font-poppins)]">Skills</h2>
                <button 
                  onClick={() => setIsAddSkillModalOpen(true)}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-[#818CF8] bg-white flex items-center justify-center text-[#818CF8] hover:bg-slate-50 transition-all flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Skills Row */}
              <div className="flex flex-wrap gap-[24px]">
                {skills.map((skill: any, index) => {
                  const skillName = skill.name || (typeof skill === 'string' ? skill : '');
                  if (!skillName) return null;
                  return (
                    <SkillProofPill
                      key={skill.skill_id || `skill-${index}`}
                      skill={skillName}
                      experiences={experiences}
                      posts={previewPosts}
                      onDelete={handleDeleteSkill}
                    />
                  );
                })}
              </div>
            </div>

            {/* Experience Section */}
            <div 
              id="experience-section"
              className="w-[960px] mx-auto bg-white mt-[16px] rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] pr-[24px] pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-[#000000] font-medium font-[family-name:var(--font-poppins)]">Experience</h2>
                <button 
                  onClick={() => { setEditingExperience(null); setIsAddExperienceModalOpen(true); }}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-[#818CF8] bg-white flex items-center justify-center text-[#818CF8] hover:bg-slate-50 transition-all flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Experience List */}
              <div className="flex flex-col gap-[32px]">
                {experiences.map((exp, index) => (
                  <EditableExperienceItem
                    key={`${exp.experience_id}-${index}`}
                    experience={exp}
                    onEdit={() => { setEditingExperience(exp); setIsAddExperienceModalOpen(true); }}
                  />
                ))}
              </div>
            </div>

            {/* Education Section */}
            <div 
              id="education-section" 
              className="w-[960px] mx-auto bg-white mt-[16px] rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] pr-[24px] pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-[#000000] font-medium font-[family-name:var(--font-poppins)]">Education</h2>
                <button 
                  onClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-[#818CF8] bg-white flex items-center justify-center text-[#818CF8] hover:bg-slate-50 transition-all flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Education List */}
              <div className="flex flex-col gap-[32px]">
                {educations.map((edu, index) => (
                  <EditableEducationItem
                    key={`${edu.education_id}-${index}`}
                    education={edu}
                    onEdit={() => { setEditingEducation(edu); setIsAddEducationModalOpen(true); }}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onSave={handleUpdateProfile}
      />

      <SkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        initialSkills={skills.map(s => s.name)}
        onSave={handleSaveSkills}
        loading={isSavingSkills}
      />

      <Dialog open={isAddExperienceModalOpen} onOpenChange={setIsAddExperienceModalOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[800px] [&>button]:hidden outline-none">
          <DialogTitle className="sr-only">Add Experience</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add a new experience record to your profile.</DialogDescription>
          <AddExperienceForm
            onSave={handleSaveExperience}
            onCancel={() => setIsAddExperienceModalOpen(false)}
            initialData={editingExperience}
            onDelete={() => editingExperience && handleDeleteExperience(editingExperience.experience_id)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEducationModalOpen} onOpenChange={setIsAddEducationModalOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[800px] [&>button]:hidden outline-none">
          <DialogTitle className="sr-only">Add Education</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add a new education record to your profile.</DialogDescription>
          <AddEducationForm
            onSave={handleSaveEducation}
            onCancel={() => setIsAddEducationModalOpen(false)}
            initialData={editingEducation}
            onDelete={() => editingEducation && handleDeleteEducation(editingEducation.education_id)}
          />
        </DialogContent>
      </Dialog>

      <ViewAvatarModal
        isOpen={isViewAvatarOpen}
        onClose={() => setIsViewAvatarOpen(false)}
        avatarUrl={user?.avatar || null}
      />

      <EditAvatarModal
        isOpen={isEditAvatarOpen}
        onClose={() => setIsEditAvatarOpen(false)}
        currentAvatarUrl={user?.avatar || null}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
      />

      <FollowListModal
        isOpen={isFollowListModalOpen}
        onClose={() => setIsFollowListModalOpen(false)}
        initialTab={activeFollowTab}
        userId={user?.id || ""}
      />

      <ContactInfoModal
        isOpen={isContactInfoModalOpen}
        onClose={() => setIsContactInfoModalOpen(false)}
        user={user}
        isOwnProfile={true}
      />

      <CompanyRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={selectedRole}
        isOwnProfile={true}
      />

      <UniversalShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entityId={user?.id || ""}
        entityType="profile"
        entityName={user?.name || ""}
        entityUrl={`/profile/${user?.account_name || user?.id}`}
      />
    </div>
  )
}
