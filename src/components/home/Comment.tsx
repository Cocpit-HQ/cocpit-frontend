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
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { ReportModal } from '@/components/shared/ReportModal';

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

export default function Comment({ comment, onReply, onDelete, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId }: CommentProps) {
  const { author, text, timeAgo, like_count, is_liked, is_pinned, authorId, id } = comment;
  const [isLiked, setIsLiked] = useState(is_liked);
  const [likes, setLikes] = useState(like_count);
  const [isPinned, setIsPinned] = useState(is_pinned || false);
  const { blockUser } = useSocial();
  const { isCompany, activeProfile } = useActiveProfile();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleBlock = async () => {
    try {
      await blockUser(String(authorId));
      toast.success(`You have blocked ${author.name}`);
    } catch (err: any) {
      // blockUser handles error toast usually, but just in case
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
      // Revert on error
      console.error('Failed to toggle comment pin:', error);
      setIsPinned(prevPinned);
      toast.error(error.response?.data?.message || 'Failed to pin comment');
    }
  };

  const isOwner = currentUserId && (String(authorId) === String(currentUserId));

  // Style config based on variant
  const isReply = variant === 'reply';
  const avatarSize = isReply ? "w-6 h-6 md:w-6 md:h-6" : "w-8 h-8 md:w-10 md:h-10";
  const textSize = isReply ? "text-xs" : "text-sm";
  const nameSize = isReply ? "text-xs" : "text-sm";



  return (
    <div id={`comment-${id}`} className={`flex gap-3 relative group ${isReply ? 'mt-2' : 'mt-4'} transition-colors duration-1000`}>

      {/* Avatar Column */}
      <div className="flex flex-col items-center flex-shrink-0">
        <Link
          href={author.isCompanyPost ? `/organization/${author.authorSlug}` : `/profile/${author.authorSlug || authorId}${postId ? `?openPost=${postId}&commentId=${id}` : ''}`}
          className="block"
        >
          <div className={`${avatarSize} rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden ring-1 ring-border/50`}>
            <img src={author.avatar || '/assets/pngegg.png'} alt={author.name} className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <div className="bg-card/50 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={author.isCompanyPost ? `/organization/${author.authorSlug}` : `/profile/${author.authorSlug || authorId}${postId ? `?openPost=${postId}&commentId=${id}` : ''}`}
              className="hover:underline"
            >
              <span className={`${nameSize} font-semibold text-foreground`}>{author.name}</span>
            </Link>
            {isPinned && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Pin className="w-3 h-3 fill-current" />
                <span className="font-medium">Pinned</span>
              </div>
            )}
            <span className={`${textSize} text-muted-foreground`}>• {timeAgo}</span>
          </div>

          {/* Comment Body */}
          <div className={`${textSize} text-foreground/90 leading-relaxed break-words`}>
            {formatCommentText(text, postId, id)}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-4 mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleLike}
            className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isLiked ? 'Liked' : 'Like'}
            {likes > 0 && <span className="font-normal text-muted-foreground/80">({likes})</span>}
          </button>

          <button
            onClick={() => onReply?.(author.name, id, author.account_name)}
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Reply
          </button>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-0.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied");
              }}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy link
              </DropdownMenuItem>

              {/* Pin/Unpin Option - Only for post owner */}
              {isPostOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePin}>
                    <Pin className="w-4 h-4 mr-2" />
                    {isPinned ? 'Unpin Comment' : 'Pin Comment'}
                  </DropdownMenuItem>
                </>
              )}

              {/* Block User - Hide if it's my own comment */}
              {!isOwner && (
                <DropdownMenuItem onClick={handleBlock}>
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              )}

              {!isOwner && (
                <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}

              {(isOwner || isPostOwner) && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right Side Heart Icon (Mobile) - Optional, keeping it subtle */}
      <div className="pt-2 px-1 block md:hidden">
        <button onClick={handleLike} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
          <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="COMMENT"
        targetId={id}
      />

    </div>
  );
}
