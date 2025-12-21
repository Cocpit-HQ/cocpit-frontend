"use client"

import React, { useState, useRef } from "react"
import { Image, Video, FileText } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

type Props = {
  isDark: boolean
  onCancel?: () => void
  onCreated?: (story: StoryDetail) => void
}

export function CreateStoryForm({ isDark, onCancel, onCreated }: Props) {
  const [description, setDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleCancel = () => {
    onCancel?.()
  }

  const handleCreate = () => {
    if (!selectedImage && !selectedVideo) return

    const newStory: StoryDetail = {
      id: Date.now(),
      image: selectedImage || selectedVideo || "", // Just using the data URL for now
      isVideo: !!selectedVideo,
      author: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      },
      title: "My New Story",
      timeAgo: "Just now",
      views: 0,
      likes: 0,
      comments: 0,
      authorTitle: "Me",
      description: description,
      viewers: [],
      likers: []
    }

    onCreated?.(newStory)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedVideo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Image */}
      <div>
        <label
          className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          htmlFor="story-image"
        >
          Upload Image
        </label>
        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-4 ${
            isDark ? "bg-background border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
          }`}
        >
          {selectedImage ? (
            <div className="flex items-center gap-3">
              <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Image selected</span>
            </div>
          ) : (
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Upload an image for your story
            </span>
          )}
          <button
            id="story-image"
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border border-dashed border-[#5B7CFF] text-[#5B7CFF] hover:bg-[#5B7CFF]/10 transition-colors flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Upload Image
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Video */}
      <div>
        <label
          className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          htmlFor="story-video"
        >
          Upload Video
        </label>
        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-4 ${
            isDark ? "bg-background border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
          }`}
        >
          {selectedVideo ? (
            <div className="flex items-center gap-3">
              <video src={selectedVideo} className="w-16 h-16 object-cover rounded" controls={false} />
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Video selected</span>
            </div>
          ) : (
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Upload a video for your story
            </span>
          )}
          <button
            id="story-video"
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border border-dashed border-[#5B7CFF] text-[#5B7CFF] hover:bg-[#5B7CFF]/10 transition-colors flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Upload Video
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          htmlFor="story-description"
        >
          Description
        </label>
        <div
          className={`flex items-start rounded-lg border px-4 py-3 ${
            isDark ? "bg-background border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4 mr-3 text-gray-500 mt-1 flex-shrink-0" />
          <textarea
            id="story-description"
            placeholder="Add a description to your story..."
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`flex-1 bg-transparent focus:outline-none resize-none ${
              isDark ? "placeholder-gray-500" : "placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={handleCancel}
          className={`px-6 py-3 rounded-lg border text-sm ${
            isDark ? "border-[#2d3548] text-gray-300 hover:bg-background" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="flex-1 px-6 py-3 rounded-lg text-sm bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90 transition-all"
        >
          Create Story
        </button>
      </div>
    </div>
  )
}

