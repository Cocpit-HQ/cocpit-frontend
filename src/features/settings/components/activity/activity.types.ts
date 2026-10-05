export interface LikeActivityItem {
  id: string | number;
  postId?: string | number;
  user: string;
  role: string;
  avatarUrl: string;
  content: string;
  type: 'media' | 'text' | 'poll';
  imageUrl?: string;
  pollQuestion?: string;
  pollMeta?: string;
}

export interface CommentActivityItem {
  id: string | number;
  postId?: string | number;
  uniqueKey?: string;
  postAuthor: string;
  postTitle: string;
  authorAvatarUrl: string;
  commenter: string;
  commenterAvatarUrl: string;
  commentText: string;
  likesCount: number;
  repliesCount: number;
  mediaType: 'image' | 'video' | 'poll' | 'article' | 'text';
  imageUrl?: string;
  videoUrl?: string;
}

export interface TagActivityItem {
  id: string | number;
  postId?: string | number;
  user: string;
  role: string;
  avatarUrl: string;
  content: string;
  type: 'media' | 'text' | 'poll';
  imageUrl?: string;
  pollQuestion?: string;
  pollMeta?: string;
}
