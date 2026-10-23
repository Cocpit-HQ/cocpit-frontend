import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, Trash2, Heart, Flag, Ban, Link as LinkIcon, Pin } from 'lucide-react';
import { UserIcon, BusinessBuildingIcon } from '@/components/icons';
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
import { useCompanyPermissions } from '@/features/businessProfile';
import { Icon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { CommentActionSnackbar } from './CommentActionSnackbar';
import { useUIStore } from '@/store/ui.store';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface ExpandableCommentTextProps {
  text: string | null | undefined;
  postId?: string | number;
  commentId?: string | number;
  mentionedUsers?: { user_id: string; full_name: string; account_name: string }[];
  maxLines?: number;
}

function ExpandableCommentText({
  text,
  postId,
  commentId,
  mentionedUsers,
  maxLines = 4,
}: ExpandableCommentTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [truncatedText, setTruncatedText] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  useEffect(() => {
    if (!text) {
      setIsOverflowing(false);
      setTruncatedText(null);
      return;
    }

    const measurer = measurerRef.current;
    if (!measurer) return;

    const measure = () => {
      // Clean display text for measurer by unwrapping mentions @[Display](handle) -> Display
      const getMeasurerContent = (raw: string) => {
        return raw.replace(/@\[([^\]]+)\]\([^)]+\)/g, '$1');
      };

      const computedStyle = window.getComputedStyle(measurer);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
      const maxHeight = maxLines * lineHeight;

      measurer.textContent = getMeasurerContent(text);
      if (measurer.scrollHeight <= maxHeight + 2) {
        setIsOverflowing(false);
        setTruncatedText(null);
        return;
      }

      setIsOverflowing(true);

      // Split keeping structured mentions and whitespace tokens intact
      const tokens = text.split(/(@\[[^\]]+\]\([^)]+\)|\s+)/);
      if (tokens.length === 0) {
        setTruncatedText(null);
        return;
      }

      const testFit = (candidateText: string) => {
        measurer.innerHTML = '';
        measurer.appendChild(document.createTextNode(getMeasurerContent(candidateText)));
        const seeMoreSpan = document.createElement('span');
        seeMoreSpan.textContent = '...See more';
        measurer.appendChild(seeMoreSpan);
        return measurer.scrollHeight <= maxHeight + 2;
      };

      let low = 1;
      let high = tokens.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = tokens.slice(0, mid).join('').trimEnd();
        const cleanCandidate = candidate.replace(/[,;:\s—\-]+$/, '');

        if (testFit(cleanCandidate)) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let finalTruncated = '';
      if (best > 0) {
        finalTruncated = tokens.slice(0, best).join('').trimEnd().replace(/[,;:\s—\-]+$/, '');
      }

      // Fallback for single long token exceeding maxLines
      if ((best === 0 || !testFit(finalTruncated)) && tokens[0]) {
        let charLow = 1;
        let charHigh = tokens[0].length;
        let bestChar = 1;
        while (charLow <= charHigh) {
          const charMid = Math.floor((charLow + charHigh) / 2);
          const charCandidate = tokens[0].slice(0, charMid);
          if (testFit(charCandidate)) {
            bestChar = charMid;
            charLow = charMid + 1;
          } else {
            charHigh = charMid - 1;
          }
        }
        finalTruncated = tokens[0].slice(0, bestChar);
      }

      setTruncatedText(finalTruncated || null);
    };

    measure();

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [text, maxLines]);

  const activeText = !isExpanded && isOverflowing && truncatedText !== null ? truncatedText : text;

  return (
    <div ref={containerRef} className="w-full relative mb-2">
      {/* Offscreen measurer that accurately mirrors typography and width */}
      <div
        ref={measurerRef}
        aria-hidden="true"
        className="ds-text-small leading-[16px] whitespace-pre-wrap break-words pointer-events-none invisible absolute top-0 left-0 right-0 -z-50"
      />

      {/* Main Comment Text */}
      <div
        style={
          !isExpanded && isOverflowing
            ? { maxHeight: `${maxLines * 16 + 4}px`, overflow: 'hidden' }
            : undefined
        }
        className="ds-text-small text-ds-text-primary leading-[16px] whitespace-pre-wrap break-words"
      >
        {formatCommentText(activeText, postId, commentId, mentionedUsers)}

        {isOverflowing && !isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="inline whitespace-nowrap select-none cursor-pointer border-none bg-transparent p-0 align-baseline ml-0.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-ds-text-primary">...</span>
            <span className="text-ds-accent font-semibold">See more</span>
          </button>
        )}
      </div>

      {isOverflowing && isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(false);
          }}
          className="block mt-1 cursor-pointer font-semibold text-[11px] leading-[14px] text-ds-accent hover:opacity-80 transition-opacity border-none bg-transparent p-0"
        >
          See less
        </button>
      )}
    </div>
  );
}

export default function Comment({ comment, onReply, onDelete, onEdit, currentUserId, variant = 'root', isGrouped = false, isPostOwner, postId, onReport, onHide, onUndo }: CommentProps) {
  const { author, text, timeAgo, like_count, is_liked, is_pinned, authorId, id, isPending, is_edited } = comment;
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions(activeProfile);
  const hasPostInteractions = !isCompany || checkPermission('CREATE_POST');
  const { blockUser } = useSocial();

  const [isLiked, setIsLiked] = useState(is_liked);
  const [likes, setLikes] = useState(like_count);
  const [isPinned, setIsPinned] = useState(is_pinned || false);
  const menuKey = id ? `comment-${id}` : 'comment-options';
  const isMenuOpen = useUIStore((state) => state.activeOpenMenuId === menuKey);
  const setIsMenuOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    const currentOpen = useUIStore.getState().activeOpenMenuId === menuKey;
    const nextOpen = typeof open === 'function' ? open(currentOpen) : open;

    // Purpose of Bug Fix: When opening the comment options menu, dispatch global event to close any open Post option menus
    // This prevents overlaps when Post menus use local state (e.g., in ArticleViewPage) and Comment menus use global state.
    if (nextOpen) {
      document.dispatchEvent(new CustomEvent('closeAllPostMenus'));
    }
    useUIStore.getState().setActiveOpenMenuId(nextOpen ? menuKey : null);
  };
  const isMobile = useIsMobile();
  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  // Purpose of Bug Fix: Listen to the global event so the Comment menu automatically closes if a Post menu is opened
  useEffect(() => {
    const handleCloseMenus = () => {
      if (useUIStore.getState().activeOpenMenuId === menuKey) {
        useUIStore.getState().setActiveOpenMenuId(null);
      }
    };
    document.addEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    return () => {
      document.removeEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    };
  }, [menuKey]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleScrollOrResize = () => {
      if (!optionsBtnRef.current) return;
      const rect = optionsBtnRef.current.getBoundingClientRect();
      const isDrawer = Boolean(optionsBtnRef.current.closest('[data-vaul-drawer]'));
      const topBoundary = isDrawer ? 0 : 90; // Fixed top header boundary on desktop
      if (rect.bottom <= topBoundary || rect.top >= window.innerHeight) {
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
                className={`w-full h-full object-cover ${author?.isCompanyPost ? 'rounded-[4px]' : 'rounded-full'}`}
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
              {author?.isCompanyPost ? (
                <BusinessBuildingIcon className="w-full h-full text-ds-text-primary" />
              ) : (
                <UserIcon className="w-full h-full text-ds-text-primary" />
              )}
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
            {!isPending && hasPostInteractions && (
              <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={optionsBtnRef}
                    aria-label="More options"
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-[28px] min-h-[28px] -mr-1 flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 rounded outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent transition-colors cursor-pointer"
                  >
                    <Icon name="menu" className="w-[20px] h-[20px] pointer-events-none" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                  }}
                  style={{
                    backgroundColor: 'var(--ds-bg)',
                    borderColor: 'var(--ds-border)',
                    width: '135px',
                    minWidth: '135px',
                    zIndex: (isMobile || Boolean(optionsBtnRef.current?.closest('[data-vaul-drawer]'))) ? 150 : 30,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "w-[135px] min-w-[135px] flex flex-col items-start p-[12px] gap-[16px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] shadow-xl !outline-none !ring-0 font-dmsans data-[state=closed]:!animate-none data-[state=closed]:!duration-0 box-border",
                    (isMobile || Boolean(optionsBtnRef.current?.closest('[data-vaul-drawer]'))) ? "!z-[150]" : "!z-[30]"
                  )}
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
                      onSelect={() => {
                        setTimeout(() => {
                          onEdit?.(id, text);
                        }, 50);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeout(() => {
                          onEdit?.(id, text);
                        }, 50);
                      }}
                      className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full font-['DM_Sans'] text-[14px] leading-[20px] font-normal whitespace-nowrap text-ds-text-secondary hover:!text-ds-text-primary focus:!bg-transparent focus:!text-ds-text-primary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-primary h-[20px] flex items-center"
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
                      className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full font-['DM_Sans'] text-[14px] leading-[20px] font-normal whitespace-nowrap text-ds-error hover:!text-ds-error focus:!bg-transparent focus:!text-ds-error p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-error h-[20px] flex items-center"
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
                        className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full font-['DM_Sans'] text-[14px] leading-[20px] font-normal whitespace-nowrap text-ds-text-secondary hover:!text-ds-text-primary focus:!bg-transparent focus:!text-ds-text-primary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-primary h-[20px] flex items-center"
                      >
                        Report
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => onHide?.(id)}
                        onClick={(e) => e.stopPropagation()}
                        className="profile-switcher-item comment-menu-item cursor-pointer outline-none w-full font-['DM_Sans'] text-[14px] leading-[20px] font-normal whitespace-nowrap text-ds-text-secondary hover:!text-ds-text-primary focus:!bg-transparent focus:!text-ds-text-primary p-0 !bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:!text-ds-text-primary h-[20px] flex items-center"
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
        <ExpandableCommentText
          text={text}
          postId={postId}
          commentId={id}
          mentionedUsers={comment.mentioned_users}
          maxLines={4}
        />

        {/* Action Bar (Styled like Figma) */}
        {/* ORIGINAL: <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black"> */}
        <div className="flex items-center gap-[8px] ds-text-small text-ds-text-primary">
          <button
            disabled={!hasPostInteractions}
            onClick={hasPostInteractions ? handleLike : undefined}
            className={`transition-colors flex items-center justify-center ${!hasPostInteractions ? 'opacity-30 cursor-default' : ''} ${isLiked ? 'text-[var(--ds-like-active)]' : 'text-ds-text-secondary hover:text-ds-text-primary'}`}
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
            disabled={!hasPostInteractions}
            onClick={hasPostInteractions ? () => onReply?.(author?.name || 'User', id, author?.account_name) : undefined}
            className={`transition-colors ${!hasPostInteractions ? 'opacity-30 cursor-default' : 'cursor-pointer'}`}
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
