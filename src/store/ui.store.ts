import { create } from 'zustand';

import { PostType } from '@/features/create-post/types';

interface PendingPost {
  id: string;
  content: any; // Simplified for store
  mediaFiles: File[];
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  type: 'post';
}

interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  initialPostType: PostType;
  isOptionsOpen: boolean; // For MobileCreateMenu
  pendingPosts: PendingPost[];
  isArticleMode: boolean; // To track if inline article editor is open
  
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null, type?: PostType) => void;
  setOptionsOpen: (open: boolean) => void;
  setPendingPosts: (fn: (prev: PendingPost[]) => PendingPost[]) => void;
  setArticleMode: (mode: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  initialPostType: 'text',
  isOptionsOpen: false,
  pendingPosts: [],
  isArticleMode: false,
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveModal: (modal, type = 'text') =>
    set((state) => ({
      activeModal: modal,
      initialPostType: type,
      isArticleMode: modal ? false : state.isArticleMode,
    })),
  setOptionsOpen: (open) => set({ isOptionsOpen: open }),
  setPendingPosts: (fn) => set((state) => ({ pendingPosts: fn(state.pendingPosts) })),
  setArticleMode: (mode) =>
    set((state) => ({
      isArticleMode: mode,
      activeModal: mode ? null : state.activeModal,
      isOptionsOpen: mode ? false : state.isOptionsOpen,
    })),
}));
