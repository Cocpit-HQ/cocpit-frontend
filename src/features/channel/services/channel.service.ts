import { Channel, ChannelArticle, ChannelInvitee, ChannelThought, GrowthPoint } from '../types/channel.types';
import {
  DUMMY_ARTICLES,
  DUMMY_DRAFT_ARTICLES,
  DUMMY_CHANNEL,
  DUMMY_GROWTH,
  DUMMY_INVITEES,
  DUMMY_THOUGHTS,
} from '../utils/dummy-channel-data';

// Mock-only in-memory "backend". No channel/article/subscriber endpoints exist yet —
// each function below is the future swap-in point for the real API call.
let mockChannel: Channel | null = null;
let mockArticles: ChannelArticle[] = [...DUMMY_ARTICLES, ...DUMMY_DRAFT_ARTICLES];
const mockThoughts: ChannelThought[] = [...DUMMY_THOUGHTS];
const mockInvitees: ChannelInvitee[] = [...DUMMY_INVITEES];

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export interface ChannelInput {
  name: string;
  description: string;
  bannerUrl: string;
  orgId?: string;
}

export async function getMyChannel(): Promise<Channel | null> {
  // TODO: replace with GET /channels/me
  await delay();
  return mockChannel;
}

export async function createChannel(input: ChannelInput): Promise<Channel> {
  // TODO: replace with POST /channels
  await delay();
  mockChannel = {
    id: uid('channel'),
    orgId: input.orgId || 'org-demo',
    name: input.name,
    description: input.description,
    bannerUrl: input.bannerUrl,
    subscriberCount: 0,
    createdAt: new Date().toISOString(),
  };
  return mockChannel;
}

export async function updateChannel(id: string, input: Partial<ChannelInput>): Promise<Channel> {
  // TODO: replace with PATCH /channels/:id
  await delay();
  if (!mockChannel || mockChannel.id !== id) {
    throw new Error('Channel not found');
  }
  mockChannel = { ...mockChannel, ...input };
  return mockChannel;
}

export async function getArticles(status?: 'published' | 'draft'): Promise<ChannelArticle[]> {
  // TODO: replace with GET /channels/:id/articles?status=
  await delay();
  const all = [...mockArticles].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return status ? all.filter((a) => a.status === status) : all;
}

export async function getArticleById(id: string): Promise<ChannelArticle | null> {
  // TODO: replace with GET /channels/articles/:id
  await delay();
  return mockArticles.find((a) => a.id === id) || null;
}

export interface ArticleInput {
  title: string;
  content: string;
  coverImage: string | null;
  excerpt: string;
  status: 'published' | 'draft';
}

export async function createArticle(channelId: string, input: ArticleInput): Promise<ChannelArticle> {
  // TODO: replace with POST /channels/:id/articles
  await delay();
  const now = new Date().toISOString();
  const article: ChannelArticle = {
    id: uid('article'),
    channelId,
    title: input.title,
    content: input.content,
    coverImage: input.coverImage,
    excerpt: input.excerpt,
    status: input.status,
    publishedAt: input.status === 'published' ? now : undefined,
    updatedAt: now,
  };
  mockArticles = [article, ...mockArticles];
  return article;
}

export async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<ChannelArticle> {
  // TODO: replace with PATCH /channels/articles/:id
  await delay();
  const existing = mockArticles.find((a) => a.id === id);
  if (!existing) throw new Error('Article not found');
  const now = new Date().toISOString();
  const wasPublished = existing.status === 'published';
  const nextStatus = input.status ?? existing.status;
  const updated: ChannelArticle = {
    ...existing,
    ...input,
    updatedAt: now,
    publishedAt: nextStatus === 'published' ? (existing.publishedAt || (!wasPublished ? now : existing.publishedAt)) : existing.publishedAt,
  };
  mockArticles = mockArticles.map((a) => (a.id === id ? updated : a));
  return updated;
}

export async function deleteArticle(id: string): Promise<boolean> {
  // TODO: replace with DELETE /channels/articles/:id
  await delay();
  mockArticles = mockArticles.filter((a) => a.id !== id);
  return true;
}

export async function getSubscriberGrowth(): Promise<GrowthPoint[]> {
  // TODO: replace with GET /channels/:id/subscriber-growth
  await delay();
  return DUMMY_GROWTH;
}

export async function getInvitees(search: string): Promise<ChannelInvitee[]> {
  // TODO: replace with GET /channels/:id/invitees?search=
  await delay(200);
  if (!search.trim()) return mockInvitees;
  const q = search.trim().toLowerCase();
  return mockInvitees.filter((u) => u.name.toLowerCase().includes(q));
}

export async function inviteUsers(userIds: string[]): Promise<boolean> {
  // TODO: replace with POST /channels/:id/invite
  await delay();
  userIds.forEach((id) => {
    const user = mockInvitees.find((u) => u.id === id);
    if (user) user.invited = true;
  });
  return true;
}

export async function getThoughts(articleId: string): Promise<ChannelThought[]> {
  // TODO: replace with GET /channels/articles/:id/thoughts
  await delay(200);
  return mockThoughts
    .filter((t) => t.articleId === articleId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addThought(
  articleId: string,
  text: string,
  authorName: string,
  authorAvatarUrl: string
): Promise<ChannelThought> {
  // TODO: replace with POST /channels/articles/:id/thoughts
  await delay(200);
  const thought: ChannelThought = {
    id: uid('thought'),
    articleId,
    authorName,
    authorAvatarUrl,
    text,
    createdAt: new Date().toISOString(),
  };
  mockThoughts.push(thought);
  return thought;
}

export async function deleteThought(id: string): Promise<boolean> {
  // TODO: replace with DELETE /channels/thoughts/:id
  await delay(200);
  const idx = mockThoughts.findIndex((t) => t.id === id);
  if (idx >= 0) mockThoughts.splice(idx, 1);
  return true;
}

export async function requestEditAccess(): Promise<boolean> {
  // TODO: replace with POST /channels/:id/request-edit-access
  await delay(200);
  return true;
}
