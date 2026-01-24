"use client"

import React, { useState, useRef } from "react"
import { Image, Video, FileText } from "lucide-react"
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail } from "@/types/showcase";
import { showcaseService } from "@/services/showcase.service";

type Props = {
  onCancel?: () => void
  onCreated?: (story: StoryDetail) => void
}

export function CreateStoryForm({ onCancel, onCreated }: Props) {
  const [description, setDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleCancel = () => {
    onCancel?.()
  }

  const handleCreate = async () => {
    if ((!selectedImage && !selectedVideo) || isSubmitting) return

    // Duration Check (for video)
    if (selectedVideo) {
      const video = document.createElement('video');
      video.src = selectedVideo;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });
      if (video.duration > 30) {
        alert("Video must be 30 seconds or less.");
        return;
      }
    }

    setIsSubmitting(true)
    try {
      let mediaData = { url: "", public_id: "", media_type: "image" };

      // select File object - we need to store it in state or ref, currently we only have base64 in selectedImage/Video
      // For this refactor, we need to capture the File object in handleUpload
      if (fileRef.current) {
        const uploadRes = await showcaseService.uploadMedia(fileRef.current);
        mediaData = {
          url: uploadRes.url,
          public_id: uploadRes.public_id,
          media_type: uploadRes.media_type
        };
      }

      const createdStory = await showcaseService.createStory({
        title: "My New Story",
        description,
        media_url: mediaData.url,
        media_type: mediaData.media_type,
        public_id: mediaData.public_id,
        media_status: mediaData.media_type === 'video' ? 'processing' : 'ready'
      });

      if (onCreated) {
        onCreated(mapStory(createdStory))
      }
    } catch (error) {
      console.error("Failed to create story", error)
      setIsSubmitting(false)
    }
  }

  // We need to store the actual file
  const fileRef = useRef<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      fileRef.current = file;
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        setSelectedVideo(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      fileRef.current = file;
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedVideo(reader.result as string)
        setSelectedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Image */}
      <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
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
      <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
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
      <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
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
          disabled={isSubmitting}
          className="px-6 py-3 rounded-lg border text-sm border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={isSubmitting || (!selectedImage && !selectedVideo)}
          className="flex-1 px-6 py-3 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            "Create Story"
          )}
        </button>
      </div>
    </div>
  )
}
