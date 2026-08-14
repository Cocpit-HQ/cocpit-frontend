"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { PostAnalytics } from '@/features/analytics/components/profile-analytics/PostAnalytics';

export default function PostAnalyticsPage() {
  const params = useParams();
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostAnalytics postId={postId} filter="Last 30 Days" />
      </div>
    </div>
  );
}
