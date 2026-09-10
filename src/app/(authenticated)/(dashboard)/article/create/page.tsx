'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import InlineArticleEditor from '@/features/feed/components/create-post/shared/InlineArticleEditor';

export default function CreateArticlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  const handleClose = () => {
    router.push('/feed');
  };

  return (
    <InlineArticleEditor 
      onClose={handleClose} 
      onSuccess={handleSuccess} 
    />
  );
}
