import React, { useState, useEffect } from 'react';
import { ThumbsUp, Trash2, Heart, MoreHorizontal, Flag, Ban, Link as LinkIcon, Pin } from 'lucide-react';
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
          {part}
        </Link>
      );
    }
    return part;
  });
};

export default function Comment({ comment, onReply, onDelete, onEdit, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId, onReport }: CommentProps) {
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
  const avatarSize = isReply ? "w-8 h-8" : "w-10 h-10";

  const authorLink = author?.isCompanyPost ? `/organization/${author?.authorSlug}` : `/profile/${author?.authorSlug || authorId}${postId ? `?openPost=${postId}&commentId=${id}` : ''}`;


  return (
    <div 
      id={`comment-${id}`} 
      className={`flex gap-3 relative group ${isReply ? 'mt-3 pl-4 border-l-2 border-border/30' : 'mt-6'} transition-all duration-300 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Avatar Column */}
      <div className="flex-shrink-0">
        <Link href={authorLink} className="block">
          <div className={`${avatarSize} rounded-full bg-muted overflow-hidden ring-1 ring-border/50`}>
            <img src={author?.avatar || '/assets/pngegg.png'} alt={author?.name || 'User'} className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Top Info Row */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
            <Link href={authorLink} className="hover:underline leading-tight">
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
                  <button className="text-black hover:bg-muted p-0.5 rounded-full transition-colors flex items-center justify-center">
                    <Icon icon="lucide:more-vertical" className="w-[18px] h-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    "w-[210px] p-2 bg-white border border-[#C7D2FE] rounded-[24px_0px_24px_24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]",
                    isOwner || isPostOwner ? "h-auto" : "h-auto"
                  )}
                >
                  {isOwner && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onEdit?.(id, text); }}
                      className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-slate-50"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Edit comment</span>
                      <Icon icon="fluent:edit-24-regular" width="24" height="24" className="text-black" />
                    </DropdownMenuItem>
                  )}

                  {(isOwner || isPostOwner) && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(id)}
                      className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none group/delete data-[highlighted]:bg-red-50"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-[#FF6B6B]">Delete comment</span>
                      <Icon icon="fluent:delete-24-regular" width="24" height="24" className="text-[#FF6B6B]" />
                    </DropdownMenuItem>
                  )}

                  {!isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onReport?.(id)}
                        className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-slate-50"
                      >
                        <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Report comment</span>
                        <Icon icon="fluent:info-24-regular" width="24" height="24" className="text-black" />
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          toast.success("Comment hidden");
                        }}
                        className="flex items-center justify-between cursor-pointer rounded-[24px] px-4 py-2 h-10 outline-none data-[highlighted]:bg-slate-50"
                      >
                        <span className="text-[14px] font-[family-name:var(--font-poppins)] font-normal leading-[20px] text-black">Hide comment</span>
                        <Icon icon="fluent:eye-hide-24-regular" width="24" height="24" className="text-black" />
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
        <div className="flex items-center gap-2 text-[12px] font-semibold text-black">
          <button
            onClick={handleLike}
            className={`hover:underline transition-colors ${isLiked ? 'text-primary' : ''}`}
          >
            Like
          </button>
          <span className="font-normal text-muted-foreground">—</span>
          <span className="font-normal text-muted-foreground">{likes} {likes === 1 ? 'like' : 'likes'}</span>
          
          <div className="w-[1px] h-3 bg-border/60 mx-1"></div>

          <button
            onClick={() => onReply?.(author?.name || 'User', id, author?.account_name)}
            className="hover:underline transition-colors"
          >
            Reply
          </button>
          <span className="font-normal text-muted-foreground">—</span>
          <span className="font-normal text-muted-foreground">{comment.reply_count || 0} {comment.reply_count === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>
    </div>
  );
}
