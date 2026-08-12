import React from 'react';
import { PostAnalytics } from '@/features/analytics/components/profile-analytics/PostAnalytics';

export default function PostAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostAnalytics />
      </div>
    </div>
  );
}
