import { Channel, ChannelArticle, ChannelThought } from '../../types/channel.types';
import { DUMMY_ARTICLES, DUMMY_THOUGHTS } from '../../utils/dummy-channel-data';

export interface PublicChannelSummary extends Channel {}

export const DUMMY_ALL_CHANNELS: PublicChannelSummary[] = [
  {
    id: 'channel-1',
    orgId: 'org-demo',
    name: 'Nexsus Global Systems',
    companyName: 'Nexsus Global Systems',
    companySlug: 'nexsus-global-systems',
    description: 'Stay updated with the latest advancements and trends in the tech world by subscribing to our Technology Newsletters.',
    bannerUrl: '/images/CHANNEL/ChannelArticle-.png',
    logoUrl: '/assets/pngegg.png',
    subscriberCount: 889,
    isSubscribed: true,
  },
  {
    id: 'channel-2',
    orgId: 'org-aurora',
    name: 'Aurora Robotics',
    companyName: 'Aurora Robotics',
    companySlug: 'aurora-robotics',
    description: 'Field notes and product deep-dives from the team building next-generation autonomous systems.',
    bannerUrl: '/images/CHANNEL/articleimage.png',
    logoUrl: '/assets/pngegg.png',
    subscriberCount: 1240,
    isSubscribed: false,
  },
  {
    id: 'channel-3',
    orgId: 'org-brightpath',
    name: 'Bright Path Design',
    companyName: 'Bright Path Design',
    companySlug: 'bright-path-design',
    description: 'Design systems, craft, and process notes from a product design studio.',
    bannerUrl: '/images/CHANNEL/articleimage1.png',
    logoUrl: '/assets/pngegg.png',
    subscriberCount: 512,
    isSubscribed: false,
  },
  {
    id: 'channel-4',
    orgId: 'org-synthwave',
    name: 'SynthWave Labs',
    companyName: 'SynthWave Labs',
    companySlug: 'synthwave-labs',
    description: 'Research notes on applied AI, tooling, and the future of cognitive-first networking.',
    bannerUrl: '/images/CHANNEL/articleimage2.png',
    logoUrl: '/assets/pngegg.png',
    subscriberCount: 2031,
    isSubscribed: true,
  },
];

export const DUMMY_RECOMMENDED_CHANNELS: PublicChannelSummary[] = DUMMY_ALL_CHANNELS.filter(
  (c) => !c.isSubscribed
);

export const DUMMY_SUBSCRIBED_CHANNELS: PublicChannelSummary[] = DUMMY_ALL_CHANNELS.filter(
  (c) => c.isSubscribed
);

export const DUMMY_CHANNEL_ARTICLES: Record<string, ChannelArticle[]> = {
  'channel-1': DUMMY_ARTICLES,
  'channel-2': DUMMY_ARTICLES.map((a) => ({ ...a, id: `${a.id}-aurora`, channelId: 'channel-2' })),
  'channel-3': DUMMY_ARTICLES.map((a) => ({ ...a, id: `${a.id}-brightpath`, channelId: 'channel-3' })),
  'channel-4': DUMMY_ARTICLES.map((a) => ({ ...a, id: `${a.id}-synthwave`, channelId: 'channel-4' })),
};

// Only the flagship "article-1" in each channel ships with seeded thoughts; the rest start empty.
export const DUMMY_CHANNEL_THOUGHTS: Record<string, ChannelThought[]> = Object.values(
  DUMMY_CHANNEL_ARTICLES
).reduce((acc, articles) => {
  articles.forEach((article) => {
    acc[article.id] = article.id.startsWith('article-1')
      ? DUMMY_THOUGHTS.map((t) => ({ ...t, articleId: article.id }))
      : [];
  });
  return acc;
}, {} as Record<string, ChannelThought[]>);
