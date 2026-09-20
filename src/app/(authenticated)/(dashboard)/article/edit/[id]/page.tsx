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
    const savedPath = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_scroll_path') : null;
    if (savedPath && savedPath !== window.location.pathname) {
      router.push(savedPath);
    } else {
      router.push('/feed');
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
