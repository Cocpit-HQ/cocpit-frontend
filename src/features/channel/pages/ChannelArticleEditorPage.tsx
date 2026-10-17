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
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
        <div className="mx-auto w-full max-w-[1128px] h-full flex flex-col px-0 md:px-4 xl:px-0 overflow-hidden">
          <ChannelArticleEditor articleId={id} onClose={goBackToChannel} onSuccess={goBackToChannel} />
        </div>
      </div>
    </div>
  );
}
