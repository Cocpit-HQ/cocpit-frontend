'use client';

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Globe, EyeOff, Star, Link2, Flag, Edit2, BarChart2, Trash2, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Icon } from "@iconify/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  location?: string;
  tags?: any[];
  authorRole?: string;
  title?: string | null;
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, timeAgo, visibility,
  isMe, isOwnPost, isCompanyPost, poll, shared_post,
  optionsBtnRef, showOptions, setShowOptions, optionsPos, setOptionsPos,
  onEdit, onDelete, onToggleVisibility, onShowAnalytics, onReport,
  location, tags, authorRole, title
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
    <div className="flex flex-row justify-between items-start p-0 gap-[8px] w-full">
      {/* Author Info (Frame 2608571) */}
      <div className="flex flex-row items-center p-0 gap-[8px]">
        {/* Avatar (Ellipse 10) */}
        <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex-shrink-0 bg-muted">
          <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
        </div>

        {/* Name & Role (Frame 2608568) */}
        <div className="flex flex-col items-start p-0">
          <div className="flex items-center gap-1 h-[24px]">
            {isMe || (!isCompanyPost && !authorId) ? (
              <h3 className="text-foreground text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] cursor-default">
                {author}
              </h3>
            ) : (
              <Link href={authorLink} className="hover:underline block">
                <h3 className="text-foreground text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)]">
                  {author}
                </h3>
              </Link>
            )}
            {isCompanyPost && (
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary" />
            )}
            {shared_post && (
              <span className="text-muted-foreground text-[14px] leading-[24px] font-normal font-[family-name:var(--font-poppins)] ml-1">
                reposted
              </span>
            )}
          </div>
          <p className="text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
            {authorRole || title || 'Designer'}
          </p>
          {(location || timeAgo) && (
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
              {location && <span>{location}</span>}
              {location && timeAgo && <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />}
              {timeAgo && <span>{timeAgo}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Metadata & Menu (Right side) */}
      <div className="flex flex-row items-center gap-[12px] h-[40px]">
        <div className="flex items-center gap-1">
          {/* Tag icon */}
          {tags && tags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none text-muted-foreground hover:text-foreground data-[state=open]:text-primary">
                  <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[180px] h-[136px] p-2 bg-card border border-border rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-[210]"
                align="end"
                sideOffset={8}
              >
                <div className="flex flex-col gap-1">
                  {tags.map((tag: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-[12px] transition-colors cursor-pointer group">
                      <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center overflow-hidden bg-muted">
                        {tag.avatar_url || tag.avatar ? (
                          <img src={tag.avatar_url || tag.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon icon="solar:user-linear" className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[14px] leading-[20px] font-normal text-foreground font-[family-name:var(--font-poppins)] transition-colors">
                        {tag.full_name || tag.name}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <div className="relative">
            <button
              ref={optionsBtnRef}
              onClick={handleOptionsClick}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Icon icon="solar:menu-dots-bold" className="w-[24px] h-[24px] rotate-90" />
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
    </div>
  );
};
