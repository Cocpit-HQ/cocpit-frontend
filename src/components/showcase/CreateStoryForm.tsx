"use client"

import React, { useState, useRef } from "react"
import { Image, Video, FileText } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

type Props = {
  onCancel?: () => void
  onCreated?: (story: StoryDetail) => void
}

export function CreateStoryForm({ onCancel, onCreated }: Props) {
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
          className="block text-sm mb-2 text-muted-foreground"
          htmlFor="story-image"
        >
          Upload Image
        </label>
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-4 bg-muted/50 border-border text-foreground"
        >
          {selectedImage ? (
            <div className="flex items-center gap-3">
              <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
              <span className="text-sm text-muted-foreground">Image selected</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Upload an image for your story
            </span>
          )}
          <button
            id="story-image"
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
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
          className="block text-sm mb-2 text-muted-foreground"
          htmlFor="story-video"
        >
          Upload Video
        </label>
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-4 bg-muted/50 border-border text-foreground"
        >
          {selectedVideo ? (
            <div className="flex items-center gap-3">
              <video src={selectedVideo} className="w-16 h-16 object-cover rounded" controls={false} />
              <span className="text-sm text-muted-foreground">Video selected</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Upload a video for your story
            </span>
          )}
          <button
            id="story-video"
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
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
          className="block text-sm mb-2 text-muted-foreground"
          htmlFor="story-description"
        >
          Description
        </label>
        <div
          className="flex items-start rounded-lg border px-4 py-3 bg-muted/50 border-border text-foreground"
        >
          <FileText className="w-4 h-4 mr-3 text-muted-foreground mt-1 flex-shrink-0" />
          <textarea
            id="story-description"
            placeholder="Add a description to your story..."
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none resize-none placeholder-muted-foreground"
          />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 rounded-lg border text-sm border-border text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="flex-1 px-6 py-3 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all"
        >
          Create Story
        </button>
      </div>
    </div>
  )
}
