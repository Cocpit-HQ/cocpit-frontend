"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
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
import { getPublicProfilePosts } from "../services/profile.service"
import { Icon } from "@iconify/react"
import { getUserPosts } from "../services/profile.service"
import { toggleSavePost } from "../services/profile.service"
import { toggleLike, updatePost, deletePost } from "../services/profile.service"
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import { Post } from "@/types/entities"
import Image from "next/image"
import { useMyProfile } from "@/hooks/use-my-profile"
import { useUIStore } from "@/store/ui.store"
import { CreatePostModal } from "@/features/create-post/components/CreatePostModal"
import { PostCarousel } from "@/components/shared/PostCarousel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
const CommentSection = dynamic(() => import('@/features/feed/components/comments/CommentSection'), { ssr: false });
const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });

const mergePostState = (current: Post, incoming: Post): Post => ({
  ...current,
  ...incoming,
  author: incoming.author || current.author,
  authorId: incoming.authorId || current.authorId,
  authorAvatar: incoming.authorAvatar || current.authorAvatar,
  isCompanyPost: incoming.isCompanyPost ?? current.isCompanyPost,
  title: incoming.title || current.title,
  timeAgo: incoming.timeAgo || current.timeAgo,
  category: incoming.category || current.category,
  location: incoming.location ?? current.location,
  tags: incoming.tags ?? current.tags,
  shared_post: incoming.shared_post ?? current.shared_post,
});

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const image = post.imageSrc || (post.images && post.images.length > 0 ? post.images[0] : null);
  const videoSrc = post.videoSrc || null;
  const isArticlePost = post.category === 'Article' || Boolean(post.articleBody);
  const isPollPost = Boolean(post.poll);
  const articleExcerpt = post.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const pollQuestion = articleExcerpt || post.title || "Untitled poll";
  const pollOptions = post.poll?.options?.slice(0, 4) || [];

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  return (
    <div className="relative mb-6 flex w-full max-w-none flex-col items-start overflow-hidden rounded-[24px] border border-border bg-card py-4 shadow-sm md:w-[560px] md:max-w-[560px]">
      {/* Header */}
      <div className="flex w-full flex-row items-start justify-between px-4">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D9D9D9] relative flex-shrink-0 mt-0.5">
            <img
              src={post.authorAvatar || "/assets/pngegg.png"}
              alt={post.author}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden flex-1">
            <span className="font-[family-name:var(--font-poppins)] font-semibold text-[16px] text-foreground leading-tight truncate">{post.author}</span>
            <Link href={`/post/${post.id}`} className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-muted-foreground truncate w-full block cursor-pointer" title={post.authorHeadline || post.title || (post.isCompanyPost ? 'Organization' : '')}>
              {post.authorHeadline || post.title || (post.isCompanyPost ? 'Organization' : '')}
            </Link>
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)] mt-0.5">
              <span>{post.location || 'Kolhapur'}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>{post.timeAgo || '6 days ago'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.tags && post.tags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-[#EEF2FF] rounded-full transition-colors outline-none text-[#6B7280] hover:text-[#6366F1] data-[state=open]:text-[#6366F1]">
                  <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[180px] p-2 bg-white border border-[#C7D2FE] rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto z-[210]"
                align="end"
                sideOffset={8}
              >
                <div className="flex flex-col gap-1">
                  {post.tags.map((tag: any, idx: number) => (
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
                "flex items-center justify-center w-8 h-8 outline-none border-none focus:outline-none rounded-full transition-colors",
                isMenuOpen ? "bg-[#EEF2FF] text-[#6366F1]" : "text-foreground hover:bg-muted"
              )}>
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
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
                    className="flex items-center justify-between cursor-pointer rounded-xl px-4 py-1.5 h-10 outline-none data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#6366F1] transition-colors group"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black group-data-[highlighted]:text-[#6366F1]">Edit post</span>
                    <Icon icon="hugeicons:edit-03" width="24" height="24" className="text-black group-data-[highlighted]:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>

                  {!post.shared_post && activeTab !== 'Like' && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onTogglePrivacy?.(); }}
                      className="flex items-center justify-between cursor-pointer rounded-xl px-4 py-1.5 h-10 outline-none data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#6366F1] transition-colors group"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black group-data-[highlighted]:text-[#6366F1]">
                        {post.visibility === 'private' ? 'Make public' : 'Make private'}
                      </span>
                      {post.visibility === 'private' ? (
                        <Icon icon="hugeicons:view" width="24" height="24" className="text-black group-data-[highlighted]:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                      ) : (
                        <Icon icon="hugeicons:view-off-slash" width="24" height="24" className="text-black group-data-[highlighted]:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                      )}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="flex items-center justify-between cursor-pointer rounded-xl px-4 py-1.5 h-10 outline-none group/delete data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600 transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-[#FF6B6B] data-[highlighted]:text-red-600">Delete post</span>
                    <Icon icon="hugeicons:delete-02" width="24" height="24" className="text-[#FF6B6B] data-[highlighted]:text-red-600" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 w-full px-4">
        <div className="px-0 mb-2">
          {isArticlePost ? null : isPollPost ? (
            <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-foreground break-words whitespace-pre-wrap line-clamp-2">
              {pollQuestion}
            </p>
          ) : (
            <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-foreground break-words whitespace-pre-wrap">
              {post.content}
            </p>
          )}
        </div>



        {/* Shared Post Content */}
        {post.shared_post && (
          <div className="w-full border border-border rounded-[16px] p-3 mt-2 mb-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D9D9D9] relative flex-shrink-0">
                <img
                  src={post.shared_post.authorAvatar || "/assets/pngegg.png"}
                  alt={post.shared_post.author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] text-foreground truncate max-w-[200px]">
                  {post.shared_post.author}
                </span>
                <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] text-[#6B7280]">
                  {(post.shared_post as any).authorTitle || 'Member'}
                </span>
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-foreground break-words line-clamp-3">
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

        {!post.shared_post && (
          isPollPost ? (
            <div className="mb-4 rounded-[20px] border border-[#E3E9FF] bg-[#F8FAFF] p-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1]">
                  Poll
                </span>
                <span className="text-[10px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  {post.poll?.total_votes || 0} votes
                </span>
              </div>

              <div className="space-y-2.5">
                {pollOptions.map((option, index) => (
                  <div
                    key={option.option_id || `${option.option_text}-${index}`}
                    className="rounded-[14px] border border-[#E8ECFF] bg-white px-3 py-2.5"
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

              {post.poll && post.poll.options.length > pollOptions.length && (
                <div className="pt-3 text-[11px] leading-[16px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  +{post.poll.options.length - pollOptions.length} more option{post.poll.options.length - pollOptions.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          ) : isArticlePost ? (
            <>
              <div className="relative -mx-4 mb-3 h-[360px] w-[calc(100%+2rem)] overflow-hidden bg-slate-50 sm:h-[420px] md:h-[501px]">
                {image ? (
                  <Image src={image} alt={post.title || "Article cover"} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#DDE5FF] flex items-center justify-center px-8 text-center">
                    <span className="text-[20px] leading-[28px] text-[#6366F1] font-semibold font-[family-name:var(--font-poppins)] line-clamp-3">
                      {post.title || "Untitled Article"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <Link href={`/post/${post.id}`} className="block">
                  <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-[16px] leading-[24px] text-foreground line-clamp-2">
                    {post.title || "Untitled Article"}
                  </h3>
                </Link>
              </div>
            </>
          ) : videoSrc ? (
            <div className="relative -mx-4 mb-4 h-[360px] w-[calc(100%+2rem)] overflow-hidden bg-black sm:h-[420px] md:h-[501px]">
              <video
                src={videoSrc}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            </div>
          ) : ((post.images && post.images.length > 0) || post.imageSrc) ? (
            <div className="relative -mx-4 mb-4 h-[360px] w-[calc(100%+2rem)] overflow-hidden bg-slate-50 sm:h-[420px] md:h-[501px]">
              {post.images && post.images.length > 1 ? (
                <PostCarousel images={post.images} />
              ) : (
                <Image src={post.imageSrc || post.images?.[0] || ''} alt="Post content" fill className="object-cover" />
              )}
            </div>
          ) : null
        )}

        {Number(post.likes || 0) > 0 && (
          <div className="pt-3 px-0 mb-4 border-t border-transparent">
            <p className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-foreground">
              Liked by {post.isLiked ? (
                Number(post.likes || 0) === 1 ? (
                  'you'
                ) : (
                  <>
                    you and {Number(post.likes || 0) - 1} {Number(post.likes || 0) - 1 === 1 ? 'other' : 'others'}
                  </>
                )
              ) : (
                Number(post.likes || 0) === 1 ? (
                  <span className="font-semibold">@{post.sampleLikerUsername || 'someone'}</span>
                ) : (
                  <>
                    <span className="font-semibold">@{post.sampleLikerUsername || 'someone'}</span> and {Number(post.likes || 0) - 1} {Number(post.likes || 0) - 1 === 1 ? 'other' : 'others'}
                  </>
                )
              )}
            </p>
          </div>
        )}

        {/* Interaction Bar */}
        <div className="flex justify-between items-center px-0 w-full h-10">
          <div className="flex items-center gap-[16px]">
            <div
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className={cn(
                  "transition-all",
                  post.isLiked ? "text-primary" : "text-foreground group-hover:text-primary"
                )}
              >
                {post.isLiked ? (
                  <>
                    <path
                      fill="currentColor"
                      d="m20.27 16.265l.705-4.08a1.666 1.666 0 0 0-1.64-1.95h-5.181a.833.833 0 0 1-.822-.969l.663-4.045a4.8 4.8 0 0 0-.09-1.973a1.64 1.64 0 0 0-1.092-1.137l-.145-.047a1.35 1.35 0 0 0-.994.068c-.34.164-.588.463-.68.818l-.476 1.834a7.6 7.6 0 0 1-.656 1.679c-.415.777-1.057 1.4-1.725 1.975l-1.439 1.24a1.67 1.67 0 0 0-.572 1.406l.812 9.393A1.666 1.666 0 0 0 8.597 22h4.648c3.482 0 6.453-2.426 7.025-5.735"
                    />
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M2.968 9.485a.75.75 0 0 1 .78.685l.97 11.236a1.237 1.237 0 1 1-2.468.107V10.234a.75.75 0 0 1 .718-.749"
                      clipRule="evenodd"
                    />
                  </>
                ) : (
                  <path
                    fill="currentColor"
                    d="m20.975 12.185l-.739-.128zm-.705 4.08l-.74-.128zM6.938 20.477l-.747.065zm-.812-9.393l.747-.064zm7.869-5.863l.74.122zm-.663 4.045l.74.121zm-6.634.411l-.49-.568zm1.439-1.24l.49.569zm2.381-3.653l-.726-.189zm.476-1.834l.726.188zm1.674-.886l-.23.714zm.145.047l.229-.714zM9.862 6.463l.662.353zm4.043-3.215l-.726.188zm-2.23-1.116l-.326-.675zM3.971 21.471l-.748.064zM3 10.234l.747-.064a.75.75 0 0 0-1.497.064zm17.236 1.823l-.705 4.08l1.478.256l.705-4.08zm-6.991 9.193H8.596v1.5h4.649zm-5.56-.837l-.812-9.393l-1.495.129l.813 9.393zm11.846-4.276c-.507 2.93-3.15 5.113-6.286 5.113v1.5c3.826 0 7.126-2.669 7.764-6.357zM13.255 5.1l-.663 4.045l1.48.242l.663-4.044zm-6.067 5.146l1.438-1.24l-.979-1.136L6.21 9.11zm4.056-5.274l.476-1.834l-1.452-.376l-.476 1.833zm1.194-2.194l.145.047l.459-1.428l-.145-.047zm-1.915 4.038a8.4 8.4 0 0 0 .721-1.844l-1.452-.377A7 7 0 0 1 9.2 6.11zm2.06-3.991a.89.89 0 0 1 .596.61l1.452-.376a2.38 2.38 0 0 0-1.589-1.662zm-.863.313a.52.52 0 0 1 .28-.33l-.651-1.351c-.532.256-.932.73-1.081 1.305zm.28-.33a.6.6 0 0 1 .438-.03l.459-1.428a2.1 2.1 0 0 0-1.548.107zm2.154 8.176h5.18v-1.5h-5.18zM4.719 21.406L3.747 10.17l-1.494.129l.971 11.236zm-.969.107V10.234h-1.5v11.279zm-.526.022a.263.263 0 0 1 .263-.285v1.5c.726 0 1.294-.622 1.232-1.344zM14.735 5.343a5.5 5.5 0 0 0-.104-2.284l-1.452.377a4 4 0 0 1 .076 1.664zM8.596 21.25a.916.916 0 0 1-.911-.837l-1.494.129a2.416 2.416 0 0 0 2.405 2.208zm.03-12.244c.68-.586 1.413-1.283 1.898-2.19L9.2 6.109c-.346.649-.897 1.196-1.553 1.76zm13.088 3.307a2.416 2.416 0 0 0-2.38-2.829v1.5c.567 0 1 .512.902 1.073zM3.487 21.25c.146 0 .263.118.263.263h-1.5c0 .682.553 1.237 1.237 1.237zm9.105-12.105a1.583 1.583 0 0 0 1.562 1.84v-1.5a.083.083 0 0 1-.082-.098zm-5.72 1.875a.92.92 0 0 1 .316-.774l-.98-1.137a2.42 2.42 0 0 0-.83 2.04z"
                  />
                )}
              </svg>
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-foreground">{post.likes || 0}</span>
            </div>
            <div
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className={cn(
                  "transition-all",
                  showComments ? "text-primary" : "text-foreground group-hover:text-primary"
                )}
              >
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                  <path strokeLinejoin="round" d="M8 13.5h8m-8-5h4"/>
                  <path d="M6.099 19q-1.949-.192-2.927-1.172C2 16.657 2 14.771 2 11v-.5c0-3.771 0-5.657 1.172-6.828S6.229 2.5 10 2.5h4c3.771 0 5.657 0 6.828 1.172S22 6.729 22 10.5v.5c0 3.771 0 5.657-1.172 6.828S17.771 19 14 19c-.56.012-1.007.055-1.445.155c-1.199.276-2.309.89-3.405 1.424c-1.563.762-2.344 1.143-2.834.786c-.938-.698-.021-2.863.184-3.865"/>
                </g>
              </svg>
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-foreground">{commentsCount}</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className={cn("transition-all", post.shared_post ? "text-primary" : "text-foreground group-hover:text-primary")}
              >
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                  <path d="M8.5 15S5 17.578 5 18.5S8.5 22 8.5 22"/>
                  <path d="M5.5 18.5h8c3.288 0 4.931 0 6.038-.908q.304-.25.554-.554C21 15.93 21 14.288 21 11m-5.5-2S19 6.422 19 5.5S15.5 2 15.5 2"/>
                  <path d="M18.5 5.5h-8c-3.287 0-4.931 0-6.038.908a4 4 0 0 0-.554.554C3 8.07 3 9.712 3 13"/>
                </g>
              </svg>
              <span className="font-[family-name:var(--font-poppins)] text-[12px] text-foreground">{post.shares || 0}</span>
            </div>
            <div className="flex items-center cursor-pointer group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 28 28"
                className="text-foreground group-hover:text-primary transition-all"
              >
                <path fill="currentColor" d="M12.25 3a.75.75 0 1 1 0 1.5h-5A2.75 2.75 0 0 0 4.5 7.25v13.5a2.75 2.75 0 0 0 2.75 2.75h13.5a2.75 2.75 0 0 0 2.75-2.75v-5a.75.75 0 0 1 1.5 0v5A4.25 4.25 0 0 1 20.75 25H7.25A4.25 4.25 0 0 1 3 20.75V7.25A4.25 4.25 0 0 1 7.25 3zm5.179-.928a.75.75 0 0 1 .796.098l8.25 6.75a.75.75 0 0 1 .039 1.127l-8.25 7.75A.75.75 0 0 1 17 17.25v-3.74c-1.166.036-2.463.189-3.854.802c-1.584.698-3.35 2.021-5.16 4.577l-.362.527A.75.75 0 0 1 6.25 19c0-4.406 1.34-7.56 3.51-9.608C11.738 7.527 14.325 6.656 17 6.52V2.75a.75.75 0 0 1 .429-.679m1.07 5.178a.75.75 0 0 1-.75.75c-2.66 0-5.145.772-6.959 2.483c-1.413 1.334-2.474 3.292-2.87 6.046c1.56-1.823 3.12-2.93 4.621-3.59C14.532 12.06 16.349 12 17.75 12a.75.75 0 0 1 .75.75v2.766l6.363-5.978L18.5 4.332z"/>
              </svg>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className="flex items-center cursor-pointer group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className={cn(
                "transition-all",
                post.is_saved ? "text-[#6366F1]" : "text-[#000000] group-hover:text-[#6366F1]"
              )}
            >
              {post.is_saved ? (
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M21 11.098v4.993c0 3.096 0 4.645-.734 5.321c-.35.323-.792.526-1.263.58c-.987.113-2.14-.907-4.445-2.946c-1.02-.901-1.529-1.352-2.118-1.47a2.2 2.2 0 0 0-.88 0c-.59.118-1.099.569-2.118 1.47c-2.305 2.039-3.458 3.059-4.445 2.945a2.24 2.24 0 0 1-1.263-.579C3 20.736 3 19.188 3 16.091v-4.994C3 6.81 3 4.666 4.318 3.333S7.758 2 12 2s6.364 0 7.682 1.332S21 6.81 21 11.098M8.25 6A.75.75 0 0 1 9 5.25h6a.75.75 0 0 1 0 1.5H9A.75.75 0 0 1 8.25 6"
                  clipRule="evenodd"
                />
              ) : (
                <>
                  <path fill="currentColor" d="M9 5.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5z"/>
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M11.943 1.25c-2.073 0-3.706 0-4.982.173c-1.31.178-2.355.552-3.176 1.382c-.82.829-1.188 1.882-1.364 3.202c-.171 1.289-.171 2.938-.171 5.034v5.098c0 1.508 0 2.701.096 3.6c.095.888.298 1.689.88 2.225c.466.43 1.056.7 1.686.773c.787.09 1.522-.286 2.247-.8c.733-.518 1.622-1.305 2.744-2.297l.036-.032c.52-.46.872-.77 1.166-.986c.284-.207.457-.282.603-.312a1.5 1.5 0 0 1 .584 0c.146.03.32.105.603.312c.294.215.646.526 1.166.986l.037.032c1.121.992 2.01 1.779 2.743 2.298c.725.513 1.46.889 2.247.799a3 3 0 0 0 1.686-.773c.581-.536.785-1.337.88-2.225c.096-.899.096-2.092.096-3.6v-5.098c0-2.096 0-3.746-.171-5.034c-.171-1.32-.544-2.373-1.364-3.202c-.821-.83-1.866-1.204-3.176-1.382c-1.276-.173-2.909-.173-4.982-.173zM4.85 3.86c.497-.502 1.172-.795 2.312-.95c1.163-.158 2.694-.16 4.837-.16s3.674.002 4.837.16c1.14.155 1.815.448 2.312.95c.498.503.789 1.188.943 2.345c.156 1.178.158 2.727.158 4.893v4.993c0 1.566-.001 2.68-.087 3.488c-.09.83-.253 1.141-.405 1.282c-.2.023-.534-.054-1.21-.532c-.658-.467-1.487-1.198-2.653-2.23l-.026-.023c-.488-.431-.892-.788-1.249-1.05c-.373-.272-.749-.482-1.192-.571a3 3 0 0 0-1.176 0c-.443.09-.82.299-1.192.572c-.357.26-.761.618-1.249 1.049l-.026.023c-1.166 1.032-1.995 1.763-2.653 2.23c-.676.478-1.01.555-1.21.532a1.5 1.5 0 0 1-.84-.385c-.152-.141-.316-.452-.404-1.282c-.087-.809-.088-1.922-.088-3.488v-4.994c0-2.165.002-3.714.158-4.892c.154-1.157.445-1.842.943-2.345"
                    clipRule="evenodd"
                  />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="w-full mt-4 border-t border-[#EEF2FF] pt-4">
            <CommentSection
              postId={post.id}
              isPostOwner={isOwner}
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
  const [saveModalPostId, setSaveModalPostId] = useState<string | null>(null)
  const { data: profileData, isLoading: isProfileLoading } = useMyProfile()
  const { setEditMode } = useUIStore()

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

  const handleSaveClick = async (postId: string, isSaved: boolean) => {
    if (!isSaved) {
      setSaveModalPostId(postId);
      return;
    }

    await handleToggleSave(postId);
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
    <div className="min-h-screen bg-background flex justify-center py-10 px-4">
      <div className="flex w-full max-w-none flex-col md:w-[592px] md:max-w-[592px]">
        {/* Fixed Header Section (Non-scrollable) */}
        <div className="w-full bg-background z-20 p-4 pb-6 flex flex-col gap-6 border-b border-transparent">
          {/* Navigation Header */}
          <div className="w-full flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-[12px] hover:bg-accent transition-colors shadow-sm outline-none flex-shrink-0"
            >
              <ChevronLeft size={24} className="text-muted-foreground" strokeWidth={1.5} />
            </button>
            <div className="flex flex-col">
              <h1 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] text-foreground leading-[26px]">Post activity</h1>
              <span className="font-[family-name:var(--font-poppins)] font-normal text-[12px] text-muted-foreground leading-[16px]">Track your Interactions</span>
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
                  onSave={() => handleSaveClick(post.id, !!post.is_saved)}
                  onTogglePrivacy={() => handleTogglePrivacy(post.id, post.visibility || 'public')}
                  onDelete={() => handleDeletePost(post.id)}
                  onEdit={() => {
                    setEditingPost(post);
                    setEditMode(true, post.id);
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

      {isEditModalOpen && editingPost && (
        <CreatePostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditMode(false, null);
            setEditingPost(null);
          }}
          editPostId={editingPost.id}
          onUpdate={(updatedPost) => {
            setPosts(prev => prev.map(p => p.id === updatedPost.id ? mergePostState(p, updatedPost as any) : p));
          }}
        />
      )}

      {saveModalPostId && (
        <SavePostModal
          isOpen={!!saveModalPostId}
          onClose={() => setSaveModalPostId(null)}
          postId={saveModalPostId}
          onSaved={(isSaved) => {
            setPosts(prev => prev.map(p =>
              p.id === saveModalPostId ? { ...p, is_saved: isSaved } : p
            ));
            setSaveModalPostId(null);
          }}
        />
      )}
    </div>
  )
}
