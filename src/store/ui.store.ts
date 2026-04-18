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
  
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null, type?: PostType) => void;
  setOptionsOpen: (open: boolean) => void;
  setPendingPosts: (fn: (prev: PendingPost[]) => PendingPost[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  initialPostType: 'text',
  isOptionsOpen: false,
  pendingPosts: [],
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveModal: (modal, type = 'text') => set({ activeModal: modal, initialPostType: type }),
  setOptionsOpen: (open) => set({ isOptionsOpen: open }),
  setPendingPosts: (fn) => set((state) => ({ pendingPosts: fn(state.pendingPosts) })),
}));
