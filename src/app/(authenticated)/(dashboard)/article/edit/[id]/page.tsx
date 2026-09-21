'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import InlineArticleEditor from '@/features/feed/components/create-post/shared/InlineArticleEditor';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  if (!id) return null;

  const handleSuccess = () => {
    // Safely invalidate only specific data instead of the entire query cache 
    // (which can trigger unhandled 401s in background queries and cause logouts)
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['post', id] });
    queryClient.invalidateQueries({ queryKey: ['article', id] });
    
    // We intentionally do not redirect here so the user stays in the editor after saving.
  };

  const handleClose = () => {
    const sourcePath = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_article_source_path') : null;
    const savedPath = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_scroll_path') : null;

    if (sourcePath && sourcePath !== window.location.pathname) {
      try {
        sessionStorage.removeItem('cocpit_article_source_path');
      } catch (e) {}
      router.replace(sourcePath);
    } else if (savedPath && savedPath !== window.location.pathname && !savedPath.includes('/article/edit')) {
      router.replace(savedPath);
    } else {
      router.replace('/feed');
    }
  };

  return (
    <InlineArticleEditor 
      editPostId={id} 
      onClose={handleClose} 
      onSuccess={handleSuccess} 
    />
  );
}
