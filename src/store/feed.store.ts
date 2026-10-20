import { create } from 'zustand';

interface FeedUIState {
  expandedPosts: Record<string, boolean>;
  expandedComments: Record<string, boolean>;
  activeTab: string;
  imageAspectRatios: Record<string, number>;
  isMuted: boolean;

  setExpandedPost: (id: string, expanded: boolean) => void;
  setExpandedComment: (id: string, expanded: boolean) => void;
  setActiveTab: (tab: string) => void;
  setImageAspectRatio: (id: string, ratio: number) => void;
  setIsMuted: (isMuted: boolean) => void;
}

export const useFeedUIStore = create<FeedUIState>((set) => ({
  expandedPosts: {},
  expandedComments: {},
  activeTab: 'recent',
  imageAspectRatios: {},
  isMuted: true,

  setExpandedPost: (id, expanded) => set((state) => ({
    expandedPosts: { ...state.expandedPosts, [id]: expanded }
  })),
  setExpandedComment: (id, expanded) => set((state) => ({
    expandedComments: { ...state.expandedComments, [id]: expanded }
  })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setImageAspectRatio: (id, ratio) => set((state) => ({
    imageAspectRatios: { ...state.imageAspectRatios, [id]: ratio }
  })),
  setIsMuted: (isMuted) => set({ isMuted }),
}));
