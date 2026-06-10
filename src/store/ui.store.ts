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
  pendingPosts: PendingPost[];
  isArticleMode: boolean; // To track if inline article editor is open
  articleDraft: {
    title: string;
    content: string;
    coverImage: any;
    description: string;
    articleData: any;
  } | null;
  isEditMode: boolean;
  editingPostId: string | null;
  
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null, type?: PostType) => void;
  setPendingPosts: (fn: (prev: PendingPost[]) => PendingPost[]) => void;
  setArticleMode: (mode: boolean) => void;
  setArticleDraft: (draft: any) => void;
  setEditMode: (isEdit: boolean, postId?: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  initialPostType: 'text',
  pendingPosts: [],
  isArticleMode: false,
  articleDraft: null,
  isEditMode: false,
  editingPostId: null,
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveModal: (modal, type = 'text') =>
    set((state) => ({
      activeModal: modal,
      initialPostType: type,
      isArticleMode: modal ? false : state.isArticleMode,
    })),
  setPendingPosts: (fn) => set((state) => ({ pendingPosts: fn(state.pendingPosts) })),
  setArticleMode: (mode) =>
    set((state) => ({
      isArticleMode: mode,
      activeModal: mode ? null : state.activeModal,
    })),
  setArticleDraft: (draft) => set({ articleDraft: draft }),
  setEditMode: (isEdit, postId = null) => set({ isEditMode: isEdit, editingPostId: postId }),
}));
