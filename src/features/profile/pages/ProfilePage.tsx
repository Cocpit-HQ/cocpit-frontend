"use client"
import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { PostCarousel } from "@/components/shared/PostCarousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useAuth } from "@/hooks/use-auth"
import { useFeed } from "@/hooks/use-feed"
import { useIsMobile } from "@/hooks/use-mobile"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel"
import { TaggedPeoplePopover } from "@/shared/commonComponents/TaggedPeoplePopover"
import type { Education, Experience, Post } from "@/types/entities"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { LivingResume } from "../commonProfileComponents/LivingResume"
import { ProfileSkeleton } from "../commonProfileComponents/ProfileSkeleton"
import { ViewAvatarModal } from "../commonProfileComponents/ViewAvatarModal"
import AddEducationForm from "../components/AddEducationForm"
import AddExperienceForm, { type SavedRole } from "../components/AddExperienceForm"
import { CommentModal } from "../components/CommentModal"
import { CompanyRoleModal } from "../components/CompanyRoleModal"
import { ContactInfoModal } from "../components/ContactInfoModal"
import { EditAvatarModal } from "../components/EditAvatarModal"
import { EditPostModal } from "../components/EditPostModal"
import { FollowListModal } from "../components/FollowListModal"
import { SkillModal } from "../components/SkillModal"
import { deletePost as apiDeletePost, createRepost, getFollowing, getProfileStats, getUserPosts, toggleLike, toggleSavePost, updatePost } from "../services/profile.service"
import { ProfileIdentity } from "../types/profile.types"

import { ProfileAbout } from "../commonProfileComponents/ProfileAbout"
import { ProfileEducation } from "../commonProfileComponents/ProfileEducation"
import { ProfileExperience } from "../commonProfileComponents/ProfileExperience"
import { ProfileHeader } from "../commonProfileComponents/ProfileHeader"
import { ProfilePosts } from "../commonProfileComponents/ProfilePosts"
import { ProfileSkills } from "../commonProfileComponents/ProfileSkills"

import { useAvatarMutations, useEducationMutations, useExperienceMutations, useMyProfile, useProfileMutation, useSkillMutations } from "@/hooks/use-my-profile"
import { EditProfileModal } from "../components/EditProfileModal"
const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

const mergeProfilePostState = (current: Post, incoming: Post): Post => ({
  ...current,
  ...incoming,
  author: incoming.author || current.author,
  authorId: incoming.authorId || current.authorId,
  authorAvatar: incoming.authorAvatar || current.authorAvatar,
  title: incoming.title || current.title,
  timeAgo: incoming.timeAgo || current.timeAgo,
  category: incoming.category || current.category,
  location: incoming.location ?? current.location,
  tags: incoming.tags ?? current.tags,
  shared_post: incoming.shared_post ?? current.shared_post,
});

const ProfilePostCard = ({ post, isOwnPost, onDelete, onToggleVisibility, onUpdate }: { post: Post, isOwnPost?: boolean, onDelete?: (id: string) => void, onToggleVisibility?: (id: string) => void, onUpdate?: (post: Post) => void }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setLocalPost(post);
    setIsLiked(post.isLiked || false);
    setLikesCount(Number(post.likes) || 0);
    setIsSaved(post.is_saved || false);
  }, [post]);

  const image = localPost.imageSrc || (localPost.images && localPost.images.length > 0 ? localPost.images[0] : null);
  const videoSrc = localPost.videoSrc || null;
  const isArticlePost = localPost.category === 'Article' || Boolean(localPost.articleBody);
  const isPollPost = Boolean(localPost.poll);
  const articleExcerpt = localPost.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const pollQuestion = articleExcerpt || localPost.title || "Untitled poll";
  const pollOptions = localPost.poll?.options?.slice(0, 4) || [];

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
    if (!isSaved) {
      setIsSaveModalOpen(true);
      return;
    }

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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleTogglePrivacy = async () => {
    const newVisibility = localPost.visibility === 'private' ? 'public' : 'private';
    try {
      const updated = await updatePost(localPost.id, { visibility: newVisibility });
      const mergedPost = mergeProfilePostState(localPost, mapProfilePostToPost(updated));
      setLocalPost(mergedPost);
      onUpdate?.(mergedPost);
      onToggleVisibility?.(localPost.id);
      toast.success(`Post is now ${newVisibility}`);
    } catch (err) {
      toast.error("Failed to update privacy");
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0">
      {/* Header section (Frame 2608569) */}
      <div className="w-full h-[40px] flex items-center justify-between px-4 z-10 mb-4">
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
            <Link href={`/post/${localPost.id}`} className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] truncate block w-full cursor-pointer" title={localPost.authorHeadline || localPost.title || ""}>
              {localPost.authorHeadline || localPost.title || ""}
            </Link>
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] mt-0.5">
              <span>{localPost.location || "Kolhapur"}</span>
              <span className="w-1 h-1 rounded-full bg-[#DADADA] flex-none" />
              <span>{localPost.timeAgo || "6 days ago"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          {localPost.tags && localPost.tags.length > 0 && (
            <TaggedPeoplePopover tags={localPost.tags} />
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
              className="w-[180px] p-2 bg-card border border-[#EEF2FF] dark:border-card-border-inner rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg"
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
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-red-50 focus:text-[#FF6B6B] text-[#FF6B6B] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">Delete post</span>
                    <Icon icon="hugeicons:delete-02" className="w-6 h-6 text-[#FF6B6B]" style={{ strokeWidth: '1.5px' }} />
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
        {isArticlePost ? (
          null
        ) : isPollPost ? (
          <Link
            href={`/post/${localPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-2 min-h-[40px] cursor-pointer"
          >
            {pollQuestion}
          </Link>
        ) : (
          <Link
            href={`/post/${localPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] truncate h-[20px] cursor-pointer"
          >
            {localPost.content}
          </Link>
        )}
      </div>

      {/* Main Image/Shared Content (Rectangle 14) */}
      <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
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
        ) : isPollPost ? (
          <Link href={`/post/${localPost.id}`} className="block w-full h-full p-4 bg-[#F8FAFF]">
            <div className="w-full h-full rounded-[20px] border border-[#E3E9FF] bg-white p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1]">
                  Poll
                </span>
                <span className="text-[10px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  {localPost.poll?.total_votes || 0} votes
                </span>
              </div>

              <div className="space-y-2.5">
                {pollOptions.map((option, index) => (
                  <div
                    key={option.option_id || `${option.option_text}-${index}`}
                    className="rounded-[14px] border border-[#E8ECFF] bg-[#F8FAFF] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] leading-[18px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-1">
                        {option.option_text}
                      </span>
                      <span className="text-[11px] leading-[16px] text-[#6366F1] font-medium font-[family-name:var(--font-poppins)] flex-shrink-0">
                        {option.vote_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {localPost.poll && localPost.poll.options.length > pollOptions.length && (
                <div className="mt-auto pt-3 text-[11px] leading-[16px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  +{localPost.poll.options.length - pollOptions.length} more option{localPost.poll.options.length - pollOptions.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </Link>
        ) : isArticlePost ? (
          <Link href={`/post/${localPost.id}`} className="block w-full h-full relative">
            {image ? (
              <img
                src={image}
                alt={localPost.title || "Article cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#DDE5FF] flex items-center justify-center px-6 text-center">
                <span className="text-[16px] leading-[24px] text-[#6366F1] font-semibold font-[family-name:var(--font-poppins)] line-clamp-3">
                  {localPost.title || "Untitled Article"}
                </span>
              </div>
            )}
          </Link>
        ) : videoSrc ? (
          <Link href={`/post/${localPost.id}`} className="block w-full h-full bg-black">
            <video
              src={videoSrc}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          </Link>
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

      {isArticlePost && (
        <div className="w-full px-4 mb-3">
          <Link href={`/post/${localPost.id}`} className="block">
            <h3 className="text-[14px] leading-[20px] text-foreground font-semibold font-[family-name:var(--font-poppins)] line-clamp-2">
              {localPost.title || "Untitled Article"}
            </h3>
          </Link>
        </div>
      )}

      {/* Liked by Section (Frame 2608622) */}
      {likesCount > 0 && (
        <div className="w-full h-[20px] px-4 mb-4 flex items-center">
          <p className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)] truncate">
            Liked by {isLiked ? (
              likesCount === 1 ? (
                'you'
              ) : (
                <>
                  you and {likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}
                </>
              )
            ) : (
              likesCount === 1 ? (
                <span>@{localPost.sampleLikerUsername || 'someone'}</span>
              ) : (
                <>
                  <span>@{localPost.sampleLikerUsername || 'someone'}</span> and {likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}
                </>
              )
            )}
          </p>
        </div>
      )}

      {/* Interaction Footer (Frame 2608574) */}
      <div className="w-full h-[40px] px-4 py-2 mt-auto border-t border-transparent">
        {/* Frame 2608620 */}
        <div className="flex items-center justify-between w-full h-[24px]">
          <div className="flex items-center gap-[16px]">
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
            <button onClick={handleShare} className="flex items-center min-w-0 flex-shrink-0">
              <Icon icon="fluent:share-16-regular" className="w-5 h-5 text-foreground" />
            </button>
          </div>
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
        onSuccess={(updated) => {
          const mergedPost = mergeProfilePostState(localPost, updated);
          setLocalPost(mergedPost);
          onUpdate?.(mergedPost);
        }}
      />

      {isSaveModalOpen && (
        <SavePostModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          postId={localPost.id}
          onSaved={(saved) => {
            setIsSaved(saved);
            setIsSaveModalOpen(false);
          }}
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={localPost.id}
          onShare={() => {
            setLocalPost(prev => ({
              ...prev,
              shares: (Number(prev.shares) || 0) + 1 + ""
            }));
          }}
        />
      )}
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
    setPreviewPosts(prev => prev.filter(post => post.id !== id));
    togglePostVisibility(id);
  }, [togglePostVisibility]);

  const handleUpdatePreviewPost = useCallback((updatedPost: Post) => {
    setPreviewPosts(prev =>
      prev.map(post =>
        post.id === updatedPost.id ? mergeProfilePostState(post, updatedPost) : post
      )
    );
  }, []);

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    availability: (user?.availability as any) || "Immediately",
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
      <div className="w-full md:max-w-[998px] mx-auto pt-0 md:pt-8 pb-[100px] md:pb-12 px-0 md:px-4 xl:px-0">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div id="profile-card" className="overflow-hidden relative bg-card md:rounded-[24px] rounded-none border-none outline-none pb-8 md:pb-0">

            <ProfileHeader
              user={user}
              isOwnProfile={true}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              profileStats={profileStats}
              latestExperience={latestExperience}
              latestEducation={latestEducation}
              onAvatarClick={() => isMobile ? setIsEditAvatarOpen(true) : setIsViewAvatarOpen(true)}
              onEditAvatarClick={() => setIsEditAvatarOpen(true)}
              onContactInfoClick={() => setIsContactInfoModalOpen(true)}
              onEditProfileClick={() => setIsEditProfileModalOpen(true)}
              onShareProfileClick={() => setIsShareModalOpen(true)}
              onFollowListClick={openFollowList}
              onLogout={handleLogout}
              onRoleClick={handleRoleClick}
              scrollToExperience={scrollToExperience}
              scrollToEducation={scrollToEducation}
            />

            <ProfileAbout
              aboutText={user?.about}
              isOwnProfile={true}
            />

            <LivingResume
              experiences={flatExperiences}
              skills={skills.map(s => s.name)}
              resumeName={profileData?.resume?.originalName}
              resumeUrl={profileData?.resume?.url}
              isOwnProfile={true}
            />

            <ProfilePosts
              posts={previewPosts}
              isOwnProfile={true}
              isCompany={isCompany}
              profileSlug={user?.account_name || user?.id || ""}
              userName={user?.name || ""}
              onDeletePost={handleDeletePost}
              onToggleVisibility={handleToggleVisibility}
              onUpdatePost={handleUpdatePreviewPost}
              onCreateClick={() => router.push("/create-post")}
            />

            <ProfileSkills
              skills={skills}
              experiences={flatExperiences}
              posts={previewPosts}
              isOwnProfile={true}
              onAddSkillClick={() => setIsAddSkillModalOpen(true)}
              onDeleteSkill={handleDeleteSkill}
            />

            <ProfileExperience
              experiences={experiences}
              isOwnProfile={true}
              onAddExperienceClick={() => { setEditingExperiences(null); setIsAddExperienceModalOpen(true); }}
              onEditExperienceClick={(exps) => {
                setEditingExperiences(exps);
                setIsAddExperienceModalOpen(true);
              }}
            />

            <ProfileEducation
              educations={educations}
              isOwnProfile={true}
              onAddEducationClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }}
              onEditEducationClick={(edu) => {
                setEditingEducation(edu);
                setIsAddEducationModalOpen(true);
              }}
            />

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
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full sm:rounded-[24px] outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">
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
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full sm:rounded-[24px] outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Add Education</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add a new education record to your profile.</DialogDescription>
          <AddEducationForm
            onSave={handleSaveEducation}
            onCancel={() => setIsAddEducationModalOpen(false)}
            initialData={editingEducation}
            existingEducations={educations}
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
        portalContainerId="profile-card"
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

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={user?.id}
        onShare={(selectedIds) => {
          console.log("Shared profile with:", selectedIds);
          setIsShareModalOpen(false);
        }}
      />
    </div>
  )
}
