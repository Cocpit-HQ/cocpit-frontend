import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, Trash2, Heart, Flag, Ban, Link as LinkIcon, Pin } from 'lucide-react';
import { UserIcon } from '@/components/icons';
import { toggleCommentLike, toggleCommentPin } from '@/services/api/posts';
import { Comment as CommentType } from '@/types/entities';
import Link from 'next/link';
import { DynamicMention } from '@/shared/commonComponents/DynamicMention';
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
import { CommentActionSnackbar } from './CommentActionSnackbar';
import { useUIStore } from '@/store/ui.store';

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
  onUndo?: (commentId: string | number) => void;
}

const formatCommentText = (
  text: string | null | undefined, 
  postId?: string | number, 
  currentCommentId?: string | number,
  mentionedUsers?: { user_id: string; full_name: string; account_name: string }[]
) => {
  if (!text) return null;
  // Only match structured mentions @[Name](account) for registered platform users
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
  
  return parts.map((part, index) => {
    let accountName = '';
    let displayName = '';
    
    const structuredMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
    if (structuredMatch) {
      displayName = structuredMatch[1];
      accountName = structuredMatch[2];
    }

    if (accountName) {
      return (
        <DynamicMention 
          key={index} 
          displayName={displayName} 
          handle={accountName}
          mentionedUsers={mentionedUsers}
          className="hover:underline cursor-pointer transition-opacity hover:opacity-80 text-ds-accent text-[var(--ds-accent)] !text-[var(--ds-accent)] font-semibold"
          style={{ color: 'var(--ds-accent)' }}
        />
      );
    }
    return part;
  });
};

export default function Comment({ comment, onReply, onDelete, onEdit, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId, onReport, onHide, onUndo }: CommentProps) {
  const { author, text, timeAgo, like_count, is_liked, is_pinned, authorId, id, isPending, is_edited } = comment;
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const { blockUser } = useSocial();

  const [isLiked, setIsLiked] = useState(is_liked);
  const [likes, setLikes] = useState(like_count);
  const [isPinned, setIsPinned] = useState(is_pinned || false);
  const menuKey = id ? `comment-${id}` : 'comment-options';
  const isMenuOpen = useUIStore((state) => state.activeOpenMenuId === menuKey);
  const setIsMenuOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    const currentOpen = useUIStore.getState().activeOpenMenuId === menuKey;
    const nextOpen = typeof open === 'function' ? open(currentOpen) : open;
    useUIStore.getState().setActiveOpenMenuId(nextOpen ? menuKey : null);
  };
  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleScrollOrResize = () => {
      if (!optionsBtnRef.current) return;
      const rect = optionsBtnRef.current.getBoundingClientRect();
      const menuHeight = 90; // dropdown height (~80-90px)
      // Close only when the entire comment button and menu have scrolled completely out of the viewport
      if (rect.bottom + menuHeight <= 0 || rect.top >= window.innerHeight) {
        if (document.activeElement === optionsBtnRef.current) {
          optionsBtnRef.current.blur();
        }
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isMenuOpen]);

  const currentActorId = activeProfile?.id || currentUserId || (session?.user as any)?.user_id || (session?.user as any)?.sub || session?.user?.id;
  const currentActorName = activeProfile?.name || session?.user?.name;

  const isOwner = Boolean(
    (currentActorId && authorId && String(authorId) === String(currentActorId)) || 
    (currentActorName && author?.name && author.name.trim().toLowerCase() === currentActorName.trim().toLowerCase())
  );

  const handleBlock = async () => {
    try {
      await blockUser(String(authorId));
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

  const isMe = String(authorId) === String(currentUserId || session?.user?.id);
  const baseCommentAuthorLink = isMe
    ? '/profile'
    : author?.isCompanyPost
    ? `/organization/${author?.authorSlug}`
    : `/profile/${author?.authorSlug || authorId}`;
  const authorLink = postId ? `${baseCommentAuthorLink}?sourcePostId=${postId}&commentId=${id}` : baseCommentAuthorLink;

  if (comment.actionState) {
    const message = comment.actionState.type === 'reported' 
      ? "Comment reported — Thanks for helping keep the community safe" 
      : `Comment ${comment.actionState.type} successfully`;
    
    return (
      <div id={`comment-${id}`} className="w-full">
        <CommentActionSnackbar 
          message={message} 
          onUndo={comment.actionState.type !== 'reported' ? () => {
            if (onUndo) {
              onUndo(id);
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('undo-comment-action', { detail: { commentId: id } }));
            }
          } : undefined}
        />
      </div>
    );
  }

  const hasCustomAvatar = Boolean(author?.avatar && author.avatar.trim() !== '');

  return (
    <div 
      id={`comment-${id}`} 
      className={`flex gap-[8px] relative group transition-all duration-300 font-dmsans ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Avatar Column */}
      <div className="flex-shrink-0 shrink-0 flex-none">
        <Link href={authorLink} className="block shrink-0 flex-none">
          <div className={`w-[24px] h-[24px] ${author?.isCompanyPost ? 'rounded-[4px]' : 'rounded-full'} bg-ds-surface-1 text-ds-text-secondary overflow-hidden flex items-center justify-center font-semibold text-[10px] font-dmsans select-none shrink-0 flex-none border border-ds-border`}>
            {hasCustomAvatar ? (
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
            <span data-fallback className="p-0.5 w-full h-full flex items-center justify-center text-ds-text-primary" style={{ display: hasCustomAvatar ? 'none' : 'flex' }}>
              <UserIcon className="w-full h-full text-ds-text-primary" />
            </span>
          </div>
        </Link>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Top Info Row */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col min-w-0 mr-2">
            <Link href={authorLink} className="leading-tight flex items-baseline gap-1.5 flex-wrap">
              {/* ORIGINAL: <span className="text-sm font-bold text-black">{author?.name || 'Anonymous'}</span> */}
              <span className="ds-text-body text-ds-text-primary truncate max-w-full">{author?.name || 'Anonymous'}</span>
            </Link>
            {author?.headline && (
              /* ORIGINAL: <span className="text-[12px] text-muted-foreground font-normal leading-tight mt-0.5">{author.headline}</span> */
              <span className="ds-text-meta text-ds-text-secondary mt-0.5 truncate max-w-full">
                {author.headline}
              </span>
            )}
          </div>
          
          {/* ORIGINAL: <div className="flex items-center gap-4 pt-1"> */}
          <div className="flex items-center gap-2 pt-1 shrink-0">
            {is_edited && (
              <>
                <span className="font-dmsans text-[10px] leading-[12px] font-normal text-ds-text-muted shrink-0 text-center">
                  Edited
                </span>
                <span className="w-1 h-1 rounded-full bg-ds-text-muted shrink-0 inline-block" />
              </>
            )}
            {/* ORIGINAL: <span className="text-[12px] text-muted-foreground whitespace-nowrap">{timeAgo}</span> */}
            <span className="ds-text-meta text-ds-text-secondary whitespace-nowrap">{timeAgo}</span>
            {!isPending && (
              <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={optionsBtnRef}
                    aria-label="More options"
                    onClick={(e) => e.stopPropagation()}
                    className="w-[20px] h-[20px] flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 rounded outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent transition-colors"
                  >
                    <Icon name="menu" className="w-[20px] h-[20px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  avoidCollisions={false}
                  hideWhenDetached={true}
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                  }}
                  style={{ zIndex: 35 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-[135px] flex flex-col items-start p-[12px] gap-[16px] bg-ds-surface-2 rounded-[8px] !border-none !outline-none !ring-0 shadow-none font-dmsans !z-[35] data-[state=closed]:!animate-none data-[state=closed]:!duration-0"
                >
                  <style>{`
                    [data-theme] [role="menuitem"].comment-menu-item:hover,
                    [data-theme] [role="menuitem"].comment-menu-item[data-highlighted],
                    [data-theme] [role="menuitem"].comment-menu-item:focus {
                      background-color: transparent !important;
                    }
                    [data-theme] [role="menuitem"].comment-menu-item:hover *,
                    [data-theme] [role="menuitem"].comment-menu-item[data-highlighted] * {
                      color: inherit !important;
                    }
                  `}</style>
                  {isOwner && (
                    <DropdownMenuItem
                      onSelect={() => onEdit?.(id, text)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(id, text);
                      }}
                      className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:!text-ds-text-secondary focus:!bg-transparent focus:!text-ds-text-secondary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-secondary"
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
                      className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full ds-text-secondary text-ds-error hover:!text-ds-error focus:!bg-transparent focus:!text-ds-error p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-error"
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
                        className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:!text-ds-text-secondary focus:!bg-transparent focus:!text-ds-text-secondary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-secondary"
                      >
                        Report
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => onHide?.(id)}
                        onClick={(e) => e.stopPropagation()}
                        className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full ds-text-secondary text-ds-text-secondary hover:!text-ds-text-secondary focus:!bg-transparent focus:!text-ds-text-secondary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-secondary"
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
          {formatCommentText(text, postId, id, comment.mentioned_users)}
        </div>

        {/* Action Bar (Styled like Figma) */}
        {/* ORIGINAL: <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black"> */}
        <div className="flex items-center gap-[8px] ds-text-small text-ds-text-primary">
          <button
            onClick={handleLike}
            className={`transition-colors flex items-center justify-center ${isLiked ? 'text-[var(--ds-like-active)]' : 'text-ds-text-secondary hover:text-ds-text-primary'}`}
            aria-label={isLiked ? "Unlike comment" : "Like comment"}
          >
            <Icon 
              name={isLiked ? "like-filled" : "like"} 
              className={`w-[14px] h-[14px] ${isLiked ? 'text-ds-accent' : ''}`}
            />
          </button>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">-</span> */}
          <span className="font-normal text-ds-text-secondary">-</span>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">{likes} {likes === 1 ? 'like' : 'likes'}</span> */}
          <span className="font-normal text-ds-text-secondary">{likes} {likes === 1 ? 'like' : 'likes'}</span>
          
          {/* Divider between likes and reply styled with theme border from newGlobal.css */}
          <div className="h-[14px] border-l border-ds-border mx-[4px] self-center" style={{ borderColor: 'var(--ds-border)' }} />

          <button
            onClick={() => onReply?.(author?.name || 'User', id, author?.account_name)}
            className="transition-colors"
          >
            Reply
          </button>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">-</span> */}
          <span className="font-normal text-ds-text-secondary">-</span>
          {/* ORIGINAL: <span className="font-normal text-muted-foreground">{comment.reply_count || 0} reply</span> */}
          <span className="font-normal text-ds-text-secondary">{comment.reply_count || 0} {(comment.reply_count || 0) === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>
    </div>
  );
}
