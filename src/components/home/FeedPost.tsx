"use client"

import React from 'react'
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'

interface FeedPostProps {
  author: string
  title?: string
  timeAgo?: string
  content: string
  imageSrc?: string
  likes?: string
  comments?: string
  shares?: string
  isDark?: boolean
}

export default function FeedPost({ author, title, timeAgo = '1h', content, imageSrc, likes = '0', comments = '0', shares = '0', isDark = false }: FeedPostProps) {
  const imgSrc = imageSrc || '/assets/pngegg.png'

  return (
    <div className={`${isDark ? 'bg-[#242b3d] border-[#2d3548]' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
              <img src={imgSrc} alt={author} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} mb-0.5`}>{author}</h3>
              {title && <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>}
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{timeAgo} ago</p>
            </div>
          </div>
          <button className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{content}</p>
      </div>

      <div className="w-full">
        <img src={imgSrc} alt="Post content" className="w-full h-auto object-cover" />
      </div>

      <div className={`px-6 py-3 border-t ${isDark ? 'border-[#2d3548]' : 'border-gray-200'}`}>
        <div className={`flex items-center justify-between text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>{likes} likes</span>
          <div className="flex gap-3">
            <span>{comments} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-[#2d3548]' : 'border-gray-200'}`}>
          <button className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]'} transition-colors flex-1 justify-center`}>
            <ThumbsUp className="w-5 h-5" />
            <span>Like</span>
          </button>
          <button className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]'} transition-colors flex-1 justify-center`}>
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </button>
          <button className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]'} transition-colors flex-1 justify-center`}>
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}
