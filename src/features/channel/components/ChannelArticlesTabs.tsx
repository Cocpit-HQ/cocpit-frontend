import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { ChannelArticle } from '../types/channel.types';
import ChannelArticleCard from './ChannelArticleCard';

interface ChannelArticlesTabsProps {
  articles: ChannelArticle[];
  initialTab?: 'published' | 'draft';
  onSelectPublished: (article: ChannelArticle) => void;
  onEditDraft: (article: ChannelArticle) => void;
  onDeleteDraft: (article: ChannelArticle) => void;
}

export default function ChannelArticlesTabs({
  articles,
  initialTab = 'published',
  onSelectPublished,
  onEditDraft,
  onDeleteDraft,
}: ChannelArticlesTabsProps) {
  const [tab, setTab] = useState<'published' | 'draft'>(initialTab);
  const published = articles.filter((a) => a.status === 'published');
  const drafts = articles.filter((a) => a.status === 'draft');
  const list = tab === 'published' ? published : drafts;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-black dark:text-[#FFFFFF] text-[18px] font-semibold font-['Poppins'] leading-tight">
          All articles
        </h3>
        <span className="text-[#6B7280] text-[12px] font-['Poppins']">
          Total articles - {articles.length}
        </span>
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-[#2A2D35] mt-2">
        {(['published', 'draft'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-[14px] font-semibold font-['Poppins'] transition-all border-b-2 ${
              tab === t
                ? 'border-[#1A73E8] text-[#1A73E8]'
                : 'border-transparent text-gray-500 hover:text-black dark:text-[#A1A8B3] dark:hover:text-[#FFFFFF]'
            }`}
          >
            {t === 'published' ? 'Published' : 'Drafts'}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col gap-4 mt-2">
        {list.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#121B2B] flex items-center justify-center">
              <Icon icon="solar:document-text-linear" className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-400 text-xs font-['Poppins']">
              {tab === 'published' ? 'No published articles yet.' : 'No drafts saved yet.'}
            </p>
          </div>
        ) : (
          list.map((article) => (
            <ChannelArticleCard
              key={article.id}
              article={article}
              onClick={tab === 'published' ? () => onSelectPublished(article) : () => onEditDraft(article)}
              onEdit={() => onEditDraft(article)}
              onDelete={() => onDeleteDraft(article)}
            />
          ))
        )}
      </div>
    </div>
  );
}