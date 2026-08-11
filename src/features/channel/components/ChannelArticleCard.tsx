import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { ChannelArticle } from '../types/channel.types';

const CocpitShareModel = dynamic(() => import('@/shared/commonComponents/cocpitsharemodel'), { ssr: false });

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

const getDisplayExcerpt = (article: ChannelArticle) => {
  if (article.excerpt && article.excerpt.trim() !== '') return article.excerpt;
  if (!article.content) return '';
  return article.content.replace(/<[^>]+>/g, ' ').replace(/[#*`~>_]/g, '').replace(/\s+/g, ' ').trim();
};

export default function ChannelArticleCard({ article, onClick, onEdit, onDelete }: ChannelArticleCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const showOwnerActions = !!onEdit || !!onDelete;
  const isEdited = Boolean(
    article.updatedAt && 
    article.publishedAt && 
    new Date(article.updatedAt).getTime() - new Date(article.publishedAt).getTime() > 1000
  );

  return (
    <>
      <div
        onClick={onClick}
        className={`w-full flex items-start md:items-center gap-4 md:gap-6 py-0 md:py-2 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="relative w-[100px] md:w-[180px] h-[50px] md:h-[100px] flex-shrink-0 rounded-[12px] md:rounded-[16px] overflow-hidden bg-gray-100 dark:bg-[#121B2B]">
          {article.coverImage && (
            <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-[4px] justify-start md:justify-center py-0 md:py-2">
          <div className="flex items-center gap-[4px] md:gap-2.5 mb-0 md:mb-0.5">
            {article.status === 'draft' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold font-['Poppins'] uppercase bg-slate-100 dark:bg-[#2A2D35] text-slate-500 dark:text-[#A1A8B3]">
                Draft
              </span>
            )}
            <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[10px] md:text-[12px] font-normal md:font-medium font-['Poppins'] leading-[16px] md:leading-normal">
              {formatDate(article.publishedAt || article.updatedAt)}
            </span>
            {(isEdited || (article.status === 'draft' && article.updatedAt)) && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-medium font-['Poppins'] leading-[16px] md:leading-normal bg-[#E5E7EB] dark:bg-[#2A2D35] text-[#6B7280] dark:text-[#D1D5DB]">
                Edited {timeAgo(article.updatedAt || article.publishedAt)}
              </span>
            )}
          </div>
          <h4 className="text-black dark:text-[#FFFFFF] text-[14px] md:text-[15px] font-medium md:font-bold font-['Poppins'] leading-[16px] md:leading-normal line-clamp-2 md:truncate">
            {article.title}
          </h4>
          <p className="hidden md:block text-[#6B7280] dark:text-[#9CA3AF] text-[13px] font-['Poppins'] truncate mt-0.5">
            {getDisplayExcerpt(article)}
          </p>
        </div>

        <div
          className="flex items-end md:items-center gap-4 flex-shrink-0 ml-0 md:ml-4 h-[50px] md:h-full pb-1 md:pb-0"
          onClick={(e) => e.stopPropagation()}
        >
          {showOwnerActions && (
            <>
              <button
                onClick={onEdit}
                className="text-black dark:text-[#FFFFFF] hover:text-[#1A73E8] dark:hover:text-[#4D9CFF] transition-colors p-2 -m-2 md:p-0 md:m-0"
                title="Edit"
              >
                <Icon icon="fluent:edit-24-regular" className="w-[24px] h-[24px]" />
              </button>
              <button
                onClick={onDelete}
                className="text-black dark:text-[#FFFFFF] hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 -m-2 md:p-0 md:m-0"
                title="Delete"
              >
                <Icon icon="fluent:delete-24-regular" className="w-[24px] h-[24px]" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="text-black dark:text-[#FFFFFF] hover:text-[#1A73E8] dark:hover:text-[#4D9CFF] transition-colors p-2 -m-2 md:p-0 md:m-0"
            title="Share"
          >
            <Icon icon="fluent:share-24-regular" className="w-[24px] h-[24px]" />
          </button>
        </div>
      </div>

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={article.id.toString()}
          onShare={() => {}}
        />
      )}
    </>
  );
}
