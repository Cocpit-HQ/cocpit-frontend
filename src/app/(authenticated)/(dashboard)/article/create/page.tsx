'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import InlineArticleEditor from '@/features/feed/components/create-post/shared/InlineArticleEditor';

import { useUIStore } from '@/store/ui.store';

export default function CreateArticlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });

    useUIStore.getState().setArticleMode(false);
    
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('scroll-/feed');
      }
    } catch (e) {}
    
    if (window.history.length > 1) {
      router.push('/feed');
    } else {
      router.push('/feed');
    }
  };

  const handleClose = () => {
    useUIStore.getState().setArticleMode(false);
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      const savedPath = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_scroll_path') : null;
      router.push(savedPath || '/feed');
    }
  };

  return (
    <InlineArticleEditor 
      onClose={handleClose} 
      onSuccess={handleSuccess} 
    />
  );
}
