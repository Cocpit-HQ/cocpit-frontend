import { Post } from '@/types/entities';
import { Session } from 'next-auth';
import React from 'react';

export interface ArticleUIProps {
  post: Post;
  id: string;
  coverImage: string | null;
  sanitizedHtml: string;
  authorProfileHref: string;
  authorUserId: string | undefined;
  isMe: boolean;
  canManage: boolean;
  isCompany: boolean;
  session: Session | null;
  activeProfileId?: string | number;
  menuAccess?: import('../../utils/postMenuAccess').PostMenuAccess;
  hasPostInteractions?: boolean;

  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  isCommented: boolean;
  shareCount: number;
  externalShareCount: number;
  isReposted: boolean;
  isRepostedWithThoughts: boolean;
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;

  handleClose: () => void;
  handleLike: (isCompany: boolean, activeProfileId?: string) => void;
  handleToggleFollow: () => void;
  isFollowActionLoading: boolean;
  isAuthorFollowing: boolean;
  handleIncrementCommentCount: () => void;
  handleDecrementCommentCount: () => void;
  handleMenuClick: (e: React.MouseEvent) => void;
  handleDirectRepost: () => void;
  setIsShareModalOpen: (val: boolean) => void;
  setIsSaveModalOpen: (val: boolean) => void;
  setIsLikesModalOpen: (val: boolean) => void;
  handleRepostWithThoughts: () => void;

  contentRef: React.RefObject<HTMLDivElement | null>;
}
