import React from 'react'

export function FeedTabs({ isDark }: { isDark?: boolean }) {
  return (
    <div className="flex gap-4 mb-4">
      <button className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white text-sm font-medium">
        Top
      </button>
      <button className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        Recent
      </button>
    </div>
  )
}
