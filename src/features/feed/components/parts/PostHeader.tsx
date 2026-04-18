import React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Globe, EyeOff, Star, Link2, Flag, Edit2, BarChart2, Trash2, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostHeaderProps {
  id: string | number;
  author: string;
  authorId?: string | number;
  authorAvatar?: string;
  authorSlug?: string;
  timeAgo: string;
  visibility: string;
  isMe: boolean;
  isOwnPost?: boolean;
  isCompanyPost?: boolean;
  poll?: any;
  shared_post?: any;
  optionsBtnRef: React.RefObject<HTMLButtonElement | null>;
  showOptions: boolean;
  setShowOptions: (val: boolean) => void;
  optionsPos: { top: number; right: number } | null;
  setOptionsPos: (pos: { top: number; right: number } | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onShowAnalytics: () => void;
  onReport: () => void;
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, timeAgo, visibility,
  isMe, isOwnPost, isCompanyPost, poll, shared_post,
  optionsBtnRef, showOptions, setShowOptions, optionsPos, setOptionsPos,
  onEdit, onDelete, onToggleVisibility, onShowAnalytics, onReport
}: PostHeaderProps) => {
  const avatarSrc = authorAvatar || '/assets/pngegg.png';

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOptions) {
      const rect = optionsBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setOptionsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
    }
    setShowOptions(!showOptions);
  };

  const authorLink = isCompanyPost ? `/organization/${authorSlug}` : `/profile/${authorSlug || authorId}`;

  return (
    <div className="flex items-start justify-between mb-2">
      <div className="flex gap-3">
        {isMe || (!isCompanyPost && !authorId) ? (
          <div className="block flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-default">
              <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <Link href={authorLink} className="block flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
              <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
            </div>
          </Link>
        )}
        <div>
          {isMe || (!isCompanyPost && !authorId) ? (
            <h3 className="text-foreground text-sm font-semibold cursor-default leading-tight">{author}</h3>
          ) : (
            <Link href={authorLink} className="hover:underline block">
              <h3 className="text-foreground text-sm font-semibold leading-tight">{author}</h3>
            </Link>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <p className="text-[11px] leading-tight text-muted-foreground">{timeAgo} •</p>
              {visibility === 'private' ? (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Globe className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <button
            ref={optionsBtnRef}
            onClick={handleOptionsClick}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showOptions && optionsPos && typeof document !== 'undefined' && createPortal(
            <>
              <div className="fixed inset-0 z-[199]" onClick={() => setShowOptions(false)} />
              <div
                className="fixed w-48 bg-card border border-border rounded-lg shadow-lg z-[200] overflow-hidden"
                style={{ top: optionsPos.top, right: optionsPos.right }}
              >
                {!isOwnPost && (
                  <>
                    <button
                      onClick={() => setShowOptions(false)}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                    >
                      <Star className="w-4 h-4" />
                      <span>Add to favorites</span>
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
                          toast.success("Link copied!");
                        }
                        setShowOptions(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Copy link</span>
                    </button>
                    <button
                      onClick={() => { onReport(); setShowOptions(false); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report</span>
                    </button>
                  </>
                )}

                {isOwnPost && (
                  <>
                    {!poll && (
                      <button
                        onClick={() => { onEdit(); setShowOptions(false); }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Post</span>
                      </button>
                    )}
                    {poll && (
                      <button
                        onClick={() => { onShowAnalytics(); setShowOptions(false); }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                      >
                        <BarChart2 className="w-4 h-4" />
                        <span>View Poll Analytics</span>
                      </button>
                    )}
                    <button
                      onClick={onToggleVisibility}
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-b border-border text-foreground hover:bg-muted"
                      )}
                    >
                      {visibility === 'private' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                    </button>
                    <button
                      onClick={onDelete}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};
