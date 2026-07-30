'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { usePublicChannel } from '../hooks/usePublicChannel';
import { usePublicChannelArticle } from '../hooks/usePublicChannelArticle';
import PublicChannelThoughtsPanel from '../components/PublicChannelThoughtsPanel';
import { sanitizeArticleHtmlForDisplay } from '@/lib/sanitizeArticleHtml';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function PublicChannelArticlePage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.communityId as string;
  const articleId = params?.articleId as string;

  const { channel } = usePublicChannel(communityId, false);
  const { article } = usePublicChannelArticle(communityId, articleId);

  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    if (article?.content) {
      const div = document.createElement('div');
      div.innerHTML = article.content;
      const headings = Array.from(div.querySelectorAll('h1, h2, h3'));

      const extractedToc = headings
        .map((h, i) => {
          const text = h.textContent || '';
          const elementId = h.id || text.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || `heading-${i}`;
          h.id = elementId;
          return {
            id: elementId,
            text,
            level: parseInt(h.tagName[1]),
          };
        })
        .filter((item) => item.text.trim() !== article.title.trim());

      setToc(extractedToc);
    }
  }, [article]);

  if (!article) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 text-sm font-['Poppins']">Article not found.</p>
        <button
          onClick={() => router.push(`/channels/${communityId}`)}
          className="text-[#1A73E8] text-sm font-semibold font-['Poppins']"
        >
          Back to channel
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-24 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_386px] gap-8">
        <div className="flex flex-col gap-5 min-w-0 pb-12">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#2A2D35] border-dashed">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#2A2D35] flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121B2B] transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-black dark:text-[#FFFFFF] text-[15px] font-semibold font-['Poppins'] leading-tight">
                {channel?.name || 'Channel'}
              </h2>
              <p className="text-gray-500 text-[11px] font-['Poppins'] mt-0.5">
                {channel?.subscriberCount?.toLocaleString() || 0} Subscriber
              </p>
            </div>
          </div>

          {article.coverImage && (
            <div className="w-full h-[240px] lg:h-[320px] rounded-[24px] overflow-hidden bg-gray-100 dark:bg-[#121B2B]">
              <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <h1 className="text-black dark:text-[#FFFFFF] text-[32px] lg:text-[40px] font-semibold font-['Poppins'] leading-tight mt-4 mb-2">
            {article.title}
          </h1>

          <div
            className="article-content prose prose-gray dark:prose-invert max-w-none font-['Poppins'] text-gray-800 dark:text-[#FFFFFF] mt-2"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtmlForDisplay(article.content) }}
          />
        </div>

        <div className="hidden lg:block lg:w-[386px] flex-shrink-0">
          <div className="sticky top-24 h-[calc(100vh-120px)] border border-[#E0E0E7] dark:border-[#2A2D35] rounded-[32px] overflow-hidden bg-white dark:bg-[#0F1115]">
            <PublicChannelThoughtsPanel
              articleId={articleId}
              isSubscribed={channel ? (channel.isSubscribed || false) : (article.isSubscribed || false)}
              isOwner={channel?.isOwner || false}
              channelOrgId={channel?.orgId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
