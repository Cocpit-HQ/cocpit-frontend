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

  const [isMobileThoughtsOpen, setIsMobileThoughtsOpen] = useState(false);

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

  // Lock body scroll when mobile thoughts sheet is open
  useEffect(() => {
    if (isMobileThoughtsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileThoughtsOpen]);

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
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-[100px] lg:pb-24 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_386px] gap-8">
        <div className="flex flex-col gap-5 min-w-0 pb-12">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#2A2D35] border-dashed">
            <button
              onClick={() => router.back()}
              className="w-[48px] h-[48px] rounded-[100px] border border-[#E0E0E7] dark:border-[#2E3445] flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121B2B] transition-colors flex-shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6B7280] dark:text-[#A1A8B3]">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div 
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/channels/${communityId}`)}
            >
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

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[40] bg-white/80 dark:bg-[#0F1115]/80 backdrop-blur-[6px] border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => setIsMobileThoughtsOpen(true)}
          className="w-full h-[56px] px-[16px] rounded-[24px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] flex items-center justify-between"
        >
          <span className="text-[#6B7280] text-[12px] font-['Poppins']">Write your thoughts</span>
          <div className="w-[40px] h-[40px] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#000000] dark:text-[#FFFFFF]">
              <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {isMobileThoughtsOpen && (
        <div className="lg:hidden fixed inset-0 z-[80] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileThoughtsOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] bg-white dark:bg-[#0F1115] rounded-t-[24px] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Top Handle */}
            <div className="w-full flex justify-center pt-[16px] pb-[10px]">
              <div className="w-[50px] h-[5px] rounded-full bg-black dark:bg-[#E0E0E7]" />
            </div>
            {/* Panel Content */}
            <div className="w-full h-full overflow-y-auto">
              <PublicChannelThoughtsPanel
                articleId={articleId}
                isSubscribed={channel ? (channel.isSubscribed || false) : (article.isSubscribed || false)}
                isOwner={channel?.isOwner || false}
                channelOrgId={channel?.orgId}
                isMobileModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
