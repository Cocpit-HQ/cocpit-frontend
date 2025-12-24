"use client"

import React, { useState, useRef, useEffect } from 'react'
import { X, Image, Video, BarChart2, Plus, Trash2, Crop, MoveHorizontal, MoveVertical } from 'lucide-react'
import { useFeed } from '@/context/FeedContext'

type PostType = 'text' | 'photo' | 'video' | 'poll'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  initialPostType?: PostType
}

interface PollOption {
  id: string
  text: string
}

interface UploadedImage {
  id: string
  url: string
  file: File
  crop: {
    x: number
    y: number
    zoom: number
  }
}

export function CreatePostModal({ isOpen, onClose, initialPostType = 'text' }: CreatePostModalProps) {
  const { addPost } = useFeed()
  const [postType, setPostType] = useState<PostType>(initialPostType)
  const [description, setDescription] = useState('')
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('auto')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ])
  const [postCategory, setPostCategory] = useState<'Personal' | 'Professional' | 'Achievement'>('Professional')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const aspectRatios = [
    { label: 'Original', value: 'auto' },
    { label: '1:1', value: '1/1' },
    { label: '4:5', value: '4/5' },
    { label: '1.91:1', value: '1.91/1' },
    { label: '9:16', value: '9/16' },
  ]

  useEffect(() => {
    if (isOpen) {
      setPostType(initialPostType)
    }
  }, [isOpen, initialPostType])

  if (!isOpen) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: UploadedImage[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      crop: { x: 0, y: 0, zoom: 1 },
    }))
    setUploadedImages([...uploadedImages, ...newImages])
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const removeImage = (id: string) => {
    setUploadedImages(uploadedImages.filter((img) => img.id !== id))
    if (selectedImageForCrop === id) {
      setSelectedImageForCrop(null)
    }
  }

  const updateImageCrop = (id: string, cropData: Partial<UploadedImage['crop']>) => {
    setUploadedImages(
      uploadedImages.map((img) =>
        img.id === id ? { ...img, crop: { ...img.crop, ...cropData } } : img
      )
    )
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }])
    }
  }

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((option) => option.id !== id))
    }
  }

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(pollOptions.map((option) => (option.id === id ? { ...option, text } : option)))
  }

  const handlePost = () => {
    // Create new post object
    let videoUrl = undefined;
    if (videoFile) {
        videoUrl = URL.createObjectURL(videoFile);
    }

    const newPost = {
      id: Date.now(),
      author: 'Sally Liang', // Mock logged-in user
      title: 'Senior Financial Analyst',
      timeAgo: 'Just now',
      content: description,
      // Add other fields based on postType (images, video, poll)
      imageSrc: uploadedImages.length > 0 ? uploadedImages[0].url : undefined,
      images: uploadedImages.map(img => img.url),
      videoSrc: videoUrl,
      aspectRatio: selectedAspectRatio,
      likes: '0',
      comments: '0',
      shares: '0',
      commentData: [],
      category: postCategory
    }

    addPost(newPost)

    // Handle post submission logic here
    console.log('Posting:', { postType, description, uploadedImages, videoFile, pollQuestion, pollOptions })
    onClose()
    // Reset state
    setPostType('text')
    setDescription('')
    setUploadedImages([])
    setVideoFile(null)
    setVideoPreview(null)
    setSelectedAspectRatio('auto')
    setPollQuestion('')
    setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }])
    setPostCategory('Professional')
  }

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageForCrop)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-card"
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-card border-border"
        >
          <h2 className="text-xl text-foreground">Create a post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                <img
                    src="/assets/pngegg.png"
                    alt="Your profile"
                    className="w-full h-full object-cover"
                />
                </div>
                <div>
                <h3 className="text-foreground">Sally Liang</h3>
                <p className="text-sm text-muted-foreground">Post to Anyone</p>
                </div>
            </div>

            {/* Post Category Selection */}
            <div className="flex gap-2">
                {(['Personal', 'Professional', 'Achievement'] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setPostCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            postCategory === cat
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Post Type Selection */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPostType('photo')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                postType === 'photo'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary'
              }`}
            >
              <Image className="w-4 h-4" />
              <span className="text-sm">Photo</span>
            </button>
            <button
              onClick={() => setPostType('video')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                postType === 'video'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary'
              }`}
            >
              <Video className="w-4 h-4" />
              <span className="text-sm">Video</span>
            </button>
            <button
              onClick={() => setPostType('poll')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                postType === 'poll'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="text-sm">Poll</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6">
          {/* Description Textarea */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={postType === 'poll' ? 'Add context to your poll (optional)...' : 'What do you want to share?'}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-primary resize-none bg-muted/50 text-foreground placeholder-muted-foreground border-border"
            rows={4}
          />

          {/* Photo Upload Section */}
          {postType === 'photo' && (
            <div className="mt-4 space-y-4">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-lg border-2 border-dashed transition-all bg-muted/20 border-border hover:border-primary text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Image className="w-8 h-8" />
                  <span>Click to upload photos</span>
                  <span className="text-sm opacity-70">or drag and drop (multiple files supported)</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Uploaded Images Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImageForCrop === image.id
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt="Upload preview"
                          className="w-full h-full object-contain bg-black/5"
                          style={{
                            transform: `scale(${image.crop.zoom}) translate(${image.crop.x}px, ${image.crop.y}px)`,
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => setSelectedImageForCrop(selectedImageForCrop === image.id ? null : image.id)}
                          className={`p-2 rounded-full transition-all bg-card/90 ${
                            selectedImageForCrop === image.id
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Crop className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="p-2 rounded-full transition-colors bg-card/90 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Crop & Aspect Ratio Controls */}
              {uploadedImages.length > 0 && (
                <div
                  className="p-4 rounded-lg border space-y-3 bg-muted/20 border-border"
                >
                  <h4 className="text-sm mb-2 text-foreground">Edit Image</h4>

                  {/* Aspect Ratio Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Aspect Ratio
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {aspectRatios.map((ratio) => (
                            <button
                                key={ratio.value}
                                onClick={() => setSelectedAspectRatio(ratio.value)}
                                className={`px-3 py-1.5 rounded text-xs transition-colors border ${
                                    selectedAspectRatio === ratio.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                }`}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                  </div>

                  {selectedImage && (
                    <>
                      {/* Zoom Control */}
                      <div className="space-y-2">
                        <label className="text-sm flex items-center gap-2 text-muted-foreground">
                          <span>Zoom</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={selectedImage.crop.zoom}
                          onChange={(e) => updateImageCrop(selectedImage.id, { zoom: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Position Controls */}
                  {selectedImage && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm flex items-center gap-2 text-muted-foreground">
                          <MoveHorizontal className="w-4 h-4" />
                          <span>Horizontal</span>
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={selectedImage.crop.x}
                          onChange={(e) => updateImageCrop(selectedImage.id, { x: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm flex items-center gap-2 text-muted-foreground">
                          <MoveVertical className="w-4 h-4" />
                          <span>Vertical</span>
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={selectedImage.crop.y}
                          onChange={(e) => updateImageCrop(selectedImage.id, { y: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Upload Section */}
          {postType === 'video' && (
            <div className="mt-4 space-y-4">
              {!videoPreview ? (
                <>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-12 rounded-lg border-2 border-dashed transition-all bg-muted/20 border-border hover:border-primary text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Video className="w-10 h-10" />
                      <span>Click to upload video</span>
                      <span className="text-sm opacity-70">MP4, WebM, or OGG (max 500MB)</span>
                    </div>
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="relative">
                  <video src={videoPreview} controls className="w-full rounded-lg" />
                  <button
                    onClick={() => {
                      setVideoFile(null)
                      setVideoPreview(null)
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full transition-colors bg-card/90 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Video Aspect Ratio Controls */}
              {videoPreview && (
                  <div
                    className="p-4 rounded-lg border space-y-3 bg-muted/20 border-border"
                  >
                    <h4 className="text-sm mb-2 text-foreground">Video Ratio</h4>
                    <div className="flex gap-2 flex-wrap">
                        {aspectRatios.map((ratio) => (
                            <button
                                key={ratio.value}
                                onClick={() => setSelectedAspectRatio(ratio.value)}
                                className={`px-3 py-1.5 rounded text-xs transition-colors border ${
                                    selectedAspectRatio === ratio.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                }`}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                  </div>
              )}
            </div>
          )}

          {/* Poll Section */}
          {postType === 'poll' && (
            <div className="mt-4 space-y-4">
              {/* Poll Question */}
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">
                  Your question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-primary bg-muted/50 text-foreground placeholder-muted-foreground border-border"
                />
              </div>

              {/* Poll Options */}
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">
                  Answer options
                </label>
                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={option.id} className="flex gap-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updatePollOption(option.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:border-primary bg-muted/50 text-foreground placeholder-muted-foreground border-border"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => removePollOption(option.id)}
                          className="p-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-muted"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 6 && (
                  <button
                    onClick={addPollOption}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-muted/20 text-muted-foreground border-border hover:border-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add option</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-card border-border"
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={
              !description.trim() &&
              uploadedImages.length === 0 &&
              !videoFile &&
              !pollQuestion.trim()
            }
            className={`px-8 py-2.5 rounded-lg transition-all ${
              !description.trim() &&
              uploadedImages.length === 0 &&
              !videoFile &&
              !pollQuestion.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )
}
