import api from '@/lib/axios';
import { uploadMedia } from '@/services/api/upload';
import { Channel, ChannelArticle, ChannelInvitee, ChannelThought, GrowthPoint } from '../types/channel.types';

export interface ChannelInput {
  name: string;
  description: string;
  bannerUrl: string;
  orgId?: string;
}

export interface ArticleInput {
  title: string;
  content: string;
  coverImage: string | null;
  excerpt: string;
  status: 'published' | 'draft';
}

/** Helper to fetch an image URL and convert it to a File object for FormData */
async function urlToFile(url: string, filename: string): Promise<File> {
  // If it's already a blob URL or external URL, fetch and convert
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

export async function getMyChannel(orgId: string): Promise<Channel | null> {
  if (!orgId) return null;
  try {
    const res = await api.get(`/organizations/${orgId}/community/status`);
    if (!res.data.has_community || !res.data.community) {
      return null;
    }
    const data = res.data.community;
    return {
      id: data.id || data.community_id,
      orgId: data.orgId || data.org_id || orgId,
      name: data.name,
      description: data.description,
      bannerUrl: data.bannerUrl || data.banner_url,
      subscriberCount: data.subscriberCount || data.subscriber_count || 0,
      createdAt: new Date().toISOString(), // Backend doesn't provide this yet
    };
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function createChannel(orgId: string, input: ChannelInput): Promise<Channel> {
  const formData = new FormData();
  formData.append('name', input.name);
  formData.append('description', input.description);
  
  if (input.bannerUrl) {
    try {
      const file = await urlToFile(input.bannerUrl, 'banner.jpg');
      formData.append('banner', file);
    } catch (e) {
      console.warn("Failed to convert bannerUrl to File", e);
    }
  }

  const res = await api.post(`/organizations/${orgId}/community`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data.data;
  return {
    id: data.id || data.community_id,
    orgId: data.orgId || data.org_id || orgId,
    name: data.name,
    description: data.description,
    bannerUrl: data.bannerUrl || data.banner_url,
    subscriberCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function updateChannel(orgId: string, input: Partial<ChannelInput>): Promise<Channel> {
  const formData = new FormData();
  if (input.name) formData.append('name', input.name);
  if (input.description) formData.append('description', input.description);
  
  if (input.bannerUrl) {
    try {
      const file = await urlToFile(input.bannerUrl, 'banner.jpg');
      formData.append('banner', file);
    } catch (e) {
      console.warn("Failed to convert bannerUrl to File", e);
    }
  }

  const res = await api.put(`/organizations/${orgId}/community`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data.data;
  return {
    id: data.id || data.community_id,
    orgId: data.orgId || data.org_id || orgId,
    name: data.name,
    description: data.description,
    bannerUrl: data.bannerUrl || data.banner_url,
    subscriberCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export interface ArticlesResponse {
  articles: ChannelArticle[];
  nextCursor: string | null;
  total: number;
}

export async function getArticles(
  communityId: string,
  status?: 'published' | 'draft',
  cursor?: string | null,
  limit: number = 10
): Promise<ArticlesResponse> {
  if (!communityId) return { articles: [], nextCursor: null, total: 0 };
  const res = await api.get(`/communities/${communityId}/articles`, {
    params: { status, cursor, limit }
  });
  
  const articles = res.data.data.map((item: any) => ({
    id: item.id || item.post_id,
    channelId: communityId,
    title: item.title,
    content: item.content,
    coverImage: item.coverImage || item.banner_url || null,
    excerpt: '', // Backend doesn't support excerpt
    status: item.status || 'published',
    publishedAt: item.publishedAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at,
  }));

  return {
    articles,
    nextCursor: res.data.nextCursor || null,
    total: res.data.total || 0,
  };
}

export async function getArticleById(id: string): Promise<ChannelArticle | null> {
  try {
    const res = await api.get(`/post/${id}`);
    const item = res.data;
    
    let coverImage = null;
    if (item.media_urls && item.media_urls.length > 0) {
        coverImage = item.media_urls[0].url || item.media_urls[0];
    } else if (item.media && item.media.length > 0) {
        coverImage = item.media[0].url || item.media[0];
    }
    
    return {
      id: item.id || item.post_id || id,
      channelId: item.channelId || item.author_org_id || '', 
      title: item.title || '',
      content: item.content || '',
      coverImage: coverImage,
      excerpt: '',
      status: item.status || 'published',
      publishedAt: item.publishedAt || item.created_at || new Date().toISOString(),
      updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function createArticle(channelId: string, input: ArticleInput): Promise<ChannelArticle> {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('content', input.content);
  formData.append('post_type', 'article');
  formData.append('category', 'Insight'); // <-- Backend requires this for company posts
  formData.append('companyId', channelId);
  formData.append('visibility', 'public');
  formData.append('is_community_article', 'true');
  if (input.status) {
    formData.append('status', input.status);
  }
  
  if (input.coverImage) {
    try {
      const file = await urlToFile(input.coverImage, 'cover.jpg');
      formData.append('media', file);
    } catch (e) {
      console.warn("Failed to convert coverImage to File", e);
    }
  }
  
  const res = await api.post(`/post`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  const data = res.data;
  
  return {
    id: data.postId || data.post_id,
    channelId: channelId,
    title: data.title || input.title,
    content: data.content || input.content,
    coverImage: input.coverImage, 
    excerpt: input.excerpt || '',
    status: input.status || 'published',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateArticle(id: string, orgId: string, input: Partial<ArticleInput>): Promise<ChannelArticle> {
  let coverImageUrl = input.coverImage;
  
  if (input.coverImage && (input.coverImage.startsWith('data:') || input.coverImage.startsWith('blob:'))) {
    try {
      const file = await urlToFile(input.coverImage, 'cover.jpg');
      const uploadedUrls = await uploadMedia([file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
         coverImageUrl = uploadedUrls[0];
      }
    } catch (e) {
      console.warn("Failed to upload coverImage", e);
    }
  }

  const payload = {
    title: input.title,
    content: input.content,
    companyId: orgId,
    media_urls: input.coverImage === undefined ? undefined : (coverImageUrl ? [coverImageUrl] : []),
    status: input.status,
    is_community_article: true,
  };
  
  const res = await api.put(`/post/${id}`, payload);
  const data = res.data.data || res.data;
  
  return {
    id: data.post_id || id,
    channelId: data.author_org_id || '',
    title: data.title || input.title || '',
    content: data.content || input.content || '',
    coverImage: input.coverImage || null,
    excerpt: input.excerpt || '',
    status: data.status || input.status || 'published',
    publishedAt: data.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteArticle(id: string, orgId: string): Promise<boolean> {
  await api.delete(`/post/${id}`, { data: { companyId: orgId } });
  return true;
}

export async function getSubscriberGrowth(orgId: string): Promise<GrowthPoint[]> {
  const res = await api.get(`/organizations/${orgId}/community/growth`);
  return res.data.data;
}

export async function getInvitees(orgId: string, search: string): Promise<ChannelInvitee[]> {
  if (!orgId) return [];
  const res = await api.get(`/organizations/${orgId}/community/invite-suggestions`, {
    params: { search }
  });
  
  return res.data.data.map((user: any) => ({
    id: user.id || user.user_id,
    name: user.name,
    avatarUrl: user.avatarUrl || user.avatar,
    headline: user.headline,
    invited: user.isInvited || user.is_invited,
  }));
}

export async function inviteUsers(orgId: string, userIds: string[]): Promise<boolean> {
  await Promise.all(
    userIds.map(id => api.post(`/organizations/${orgId}/community/invite`, { invitee_id: id }))
  );
  return true;
}

export async function getThoughts(articleId: string): Promise<ChannelThought[]> {
  const res = await api.get(`/post/${articleId}/comments`);
  
  return res.data.map((comment: any) => ({
    id: comment.comment_id,
    articleId: articleId,
    parentId: comment.parent_id || undefined,
    authorName: comment.full_name || comment.author_name,
    authorAvatarUrl: comment.avatar_url || comment.author_avatar,
    text: comment.content || comment.text,
    createdAt: comment.created_at || new Date().toISOString(),
  }));
}
 
export async function addThought(
  articleId: string,
  text: string,
  authorName: string,
  authorAvatarUrl: string,
  parentId?: string
): Promise<ChannelThought> {
  const res = await api.post(`/post/${articleId}/comments`, { content: text, parent_id: parentId });
  
  const comment = res.data.comment;
  return {
    id: comment.comment_id,
    articleId: articleId,
    parentId: comment.parent_id || undefined,
    authorName: comment.full_name || authorName,
    authorAvatarUrl: comment.avatar_url || authorAvatarUrl,
    text: comment.content || text,
    createdAt: comment.created_at || new Date().toISOString(),
  };
}

export async function deleteThought(id: string): Promise<boolean> {
  await api.delete(`/comments/${id}`);
  return true;
}

export async function requestEditAccess(orgId: string): Promise<boolean> {
  await api.post(`/organizations/${orgId}/community/request-access`);
  return true;
}

export async function getRecommendedChannels(): Promise<Channel[]> {
  const res = await api.get('/communities/recommended');
  return res.data.data.map((item: any) => ({
    id: item.id || item.community_id,
    orgId: item.orgId || item.org_id,
    name: item.name,
    description: item.description,
    bannerUrl: item.bannerUrl || item.banner_url,
    subscriberCount: item.subscriberCount || item.subscriber_count || 0,
    companyName: item.companyName || item.company_name,
    logoUrl: item.logoUrl || item.logo_url,
    isSubscribed: false,
    isOwner: false,
  }));
}

export async function getSubscribedChannels(): Promise<Channel[]> {
  const res = await api.get('/communities/subscriptions');
  return res.data.data.map((item: any) => ({
    id: item.id || item.community_id,
    orgId: item.orgId || item.org_id,
    name: item.name,
    description: item.description,
    bannerUrl: item.bannerUrl || item.banner_url,
    subscriberCount: item.subscriberCount || item.subscriber_count || 0,
    companyName: item.companyName || item.company_name,
    companySlug: item.companySlug || item.company_slug,
    logoUrl: item.logoUrl || item.logo_url,
    isSubscribed: true,
    isOwner: item.isOwner || item.is_owner || false,
  }));
}

export async function searchChannels(query: string): Promise<Channel[]> {
  const res = await api.get('/communities/search', {
    params: { q: query }
  });
  return res.data.data.map((item: any) => ({
    id: item.id || item.community_id,
    orgId: item.orgId || item.org_id,
    name: item.name,
    description: item.description,
    bannerUrl: item.bannerUrl || item.banner_url,
    subscriberCount: item.subscriberCount || item.subscriber_count || 0,
    companyName: item.companyName || item.company_name,
    logoUrl: item.logoUrl || item.logo_url,
    isSubscribed: item.isSubscribed || item.is_subscribed || false,
    isOwner: item.isOwner || item.is_owner || false,
  }));
}

export async function getPublicChannel(communityId: string): Promise<Channel | null> {
  try {
    const res = await api.get(`/communities/${communityId}`);
    const data = res.data.data;
    return {
      id: data.id || data.community_id,
      orgId: data.orgId || data.org_id,
      name: data.name,
      description: data.description,
      bannerUrl: data.bannerUrl || data.banner_url,
      subscriberCount: data.subscriberCount || data.subscriber_count || 0,
      companyName: data.companyName || data.company_name,
      companySlug: data.companySlug || data.company_slug,
      logoUrl: data.logoUrl || data.logo_url,
      isSubscribed: data.isSubscribed || data.is_subscribed || false,
      isOwner: data.isOwner || data.is_owner || false,
    };
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function subscribeToCommunity(communityId: string): Promise<any> {
  const res = await api.post(`/communities/${communityId}/subscribe`);
  return res.data;
}

export async function unsubscribeFromCommunity(communityId: string): Promise<any> {
  const res = await api.delete(`/communities/${communityId}/unsubscribe`);
  return res.data;
}

