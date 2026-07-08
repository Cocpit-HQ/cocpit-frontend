import { Post, Comment as CommentType, Poll } from '@/types/entities';

export interface FeedPostProps extends Omit<Post, 'commentData'> {
  initialComments?: CommentType[];
  isDark?: boolean;
  onLike?: () => void;
  onShare?: () => void;
  isOwnPost?: boolean;
  onDelete?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  isLiked?: boolean;
  isProfileView?: boolean;
  priority?: boolean;
  authorSlug?: string;
  isCompanyPost?: boolean;
  is_saved?: boolean;
  is_commented?: boolean;
  onSaveChange?: (isSaved: boolean) => void;
  isFullContent?: boolean;
  is_broadcast?: boolean;
  broadcastOrgName?: string;
  initialShowComments?: boolean;
  sessionId?: string | null;
  imageFit?: 'cover' | 'contain';
  forceSquareMedia?: boolean;
}

export type FeedInteraction = {
  isLiked: boolean;
  likeCount: number;
  isSaved: boolean;
  isCommented: boolean;
  commentCount: number;
  sharesCount: number;
};
