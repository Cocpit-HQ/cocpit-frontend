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
import { Icon } from '@/components/icons';
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
  // Match both structured mentions @[Name](account) and legacy mentions @account
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\)|@\w+)/g);
  
  return parts.map((part, index) => {
    let accountName = '';
    let displayName = '';
    
    const structuredMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
    if (structuredMatch) {
      displayName = structuredMatch[1];
      accountName = structuredMatch[2];
    } else if (part.startsWith('@')) {
      accountName = part.substring(1);
      displayName = accountName; // Legacy fallback
    }

    if (accountName) {
      const params = new URLSearchParams();
      if (postId) params.set('openPost', postId.toString());
      if (currentCommentId) params.set('commentId', currentCommentId.toString());

      const searchStr = params.toString();
      const href = `/profile/${accountName}${searchStr ? `?${searchStr}` : ''}`;

      return (
        <Link
          key={index}
          href={href}
          className="mention-link text-ds-accent text-[var(--ds-accent)] !text-[var(--ds-accent)] font-semibold no-underline hover:no-underline cursor-pointer transition-opacity hover:opacity-80"
          style={{ color: 'var(--ds-accent)' }}
        >
          {displayName}
        </Link>
      );
    }
    return part;
  });
};

export default function Comment({ comment, onReply, onDelete, onEdit, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId, onReport, onHide }: CommentProps) {
  const { author, text, timeAgo, like_count, is_liked, is_pinned, authorId, id, isPending, is_edited } = comment;
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

  const baseCommentAuthorLink = author?.isCompanyPost ? `/organization/${author?.authorSlug}` : `/profile/${author?.authorSlug || authorId}`;
  const authorLink = postId ? `${baseCommentAuthorLink}?sourcePostId=${postId}&commentId=${id}` : baseCommentAuthorLink;


  return (
    <div 
      id={`comment-${id}`} 
      className={`flex gap-3 relative group transition-all duration-300 font-dmsans ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Avatar Column */}
      <div className="flex-shrink-0 shrink-0 flex-none">
        <Link href={authorLink} className="block shrink-0 flex-none">
          <div className={`w-[24px] h-[24px] ${author?.isCompanyPost ? 'rounded-[4px]' : 'rounded-full'} bg-ds-surface-1 text-ds-text-secondary overflow-hidden flex items-center justify-center font-semibold text-[10px] font-dmsans select-none shrink-0 flex-none`}>
            {author?.avatar && author.avatar !== '/assets/pngegg.png' ? (
              <img 
                src={author.avatar} 
                alt={author?.name || 'User'} 
                className="w-full h-full object-cover rounded-full" 
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
              {/* ORIGINAL: <span className="text-sm font-bold text-black">{author?.name || 'Anonymous'}</span> */}
              <span className="ds-text-body text-ds-text-primary">{author?.name || 'Anonymous'}</span>
            </Link>
            {author?.headline && (
              /* ORIGINAL: <span className="text-[12px] text-muted-foreground font-normal leading-tight mt-0.5">{author.headline}</span> */
              <span className="ds-text-meta text-ds-text-secondary mt-0.5">
                {author.headline}
              </span>
            )}
          </div>
          
          {/* ORIGINAL: <div className="flex items-center gap-4 pt-1"> */}
          <div className="flex items-center gap-2 pt-1">
            {is_edited && (
              <>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '12px',
                    textAlign: 'center',
                    color: '#B8ADA8',
                    flexShrink: 0,
                  }}
                >
                  Edited
                </span>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#726B67',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
              </>
            )}
            {/* ORIGINAL: <span className="text-[12px] text-muted-foreground whitespace-nowrap">{timeAgo}</span> */}
            <span className="ds-text-meta text-ds-text-secondary">{timeAgo}</span>
            {!isPending && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="More options"
                    onClick={(e) => e.stopPropagation()}
                    className="w-[20px] h-[20px] flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 rounded outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent transition-colors"
                  >
                    <Icon name="menu" className="w-[20px] h-[20px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                  className="w-[135px] flex flex-col items-start p-[12px] gap-[16px] bg-ds-surface-2 rounded-[8px] !border-none !outline-none !ring-0 shadow-none font-dmsans"
                >
                  {isOwner && (
                    <DropdownMenuItem
                      onSelect={() => onEdit?.(id, text)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(id, text);
                      }}
                      className="cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary focus:bg-transparent focus:text-ds-text-primary p-0 bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-ds-text-primary"
                    >
                      Edit comment
                    </DropdownMenuItem>
                  )}

                  {(isOwner || isPostOwner) && (
                    <DropdownMenuItem
                      onSelect={() => onDelete?.(id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(id);
                      }}
                      className="cursor-pointer outline-none w-full ds-text-secondary text-ds-error hover:opacity-80 focus:bg-transparent p-0 bg-transparent data-[highlighted]:bg-transparent"
                    >
                      Delete comment
                    </DropdownMenuItem>
                  )}

                  {!isOwner && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => {
                          setTimeout(() => {
                            onReport?.(id);
                          }, 50);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimeout(() => {
                            onReport?.(id);
                          }, 50);
                        }}
                        className="cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary focus:bg-transparent focus:text-ds-text-primary p-0 bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-ds-text-primary"
                      >
                        Report
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => onHide?.(id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onHide?.(id);
                        }}
                        className="cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary focus:bg-transparent focus:text-ds-text-primary p-0 bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-ds-text-primary"
                      >
                        Hide comment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Comment Body */}
        {/* ORIGINAL: <div className="text-[14px] text-black/90 leading-normal mb-2 break-words"> */}
        <div className="ds-text-small text-ds-text-primary leading-normal mb-2 break-words">
          {formatCommentText(text, postId, id)}
        </div>

        {/* Action Bar (Styled like Figma) */}
        {/* ORIGINAL: <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black"> */}
        <div className="flex items-center gap-[8px] ds-text-small text-ds-text-primary">
          <button
            onClick={handleLike}
            className={`hover:underline transition-colors ${isLiked ? 'text-ds-accent' : ''}`}
          >
            Like
          </button>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">-</span> */}
          <span className="font-normal text-ds-text-primary">-</span>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">{likes} {likes === 1 ? 'like' : 'likes'}</span> */}
          <span className="font-normal text-ds-text-secondary">{likes} {likes === 1 ? 'like' : 'likes'}</span>
          
          {/* ORIGINAL: <span className="font-normal text-[#DADADA] mx-1">|</span> */}
          <div className="w-[1px] h-[16px] bg-ds-border mx-[4px]" />

          <button
            onClick={() => onReply?.(author?.name || 'User', id, author?.account_name)}
            className="hover:underline transition-colors"
          >
            Reply
          </button>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">-</span> */}
          <span className="font-normal text-ds-text-primary">-</span>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">{comment.reply_count || 0} reply</span> */}
          <span className="font-normal text-ds-text-secondary">{comment.reply_count || 0} reply</span>
        </div>
      </div>
    </div>
  );
}
