'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChannelArticleEditor from '../components/ChannelArticleEditor';

export default function ChannelArticleEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || undefined;

  const goBackToChannel = () => router.push('/channel');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pt-4 md:pt-6 pb-4 md:pb-8">
        <div className="mx-auto w-full max-w-[1128px] px-0 md:px-4 xl:px-0">
          <ChannelArticleEditor articleId={id} onClose={goBackToChannel} onSuccess={goBackToChannel} />
        </div>
      </div>
    </div>
  );
}
