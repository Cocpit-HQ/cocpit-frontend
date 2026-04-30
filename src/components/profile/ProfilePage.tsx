"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Menu, LogOut, Edit2, CheckCircle, GraduationCap, Briefcase, Pencil, Plus, Building2, FileText, Copy, ChevronDown, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
import { deletePost as apiDeletePost, toggleLike, createRepost, updatePost } from "@/services/api/posts"
import { toggleSavePost } from "@/services/api/savedPost"
import { CommentModal } from "./parts/CommentModal"
import { EditPostModal } from "./parts/EditPostModal"
import { UserData, Skill, AddSkillsPayload } from "@/types/user"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import type { Post } from "@/types/entities"
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal"
import { EditAvatarModal } from "@/components/profile/EditAvatarModal"
import EditCoverPhoto from "@/components/profile/EditCoverPhoto"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

const ProfilePostCard = ({ post, isOwnPost, onDelete }: { post: Post, isOwnPost?: boolean, onDelete?: (id: string) => void }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const image = localPost.imageSrc || (localPost.images && localPost.images.length > 0 ? localPost.images[0] : null);

  const handleLike = async () => {
    try {
      const res = await toggleLike(localPost.id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await toggleSavePost(localPost.id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
    } catch (err) {
      toast.error("Failed to update save status");
    }
  };

  const handleRepost = async () => {
    try {
      await createRepost(localPost.id);
      setLocalPost(prev => ({
        ...prev,
        shares: (Number(prev.shares) || 0) + 1 + ""
      }));
      toast.success("Post reposted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to repost");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${localPost.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post",
          url: shareUrl
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Post link copied to clipboard!");
    }
  };

  const handleTogglePrivacy = async () => {
    const newVisibility = localPost.visibility === 'private' ? 'public' : 'private';
    try {
      const updated = await updatePost(localPost.id, { visibility: newVisibility });
      setLocalPost(mapProfilePostToPost(updated));
      toast.success(`Post is now ${newVisibility}`);
    } catch (err) {
      toast.error("Failed to update privacy");
    }
  };

  return (
    <div className="w-full sm:w-[285.33px] h-[488px] bg-card border border-border rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] py-2 flex flex-col gap-2 relative flex-shrink-0">
      {/* Header section - full width flex row */}
      <div className="w-full px-4 pt-2 flex items-center justify-between z-10">
        {/* Left section: Avatar + Text details */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={localPost.authorAvatar || "/assets/profilephoto.png"}
              alt={localPost.author || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {localPost.author || "Anonymous"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {localPost.category || "Location"}
            </span>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none">
                <Icon icon="la:user-tag" className="w-[24px] h-[24px] text-primary" />
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
              <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none">
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-[24px] h-[24px] text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[180px] h-[136px] p-2 bg-card border-border rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              align="end"
              sideOffset={8}
            >
              <div className="flex flex-col gap-3">
                {/* Edit Post */}
                {isOwnPost && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-between w-full group transition-colors px-2 py-1.5"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-foreground">Edit post</span>
                    <Icon icon="lucide:pencil" className="w-[18px] h-[18px] text-foreground" />
                  </button>
                )}

                {/* Visibility Toggle */}
                {isOwnPost && (
                  <button 
                    onClick={handleTogglePrivacy}
                    className="flex items-center justify-between w-full group transition-colors px-2 py-1.5"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-foreground">
                      {localPost.visibility === 'private' ? 'Make public' : 'Make private'}
                    </span>
                    <Icon 
                      icon={localPost.visibility === 'private' ? "fluent:eye-24-regular" : "fluent:eye-hide-24-regular"} 
                      className="w-[18px] h-[18px] text-foreground" 
                    />
                  </button>
                )}

                {/* Delete Post */}
                {isOwnPost && (
                  <button 
                    onClick={() => onDelete?.(localPost.id)}
                    className="flex items-center justify-between w-full group transition-colors px-2 py-1.5"
                  >
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-red-400">Delete post</span>
                    <Icon icon="fluent:delete-32-regular" className="w-[18px] h-[18px] text-red-400" />
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
      </div>
    </div>

      <div className="px-4 py-2 h-[48px] overflow-hidden">
        <p className="text-[12px] leading-[16px] text-foreground font-normal font-[family-name:var(--font-poppins)] line-clamp-1">
          {(() => {
            const content = localPost.content || "";
            return content.split(/(@\[[^\]]+\]\([^)]+\)|#\w+)/g).map((part, i) => {
              if (part.startsWith('#')) {
                return <span key={i} className="text-primary hover:underline cursor-pointer">{part}</span>;
              }
              const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
              if (mentionMatch) {
                return <span key={i} className="text-primary font-medium hover:underline cursor-pointer">{mentionMatch[1]}</span>;
              }
              return part;
            });
          })()}
        </p>
        <p className="text-[10px] leading-[16px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)] mt-1">
          {localPost.timeAgo || "Just now"}
        </p>
      </div>

      {/* Content Section */}
      <div className="px-0 h-[300px] flex-shrink-0">
        <div className="w-full h-full bg-card overflow-hidden relative border-y border-border">
          {/* Shared Post (Repost) */}
          {localPost.shared_post ? (
            <div className="p-4 h-full bg-secondary flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={localPost.shared_post.authorAvatar || "/assets/profilephoto.png"} />
                  <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-semibold text-foreground truncate">
                  {localPost.shared_post.author}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-3">
                {localPost.shared_post.content}
              </p>
              {localPost.shared_post.imageSrc && (
                <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-200">
                  <img src={localPost.shared_post.imageSrc} alt="Shared content" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : localPost.poll ? (
            /* Poll Section */
            <div className="p-4 h-full flex flex-col gap-3 justify-center">
              <p className="text-[12px] font-semibold text-foreground mb-1">{localPost.poll.total_votes || 0} votes</p>
              <div className="space-y-2">
                {localPost.poll.options.map((option, idx) => {
                  const percentage = localPost.poll!.total_votes > 0 
                    ? Math.round((option.vote_count / localPost.poll!.total_votes) * 100) 
                    : 0;
                  return (
                    <div key={option.option_id} className="relative h-9 w-full bg-secondary border border-border rounded-lg overflow-hidden group">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative h-full flex items-center justify-between px-3 text-[11px]">
                        <span className="font-medium text-foreground">{option.option_text}</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : localPost.category === 'Article' ? (
             /* Article Section */
             <div className="h-full flex flex-col">
                {image && <img src={image} className="w-full h-40 object-cover" />}
                <div className="p-4 flex-1 bg-card">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-2">{localPost.title || "Untitled Article"}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">Click to read full article on Cocpit Insight</p>
                </div>
             </div>
          ) : image ? (
            /* Standard Image Post */
            <img
              src={image}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          ) : (
            /* Fallback Placeholder */
            <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
              <Icon icon="solar:gallery-linear" className="w-12 h-12 opacity-20" />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 mt-auto">
        {/* Liked by Section */}
        <div className="px-1 mb-2">
          <p className="text-[11px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
            Liked by <span className="font-semibold text-foreground">Jhon</span> and <span className="font-semibold text-foreground">others</span>
          </p>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-5">
            <button 
              onClick={handleLike}
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Icon 
                icon={isLiked ? "solar:like-bold" : "solar:like-outline"} 
                className={cn("w-[22px] h-[22px] group-active:scale-110 transition-transform", isLiked ? "text-primary" : "text-foreground")} 
              />
              <span className="text-[12px] leading-[1] text-foreground font-normal font-[family-name:var(--font-poppins)] translate-y-[1px]">{likesCount}</span>
            </button>
            <button 
              onClick={() => setIsCommentModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Icon icon="hugeicons:comment-01" className="w-[22px] h-[22px] text-foreground group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[1] text-foreground font-normal font-[family-name:var(--font-poppins)] translate-y-[1px]">{localPost.comments || 0}</span>
            </button>
            <button 
              onClick={handleRepost}
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Icon icon="hugeicons:repost" className="w-[22px] h-[22px] text-foreground group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[1] text-foreground font-normal font-[family-name:var(--font-poppins)] translate-y-[1px]">{localPost.shares || 0}</span>
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Icon icon="fluent:share-32-regular" className="w-[22px] h-[22px] text-foreground group-active:scale-110 transition-transform" />
              <span className="text-[12px] leading-[1] text-foreground font-normal font-[family-name:var(--font-poppins)] translate-y-[1px]">{localPost.shares || 0}</span>
            </button>
            <button 
              onClick={handleBookmark}
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Icon 
                icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-outline"} 
                className={cn("w-[22px] h-[22px] group-active:scale-110 transition-transform", isSaved ? "text-primary" : "text-foreground")} 
              />
              <span className="text-[12px] leading-[1] text-foreground font-normal font-[family-name:var(--font-poppins)] translate-y-[1px]">{localPost.shares || 0}</span>
            </button>
          </div>
        </div>
      </div>

      <CommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={localPost.id}
        onCommentAdded={() => {
          setLocalPost(prev => ({
            ...prev,
            comments: (parseInt(prev.comments) || 0) + 1 + ""
          }));
        }}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={localPost}
        onSuccess={(updated) => setLocalPost(mapProfilePostToPost(updated))}
      />
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
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
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
    <div className="min-h-screen bg-background">
      <div className="w-full md:max-w-[960px] mx-auto pt-0 md:pt-8 pb-[100px] md:pb-12 px-0 md:px-0">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="overflow-hidden relative bg-card md:rounded-[24px] rounded-none border-none outline-none pb-8 md:pb-0">

            <EditCoverPhoto coverImage={coverImage} setCoverImage={setCoverImage}>
              <div className="absolute top-3 right-3 md:hidden z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border text-foreground">
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
              <div className="flex items-start justify-between -mt-[32px] md:-mt-[40px]">
                <div className="relative group ml-4 md:ml-[38px]">
                  <div
                    className="w-[64px] h-[64px] md:w-[80px] md:h-[80px] rounded-full border-[3px] md:border-4 border-card bg-card overflow-hidden flex-shrink-0 cursor-pointer shadow-sm"
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
                    <img src="/assets/edit.png" alt="Edit" className="w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
                  </button>
                </div>


                <div className="hidden md:flex flex-col items-end mt-12 pr-[16px]">
                  <button 
                    onClick={() => setIsContactInfoModalOpen(true)}
                    className="text-[14px] font-medium text-muted-foreground hover:text-primary transition-colors font-[family-name:var(--font-poppins)]"
                  >
                    Contact Info
                  </button>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="md:hidden flex items-center gap-3 px-4 mt-4">
                <button 
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="flex-1 h-[40px] rounded-[24px] bg-secondary text-primary font-medium font-[family-name:var(--font-poppins)] text-[14px] flex items-center justify-center transition-colors"
                >
                  Edit profile
                </button>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-[40px] h-[40px] rounded-full bg-secondary text-primary flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Stats Section */}
              <div className="md:hidden w-full px-4 mt-6">
                <div className="flex justify-between items-center w-full px-2">
                  <div onClick={() => openFollowList("following")} className="flex flex-col items-center cursor-pointer">
                    <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                    <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Following</span>
                  </div>
                  <div className="w-[1px] h-8 bg-border"></div>
                  <div onClick={() => openFollowList("followers")} className="flex flex-col items-center cursor-pointer">
                    <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                    <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Followers</span>
                  </div>
                  <div className="w-[1px] h-8 bg-border"></div>
                  <div onClick={() => openFollowList("connections")} className="flex flex-col items-center cursor-pointer">
                    <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                    <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Connections</span>
                  </div>
                </div>
              </div>

              {/* Desktop Stats Section with exact spec-compliant dimensions and padding */}
              <div className="hidden md:block w-full h-[90px] pt-[16px] pr-[16px] pb-[16px] pl-[40px] mt-[16px] mb-0">
                <div className="flex gap-[24px] items-center">
                  <div
                    onClick={() => openFollowList("following")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-secondary rounded-[24px] cursor-pointer hover:opacity-80 transition-all border border-transparent"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12px] leading-[18px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">Following</span>
                      <span className="text-[16px] leading-[24px] text-primary font-semibold font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                    </div>
                    <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div
                    onClick={() => openFollowList("followers")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-secondary rounded-[24px] cursor-pointer hover:opacity-80 transition-all border border-transparent"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12px] leading-[18px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">Followers</span>
                      <span className="text-[16px] leading-[24px] text-primary font-semibold font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                    </div>
                    <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div
                    onClick={() => openFollowList("connections")}
                    className="w-[290.67px] h-[58px] flex items-center justify-between px-6 bg-secondary rounded-[24px] cursor-pointer hover:opacity-80 transition-all border border-transparent"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12px] leading-[18px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">Connection</span>
                      <span className="text-[16px] leading-[24px] text-primary font-semibold font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                    </div>
                    <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-muted-foreground" />
                  </div></div>
                </div>
              </div>

            <div className="flex justify-between items-start w-full min-h-[217px] pt-[16px] px-4 md:pr-[16px] pb-[16px] md:pl-[40px] md:gap-[100px]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap md:flex-nowrap">
                  <h1 className="text-[20px] md:text-[24px] font-semibold text-foreground leading-[28px] md:leading-[32px] font-[family-name:var(--font-poppins)] tracking-tight whitespace-nowrap">{user?.name}</h1>

                  {/* Company Roles Static Display */}
                  {(() => {
                    const visibleRoles = user?.company_roles?.filter(r => r.is_role_visible) || [];
                    if (visibleRoles.length === 0) return null;

                    return (
                      <div className="flex items-center gap-2 flex-nowrap">
                        <div className="flex items-center gap-[10px] px-[16px] py-[8px] bg-secondary rounded-[24px] border border-primary/20 flex-shrink-0 w-fit h-[36px]">
                          <Icon icon="solar:buildings-linear" className="w-5 h-5 text-primary" />
                          <span className="text-[12px] font-normal text-primary leading-[16px] font-[family-name:var(--font-poppins)] whitespace-nowrap">
                            {visibleRoles[0].role} at {visibleRoles[0].name}
                          </span>
                        </div>

                        {visibleRoles.length > 1 && (
                          <span className="text-[12px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full border border-border">
                            + {visibleRoles.length - 1} more
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <p className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] mb-4">
                  {user?.headline}
                </p>

                <div className="flex flex-col gap-0.5 mb-4">
                  {user?.location && (
                    <div className="flex items-center gap-2 text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)]">
                      <span>{user?.location}</span>
                    </div>
                  )}
                  {user?.website && (
                    <div className="flex items-center gap-2 text-[12px] font-normal text-primary leading-[16px] font-[family-name:var(--font-poppins)] hover:underline">
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
                    <div onClick={scrollToExperience} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-secondary/50 rounded-xl transition-colors">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon icon="hugeicons:job-search" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.company_name}</span>
                          <span className="text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.title}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {latestEducation && (
                    <div onClick={scrollToEducation} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-secondary/50 rounded-xl transition-colors">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon icon="qlementine-icons:education-24" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">
                            {/* @ts-ignore */}
                            {latestEducation.school_name || latestEducation.school || 'University'}
                          </span>
                          <span className="text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestEducation.degree}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-center w-6 h-6 text-primary outline-none border-none focus:outline-none hover:bg-secondary rounded-full transition-colors">
                        <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      alignOffset={0}
                      className="w-[180px] h-[136px] !rounded-tl-[24px] !rounded-tr-none !rounded-br-[24px] !rounded-bl-[24px] border border-border p-[8px] bg-card flex flex-col gap-1"
                    >
                      <DropdownMenuItem
                        onClick={() => setIsEditProfileModalOpen(true)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-primary focus:text-white rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-white">Edit profile</span>
                        <Edit2 className="w-4 h-4 text-foreground group-focus:text-white transition-colors" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-primary focus:text-white rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-white">Share profile</span>
                        <Share2 className="w-4 h-4 text-foreground group-focus:text-white transition-colors" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Profile link copied");
                        }}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-primary focus:text-white rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-white">Copy profile</span>
                        <Copy className="w-4 h-4 text-foreground group-focus:text-white transition-colors" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="w-full px-4 md:pr-[16px] pb-[20px] md:pl-[40px] flex flex-col gap-[12px] mt-[16px]">
              <h2 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] leading-[26px] text-foreground">About</h2>
              <div className="relative w-full md:max-w-[904px]">
                <p 
                  className={cn(
                    "font-[family-name:var(--font-poppins)] font-normal text-[14px] md:text-[16px] leading-[20px] md:leading-[24px] text-foreground transition-all duration-300",
                    !isAboutExpanded && "line-clamp-3 md:line-clamp-2"
                  )}
                >
                  {user?.about}
                </p>
                {!isAboutExpanded && (user?.about?.length || 0) > 150 && (
                  <button 
                    onClick={() => setIsAboutExpanded(true)}
                    className="absolute bottom-0 right-0 bg-card pl-2 text-muted-foreground hover:text-primary font-normal text-[14px] md:text-[16px] transition-colors"
                  >
                    ....More
                  </button>
                )}
                {isAboutExpanded && (
                  <button 
                    onClick={() => setIsAboutExpanded(false)}
                    className="text-[#6366F1] hover:underline font-normal text-[14px] mt-2 block"
                  >
                    Show less
                  </button>
                )}
              </div>
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
              className="w-full md:w-[960px] mx-auto bg-transparent mt-[16px] transition-all duration-500 ease-in-out overflow-hidden"
              style={{ minHeight: isPostsExpanded ? 'auto' : '564px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pt-4 pb-4 px-4 md:px-10">
                <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Post</h2>
                {previewPosts.length > 3 && (
                  <button
                    onClick={() => {
                      setIsPostsExpanded(!isPostsExpanded);
                      if (isPostsExpanded) {
                        document.getElementById('posts-section-top')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-[78px] h-[36px] flex items-center justify-center px-4 py-2 border border-primary rounded-[24px] bg-card text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-primary whitespace-nowrap hover:bg-secondary transition-all duration-200"
                  >
                    {isPostsExpanded ? 'Show less' : 'See all'}
                  </button>
                )}
              </div>

              {/* Anchor for scroll to top */}
              <div id="posts-section-top" />

              {/* Posts Wrapper */}
              <div
                className={`px-4 md:pl-10 md:pr-4 transition-all duration-500 ease-in-out ${isPostsExpanded
                    ? "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[24px] pb-10"
                    : "flex flex-col md:flex-row gap-4 md:gap-[24px]"
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
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] px-4 md:pr-[24px] md:pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Skills</h2>
                <button 
                  onClick={() => setIsAddSkillModalOpen(true)}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-primary bg-card flex items-center justify-center text-primary hover:bg-secondary transition-all flex-shrink-0"
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
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] px-4 md:pr-[24px] md:pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Experience</h2>
                <button 
                  onClick={() => { setEditingExperience(null); setIsAddExperienceModalOpen(true); }}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-primary bg-card flex items-center justify-center text-primary hover:bg-secondary transition-all flex-shrink-0"
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
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] pt-[16px] px-4 md:pr-[24px] md:pl-[40px] pb-[40px] flex flex-col gap-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Education</h2>
                <button 
                  onClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }}
                  className="w-[56px] h-[40px] px-4 py-2 rounded-[24px] border border-primary bg-card flex items-center justify-center text-primary hover:bg-secondary transition-all flex-shrink-0"
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
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full [&>button]:hidden outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
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
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full [&>button]:hidden outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
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
