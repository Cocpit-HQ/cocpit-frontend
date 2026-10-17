import { Post, Comment as CommentType, Poll } from '@/types/entities';
import { PostMenuAccess } from './utils/postMenuAccess';

export interface FeedPostProps extends Omit<Post, 'commentData'> {
  initialComments?: CommentType[];
  isDark?: boolean;
  onLike?: () => void;
  onShare?: () => void;
  isOwnPost?: boolean;
  /** Tri-state post-menu visibility; takes precedence over isOwnPost when set. */
  menuAccess?: PostMenuAccess;
  onDelete?: (id: string) => void;
  onEdit?: (post: any) => void;
  onRepostWithThoughts?: (post: any) => void;
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
  onCommentClickOverride?: () => void;
  authorRole?: string;
  /** z-index override for the post-options dropdown (useful inside high-z overlays). */
  menuZIndex?: number;
  className?: string;
}

export type FeedInteraction = {
  isLiked: boolean;
  likeCount: number;
  isSaved: boolean;
  isCommented: boolean;
  commentCount: number;
  sharesCount: number;
};

export * from './components/create-post/types';
