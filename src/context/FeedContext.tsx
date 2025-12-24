"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Post } from '@/types/entities';

// Mock data from HomePage.tsx
const initialMockPosts: Post[] = [
  {
    id: 1,
    author: 'Sarah Chen',
    title: 'UX Designer at Design Studio',
    timeAgo: '2h',
    content:
      '🎨 Just launched our new design system! Working with an amazing team to create consistent, accessible experiences across all our products.',
    imageSrc: '/assets/pngegg.png',
    likes: '10k',
    comments: '2',
    shares: '2',
    commentData: [
      { id: 1, author: { name: 'Alex Johnson', avatar: '/assets/pngegg.png' }, text: 'This looks amazing! Can\'t wait to see it in action.', timeAgo: '2h', likes: 15 },
      { id: 2, author: { name: 'Maria Garcia', avatar: '/assets/pngegg.png' }, text: 'Great work, Sarah! The component library is so clean.', timeAgo: '1h', likes: 8 },
    ],
    category: 'Professional'
  },
  {
    id: 2,
    author: 'Michael Torres',
    title: 'Product Manager at TechCorp',
    timeAgo: '5h',
    content:
      'Excited to announce that our team just shipped a major feature update! 🚀',
    imageSrc: '/assets/pngegg.png',
    likes: '8.5k',
    comments: '1',
    shares: '5',
    commentData: [
      { id: 1, author: { name: 'David Lee', avatar: '/assets/pngegg.png' }, text: 'Congratulations to the whole team!', timeAgo: '4h', likes: 22 },
    ],
    category: 'Achievement'
  },
  {
    id: 3,
    author: 'Sally Liang',
    title: 'Senior Financial Analyst at Johnson & Johnson',
    timeAgo: '1d',
    content:
      'Just finished a deep dive into data analysis trends for 2024. The shift towards AI-driven forecasting is fascinating! #DataAnalysis #FinTech',
    imageSrc: undefined,
    likes: '1.2k',
    comments: '15',
    shares: '8',
    commentData: [],
    category: 'Professional'
  },
  {
    id: 4,
    author: 'Sally Liang',
    title: 'Senior Financial Analyst at Johnson & Johnson',
    timeAgo: '3d',
    content:
      'Great session on Product Strategy today. Always learning! 📚',
    imageSrc: undefined,
    likes: '850',
    comments: '12',
    shares: '3',
    commentData: [],
    category: 'Personal'
  },
  {
    id: 5,
    author: 'Sally Liang',
    title: 'Senior Financial Analyst at Johnson & Johnson',
    timeAgo: '1w',
    content:
      'Honored to be recognized as Top Contributor of the Month! 🏆 Thanks to my amazing team.',
    imageSrc: undefined,
    likes: '2.1k',
    comments: '45',
    shares: '12',
    commentData: [],
    category: 'Achievement'
  },
];

interface FeedContextType {
  posts: Post[];
  addPost: (post: Post) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const [posts, setPosts] = useState<Post[]>(initialMockPosts);

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  return (
    <FeedContext.Provider value={{ posts, addPost }}>
      {children}
    </FeedContext.Provider>
  );
};
