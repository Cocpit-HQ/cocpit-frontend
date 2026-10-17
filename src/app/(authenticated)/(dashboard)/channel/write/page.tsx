'use client';

import { Suspense } from 'react';
import ChannelArticleEditorPage from '@/features/channel/pages/ChannelArticleEditorPage';

export default function ChannelWriteRoute() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <ChannelArticleEditorPage />
    </Suspense>
  );
}
