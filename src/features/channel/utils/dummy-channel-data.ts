import { Channel, ChannelArticle, ChannelInvitee, ChannelThought, GrowthPoint } from '../types/channel.types';

export const DUMMY_CHANNEL: Channel = {
  id: 'channel-1',
  orgId: 'org-demo',
  name: 'Nexsus Global Systems',
  description: 'Stay updated with the latest advancements and trends in the tech world by subscribing to our Technology Newsletters.',
  bannerUrl: '/images/CHANNEL/ChannelArticle-.png',
  subscriberCount: 889,
  createdAt: '2026-05-01T09:00:00.000Z',
};

export const DUMMY_ARTICLES: ChannelArticle[] = [
  {
    id: 'article-1',
    channelId: 'channel-1',
    title: 'Beyond The Screen: The Rise of Cognitive-First Networking',
    content: `<h1>Beyond The Screen: The Rise of Cognitive-First Networking</h1>
      <p>Work is evolving faster than ever. From remote teams to AI-assisted workflows, the way we build careers is no longer traditional. I'll break down what's changing and why it matters.</p>
      <p>AI is becoming part of daily workflows. Examples:</p>
      <ul><li>Writing assistance</li><li>Design generation</li><li>Code debugging</li><li>Idea brainstorming</li></ul>`,
    coverImage: '/images/CHANNEL/articleimage.png',
    excerpt: "How Cocpit is redefining the workspace for decentralized teams across 15 timezones...",
    status: 'published',
    publishedAt: '2026-05-20T10:00:00.000Z',
    updatedAt: '2026-05-20T10:00:00.000Z',
  },
  {
    id: 'article-2',
    channelId: 'channel-1',
    title: 'The Synthesis Layer',
    content: `<h1>The Synthesis Layer</h1>
      <p>In the past, networking was a game of volume. Today, it's a game of resonance. By utilizing large language models to interpret our output — commits, designs, strategy docs — we are moving toward a 'liquid identity' where your skills are verified by the collective AI intelligence of the network itself.</p>`,
    coverImage: '/images/CHANNEL/articleimage1.png',
    excerpt: "How Cocpit is redefining the workspace for decentralized teams across 15 timezones...",
    status: 'published',
    publishedAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'article-3',
    channelId: 'channel-1',
    title: 'Navigating the Hybrid Era: A Blueprint for Leaders',
    content: `<h1>Navigating the Hybrid Era: A Blueprint for Leaders</h1>
      <p>How Cocpit is redefining the workspace for decentralized teams across 15 timezones...</p>`,
    coverImage: '/images/CHANNEL/articleimage2.png',
    excerpt: "How Cocpit is redefining the workspace for decentralized teams across 15 timezones...",
    status: 'published',
    publishedAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
];

export const DUMMY_DRAFT_ARTICLES: ChannelArticle[] = [
  {
    id: 'draft-1',
    channelId: 'channel-1',
    title: 'Navigating the Hybrid Era: A Blueprint for Leaders',
    content: `<h1>Navigating the Hybrid Era: A Blueprint for Leaders</h1><p>How Cocpit is redefining the workspace for decentralized teams across 15 timezones...</p>`,
    coverImage: '/images/CHANNEL/articleimage4.png',
    excerpt: "How Cocpit is redefining the workspace for decentralized teams across 15 timezones...",
    status: 'draft',
    updatedAt: '2026-07-11T14:00:00.000Z',
  },
];

export const DUMMY_GROWTH: GrowthPoint[] = [
  { date: 'Jan', subscribers: 420 },
  { date: 'Feb', subscribers: 460 },
  { date: 'Mar', subscribers: 500 },
  { date: 'Apr', subscribers: 560 },
  { date: 'May', subscribers: 610 },
  { date: 'Jun', subscribers: 700 },
  { date: 'July', subscribers: 760 },
  { date: 'Aug', subscribers: 800 },
  { date: 'Sept', subscribers: 830 },
  { date: 'Oct', subscribers: 850 },
  { date: 'Nov', subscribers: 870 },
  { date: 'Dec', subscribers: 889 },
];

export const DUMMY_INVITEES: ChannelInvitee[] = [
  { id: 'user-1', name: 'James Karl', avatarUrl: '/assets/pngegg.png', headline: 'Product Designer' },
  { id: 'user-2', name: 'Liz Meon', avatarUrl: '/assets/pngegg.png', headline: 'Engineering Manager' },
  { id: 'user-3', name: 'Jordan_Alexis', avatarUrl: '/assets/pngegg.png', headline: 'Frontend Engineer' },
  { id: 'user-4', name: 'Kenji.Dev', avatarUrl: '/assets/pngegg.png', headline: 'Backend Engineer' },
  { id: 'user-5', name: 'Sara_Systems', avatarUrl: '/assets/pngegg.png', headline: 'HR Business Partner' },
  { id: 'user-6', name: 'Marko_Build', avatarUrl: '/assets/pngegg.png', headline: 'DevOps Lead' },
];

export const DUMMY_THOUGHTS: ChannelThought[] = [
  {
    id: 'thought-1',
    articleId: 'article-1',
    authorName: 'Jordan_Alexis',
    authorAvatarUrl: '/assets/pngegg.png',
    text: "The idea of 'Contextual Agility' really hits home. My best work has always come from those high-stakes, fast-moving modular teams where roles are fluid.",
    createdAt: '2026-07-11T09:00:00.000Z',
  },
  {
    id: 'thought-2',
    articleId: 'article-1',
    authorName: 'Kenji.Dev',
    authorAvatarUrl: '/assets/pngegg.png',
    text: 'Exactly the LLM-backed verification of skills makes it much easier to trust new collaborators quickly.',
    createdAt: '2026-07-11T10:15:00.000Z',
  },
  {
    id: 'thought-3',
    articleId: 'article-1',
    authorName: 'Sara_Systems',
    authorAvatarUrl: '/assets/pngegg.png',
    text: "Great read. I wonder how traditional HR will react to this asymmetric opportunity shift, it completely bypasses their usual filters.",
    createdAt: '2026-07-11T12:40:00.000Z',
  },
  {
    id: 'thought-4',
    articleId: 'article-1',
    authorName: 'Marko_Build',
    authorAvatarUrl: '/assets/pngegg.png',
    text: "'Independent compute nodes' - what a phrase. This is the future of the DAO model applied to labor.",
    createdAt: '2026-07-11T15:05:00.000Z',
  },
];
