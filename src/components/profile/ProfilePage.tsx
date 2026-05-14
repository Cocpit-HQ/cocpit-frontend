"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"
import { Menu, LogOut, Edit2, CheckCircle, GraduationCap, Briefcase, Pencil, Plus, Building2, FileText, Copy, ChevronDown, User, ThumbsUp, MessageSquare, Repeat2, Share, Bookmark, Eye, EyeOff, Trash2 } from "lucide-react"
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
import AddExperienceForm, { type SavedRole } from "@/components/profile/AddExperienceForm"
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
import { PostCarousel } from "@/components/shared/PostCarousel"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditableExperienceItem } from "@/components/profile/parts/EditableExperienceItem"
import { EditableExperienceGroup } from "@/components/profile/parts/EditableExperienceGroup"
import { EditableEducationItem } from "@/components/profile/parts/EditableEducationItem"
import { ContactInfoModal } from "@/components/profile/ContactInfoModal"
import { FollowListModal } from "@/components/profile/FollowListModal"
import { getProfileStats } from "@/services/api/social"
import { useQuery } from "@tanstack/react-query"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"

import { EditProfileModal } from "@/components/profile/parts/EditProfileModal"
import { useMyProfile, useExperienceMutations, useEducationMutations, useSkillMutations, useAvatarMutations, useProfileMutation } from "@/hooks/use-my-profile"

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0">
      {/* Header section (Frame 2608569) */}
      <div className="w-full h-[40px] flex items-center justify-between px-4 z-10 mb-2">
        {/* Author Info (Frame 2608571) */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {/* Avatar (Ellipse 10) */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            <img
              src={localPost.authorAvatar || "/assets/profilephoto.png"}
              alt={localPost.author || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Text Info (Frame 2608568) */}
          <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <span className="text-[16px] leading-[24px] font-normal text-foreground truncate font-[family-name:var(--font-poppins)]">
              {localPost.author || "Anonymous"}
            </span>
            <span className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)]">
              {(localPost as any).authorRole || "Designer"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          {localPost.tags && localPost.tags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-[#EEF2FF] rounded-full transition-colors outline-none text-[#6B7280] hover:text-[#6366F1] data-[state=open]:text-[#6366F1]">
                  <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[180px] p-2 bg-card border border-border rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto z-[210]"
                align="end"
                sideOffset={8}
              >
                <div className="flex flex-col gap-1">
                  {localPost.tags.map((tag: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-[12px] transition-colors cursor-pointer">
                      <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                        {tag.avatar_url || tag.avatar ? (
                          <img src={tag.avatar_url || tag.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon icon="solar:user-linear" className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[14px] leading-[20px] font-normal text-black font-[family-name:var(--font-poppins)]">
                        {tag.full_name || tag.name}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <DropdownMenu onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "p-1 rounded-full transition-colors outline-none",
                isMenuOpen ? "bg-[#EEF2FF] text-[#6366F1]" : "text-foreground"
              )}>
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-[24px] h-[24px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[180px] p-2 bg-card border border-border rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg"
              align="end"
            >
              <div className="flex flex-col gap-1">
                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">Edit post</span>
                    <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>
                )}

                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={handleTogglePrivacy}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">
                      {localPost.visibility === 'private' ? 'Make public' : 'Make private'}
                    </span>
                    {localPost.visibility === 'private' ? (
                      <Icon icon="hugeicons:view" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    ) : (
                      <Icon icon="hugeicons:view-off-slash" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    )}
                  </DropdownMenuItem>
                )}

                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(localPost.id)}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-500 rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">Delete post</span>
                    <Icon icon="hugeicons:delete-02" className="w-6 h-6 text-red-500" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section (Frame 2608605) */}
      <div className="w-full flex flex-col gap-[8px] mb-2 px-4">
        {/* Text Content (Frame 2608573) */}
        <Link
          href={`/post/${localPost.id}`}
          className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] truncate h-[20px] cursor-pointer"
        >
          {localPost.content}
        </Link>
        {/* Metadata (Frame 2608604) */}
        <div className="flex items-center gap-1 h-[16px]">
          <span className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] flex-none">
            {localPost.location || "Kolhapur"}
          </span>
          <div className="w-[6px] h-[6px] rounded-full bg-[#DADADA] flex-none" />
          <span className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)]">
            {localPost.timeAgo || "6 days ago"}
          </span>
        </div>
      </div>

      {/* Main Image/Shared Content (Rectangle 14) */}
      <div className="w-full h-[300px] mb-2 bg-muted relative overflow-hidden">
        {localPost.shared_post ? (
          <div className="w-full h-full p-3 bg-card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                <img src={localPost.shared_post.authorAvatar || "/assets/pngegg.png"} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-medium truncate">{localPost.shared_post.author}</span>
            </div>
            <p className="text-[10px] line-clamp-2 mb-2 flex-grow">{localPost.shared_post.content}</p>
            {(localPost.shared_post.images?.length || localPost.shared_post.imageSrc) && (
              <div className="h-[180px] w-full rounded-lg overflow-hidden">
                <img src={localPost.shared_post.imageSrc || localPost.shared_post.images?.[0] || ''} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            {localPost.images && localPost.images.length > 1 ? (
              <PostCarousel images={localPost.images} />
            ) : (
              <img
                src={image || "/assets/placeholder.png"}
                alt="Content"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </div>

      {/* Liked by Section (Frame 2608622) */}
      <div className="w-full h-[20px] px-4 mb-2 flex items-center">
        <p className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)] truncate">
          Liked by <span className="font-medium">Jhon</span> and others
        </p>
      </div>

      {/* Interaction Footer (Frame 2608574) */}
      <div className="w-full h-[40px] px-4 py-2 mt-auto border-t border-border">
        {/* Frame 2608620 */}
        <div className="flex items-center justify-between gap-1 h-[24px]">
          <button onClick={handleLike} className="flex items-center gap-1 min-w-0 flex-shrink-0">
            <Icon icon={isLiked ? "solar:like-bold" : "solar:like-broken"} className={cn("w-5 h-5", isLiked ? "text-[#6366F1]" : "text-foreground")} />
            <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{likesCount}</span>
          </button>
          <Link href={`/post/${localPost.id}?comments=true`} className="flex items-center gap-1 min-w-0 flex-shrink-0">
            <Icon icon="hugeicons:comment-01" className="w-5 h-5 text-foreground" />
            <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{localPost.comments || 0}</span>
          </Link>
          <button onClick={handleRepost} className="flex items-center gap-1 min-w-0 flex-shrink-0">
            <Icon icon="hugeicons:repost" className="w-5 h-5 text-foreground" />
            <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{localPost.shares || 0}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 min-w-0 flex-shrink-0">
            <Icon icon="fluent:share-16-regular" className="w-5 h-5 text-foreground" />
            <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">3</span>
          </button>
          <button onClick={handleBookmark} className="flex-shrink-0">
            <Icon
              icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
              className={cn("w-5 h-5", isSaved ? "text-[#6366F1]" : "text-foreground")}
            />
          </button>
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
        onSuccess={(updated) => setLocalPost(updated)}
      />
    </div>
  );
};

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
  const [isExperienceExpanded, setIsExperienceExpanded] = useState(false);
  const [isEducationExpanded, setIsEducationExpanded] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");
  const [isSavingExperience, setIsSavingExperience] = useState(false);

  const [editingExperiences, setEditingExperiences] = useState<Experience[] | null>(null);
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
  const [isPostsExpanded, setIsPostsExpanded] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const { logout } = useAuth();

  const experiences = useMemo(() => profileData?.experiences || [], [profileData]);

  // Flat list sorted descending by start_date — used for display, LivingResume, SkillProofPill, and cross-session validation
  const flatExperiences = useMemo(
    () =>
      experiences
        .flatMap((g) => g.experiences)
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
    [experiences]
  );
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
      
      // Deduplicate new skills case-insensitively to prevent any accidental duplicates
      const uniqueNewSkills: string[] = [];
      for (const skill of normalizedNewSkills) {
        if (!uniqueNewSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          uniqueNewSkills.push(skill);
        }
      }

      const currentSkillNames = skills.map(s => s.name);

      const skillsToAdd = uniqueNewSkills.filter(newSkill =>
        !currentSkillNames.some(curr => curr.toLowerCase() === newSkill.toLowerCase())
      );

      const skillsToRemove = skills.filter(curr =>
        !uniqueNewSkills.some(newSkill => newSkill.toLowerCase() === curr.name.toLowerCase())
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

  const handleSaveExperience = async (roles: SavedRole[], deletedIds: string[] = []) => {
    setIsSavingExperience(true)
    try {
      const operations: any[] = []

      // ── Handle Explicit Deletions ─────────────────────
      for (const id of deletedIds) {
        operations.push({ type: 'DELETE', id })
      }

      const updateMap = new Map<string, any>()
      const createOps: any[] = []

      console.log("[Batch Save] Constructing operations for batch update...", { roles, deletedIds });

      for (const role of roles) {
        // Prepare the base data for the operation
        const data = {
          title: role.title,
          company_name: role.company_name,
          location: role.location,
          work_type: role.work_type,
          work_mode: role.work_mode,
          start_date: role.start_date,
          end_date: role.end_date,
          is_current: role.is_current,
          description: role.description ?? null,
          org_id: role.org_id || null, // Ensure empty string becomes null
        }

        if (role.experience_id) {
          // ── Editing an existing role ─────────────────────
          const existing = updateMap.get(role.experience_id) || {}
          updateMap.set(role.experience_id, { ...existing, ...data })
        } else {
          // ── Adding a new role ────────────────────────────
          // Generate a tempId for optimistic cache mapping
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          createOps.push({
            type: 'CREATE',
            tempId,
            data
          })
        }

        // ── Handle atomic role termination ───────────────
        // If this role was set to end a previous one, add an extra update operation
        if (role.shouldEndPreviousRole && role.experienceIdToEnd) {
          console.log(`[Batch Save] Queuing termination for role ID: ${role.experienceIdToEnd}`);
          const existing = updateMap.get(role.experienceIdToEnd) || {}
          updateMap.set(role.experienceIdToEnd, {
            ...existing,
            is_current: false,
            end_date: role.start_date
          })
        }
      }

      // Finalize operations array from map
      for (const [id, data] of updateMap.entries()) {
        operations.push({ type: 'UPDATE', id, data })
      }
      operations.push(...createOps)


      console.log("[Batch Save] Executing batch update with operations:", operations);

      // Execute the unified atomic batch update
      const result = await expMutations.batchUpdate.mutateAsync({
        operations,
        version: profileData?.user?.version ?? 0
      })

      console.log("[Batch Save] Batch update successful:", result);

      setIsAddExperienceModalOpen(false)
      setEditingExperiences(null)
      // Success toast is handled by the useExperienceMutations.batchUpdate hook
    } catch (err: any) {
      // Error toast is handled by the useExperienceMutations.batchUpdate hook
      console.error("Failed to save experience batch:", err)
      throw err
    } finally {
      setIsSavingExperience(false)
    }
  }

  const handleDeleteExperience = async (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    if (ids.length === 0) return;

    if (ids.length === 1) {
      await expMutations.remove.mutateAsync(ids[0]);
    } else {
      await expMutations.batchUpdate.mutateAsync({
        requestId: crypto.randomUUID(),
        operations: ids.map(id => ({ type: 'DELETE', id })),
        version: profileData?.user?.version ?? 0
      });
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperiences(null);
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
  const latestExperience = flatExperiences[0] || null;

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
    <div className="min-h-screen bg-card">
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
              <div className="flex items-start justify-between -mt-[49px] md:-mt-[49px]">
                <div className="relative group ml-[12px] md:ml-[34px]">
                  <div className="w-[98px] h-[98px] relative cursor-pointer" onClick={() => setIsViewAvatarOpen(true)}>
                    {/* Top Half Border Only */}
                    <div className="absolute inset-0 rounded-full border-4 border-white shadow-sm [mask-image:linear-gradient(to_bottom,black_50%,transparent_50%)]" />

                    {/* Avatar Logo */}
                    <div className="absolute inset-[4px] rounded-full overflow-hidden bg-card">
                      <img
                        src={profileData?.user?.avatar || "/assets/avatar.png"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditAvatarOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10"
                    aria-label="Edit Profile Picture"
                  >
                    <div className="w-[28px] h-[28px] md:w-[36px] md:h-[36px] rounded-full bg-[#6366F1] flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-white" style={{ strokeWidth: '1.5px' }} />
                    </div>
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

              {/* Desktop Stats Section — 960 Fill × 90 Hug */}
              <div className="hidden md:flex w-full h-[90px] items-center pt-[16px] pr-[16px] pb-[16px] pl-[40px] mt-[16px] mb-0">
                <div className="flex gap-[16px] items-center w-full">
                  <button
                    onClick={() => openFollowList("following")}
                    className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                    style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                  >
                    <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Following</span>
                    <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                  </button>
                  <button
                    onClick={() => openFollowList("followers")}
                    className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                    style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                  >
                    <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Followers</span>
                    <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                  </button>
                  <button
                    onClick={() => openFollowList("connections")}
                    className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                    style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                  >
                    <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Connection</span>
                    <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                  </button>
                </div>
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
                        <div className="flex items-center gap-[10px] px-[16px] py-[8px] bg-primary-tint rounded-[24px] border border-primary/20 flex-shrink-0 w-fit h-[36px]">
                          <Icon icon="solar:buildings-linear" className="w-5 h-5 text-primary-tint-foreground" />
                          <span className="text-[12px] font-normal text-primary-tint-foreground leading-[16px] font-[family-name:var(--font-poppins)] whitespace-nowrap">
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

                <div className="flex flex-col gap-2 mb-4">
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
                        <div className={cn(
                          "w-[56px] h-[40px] rounded-[24px] flex items-center justify-center flex-shrink-0 overflow-hidden",
                          (latestExperience.logo_url || (latestExperience as any).company_logo) ? "bg-secondary" : "bg-[#E0E7FF] px-[16px] py-[8px]"
                        )}>
                          {latestExperience.logo_url || (latestExperience as any).company_logo ? (
                            <img
                              src={latestExperience.logo_url || (latestExperience as any).company_logo}
                              alt={latestExperience.company_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Icon icon="hugeicons:job-search" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                          )}
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
                        <div className={cn(
                          "w-[56px] h-[40px] rounded-[24px] flex items-center justify-center flex-shrink-0 overflow-hidden",
                          (latestEducation as any).school_logo ? "bg-secondary" : "bg-[#E0E7FF] px-[16px] py-[8px]"
                        )}>
                          {(latestEducation as any).school_logo ? (
                            <img
                              src={(latestEducation as any).school_logo}
                              alt="School Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Icon icon="qlementine-icons:education-24" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                          )}
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
                      <button className="flex items-center justify-center w-6 h-6 text-foreground data-[state=open]:text-primary-tint-foreground data-[state=open]:bg-primary-tint outline-none border-none focus:outline-none rounded-full transition-colors">
                        <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      alignOffset={0}
                      className="w-[180px] h-[136px] !rounded-tl-[24px] !rounded-tr-none !rounded-br-[24px] !rounded-bl-[24px] border border-[#C7D2FE] p-[8px] bg-card flex flex-col gap-1"
                    >
                      <DropdownMenuItem
                        onClick={() => setIsEditProfileModalOpen(true)}
                        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-primary-tint-foreground">Edit profile</span>
                        <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-foreground group-focus:text-primary-tint-foreground transition-colors" style={{ strokeWidth: '1.5px' }} />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share profile</span>
                        <Icon icon="fluent:share-16-regular" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Profile link copied");
                        }}
                        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Copy profile</span>
                        <Icon icon="solar:copy-outline" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
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
                    className="absolute bottom-0 right-0 bg-card pl-2 text-muted-foreground hover:text-primary font-normal text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] transition-colors"
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
                experiences={flatExperiences}
                skills={skills.map(s => s.name)}
                resumeName={profileData?.resume?.originalName}
                resumeUrl={profileData?.resume?.url}
              />
            </div>

            {/* Posts Section */}
            <div
              className="w-full md:w-[960px] mx-auto bg-transparent mt-[16px] transition-all duration-500 ease-in-out overflow-hidden"
              style={{ minHeight: '564px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pt-4 pb-4 px-4 md:px-10">
                <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Post</h2>
                {previewPosts.length > 3 && (
                  <button
                    onClick={() => router.push(`/profile/${user?.account_name || user?.id}/posts`)}
                    className="w-[78px] h-[36px] flex items-center justify-center px-4 py-2 border border-primary rounded-[24px] bg-card text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-primary whitespace-nowrap hover:bg-secondary transition-all duration-200"
                  >
                    See all
                  </button>
                )}
              </div>

              <div className="px-4 md:pl-10 md:pr-4 flex flex-row md:flex-row gap-4 md:gap-[24px] overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {previewPosts.slice(0, 3).map((post, index) => (
                  <div
                    key={`${post.id || 'post'}-${index}`}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both flex-shrink-0"
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
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-card-inner border border-card-border-inner transition-all duration-500 ease-in-out overflow-hidden"
            >
              <div className="pt-[16px] pb-[40px] flex flex-col gap-[32px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-10">
                  <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Skills</h2>
                  <button
                    onClick={() => setIsAddSkillModalOpen(true)}
                    className="add-button-chip"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Skills Nested Card Wrapper */}
                <div className="px-4 md:px-10">
                  <div className="bg-card rounded-[24px] shadow-card-inner border border-card-border-inner min-h-[100px] flex items-center p-8">
                    <div className="flex flex-wrap gap-[16px]">
                      {skills.map((skill: any, index) => {
                        const skillName = skill.name || (typeof skill === 'string' ? skill : '');
                        if (!skillName) return null;
                        return (
                          <SkillProofPill
                            key={`${skill.skill_id || 'skill'}-${index}`}
                            skill={skillName}
                            experiences={flatExperiences}
                            posts={previewPosts}
                            onDelete={handleDeleteSkill}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <div
              id="experience-section"
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-card-inner border border-card-border-inner transition-all duration-500 ease-in-out overflow-hidden"
            >
              <div className="pt-[16px] pb-[40px] flex flex-col gap-[32px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-10">
                  <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Experience</h2>
                  <button
                    onClick={() => { setEditingExperiences(null); setIsAddExperienceModalOpen(true); }}
                    className="add-button-chip"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Experience Nested Card Wrapper */}
                <div className="px-4 md:px-10">
                  <div className="bg-card rounded-[24px] shadow-card-inner border border-card-border-inner min-h-[72px] pl-[40px] py-8 pr-6">
                    <div className="flex flex-col gap-[16px]">
                      {(isExperienceExpanded ? experiences : experiences.slice(0, 2)).map((group, gIdx) => (
                        <EditableExperienceGroup
                          key={`${group.company_name}-${gIdx}`}
                          group={group}
                          onEdit={() => {
                            setEditingExperiences(group.experiences);
                            setIsAddExperienceModalOpen(true);
                          }}
                        />
                      ))}
                    </div>

                    {experiences.length > 2 && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => setIsExperienceExpanded(!isExperienceExpanded)}
                          className="w-[86px] h-[24px] flex items-center justify-center text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-primary transition-all flex-none"
                        >
                          {isExperienceExpanded ? "View less" : "View more"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div
              id="education-section"
              className="w-full md:w-[960px] mx-auto bg-card mt-[16px] md:rounded-[24px] shadow-card-inner border border-card-border-inner transition-all duration-500 ease-in-out overflow-hidden"
            >
              <div className="pt-[16px] pb-[40px] flex flex-col gap-[32px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-10">
                  <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Education</h2>
                  <button
                    onClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }}
                    className="add-button-chip"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Education Nested Card Wrapper */}
                <div className="px-4 md:px-10">
                  <div className="bg-card rounded-[24px] shadow-card-inner border border-card-border-inner min-h-[72px] pl-[40px] py-8 pr-6">
                    <div className="flex flex-col gap-[16px]">
                      {(isEducationExpanded ? educations : educations.slice(0, 2)).map((edu, index) => (
                        <EditableEducationItem
                          key={`${edu.education_id}-${index}`}
                          education={edu}
                          onEdit={() => { setEditingEducation(edu); setIsAddEducationModalOpen(true); }}
                        />
                      ))}
                    </div>

                    {educations.length > 2 && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => setIsEducationExpanded(!isEducationExpanded)}
                          className="w-[86px] h-[24px] flex items-center justify-center text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-primary transition-all flex-none"
                        >
                          {isEducationExpanded ? "View less" : "View more"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
        initialSkills={skills?.map(s => s.name) || []}
        onSave={handleSaveSkills}
        loading={isSavingSkills}
      />

      <Dialog open={isAddExperienceModalOpen} onOpenChange={setIsAddExperienceModalOpen}>
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
          <DialogTitle className="sr-only">Add Experience</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add or edit experience records on your profile.</DialogDescription>
          <AddExperienceForm
            onSave={handleSaveExperience}
            onCancel={() => {
              setIsAddExperienceModalOpen(false);
              setEditingExperiences(null);
            }}
            initialExperiences={editingExperiences || undefined}
            onDelete={(ids) => {
              handleDeleteExperience(ids);
            }}
            companyName={editingExperiences?.[0]?.company_name}
            isSaving={isSavingExperience}
            existingExperiences={flatExperiences}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEducationModalOpen} onOpenChange={setIsAddEducationModalOpen}>
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
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
