"use client";

import React, { useState, useEffect } from 'react';
import { ThumbsUp, UserMinus, Image as ImageIcon, BarChart2, Edit3, Loader2 } from 'lucide-react';
import { getActivityLogs, removeActivity } from '@/features/settings/api/activity';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { feedApi } from '@/features/feed/api/feed.api';
import { Icon } from '@iconify/react';

export function ActivitySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Likes' | 'Comments' | 'Tags'>('Likes');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = ['Likes', 'Comments', 'Tags'] as const;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const typeMap = { Likes: 'likes', Comments: 'comments', Tags: 'tags' } as const;
        const res = await getActivityLogs(typeMap[activeTab]);
        setData(res || []);
      } catch (error) {
        toast.error(`Failed to fetch ${activeTab.toLowerCase()}`);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleRemove = async (id: number | string, activeTabType: 'Likes' | 'Comments' | 'Tags') => {
    try {
      if (activeTabType === 'Likes') {
        await feedApi.toggleLike(id as string);
      } else {
        const typeMap = { Likes: 'like', Comments: 'comment', Tags: 'tag' } as const;
        await removeActivity(typeMap[activeTabType], id);
      }
      setData(prev => prev.filter(item => item.id !== id));
      toast.success('Activity removed');
    } catch (error) {
      toast.error('Failed to remove activity');
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">

        {/* Header section */}
        <div className="flex flex-col items-start justify-center mb-2">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Your activity</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-1">Everything you've posted and engaged with</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-row gap-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[14px] font-medium transition-colors ${activeTab === tab
                ? 'bg-[#EEF2FF] text-[#6366F1] border border-[#EEF2FF]'
                : 'bg-white border border-[#A5B4FC] text-[#818CF8]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : (
            <>
              {activeTab === 'Likes' && data.map((like) => (
                <div
                  key={like.id}
                  className="flex flex-col gap-3 w-full pl-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={() => router.push(`/post/${like.id}`)}
                >
                  <div className="flex flex-row justify-between items-center pr-4">
                    <div className="flex flex-row items-center gap-3">
                      {like.avatarUrl ? (
                        <img src={like.avatarUrl} alt={like.user} className="w-[36px] h-[36px] rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-[36px] h-[36px] rounded-full bg-[#EEF2FF] text-[#6366F1] font-medium text-[16px] flex items-center justify-center flex-shrink-0 select-none">
                          {(like.user || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        <span className="text-[14px] font-semibold text-black leading-[20px]">{like.user}</span>
                        <span className="text-[12px] font-normal text-gray-500 leading-[16px]">{like.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(like.id, 'Likes'); }}
                      className="group relative flex items-center justify-center p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-[#6366F1]">
                        <path fill="currentColor" d="m20.27 16.265l.705-4.08a1.666 1.666 0 0 0-1.64-1.95h-5.181a.833.833 0 0 1-.822-.969l.663-4.045a4.8 4.8 0 0 0-.09-1.973a1.64 1.64 0 0 0-1.092-1.137l-.145-.047a1.35 1.35 0 0 0-.994.068c-.34.164-.588.463-.68.818l-.476 1.834a7.6 7.6 0 0 1-.656 1.679c-.415.777-1.057 1.4-1.725 1.975l-1.439 1.24a1.67 1.67 0 0 0-.572 1.406l.812 9.393A1.666 1.666 0 0 0 8.597 22h4.648c3.482 0 6.453-2.426 7.025-5.735" />
                        <path fill="currentColor" fillRule="evenodd" d="M2.968 9.485a.75.75 0 0 1 .78.685l.97 11.236a1.237 1.237 0 1 1-2.468.107V10.234a.75.75 0 0 1 .718-.749" clipRule="evenodd" />
                      </svg>
                      <div className="absolute top-[-36px] right-[-10px] bg-[#EEF2FF] text-[#6366F1] text-[12px] px-3 py-1.5 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                        Remove like
                      </div>
                    </button>
                  </div>

                  {(like.type === 'image' || like.type === 'video') && (
                    <div className="flex flex-row gap-4 ml-1">
                      {like.mediaUrl && (
                        <img src={like.mediaUrl} alt="" className="w-[60px] h-[60px] rounded-[12px] object-cover flex-shrink-0" />
                      )}
                      <p className="text-[14px] font-normal text-black leading-[20px] max-w-[450px] line-clamp-3">
                        {like.content}
                      </p>
                    </div>
                  )}
                  {like.type === 'text' && (
                    <p className="text-[14px] font-normal text-black leading-[20px] ml-1 max-w-[480px] line-clamp-3">
                      {like.content}
                    </p>
                  )}
                  {like.type === 'poll' && (
                    <div className="flex flex-col justify-center gap-1 bg-[#EEF2FF] px-4 py-3 rounded-[12px] ml-1 mr-4">
                      <span className="text-[14px] font-medium text-[#1F2937] leading-[20px]">{like.postTitle}</span>
                      <span className="text-[10px] font-normal text-gray-500">{like.votes || 0} votes • {like.isPollActive ? 'Poll active' : 'Poll closed'}</span>
                    </div>
                  )}
                </div>
              ))}

              {activeTab === 'Comments' && data.map((comment) => (
                <div
                  key={comment.id}
                  className="flex flex-row gap-4 w-full pr-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={() => router.push(`/post/${comment.postId}`)}
                >
                  {/* Post Icon / Thumbnail */}
                  {comment.mediaUrl && (comment.type === 'image' || comment.type === 'video') ? (
                    <img src={comment.mediaUrl} alt="" className="w-[60px] h-[60px] rounded-[12px] object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-[#EEF2FF]">
                      {comment.type === 'poll' && <Icon icon="fluent:poll-16-regular" className="w-6 h-6 text-[#6366F1]" />}
                      {(comment.type === 'image' || comment.type === 'video') && <Icon icon="stash:image" className="w-6 h-6 text-[#6366F1]" />}
                      {(comment.type === 'text' || comment.type === 'article' || !comment.type) && <Icon icon="solar:document-add-linear" className="w-6 h-6 text-[#6366F1]" />}
                    </div>
                  )}

                  {/* Comment Content */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-row items-center gap-2">
                      {comment.postAuthor === 'Lighti' ? (
                        <img src="/assets/default-company.png" alt={comment.postAuthor} className="w-[24px] h-[24px] rounded-[6px] object-cover flex-shrink-0" />
                      ) : comment.postAuthorAvatar ? (
                        <img src={comment.postAuthorAvatar} alt={comment.postAuthor} className="w-[24px] h-[24px] rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-[24px] h-[24px] rounded-full bg-[#EEF2FF] text-[#6366F1] font-medium text-[10px] flex items-center justify-center flex-shrink-0 select-none">
                          {(comment.postAuthor || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="text-[14px] font-normal text-black leading-[20px] max-w-[450px] line-clamp-1">
                        <span className="font-semibold">{comment.postAuthor}</span> {comment.postTitle}
                      </p>
                    </div>
                    <div className="flex flex-row items-center gap-2 ml-8">
                      {comment.commenterAvatar ? (
                        <img src={comment.commenterAvatar} alt={comment.commenter} className="w-[24px] h-[24px] rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-[24px] h-[24px] rounded-full bg-[#EEF2FF] text-[#6366F1] font-medium text-[10px] flex items-center justify-center flex-shrink-0 select-none">
                          {(comment.commenter || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="text-[14px] font-normal text-black leading-[20px] line-clamp-3">
                        <span className="font-semibold">{comment.commenter}</span> {comment.comment}
                      </p>
                    </div>
                    <div className="flex flex-row items-center gap-3 ml-[68px] mt-1">
                      <span className="text-[12px] font-semibold text-black">Like - <span className="font-normal text-gray-500">{comment.likes} likes</span></span>
                      <span className="text-[12px] text-gray-300">|</span>
                      <span className="text-[12px] font-semibold text-black">Reply - <span className="font-normal text-gray-500">{comment.replies} reply</span></span>
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'Tags' && data.map((tag) => (
                <div
                  key={tag.id}
                  className="flex flex-col gap-3 w-full pl-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={() => router.push(`/post/${tag.postId}`)}
                >
                  <div className="group relative flex flex-row justify-between items-center pr-4">
                    <div className="flex flex-row items-center gap-3">
                      {tag.avatarUrl ? (
                        <img src={tag.avatarUrl} alt={tag.user} className="w-[36px] h-[36px] rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-[36px] h-[36px] rounded-full bg-[#EEF2FF] text-[#6366F1] font-medium text-[16px] flex items-center justify-center flex-shrink-0 select-none">
                          {(tag.user || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        <span className="text-[14px] font-semibold text-black leading-[20px]">{tag.user}</span>
                        <span className="text-[12px] font-normal text-gray-500 leading-[16px]">{tag.role}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(tag.id, 'Tags'); }}
                      className="group relative flex items-center justify-center p-1"
                    >
                      <Icon icon="la:user-tag" className="w-6 h-6 text-[#6366F1]" />
                      <div className="absolute top-[-36px] right-[-10px] bg-[#EEF2FF] text-[#6366F1] text-[12px] px-3 py-1.5 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                        Remove tag
                      </div>
                    </button>
                  </div>

                  {(tag.type === 'image' || tag.type === 'video') && (
                    <div className="flex flex-row gap-4 ml-1">
                      {tag.mediaUrl && (
                        <img src={tag.mediaUrl} alt="" className="w-[60px] h-[60px] rounded-[12px] object-cover flex-shrink-0" />
                      )}
                      <p className="text-[14px] font-normal text-black leading-[20px] max-w-[450px] line-clamp-3">
                        {tag.content}
                      </p>
                    </div>
                  )}
                  {(tag.type === 'text' || tag.type === 'article' || !tag.type) && (
                    <p className="text-[14px] font-normal text-black leading-[20px] ml-1 max-w-[480px] line-clamp-3">
                      {tag.content}
                    </p>
                  )}
                  {tag.type === 'poll' && (
                    <div className="flex flex-col justify-center gap-1 bg-[#EEF2FF] px-4 py-3 rounded-[12px] ml-1 mr-4">
                      <span className="text-[14px] font-medium text-[#1F2937] leading-[20px]">{tag.postTitle}</span>
                      <span className="text-[10px] font-normal text-gray-500">{tag.votes || 0} votes • {tag.isPollActive ? 'Poll active' : 'Poll closed'}</span>
                    </div>
                  )}
                </div>
              ))}

            </>
          )}
        </div>

      </div>
    </div>
  );
}
