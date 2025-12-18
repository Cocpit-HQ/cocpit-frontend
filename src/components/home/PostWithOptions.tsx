import React from 'react'
import { Video, Image, BarChart2 } from 'lucide-react'

interface PostWithOptionsProps {
  onClose: () => void
  onOptionClick: (option: 'photo' | 'video' | 'poll') => void
}

export default function PostWithOptions({
  onClose,
  onOptionClick,
}: PostWithOptionsProps) {
  return (
    <div
      className="fixed inset-x-0 top-0 bottom-14 bg-transparent z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-transparent w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4">
          <div className="flex flex-col items-start gap-6 bg-white dark:bg-gray-800 p-4 rounded-lg w-32">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 bg-opacity-50 text-blue-400"
              onClick={() => onOptionClick('photo')}
            >
              <Image className="w-5 h-5" />
              <span className="text-lg">Photo</span>
            </button>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 bg-opacity-50 text-green-400"
              onClick={() => onOptionClick('video')}
            >
              <Video className="w-5 h-5" />
              <span className="text-lg">Video</span>
            </button>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 bg-opacity-50 text-yellow-400"
              onClick={() => onOptionClick('poll')}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="text-lg">Poll</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
