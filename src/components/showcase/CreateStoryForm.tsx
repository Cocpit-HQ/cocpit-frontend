"use client"

import React, { useState, useRef } from "react"
import { Image, Video, FileText, Sparkles } from "lucide-react"
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail } from "@/types/showcase";
import { showcaseService } from "@/services/showcase.service";
import { SharedPostCard } from "./SharedPostCard";
import { StoryEditor } from "./editor/StoryEditor";
import { StoryMetadata } from "@/types/story-editor";
import { getGradientImage } from "@/lib/canvasUtils";
import { EditorCanvas } from "./editor/EditorCanvas";
import { useActiveProfile } from "@/context/ActiveProfileContext";

type Props = {
  onCancel?: () => void
  onCreated?: (story: StoryDetail) => void
  sharedPostId?: string | null
}

export function CreateStoryForm({ onCancel, onCreated, sharedPostId }: Props) {
  const [description, setDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null) // Used for background in share mode
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [postData, setPostData] = useState<any>(null)

  // Background selection & Scaling for text/shared post stories
  const [backgroundStyle, setBackgroundStyle] = useState("bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500")
  const [scale, setScale] = useState(1);

  // Editor State
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editorMetadata, setEditorMetadata] = useState<StoryMetadata | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // New States for Intent Mode
  const [mode, setMode] = useState<'media' | 'text'>('media');
  const [template, setTemplate] = useState<'blank' | 'quote' | 'announcement'>('blank');

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null);

  // Fetch shared post data
  React.useEffect(() => {
    if (sharedPostId) {
      import("@/services/api/feed").then(({ getPostById }) => {
        getPostById(sharedPostId).then((data: any) => {
          // Map backend post to SharedPostCard format
          setPostData({
            is_accessible: true, // Assuming if you can share it, you can see it
            post_id: data.post_id || data.id || data.postId,
            content: data.content,
            author: {
              user_id: data.author?.user_id || data.user_id || data.user?.id || "",
              full_name: data.author?.full_name || data.author_name || data.user?.fullName || "Unknown",
              avatar_url: data.author?.avatar_url || data.author_avatar || data.user?.profilePicture || ""
            },
            media: (data.media_urls || data.media || []).map((url: any) => ({
              url: typeof url === 'string' ? url : url.url,
              media_type: data.media_type || (typeof url === 'string' && url.includes('.mp4') ? 'video' : 'image')
            })) || []
          });
        }).catch(err => console.error("Failed to load shared post", err));
      });
    }
  }, [sharedPostId]);

  const handleCancel = () => {
    onCancel?.()
  }

  const { activeProfile } = useActiveProfile();
  const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

  const handleCreate = async () => {
    if ((!selectedImage && !selectedVideo && !sharedPostId) || isSubmitting) return

    // Duration Check (for video)
    if (selectedVideo && !sharedPostId) {
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

      if (fileRef.current) {
        const uploadRes = await showcaseService.uploadMedia(fileRef.current, companyId);
        mediaData = {
          url: uploadRes.url,
          public_id: uploadRes.public_id,
          media_type: uploadRes.media_type
        };
      } else if (sharedPostId) {
        mediaData.media_type = 'image';
      }

      const finalMetadata = editorMetadata ? { ...editorMetadata } : undefined;
      if (finalMetadata && finalMetadata.layers && mediaData.url) {
        finalMetadata.layers = finalMetadata.layers.map(layer => {
          if (layer.type === 'image' || layer.type === 'video') {
            // Update the main media layer source to the persistent Cloudinary URL
            return { ...layer, src: mediaData.url };
          }
          return layer;
        });
      }

      const createdStory = await showcaseService.createStory({
        title: "",
        description,
        media_url: mediaData.url,
        media_type: mediaData.media_type,
        public_id: mediaData.public_id,
        media_status: mediaData.media_type === 'video' ? 'processing' : 'ready',
        shared_post_id: sharedPostId || undefined,
        story_metadata: sharedPostId ? {
          backgroundStyle: !selectedImage ? backgroundStyle : undefined, // Only send gradient if no image upload
          scale: scale
        } : finalMetadata || undefined
      }, companyId);

      if (onCreated) {
        onCreated(mapStory(createdStory))
      }
    } catch (error) {
      console.error("Failed to create story", error)
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditingFile(file);
      // Reset input so same file can be selected again if cancelled
      e.target.value = "";
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditingFile(file);
      e.target.value = "";
    }
  }

  const handleEditorSave = (file: File | Blob | string, metadata: StoryMetadata) => {
    // Determine if it's a file or string (though editor usually returns File/Blob for uploads)
    // If it's a blob/file, update fileRef
    if (file instanceof File || file instanceof Blob) {
      // If Blob, cast to File if possible or just keep as Blob (uploadMedia handles it?) 
      // uploadMedia expects File usually. We might need to construct a File from Blob.
      const f = file instanceof File ? file : new File([file], "story-edit.jpg", { type: file.type });
      fileRef.current = f;

      const reader = new FileReader()
      reader.onloadend = () => {
        if (f.type.startsWith('video')) {
          setSelectedVideo(reader.result as string)
          setSelectedImage(null)
        } else {
          setSelectedImage(reader.result as string)
          setSelectedVideo(null)
        }
      }
      reader.readAsDataURL(f)
    }

    setEditorMetadata(metadata);
    // Instead of closing, go to preview mode
    setIsPreviewing(true);
  }

  const handleEditorCancel = () => {
    setEditingFile(null);
    setIsPreviewing(false);
  }

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto pb-20 scrollbar-hide">

      {editingFile && !isPreviewing && (
        <StoryEditor
          file={editingFile}
          initialMetadata={editorMetadata || undefined}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}

      {/* Preview Modal */}
      {isPreviewing && editingFile && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="w-full h-16 px-4 flex items-center justify-between bg-black/50 absolute top-0 z-20">
            <h2 className="text-white font-bold text-lg">Preview Story</h2>
            <button onClick={() => setIsPreviewing(false)} className="text-white font-medium">Edit</button>
          </div>

          {/* Preview Canvas */}
          <div className="relative w-full h-full max-w-md aspect-[9/16] bg-gray-900 shadow-2xl overflow-hidden rounded-lg my-4">
            <EditorCanvas
              mediaSrc={selectedImage || selectedVideo || ""}
              mediaType={selectedVideo ? 'video' : 'image'}
              layers={editorMetadata?.layers || []}
              activeLayerId={null} // Read only
              onLayerSelect={() => { }}
              onLayerUpdate={() => { }}
              background={editorMetadata?.background}
            />
          </div>

          {/* Description Input (Overlay) */}
          <div className="absolute bottom-24 w-full max-w-md px-6 z-40">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a caption..."
              className="w-full bg-black/60 backdrop-blur text-white placeholder-white/70 border border-white/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-md px-6 py-8 flex gap-4 absolute bottom-0 z-40 bg-gradient-to-t from-black to-transparent">
            <button
              onClick={() => setIsPreviewing(false)}
              className="flex-1 py-3 rounded-full bg-white/20 backdrop-blur-md text-white font-bold border border-white/30"
            >
              Edit
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-full bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Upload Story"}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Content Area */}
      {!sharedPostId ? (
        // STANDARD MODE
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-muted rounded-lg mb-6">
            <button
              onClick={() => setMode('media')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'media' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Media
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'text' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Text & Type
            </button>
          </div>

          {mode === 'media' ? (
            // Media Upload Mode
            <div className="space-y-6">
              {/* Upload Image Section */}
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">Upload Image</label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`
                                    w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden
                                    ${selectedImage ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                                `}
                >
                  {selectedImage ? (
                    <img src={selectedImage} alt="Selected" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                        <Image className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-blue-500">Upload Image</span>
                      <p className="text-xs text-muted-foreground mt-1">JPG or PNG (rec: 9:16)</p>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Upload Video Section */}
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">Upload Video</label>
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className={`
                                    w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden
                                    ${selectedVideo ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                                `}
                >
                  {selectedVideo ? (
                    <video src={selectedVideo} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                        <Video className="w-6 h-6 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium text-purple-500">Upload Video</span>
                      <p className="text-xs text-muted-foreground mt-1">MP4 or MOV (max 30s)</p>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Text Mode
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-4 text-muted-foreground">Choose Background</label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                    "bg-gradient-to-tr from-blue-400 to-emerald-400",
                    "bg-gradient-to-r from-amber-500 to-pink-500",
                    "bg-gradient-to-bl from-gray-900 to-gray-600",
                    "bg-black"
                  ].map(grad => (
                    <button
                      key={grad}
                      onClick={() => setBackgroundStyle(grad)}
                      className={`aspect-square rounded-full ${grad} border-2 transition-transform hover:scale-105 ${backgroundStyle === grad ? 'border-white ring-2 ring-primary/50' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-4 text-muted-foreground">Start with Template</label>
                <div className="flex gap-2">
                  {['blank', 'quote', 'announcement'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t as any)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${template === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const blob = await getGradientImage(backgroundStyle);
                    const file = new File([blob], "background.jpg", { type: "image/jpeg" });
                    // Setup initial metadata based on template
                    const meta: StoryMetadata = {
                      version: "1.0",
                      layers: []
                    };

                    if (template === 'quote') {
                      meta.layers.push({
                        id: crypto.randomUUID(), type: 'text',
                        x: 50, y: 50, width: 80, height: 20, rotation: 0, scale: 1, zIndex: 1,
                        content: '"Your Quote Here"',
                        style: { color: '#ffffff', fontSize: 32, fontFamily: 'serif', fontWeight: 'normal', textAlign: 'center', fontStyle: 'italic' }
                      });
                    } else if (template === 'announcement') {
                      meta.layers.push({
                        id: crypto.randomUUID(), type: 'text',
                        x: 50, y: 30, width: 90, height: 15, rotation: 0, scale: 1, zIndex: 1,
                        content: 'BIG NEWS',
                        style: { color: '#ffffff', fontSize: 48, fontFamily: 'Inter', fontWeight: '900', textAlign: 'center' }
                      });
                    }

                    setEditorMetadata(meta);
                    setEditingFile(file);
                  } catch (e) {
                    console.error('Failed to generate background', e);
                  }
                  setIsSubmitting(false);
                }}
                className="w-full py-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary font-medium flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Sparkles className="w-5 h-5" />
                Open Editor with {template === 'blank' ? 'Background' : 'Template'}
              </button>
            </div>
          )}
        </div>
      ) : (
        // SHARED POST MODE: Preview & Background
        <div className="flex flex-col items-center">
          {/* Preview Container (Phone Aspect Ratio) */}
          <div
            className={`
                    w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center p-4 mb-6
                    ${selectedImage ? '' : backgroundStyle}
                `}
          >
            {/* Background Image if selected */}
            {selectedImage && (
              <img src={selectedImage} className="absolute inset-0 w-full h-full object-cover z-0" />
            )}

            {/* Shared Post Card */}
            <div
              className="z-10 w-full transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            >
              {postData ? (
                // Dynamically import or just access if I imported it. I'll rely on SharedPostCard import (which I need to add)
                <SharedPostCard sharedPost={postData} onClick={() => { }} />
              ) : (
                <div className="w-full h-32 bg-white/10 animate-pulse rounded-xl" />
              )}
            </div>
          </div>

          {/* Background & Scale Controls */}
          <div className="w-full mb-6 space-y-4">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground">Story Background</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {/* Upload Button */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-10 h-10 rounded-full border border-dashed border-white/50 flex items-center justify-center hover:bg-white/10 flex-shrink-0"
                  title="Upload Background Image"
                >
                  <Image className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={imageInputRef} // Reuse image input ref for background
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Gradients */}
                {[
                  "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                  "bg-gradient-to-tr from-blue-400 to-emerald-400",
                  "bg-gradient-to-r from-amber-500 to-pink-500",
                  "bg-gradient-to-bl from-gray-900 to-gray-600",
                  "bg-black"
                ].map(grad => (
                  <button
                    key={grad}
                    onClick={() => {
                      setBackgroundStyle(grad);
                      setSelectedImage(null); // Clear image if selecting gradient
                      fileRef.current = null;
                    }}
                    className={`w-10 h-10 rounded-full ${grad} border-2 ${backgroundStyle === grad && !selectedImage ? 'border-white' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Scale Control */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Post Size</span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.1"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      )}

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
            rows={sharedPostId ? 3 : 6}
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
          disabled={isSubmitting || (!selectedImage && !selectedVideo && !sharedPostId)}
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
