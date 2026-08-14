import React, { useState, useEffect } from 'react';
import { ThumbsUp, Trash2, Heart, Flag, Ban, Link as LinkIcon, Pin } from 'lucide-react';
import { toggleCommentLike, toggleCommentPin } from '@/services/api/posts';
import { Comment as CommentType } from '@/types/entities';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useSocial } from '@/context/SocialContext';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface CommentProps {
  comment: CommentType;
  isDark?: boolean;
  onReply?: (authorName: string, commentId: string | number, accountName?: string) => void;
  onDelete?: (commentId: string | number) => void;
  currentUserId?: string;
  variant?: 'root' | 'reply';
  isGrouped?: boolean;
  isPostOwner?: boolean;
  postId?: string | number;
  onReport?: (commentId: string | number) => void;
  onEdit?: (commentId: string | number, currentText: string) => void;
  onHide?: (commentId: string | number) => void;
}

const formatCommentText = (text: string, postId?: string | number, currentCommentId?: string | number) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const accountName = part.substring(1);
      
      const params = new URLSearchParams();
      if (postId) params.set('openPost', postId.toString());
      if (currentCommentId) params.set('commentId', currentCommentId.toString());

      const searchStr = params.toString();
      const href = `/profile/${accountName}${searchStr ? `?${searchStr}` : ''}`;

      return (
        <Link
          key={index}
          href={href}
          className="text-primary font-medium cursor-pointer hover:underline"
        >
          {accountName}
        </Link>
      );
    }
    return part;
  });
};

export default function Comment({ comment, onReply, onDelete, onEdit, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId, onReport, onHide }: CommentProps) {
  const { author, text, timeAgo, like_count, is_liked, is_pinned, authorId, id, isPending } = comment;
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const { blockUser } = useSocial();

  const [isLiked, setIsLiked] = useState(is_liked);
  const [likes, setLikes] = useState(like_count);
  const [isPinned, setIsPinned] = useState(is_pinned || false);

  const currentActorId = isCompany ? activeProfile?.id : (session?.user as any)?.id || session?.user?.id;
  const currentActorName = isCompany ? activeProfile?.name : session?.user?.name;

  const isOwner = (currentActorId && String(authorId) === String(currentActorId)) || 
                  (currentActorName && author?.name === currentActorName);


  const handleBlock = async () => {
    try {
      await blockUser(String(authorId));
      toast.success(`You have blocked ${author?.name || 'User'}`);
    } catch (err: any) {
      console.error("Block failed", err);
    }
  };

  useEffect(() => {
    setIsLiked(is_liked);
    setLikes(like_count);
    setIsPinned(is_pinned || false);
  }, [is_liked, like_count, is_pinned, id]);

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevLikes = likes;

    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const result = await toggleCommentLike(id, companyId);
      setIsLiked(result.liked);
      setLikes(result.likeCount);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      setIsLiked(prevLiked);
      setLikes(prevLikes);
    }
  };

  const handlePin = async () => {
    const prevPinned = isPinned;
    setIsPinned(!isPinned);

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const result = await toggleCommentPin(id, companyId);
      setIsPinned(result.pinned);
      toast.success(result.message);
    } catch (error: any) {
      console.error('Failed to toggle comment pin:', error);
      setIsPinned(prevPinned);
      toast.error(error.response?.data?.message || 'Failed to pin comment');
    }
  };

  const isReply = variant === 'reply';
  const avatarSize = "w-8 h-8";

  const baseCommentAuthorLink = author?.isCompanyPost ? `/organization/${author?.authorSlug}` : `/profile/${author?.authorSlug || authorId}`;
  const authorLink = postId ? `${baseCommentAuthorLink}?sourcePostId=${postId}&commentId=${id}` : baseCommentAuthorLink;


  return (
    <div 
      id={`comment-${id}`} 
      className={`flex gap-3 relative group transition-all duration-300 font-poppins ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Avatar Column */}
      <div className="flex-shrink-0">
        <Link href={authorLink} className="block">
          <div className={`${avatarSize} ${author?.isCompanyPost ? 'rounded-md' : 'rounded-full'} bg-[#EEF2FF] text-[#6366F1] overflow-hidden ring-1 ring-border/50 flex items-center justify-center font-semibold text-sm font-['Poppins'] select-none`}>
            {author?.avatar && author.avatar !== '/assets/pngegg.png' ? (
              <img 
                src={author.avatar} 
                alt={author?.name || 'User'} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('[data-fallback]');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }
                }} 
              />
            ) : null}
            <span data-fallback style={{ display: author?.avatar && author.avatar !== '/assets/pngegg.png' ? 'none' : 'flex' }}>{author?.name ? author.name.charAt(0).toUpperCase() : 'U'}</span>
          </div>
        </Link>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Top Info Row */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
            <Link href={authorLink} className="hover:underline leading-tight flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-black">{author?.name || 'Anonymous'}</span>
            </Link>
            {author?.headline && (
              <span className="text-[12px] text-muted-foreground font-normal leading-tight mt-0.5">
                {author.headline}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 pt-1">
            <span className="text-[12px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
            {!isPending && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-black p-0.5 rounded-full flex items-center justify-center">
                    <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    "w-[210px] p-2 bg-white border border-[#C7D2FE] rounded-[24px_0px_24px_24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] font-poppins",
                    isOwner || isPostOwner ? "h-auto" : "h-auto"
                  )}
                >
                  {isOwner && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onEdit?.(id, text); }}
                      className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#6366F1] text-black"
                    >
                      <span className="text-[14px] font-normal leading-[20px]">Edit comment</span>
                      <Icon icon="fluent:edit-24-regular" width="24" height="24" />
                    </DropdownMenuItem>
                  )}

                  {(isOwner || isPostOwner) && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(id)}
                      className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-red-50 data-[highlighted]:text-[#FF6B6B] text-[#FF6B6B]"
                    >
                      <span className="text-[14px] font-normal leading-[20px]">Delete comment</span>
                      <Icon icon="fluent:delete-24-regular" width="24" height="24" />
                    </DropdownMenuItem>
                  )}

                  {!isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onReport?.(id)}
                        className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#6366F1] text-black"
                      >
                        <span className="text-[14px] font-normal leading-[20px]">Report comment</span>
                        <Icon icon="fluent:info-24-regular" width="24" height="24" />
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (onHide) onHide(id);
                        }}
                        className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#6366F1] text-black"
                      >
                        <span className="text-[14px] font-normal leading-[20px]">Hide comment</span>
                        <Icon icon="fluent:eye-hide-24-regular" width="24" height="24" />
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Comment Body */}
        <div className="text-[14px] text-black/90 leading-normal mb-2 break-words">
          {formatCommentText(text, postId, id)}
        </div>

        {/* Action Bar (Styled like Figma) */}
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black">
          <button
            onClick={handleLike}
            className={`hover:underline transition-colors ${isLiked ? 'text-primary' : ''}`}
          >
            Like
          </button>
          <span className="font-normal text-muted-foreground">-</span>
          <span className="font-normal text-muted-foreground">{likes} {likes === 1 ? 'like' : 'likes'}</span>
          
          <span className="font-normal text-[#DADADA] mx-1">|</span>

          <button
            onClick={() => onReply?.(author?.name || 'User', id, author?.account_name)}
            className="hover:underline transition-colors"
          >
            Reply
          </button>
          <span className="font-normal text-muted-foreground">-</span>
          <span className="font-normal text-muted-foreground">{comment.reply_count || 0} reply</span>
        </div>
      </div>
    </div>
  );
}
