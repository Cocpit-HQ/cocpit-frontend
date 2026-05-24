import { Area } from 'react-easy-crop';
import { Post, PostVisibility } from '@/types/entities';

export type PostType = 'text' | 'photo' | 'poll' | 'video' | 'article' | 'milestone' | 'expert';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPostType?: PostType;
  editPostId?: string;
  onUpdate?: (post: Partial<Post>) => void;
  sharedPostId?: string;
  sharedJobId?: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  onPostCreated?: () => void;
  initialSharedPost?: any;
}

export interface MediaItem {
  id: string;
  url: string;
  file?: File;
  type: 'image' | 'video';
  crop: { x: number; y: number };
  zoom: number;
  croppedBlobUrl?: string;
  pixelCrop?: { x: number; y: number; width: number; height: number };
  isExisting?: boolean;
  fitMode: 'cover' | 'contain';
  previewUrl?: string;
  flipH?: boolean;
  flipV?: boolean;
  rotation?: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface PollOption {
  id: string;
  text: string;
}

export type CategoryType =
  | 'Personal'
  | 'Professional'
  | 'Achievement'
  | 'Update'
  | 'Hiring'
  | 'Milestone'
  | 'Insight'
  | 'Announcement'
  | 'Academic'
  | 'Admission'
  | 'Campus Life'
  | 'Research'
  | 'Club Activity'
  | 'General';
