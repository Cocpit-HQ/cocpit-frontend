'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import InlineArticleEditor from '@/features/create-post/components/InlineArticleEditor';

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
    
    // Navigate back to where the user came from, falling back to feed
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pt-4 md:pt-6 pb-4 md:pb-8">
        <div className="mx-auto w-full max-w-[1128px] px-0 md:px-4 xl:px-0">
          <InlineArticleEditor 
            editPostId={id} 
            onClose={() => router.back()} 
            onSuccess={handleSuccess} 
          />
        </div>
      </div>
    </div>
  );
}
