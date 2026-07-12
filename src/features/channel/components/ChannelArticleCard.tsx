import React from 'react';
import { Icon } from '@iconify/react';
import { ChannelArticle } from '../types/channel.types';

interface ChannelArticleCardProps {
  article: ChannelArticle;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function ChannelArticleCard({ article, onClick, onEdit, onDelete }: ChannelArticleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-6 py-2 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative w-[180px] h-[100px] flex-shrink-0 rounded-[16px] overflow-hidden bg-gray-100 dark:bg-[#1C2340]">
        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center py-2">
        <div className="flex items-center gap-2">
          {article.status === 'draft' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-['Poppins'] uppercase bg-slate-100 dark:bg-[#2E3445] text-slate-500 dark:text-[#9CA3AF]">
              Draft
            </span>
          )}
          <span className="text-[#9CA3AF] text-[12px] font-medium font-['Poppins']">
            {formatDate(article.publishedAt || article.updatedAt)}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#2E3445] text-[#6B7280] dark:text-[#9CA3AF] text-[10px] font-medium font-['Poppins']">
            Edited {timeAgo(article.updatedAt)}
          </span>
        </div>
        <h4 className="text-black dark:text-[#F9FAFB] text-[16px] font-semibold font-['Poppins'] truncate">
          {article.title}
        </h4>
        <p className="text-[#6B7280] dark:text-gray-400 text-[13px] font-medium font-['Poppins'] truncate">
          {article.excerpt}
        </p>
      </div>

      <div
        className="flex items-center gap-4 flex-shrink-0 ml-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="text-gray-600 dark:text-gray-400 hover:text-[#1A73E8] transition-colors"
          title="Edit"
        >
          <Icon icon="fluent:edit-24-regular" className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Icon icon="fluent:delete-24-regular" className="w-5 h-5" />
        </button>
        <button
          className="text-gray-600 dark:text-gray-400 hover:text-[#1A73E8] transition-colors"
          title="Share"
        >
          <Icon icon="fluent:share-28-regular" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
