/**
 * LikeBar Component
 * Added as part of liker display refactoring:
 * - Extracted reusable component for displaying post liker details ("Liked by [Name] and X others") and liker avatars.
 * - Supports 'overlay' (glassmorphism on post media) and 'inline' (below post text) layout variants.
 * - Handles filtering current viewer out of avatars and sanitizes display names to show first names.
 */
import React from 'react';
import { UserIcon } from '@/components/icons';

export interface LikeBarProps {
  likeCount?: number;
  isLiked?: boolean;
  sampleLikerUsername?: string;
  likedUsers?: any[];
  viewerUsername?: string;
  onShowLikes?: (e: React.MouseEvent) => void;
  variant?: 'overlay' | 'inline';
}

/** Extracts the first name from a user's display name or username */
export const getFirstName = (name?: string): string => {
  if (!name) return 'someone';
  const trimmed = name.trim();
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
};

export const LikeBar: React.FC<LikeBarProps> = ({
  likeCount = 0,
  isLiked = false,
  sampleLikerUsername,
  likedUsers = [],
  viewerUsername,
  onShowLikes,
  variant = 'inline',
}) => {
  if (likeCount <= 0 || (likeCount === 1 && isLiked) || !sampleLikerUsername) {
    return null;
  }

  const firstName = getFirstName(sampleLikerUsername);
  const otherCount = likeCount - (isLiked ? 2 : 1);

  const filteredLikedUsers = likedUsers && likedUsers.length > 0
    ? (viewerUsername
        ? likedUsers.filter((u: any) => u.username?.toLowerCase() !== viewerUsername.toLowerCase())
        : likedUsers)
    : [];

  const baseClasses = variant === 'overlay'
    ? "absolute bottom-[12px] left-[12px] flex flex-row items-center gap-[6px] px-[10px] py-[4px] bg-ds-bg/60 backdrop-blur-md border border-white/10 rounded-[16px] pointer-events-auto cursor-pointer hover:bg-ds-surface-2/90 transition-colors shadow-sm z-10 select-none"
    : "flex flex-row items-center justify-start gap-[6px] pointer-events-auto px-0 py-1 mt-[2px] cursor-pointer w-fit bg-transparent hover:opacity-80 transition-opacity select-none";

  return (
    <div
      className={baseClasses}
      onClick={(e) => {
        e.stopPropagation();
        onShowLikes?.(e);
      }}
    >
      <span className="text-[12px] font-normal leading-[16px] text-ds-text-primary flex items-center gap-[3px] truncate">
        <span>Liked by</span>{' '}
        {/* Bug fix: Removed underline styling from liker display name in feed */}
        <span className="font-semibold text-ds-text-primary max-w-[100px] truncate inline-block align-bottom">
          {firstName}
        </span>
        {otherCount > 0 && (
          <span>and {otherCount} {otherCount === 1 ? 'other' : 'others'}</span>
        )}
      </span>

      {filteredLikedUsers.length > 0 && (
        <div className="flex -space-x-1.5 items-center flex-shrink-0">
          {filteredLikedUsers.slice(0, 3).map((user: any, idx: number) => {
            const hasAvatar = user.avatar_url && user.avatar_url !== '/assets/pngegg.png';
            return hasAvatar ? (
              <img
                key={idx}
                src={user.avatar_url || undefined}
                alt={user.username || "user"}
                className="inline-block h-[16px] w-[16px] rounded-full border border-ds-surface-2 object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                key={idx}
                className="inline-flex h-[16px] w-[16px] rounded-full border border-ds-surface-2 bg-ds-surface-1 text-ds-text-primary font-medium text-[8px] items-center justify-center flex-shrink-0 select-none"
              >
                <UserIcon className="w-[60%] h-[60%] text-current" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LikeBar;
