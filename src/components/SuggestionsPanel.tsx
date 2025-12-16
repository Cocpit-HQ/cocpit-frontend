"use client"

import React from 'react'
import { Plus, Check } from 'lucide-react'

type Theme = 'dark' | 'light' | 'system'

interface SuggestionsPanelProps {
  theme?: Theme;
}

export function SuggestionsPanel({ theme = 'dark' }: SuggestionsPanelProps) {
  const isDark = theme === 'dark' || theme === 'system';
  
  const suggestions = [
    {
      name: 'Sarah Williams',
      title: 'UX Designer',
      followers: '2.3k followers',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      verified: true,
    },
    {
      name: 'Michael Chen',
      title: 'Software Engineer',
      followers: '1.8k followers',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      verified: false,
    },
    {
      name: 'Emily Rodriguez',
      title: 'Marketing Manager',
      followers: '3.1k followers',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      verified: true,
    },
    {
      name: 'David Thompson',
      title: 'Data Scientist',
      followers: '2.7k followers',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      verified: true,
    },
    {
      name: 'Lisa Anderson',
      title: 'Product Designer',
      followers: '1.9k followers',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      verified: false,
    },
  ];

  return (
    <div className={`${isDark ? 'bg-[#242b3d] border-[#2d3548]' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
      <div className={`px-4 py-4 border-b ${isDark ? 'border-[#2d3548]' : 'border-gray-200'} flex items-center justify-between`}>
        <h3 className={isDark ? 'text-white' : 'text-gray-900'}>Suggested for you</h3>
        <button className="text-[#5B7CFF] text-sm hover:underline">See all</button>
      </div>

      <div className="p-4 space-y-4">
        {suggestions.map((person, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
              </div>
              {person.verified && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 bg-[#5B7CFF] rounded-full flex items-center justify-center border-2 ${isDark ? 'border-[#242b3d]' : 'border-white'}`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`truncate flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{person.name}</div>
              <div className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{person.title}</div>
              <div className="text-xs text-gray-500">{person.followers}</div>
            </div>
            <button className="bg-[#5B7CFF] text-white px-4 py-1.5 rounded-lg hover:bg-[#4B6DEF] transition-all flex items-center gap-1 flex-shrink-0">
              <Plus className="w-4 h-4" />
              <span>Follow</span>
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button className={`text-sm transition-all ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          View more suggestions →
        </button>
      </div>
    </div>
  )
}

export default SuggestionsPanel
