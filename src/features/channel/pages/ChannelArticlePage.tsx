'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useMyChannel } from '../hooks/useMyChannel';
import { useChannelArticle } from '../hooks/useChannelArticles';
import ChannelThoughtsPanel from '../components/ChannelThoughtsPanel';


interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function ChannelArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { channel } = useMyChannel();
  const { article, isLoading } = useChannelArticle(id);

  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    if (article?.content) {
      // Extract headings for Table of Contents
      const div = document.createElement('div');
      div.innerHTML = article.content;
      const headings = Array.from(div.querySelectorAll('h1, h2, h3'));
      
      const extractedToc = headings.map((h, i) => {
        const text = h.textContent || '';
        const elementId = h.id || text.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || `heading-${i}`;
        // Ensure the element in the actual DOM has this ID so we can scroll to it
        h.id = elementId;
        return {
          id: elementId,
          text,
          level: parseInt(h.tagName[1]),
        };
      }).filter((item) => item.text.trim() !== article.title.trim());

      // We don't want to mutate the actual article content string here, but we can rely on 
      // the fact that we can just scroll to the text or modify the HTML before rendering
      setToc(extractedToc);
    }
  }, [article]);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 text-sm font-['Poppins']">Article not found.</p>
        <button onClick={() => router.push('/channel')} className="text-[#1A73E8] text-sm font-semibold font-['Poppins']">
          Back to channel
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-24 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_386px] gap-8">
        
        {/* Article content */}
        <div className="flex flex-col gap-5 min-w-0 pb-12">
          {/* Article Header (Author / Channel Info) */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#2A2D35] border-dashed">
            <button
              onClick={() => router.push('/channel')}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#2A2D35] flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121B2B] transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-black dark:text-[#FFFFFF] text-[15px] font-semibold font-['Poppins'] leading-tight">
                {channel?.name || 'Channel Name'}
              </h2>
              <p className="text-gray-500 text-[11px] font-['Poppins'] mt-0.5">
                {channel?.subscriberCount?.toLocaleString() || 0} Subscriber
              </p>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="w-full h-[240px] lg:h-[320px] rounded-[24px] overflow-hidden bg-gray-100 dark:bg-[#121B2B]">
              <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Article Title */}
          <h1 className="text-black dark:text-[#FFFFFF] text-[24px] lg:text-[28px] font-regular font-['Poppins'] leading-tight mt-2">
            {article.title}
          </h1>

          {/* Article HTML Content */}
          <div
            className="article-content prose prose-gray dark:prose-invert max-w-none font-['Poppins'] text-gray-800 dark:text-[#FFFFFF] mt-2"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* Thoughts rail */}
        <div className="lg:border-l lg:border-gray-100 dark:lg:border-[#2E3445] lg:pl-6 h-[calc(100vh-120px)] lg:sticky lg:top-6">
          <ChannelThoughtsPanel articleId={article.id} />
        </div>
      </div>


      
      {/* Global styles for article content headings to allow scrolling */}
      <style dangerouslySetInnerHTML={{__html: `
        .article-content h1, .article-content h2, .article-content h3 {
          scroll-margin-top: 2rem;
        }
      `}} />
    </div>
  );
}
