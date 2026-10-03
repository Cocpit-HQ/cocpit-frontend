import { create } from 'zustand';

import { PostType } from '@/features/feed/types';

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
    localFiles?: { id: string; file: File }[];
  } | null;
  isEditMode: boolean;
  editingPostId: string | null;
  editingPostData: any | null;
  
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null, type?: PostType) => void;
  setPendingPosts: (fn: (prev: PendingPost[]) => PendingPost[]) => void;
  setArticleMode: (mode: boolean) => void;
  setArticleDraft: (draft: any) => void;
  setEditMode: (isEdit: boolean, postId?: string | null, postData?: any | null) => void;
  sharedPostData: any | null;
  setSharedPostData: (data: any | null) => void;

  activeOpenMenuId: string | null;
  setActiveOpenMenuId: (id: string | null) => void;

  reportedPostIds: string[];
  notInterestedPostIds: string[];
  interestedPostIds: string[];
  addReportedPostId: (id: string) => void;
  addNotInterestedPostId: (id: string) => void;
  addInterestedPostId: (id: string) => void;
  hiddenPostIds: string[];
  addHiddenPostId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  activeOpenMenuId: null,
  initialPostType: 'text',
  pendingPosts: [],
  isArticleMode: typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_is_article_mode') === 'true' : false,
  articleDraft: null,
  isEditMode: false,
  editingPostId: null,
  editingPostData: null,
  sharedPostData: null,
  
  reportedPostIds: [],
  notInterestedPostIds: [],
  interestedPostIds: [],
  hiddenPostIds: [],
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveModal: (modal, type = 'text') => {
    if (modal && typeof window !== 'undefined') {
      sessionStorage.removeItem('cocpit_is_article_mode');
    }
    set((state) => ({
      activeModal: modal,
      initialPostType: type,
      isArticleMode: modal ? false : state.isArticleMode,
    }));
  },
  setPendingPosts: (fn) => set((state) => ({ pendingPosts: fn(state.pendingPosts) })),
  setArticleMode: (mode) => {
    if (typeof window !== 'undefined') {
      if (mode) {
        sessionStorage.setItem('cocpit_is_article_mode', 'true');
      } else {
        sessionStorage.removeItem('cocpit_is_article_mode');
      }
    }
    set((state) => ({
      isArticleMode: mode,
      activeModal: mode ? null : state.activeModal,
    }));
  },
  setArticleDraft: (draft) => set({ articleDraft: draft }),
  setEditMode: (isEdit, postId = null, postData = null) => set({ isEditMode: isEdit, editingPostId: postId, editingPostData: postData }),
  setSharedPostData: (data) => set({ sharedPostData: data }),
  setActiveOpenMenuId: (id) => set({ activeOpenMenuId: id }),

  addReportedPostId: (id) => set((state) => ({ reportedPostIds: [...state.reportedPostIds, id] })),
  addNotInterestedPostId: (id) => set((state) => ({ notInterestedPostIds: [...state.notInterestedPostIds, id] })),
  addInterestedPostId: (id) => set((state) => ({ interestedPostIds: [...state.interestedPostIds, id] })),
  addHiddenPostId: (id) => set((state) => ({ hiddenPostIds: [...state.hiddenPostIds, id] })),
}));
