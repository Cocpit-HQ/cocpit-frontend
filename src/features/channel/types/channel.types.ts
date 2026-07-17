export interface Channel {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  subscriberCount: number;
  createdAt?: string;
  companyName?: string;
  companySlug?: string;
  logoUrl?: string;
  isSubscribed?: boolean;
  isOwner?: boolean;
}

export interface ChannelArticle {
  id: string;
  channelId: string;
  title: string;
  content: string;
  coverImage: string | null;
  excerpt: string;
  status: 'published' | 'draft';
  publishedAt?: string;
  updatedAt: string;
  isSubscribed?: boolean;
}

export interface GrowthPoint {
  date: string;
  subscribers: number;
}

export interface ChannelInvitee {
  id: string;
  name: string;
  avatarUrl: string;
  headline?: string;
  invited?: boolean;
}

export interface ChannelThought {
  id: string;
  articleId: string;
  parentId?: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
  authorId?: string;
}

export type CollaborationMode = 'select' | 'pan' | 'comment';
