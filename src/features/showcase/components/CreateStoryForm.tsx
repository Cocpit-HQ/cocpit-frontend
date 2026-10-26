"use client"

import React, { useState, useRef } from "react"
import html2canvas from "html2canvas"
import { Image, Video, FileText, Sparkles } from "lucide-react"
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail } from "../types/showcase";
import { showcaseService } from "../services/showcase.service";
import { SharedPostCard } from "./SharedPostCard";
import { StoryEditor } from "./editor/StoryEditor";
import { StoryMetadata } from "../types/story-editor";
import { getGradientImage } from "@/lib/canvasUtils";
import { EditorCanvas } from "./editor/EditorCanvas";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { VirtualLayerCanvas } from "./ViewerLayerItem";
import { v4 as uuidv4 } from "uuid";
import { getJobById } from "@/services/api/jobs";
import { JobStoryCard } from "@/components/jobs/JobStoryCard";
import type { Job } from "@/types/jobs";
import type { BackendPost } from "@/services/api/feed";


type Props = {
  onCancel?: () => void
  onCreated?: (story: StoryDetail) => void
  sharedPostId?: string | null
  sharedJobId?: string | null
}

type SharedStoryPost = React.ComponentProps<typeof SharedPostCard>["sharedPost"];
type StoryMetadataWithFiles = StoryMetadata & { _compositeFile?: File; _baseFile?: File };

export function CreateStoryForm({ onCancel, onCreated, sharedPostId, sharedJobId }: Props) {
  const [description, setDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null) // Used for background in share mode
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postData, setPostData] = useState<SharedStoryPost | null>(null)
  const [jobData, setJobData] = useState<Job | null>(null)

  // Background selection & Scaling for text/shared post stories
  const [backgroundStyle, setBackgroundStyle] = useState("bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500")
  const [scale, setScale] = useState(sharedJobId ? 1.5 : 1);

  // Editor State
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editorMetadata, setEditorMetadata] = useState<StoryMetadata | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // New States for Intent Mode
  const [mode, setMode] = useState<'media' | 'text'>('media');
  const [template, setTemplate] = useState<'blank' | 'quote' | 'announcement'>('blank');

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<File | null>(null);
  const isSharedEntityStory = !!sharedPostId || !!sharedJobId;

  // Fetch shared post data
  React.useEffect(() => {
    if (sharedPostId) {
      import("@/services/api/feed").then(({ getPostById }) => {
        getPostById(sharedPostId).then((data: BackendPost) => {
          // Map backend post to SharedPostCard format
          setPostData({
            is_accessible: true, // Assuming if you can share it, you can see it
            post_id: data.post_id,
            content: data.content,
            author: {
              user_id: data.author_id,
              full_name: data.author_name || "Unknown",
              avatar_url: data.author_avatar || ""
            },
            media: data.media.map((item) => ({
              url: item.url,
              media_type: item.media_type
            })) || []
          });
        }).catch(err => console.error("Failed to load shared post", err));
      });
    }
  }, [sharedPostId]);

  React.useEffect(() => {
    if (sharedJobId) {
      getJobById(sharedJobId)
        .then((job) => {
          setJobData(job);
        })
        .catch((err) => console.error("Failed to load shared job", err));
    }
  }, [sharedJobId]);

  React.useEffect(() => {
    if (sharedJobId) {
      setScale((prev) => (prev === 1 ? 1.5 : prev));
    }
  }, [sharedJobId]);

  const handleCancel = () => {
    onCancel?.()
  }

  const { activeProfile } = useActiveProfile();
  const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

  const handleCreate = async () => {
    if (sharedJobId && !jobData) return
    if ((!selectedImage && !selectedVideo && !isSharedEntityStory && selectedFiles.length === 0) || isSubmitting) return

    setIsSubmitting(true)
    try {
      if (selectedFiles.length > 0) {
        let lastCreatedStory: StoryDetail | null = null
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const uploadRes = await showcaseService.uploadMedia(file, companyId)

          if (!uploadRes.url || uploadRes.url.startsWith('blob:')) {
            throw new Error(`Upload failed for file: ${file.name}`)
          }

          const createdStory = await showcaseService.createStory({
            title: "",
            description: description || `Story ${i + 1}`,
            media_url: uploadRes.url,
            media_type: uploadRes.media_type,
            public_id: uploadRes.public_id
          }, companyId)

          lastCreatedStory = mapStory(createdStory)
        }

        if (onCreated && lastCreatedStory) {
          onCreated(lastCreatedStory)
        }
        return
      }

      // Duration Check (for video)
      if (selectedVideo && !isSharedEntityStory) {
        const video = document.createElement('video');
        video.src = selectedVideo;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        if (video.duration > 30) {
          alert("Video must be 30 seconds or less.");
          setIsSubmitting(false);
          return;
        }
      }
      // 1. Determine the file to upload (baked snapshot for images, raw video for videos)
      const metadataWithFiles = editorMetadata as StoryMetadataWithFiles | null;
      const snapshotFile = metadataWithFiles?._compositeFile;
      const baseFile = metadataWithFiles?._baseFile || editingFile;

      // For images: upload the composite snapshot (baked by html2canvas)
      // For videos: upload the video file directly
      const mainFileToUpload: File | Blob | null =
        fileRef.current ||
        snapshotFile ||
        (editingFile instanceof File ? editingFile : null) ||
        (baseFile instanceof File ? baseFile : null);

      let fileToUpload = mainFileToUpload;

      if (!fileToUpload && isSharedEntityStory) {
        if (previewRef.current) {
          const canvas = await html2canvas(previewRef.current, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: null
          });

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
          if (!blob) throw new Error("Failed to generate shared story image");
          fileToUpload = new File([blob], "shared-entity-story.jpg", { type: "image/jpeg" });
        } else {
          const blob = await getGradientImage(backgroundStyle);
          fileToUpload = new File([blob], "shared-post-bg.jpg", { type: "image/jpeg" });
        }
      }

      let mediaData = { url: "", public_id: "", media_type: "image" };

      if (fileToUpload) {
        const uploadRes = await showcaseService.uploadMedia(
          fileToUpload instanceof File
            ? fileToUpload
            : new File([fileToUpload], "story-upload", { type: fileToUpload.type }),
          companyId
        );

        if (!uploadRes.url || uploadRes.url.startsWith('blob:')) {
          throw new Error("Upload failed: received invalid URL from server");
        }

        mediaData = {
          url: uploadRes.url,
          public_id: uploadRes.public_id,
          media_type: uploadRes.media_type
        };
      } else {
        throw new Error("No media file available to upload");
      }

      // 2. Prepare clean metadata (remove internal editor props)
      const finalMetadataObj = { ...editorMetadata } as StoryMetadataWithFiles;
      delete finalMetadataObj._baseFile;
      delete finalMetadataObj._compositeFile;

      // Final guard: ensure we have a real URL before calling the API
      if (!mediaData.url || mediaData.url.startsWith('blob:')) {
        throw new Error("Upload failed: media URL is invalid or not yet uploaded");
      }

      // For video stories: patch the main video layer's src to the uploaded media URL
      // (it currently holds a blob URL from the editor)
      if (finalMetadataObj?.layers && mediaData.url) {
        finalMetadataObj.layers = finalMetadataObj.layers.map((layer) => {
          if ((layer.id === 'main-image' || layer.id === 'main-video') && 'src' in layer && layer.src) {
            return { ...layer, src: mediaData.url };
          }
          return layer;
        });
      }

      // 3. Create story — single snapshot URL, no dual upload
      const createdStory = await showcaseService.createStory({
        title: "",
        description,
        media_url: mediaData.url,
        media_type: mediaData.media_type,
        public_id: mediaData.public_id,
        shared_post_id: sharedPostId || undefined,
        story_metadata: sharedPostId ? {
          backgroundStyle: !selectedImage ? backgroundStyle : undefined,
          scale: scale,
          is_baked: true
        } : sharedJobId ? {
          type: "job",
          job_id: jobData?.jobId || sharedJobId,
          title: jobData?.title || "",
          company_name: jobData?.company || "",
          location: jobData?.location || "",
          salary: jobData?.salary || "",
          applicants: jobData?.applicants ?? 0,
          company_logo: jobData?.companyLogo || "",
          avatar: jobData?.companyLogo || "",
          job_type: jobData?.type || "",
          posted_time: jobData?.postedTime || "",
          actively_hiring: !!jobData?.activelyHiring,
          is_saved: !!jobData?.isSaved,
          backgroundStyle: !selectedImage ? backgroundStyle : undefined,
          scale: scale,
          is_baked: true
        } : finalMetadataObj || undefined
      }, companyId);

      if (onCreated) {
        onCreated(mapStory(createdStory))
      }
    } catch (error) {
      console.error("Failed to create story", error)
      alert(`Failed to create story: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSubmitting(false)
    }
  }


  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.length > 1) {
      // Multiple files selected
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.src = URL.createObjectURL(file)
          await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true)
          })
          window.URL.revokeObjectURL(video.src)
          if (video.duration > 30) {
            alert(`Video "${file.name}" must be 30 seconds or less.`)
            e.target.value = ""
            return
          }
        }
      }
      setSelectedFiles(files)
      setSelectedImage(null)
      setSelectedVideo(null)
      setEditingFile(null)
    } else {
      // Single file selected (original logic)
      const file = files[0]
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = URL.createObjectURL(file)
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true)
        })
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          alert("Video must be 30 seconds or less.")
          e.target.value = ""
          return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedVideo(reader.result as string)
          setSelectedImage(null)
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedImage(reader.result as string)
          setSelectedVideo(null)
        }
        reader.readAsDataURL(file)
      }
      setEditingFile(file)
      setSelectedFiles([])
    }
    e.target.value = ""
  }

  const handleEditorSave = (file: File | Blob | string, metadata: StoryMetadata) => {
    // file is either the COMPOSITE image OR the original VIDEO from StoryEditor
    if (file instanceof File || file instanceof Blob) {
      const isVideo = file.type.startsWith('video/');
      const f = file instanceof File ? file : new File([file], isVideo ? "story-video.mp4" : "story-composite.jpg", { type: file.type || (isVideo ? "video/mp4" : "image/jpeg") });

      fileRef.current = f; // fileRef now guards the "Media to show" (Composite or Video)

      if (isVideo) {
        const url = URL.createObjectURL(f);
        setSelectedVideo(url);
        setSelectedImage(null);
        // Don't revoke immediately as we need it for preview
      } else {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedImage(reader.result as string)
          setSelectedVideo(null)
        }
        reader.readAsDataURL(f)
      }
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

      {editingFile && !isPreviewing && (() => {
        // When re-editing, refresh blob URLs in layer metadata since the old ones
        // may have been revoked when StoryEditor unmounted previously
        let patchedMetadata = editorMetadata || undefined;
        if (patchedMetadata?.layers && editingFile instanceof File) {
          const freshUrl = URL.createObjectURL(editingFile);
          patchedMetadata = {
            ...patchedMetadata,
            layers: patchedMetadata.layers.map(layer => {
              if ((layer.id === 'main-image' || layer.id === 'main-video') && 'src' in layer) {
                return { ...layer, src: freshUrl };
              }
              return layer;
            })
          };
        }
        return (
          <StoryEditor
            file={editingFile}
            initialMetadata={patchedMetadata}
            onSave={handleEditorSave}
            onCancel={handleEditorCancel}
            disableBackgroundFallback={true}
          />
        );
      })()}

      {/* Preview Modal */}
      {isPreviewing && editingFile && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="w-full h-16 px-4 flex items-center justify-between bg-black/50 absolute top-0 z-20">
            <h2 className="text-white font-bold text-lg">Preview Story</h2>
            <button onClick={() => setIsPreviewing(false)} className="text-white font-medium">Edit</button>
          </div>

          {/* Preview Canvas */}
          <div className="relative w-full h-full max-w-md aspect-[9/16] bg-gray-900 shadow-2xl overflow-hidden rounded-lg my-4">
            {editorMetadata?.layers && editorMetadata.layers.length > 0 && selectedVideo ? (
              <VirtualLayerCanvas
                layers={editorMetadata.layers}
                isActive={true}
                fallbackVideoUrl={selectedVideo || undefined}
                background={editorMetadata.background}
              />
            ) : (
              <>
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
                {selectedVideo && (
                  <video
                    src={selectedVideo}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )}
              </>
            )}
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
      {!isSharedEntityStory ? (
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
              {/* Unified Media Upload Section */}
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">Upload Media</label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`
                                     w-full h-64 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden
                                     ${selectedImage || selectedVideo || selectedFiles.length > 0 ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                                 `}
                >
                  {selectedFiles.length > 0 ? (
                    <div className="w-full h-full p-4 flex flex-col justify-between overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                          <span className="text-sm font-semibold text-foreground">{selectedFiles.length} files selected</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles([])}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <span className="uppercase text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                              {file.type.split('/')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-center text-xs text-blue-500 mt-2 hover:underline"
                      >
                        Click to change/add files
                      </button>
                    </div>
                  ) : selectedImage ? (
                    <img src={selectedImage} alt="Selected" className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                  ) : selectedVideo ? (
                    <video src={selectedVideo} className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                        <Image className="w-8 h-8 text-blue-500" />
                      </div>
                      <span className="text-lg font-medium text-blue-500">Upload Photo or Video</span>
                      <p className="text-sm text-muted-foreground mt-2">JPG, PNG, MP4, MOV</p>
                      <p className="text-xs text-muted-foreground mt-1">(Video max 30s, supports selecting multiple files)</p>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                    multiple
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
                  {(['blank', 'quote', 'announcement'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t)}
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
                        id: uuidv4(), type: 'text',
                        x: 50, y: 50, width: 80, height: 20, rotation: 0, scale: 1, zIndex: 1,
                        content: '"Your Quote Here"',
                        style: { color: '#ffffff', fontSize: 32, fontFamily: 'serif', fontWeight: 'normal', textAlign: 'center', fontStyle: 'italic' }
                      });
                    } else if (template === 'announcement') {
                      meta.layers.push({
                        id: uuidv4(), type: 'text',
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
            ref={previewRef}
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
              className="z-10 w-full"
              style={{ transform: `scale(${scale})` }}
            >
              {sharedPostId ? (
                postData ? (
                  <SharedPostCard sharedPost={postData} onClick={() => { }} />
                ) : (
                  <div className="w-full h-32 bg-white/10 animate-pulse rounded-xl" />
                )
              ) : sharedJobId ? (
                jobData ? (
                  <div className="pointer-events-none">
                    <JobStoryCard
                      metadata={{
                        job_id: jobData.jobId || sharedJobId,
                        title: jobData.title,
                        company_name: jobData.company,
                        location: jobData.location,
                        salary: jobData.salary,
                        applicants: jobData.applicants,
                        company_logo: jobData.companyLogo,
                        avatar: jobData.companyLogo,
                        job_type: jobData.type,
                        posted_time: jobData.postedTime,
                        actively_hiring: !!jobData.activelyHiring,
                        is_saved: !!jobData.isSaved,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-white/10 animate-pulse rounded-xl" />
                )
              ) : null}
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
                  onChange={handleMediaUpload}
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
                <span>{sharedJobId ? "Card Size" : "Post Size"}</span>
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
            rows={isSharedEntityStory ? 3 : 6}
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
          disabled={isSubmitting || (sharedJobId && !jobData) || (!selectedImage && !selectedVideo && !isSharedEntityStory && selectedFiles.length === 0)}
          className="flex-1 px-6 py-3 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-default flex items-center justify-center gap-2"
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
