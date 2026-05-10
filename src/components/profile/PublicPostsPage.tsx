"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Share,
  Bookmark,
  ChevronLeft,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Lock,
  Trash2,
  Search,
  EyeOff,
  Eye,
  Globe
} from "lucide-react"
import { getPublicProfilePosts } from "@/services/api/public-profile"
import { Icon } from "@iconify/react"
import { getUserPosts } from "@/services/api/profile"
import { toggleSavePost } from "@/services/api/savedPost"
import { toggleLike, updatePost, deletePost } from "@/services/api/posts"
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import { Post } from "@/types/entities"
import Image from "next/image"
import { useMyProfile } from "@/hooks/use-my-profile"
import { EditPostModal } from "./parts/EditPostModal"
import { PostCarousel } from "@/components/shared/PostCarousel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
const CommentSection = dynamic(() => import('@/features/feed/components/comments/CommentSection'), { ssr: false });

interface PublicPostsPageProps {
  userId: string;
}

const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-center px-4 py-2 h-10 rounded-[24px] transition-all whitespace-nowrap",
      active
        ? "bg-[#EEF2FF] border border-[#EEF2FF]"
        : "bg-white border border-[#818CF8]"
    )}
  >
    <span className={cn(
      "font-[family-name:var(--font-roboto)] font-medium text-[14px]",
      active ? "text-[#6366F1]" : "text-[#818CF8]"
    )}>
      {label}
    </span>
  </button>
)

const PublicPostCard = ({ post, onLike, onSave, onTogglePrivacy, onDelete, onEdit, currentUser, activeTab }: {
  post: Post,
  onLike?: () => void,
  onSave?: () => void,
  onTogglePrivacy?: () => void,
  onDelete?: () => void,
  onEdit?: () => void,
  currentUser?: any,
  activeTab?: string
}) => {
  const isOwner = post.authorId === currentUser?.id || post.author === currentUser?.name;
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(parseInt(post.comments) || 0);

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  return (
    <div className="flex flex-col items-start p-4 w-[560px] bg-[#FFFFFFFF] border border-[#EEF2FF] shadow-[0px_0px_4px_rgba(99,102,241,0.05)] rounded-[24px] mb-6 relative">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full h-10 px-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D9D9D9] relative flex-shrink-0">
            <img
              src={post.authorAvatar || "/assets/pngegg.png"}
              alt={post.author}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-poppins)] font-semibold text-[16px] text-black leading-tight">{post.author}</span>
            <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">{post.isCompanyPost ? 'Organization' : 'designer'}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-black cursor-pointer p-1 rounded-full transition-colors outline-none">
              <MoreVertical size={24} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "rounded-[24px_0px_24px_24px] border border-[#C7D2FE] p-2 bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)]",
              activeTab === 'Save' ? "w-[206px]" : "w-[180px]"
            )}
          >
            {activeTab === 'Save' ? (
              <>
                <DropdownMenuItem className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-white">
                  <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Unfollow</span>
                  <Icon icon="fluent:dismiss-24-regular" width="24" height="24" className="text-black flex-none" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-white">
                  <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Report post</span>
                  <Icon icon="fluent:info-24-regular" width="24" height="24" className="text-black flex-none" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-white">
                  <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Hide post</span>
                  <Icon icon="fluent:eye-hide-24-regular" width="24" height="24" className="text-black flex-none" />
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                  className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-white"
                >
                  <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Edit post</span>
                  <Icon icon="fluent:edit-24-regular" width="24" height="24" className="text-black" />
                </DropdownMenuItem>

                {!post.shared_post && activeTab !== 'Like' && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onTogglePrivacy?.(); }}
                    className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-white"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">
                      {post.visibility === 'private' ? 'Make public' : 'Make private'}
                    </span>
                    {post.visibility === 'private' ? (
                      <Icon icon="fluent:eye-24-regular" width="24" height="24" className="text-black" />
                    ) : (
                      <Icon icon="fluent:eye-hide-24-regular" width="24" height="24" className="text-black" />
                    )}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none group/delete data-[highlighted]:bg-white"
                >
                  <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-[#FF6B6B]">Delete post</span>
                  <Icon icon="fluent:delete-24-regular" width="24" height="24" className="text-[#FF6B6B]" />
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full mt-4">
        <div className="px-0 mb-2">
          <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-black">
            {post.content}
          </p>
        </div>

        <div className="flex items-center px-0 gap-2 mb-4">
          <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">{post.location || 'Kolhapur'}</span>
          <span className="text-[#6B7280]">•</span>
          <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">{post.timeAgo || '6 days ago'}</span>
        </div>

        {/* Shared Post Content */}
        {post.shared_post && (
          <div className="w-full border border-[#EEF2FF] rounded-[16px] p-3 mt-2 mb-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D9D9D9] relative flex-shrink-0">
                <img
                  src={post.shared_post.authorAvatar || "/assets/pngegg.png"}
                  alt={post.shared_post.author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] text-black truncate max-w-[200px]">
                  {post.shared_post.author}
                </span>
                <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">
                  {(post.shared_post as any).authorTitle || 'Member'}
                </span>
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-black line-clamp-3">
              {post.shared_post.content}
            </p>
            {(post.shared_post.images && post.shared_post.images.length > 0 || post.shared_post.imageSrc) && (
              <div className="mt-3 rounded-lg overflow-hidden h-40 relative bg-slate-50">
                {post.shared_post.images && post.shared_post.images.length > 1 ? (
                  <PostCarousel images={post.shared_post.images} />
                ) : (
                  <Image src={post.shared_post.imageSrc || post.shared_post.images?.[0] || ''} alt="Shared content" fill className="object-cover" />
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">{(post.shared_post as any).location || 'Kolhapur'}</span>
              <span className="text-[#6B7280]">•</span>
              <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">{post.shared_post.timeAgo || '6 days ago'}</span>
            </div>
          </div>
        )}

        {!post.shared_post && (post.images && post.images.length > 0 || post.imageSrc) && (
          <div className="w-full h-[501px] relative mx-auto rounded-lg overflow-hidden border border-[#EEF2FF] mb-4 bg-slate-50">
            {post.images && post.images.length > 1 ? (
              <PostCarousel images={post.images} />
            ) : (
              <Image src={post.imageSrc || post.images?.[0] || ''} alt="Post content" fill className="object-cover" />
            )}
          </div>
        )}

        <div className="pt-3 px-0 mb-4 border-t border-[#EEF2FF]">
          <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-black">
            Liked by <span className="font-semibold">Jhon</span> and <span className="font-semibold">others</span>
          </p>
        </div>

        {/* Interaction Bar */}
        <div className="flex justify-between items-center px-0 w-full h-10">
          <div className="flex items-center gap-4">
            <div
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <ThumbsUp
                size={20}
                strokeWidth={1.5}
                className={cn(
                  "transition-all",
                  post.isLiked ? "text-[#6366F1] fill-[#6366F1]" : "text-[#000000] group-hover:text-[#6366F1]"
                )}
              />
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-[#000000]">{post.likes || 0}</span>
            </div>
            <div
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <Icon
                icon="hugeicons:comment-01"
                width="20"
                height="20"
                className={cn(
                  "transition-all",
                  showComments ? "text-[#6366F1]" : "text-[#000000] group-hover:text-[#6366F1]"
                )}
              />
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-[#000000]">{commentsCount}</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <Icon icon="hugeicons:repost" width="20" height="20" className={cn("transition-all", post.shared_post ? "text-[#6366F1]" : "text-[#000000] group-hover:text-[#6366F1]")} />
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-[#000000]">{post.shares || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <Icon icon="fluent:share-16-regular" width="20" height="20" className="text-[#000000] group-hover:text-[#6366F1] transition-all" />
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-[#000000]">0</span>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className="cursor-pointer group"
          >
            <Icon
              icon={post.is_saved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
              width="22"
              height="22"
              className={cn(
                "transition-all",
                post.is_saved ? "text-[#6366F1]" : "text-[#000000] group-hover:text-[#6366F1]"
              )}
            />
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="w-full mt-4 border-t border-[#EEF2FF] pt-4">
            <CommentSection
              postId={post.id}
              incrementCommentCount={() => setCommentsCount(prev => prev + 1)}
              decrementCommentCount={() => setCommentsCount(prev => prev - 1)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PublicPostsPage({ userId }: PublicPostsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'Post' | 'Repost' | 'Like' | 'Comments' | 'Private post' | 'Save'>('Post')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const { data: profileData, isLoading: isProfileLoading } = useMyProfile()

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, isLiked: result.liked, likes: result.likeCount } : p
      ));
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleToggleSave = async (postId: string) => {
    try {
      const result = await toggleSavePost(postId);
      setPosts(prev => {
        const updated = prev.map(p =>
          p.id === postId ? { ...p, is_saved: result.saved } : p
        );
        // If we are on the Save tab and it was unsaved, remove it from list
        if (activeTab === 'Save' && !result.saved) {
          return updated.filter(p => p.id !== postId);
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to toggle save:", error);
    }
  };

  const handleTogglePrivacy = async (postId: string, currentVisibility: string) => {
    try {
      const newVisibility = currentVisibility === 'private' ? 'public' : 'private';
      await updatePost(postId, { visibility: newVisibility });
      setPosts(prev => {
        const updated = prev.map(p =>
          p.id === postId ? { ...p, visibility: newVisibility as any } : p
        );
        // If visibility changed, it might need to be removed from the current tab
        if (activeTab === 'Private post' && newVisibility === 'public') {
          return updated.filter(p => p.id !== postId);
        }
        if (activeTab === 'Post' && newVisibility === 'private') {
          return updated.filter(p => p.id !== postId);
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to toggle privacy:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      // Don't fetch if we're still loading profile data
      if (isProfileLoading) return;

      setLoading(true)
      try {
        const currentUser = profileData?.user;
        const normalizedUserId = String(userId).toLowerCase();
        const isOwner = currentUser && (
          normalizedUserId === String(currentUser.id).toLowerCase() ||
          normalizedUserId === String(currentUser.account_name).toLowerCase()
        );

        let mappedPosts: Post[] = [];
        if (isOwner) {
          // If owner, use the private 'me' endpoint with explicit filter
          const data = await getUserPosts({ filter: activeTab as any });
          mappedPosts = data.posts.map(mapProfilePostToPost);
        } else {
          // For visitors, use the public endpoint
          const data = await getPublicProfilePosts(userId, activeTab as any);
          mappedPosts = data.posts.map(mapPublicPostToPost);
        }
        // Client-side safeguard: filter by author and tab type
        if (activeTab === 'Post') {
          const targetId = isOwner ? currentUser?.id : userId;
          // In Post tab, only show PUBLIC posts shared by the target user
          mappedPosts = mappedPosts.filter(p => (p.authorId === targetId || p.author === currentUser?.name) && p.visibility !== 'private');
        } else if (activeTab === 'Repost') {
          const targetId = isOwner ? currentUser?.id : userId;
          // In Repost tab, only show posts that ARE reposts (have shared_post) and were shared by the target user
          mappedPosts = mappedPosts.filter(p => p.shared_post && (p.authorId === targetId || p.author === currentUser?.name));
        } else if (activeTab === 'Like') {
          // In Like tab, only show posts the user has liked
          mappedPosts = mappedPosts.filter(p => p.isLiked);
        } else if (activeTab === 'Comments') {
          // In Comments tab, only show posts where the user has actually commented
          mappedPosts = mappedPosts.filter(p => p.is_commented);
        } else if (activeTab === 'Private post') {
          // In Private tab, only show private posts
          mappedPosts = mappedPosts.filter(p => p.visibility === 'private');
        } else if (activeTab === 'Save') {
          // In Save tab, only show posts that the user has actually saved
          mappedPosts = mappedPosts.filter(p => p.is_saved);
        }

        setPosts(mappedPosts)
      } catch (err) {
        console.error("Failed to fetch posts:", err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [userId, activeTab, profileData, isProfileLoading])

  return (
    <div className="min-h-screen bg-white flex justify-center py-10 px-4">
      <div className="flex flex-col w-[592px]">
        {/* Fixed Header Section (Non-scrollable) */}
        <div className="w-full bg-white z-20 p-4 pb-6 flex flex-col gap-6 border-b border-slate-50">
          {/* Navigation Header */}
          <div className="w-full flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full border border-[#DADADA] bg-white/80 backdrop-blur-[12px] hover:bg-slate-50 transition-colors shadow-[0px_4px_12px_rgba(0,0,0,0.03)] outline-none flex-shrink-0"
            >
              <ChevronLeft size={24} className="text-[#6B7280]" strokeWidth={1.5} />
            </button>
            <div className="flex flex-col">
              <h1 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] text-black leading-[26px]">Post activity</h1>
              <span className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-[#6B7280] leading-[16px]">Track your Interactions</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-row gap-4 w-full overflow-x-auto scrollbar-hide py-1">
            <FilterChip label="Post" active={activeTab === 'Post'} onClick={() => setActiveTab('Post')} />
            <FilterChip label="Repost" active={activeTab === 'Repost'} onClick={() => setActiveTab('Repost')} />
            <FilterChip label="Like" active={activeTab === 'Like'} onClick={() => setActiveTab('Like')} />
            <FilterChip label="Comments" active={activeTab === 'Comments'} onClick={() => setActiveTab('Comments')} />
            <FilterChip label="Private post" active={activeTab === 'Private post'} onClick={() => setActiveTab('Private post')} />
            <FilterChip label="Save" active={activeTab === 'Save'} onClick={() => setActiveTab('Save')} />
          </div>
        </div>

        {/* Scrollable Post Section */}
        <div className="flex-1 p-4 pt-6 flex flex-col items-center">
          {/* Posts List */}
          <div className="w-full flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 w-full">
                <div className="w-10 h-10 border-4 border-[#EEF2FF] border-t-[#6366F1] rounded-full animate-spin"></div>
                <p className="mt-4 font-[family-name:var(--font-poppins)] text-[#6B7280]">Loading your feed...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PublicPostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleToggleLike(post.id)}
                  onSave={() => handleToggleSave(post.id)}
                  onTogglePrivacy={() => handleTogglePrivacy(post.id, post.visibility || 'public')}
                  onDelete={() => handleDeletePost(post.id)}
                  onEdit={() => {
                    setEditingPost(post);
                    setIsEditModalOpen(true);
                  }}
                  currentUser={profileData}
                  activeTab={activeTab}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 w-full text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-300" />
                </div>
                <p className="font-[family-name:var(--font-poppins)] text-[#6B7280] text-lg font-medium">No posts found</p>
                <p className="font-[family-name:var(--font-poppins)] text-[#9CA3AF] text-sm mt-1">Try switching categories or searching for something else.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingPost && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          post={editingPost}
          onSuccess={(updatedPost) => {
            setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  )
}
