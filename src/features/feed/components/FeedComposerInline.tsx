'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useFeed } from '@/hooks/use-feed';
import { MentionTextarea } from '@/shared/commonComponents/MentionTextarea';
import { Icon } from '@/components/icons';
import { postApi } from '@/features/feed/api/post.api';
import { sanitizeContent } from '@/lib/contentSanitizer';
import { formatMentionsForBackend, parseMentionsForFrontend } from '@/lib/mentions';
import { UserMention } from '@/services/api/users';
import { getPostById } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { toast } from 'sonner';
import { MapPin, X, Plus, ChevronDown } from 'lucide-react';
import { Dialog, BareDialogContent } from '@/components/ui/dialog';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { ComposerImagePreview, ComposerImage, MAX_COMPOSER_IMAGES } from '@/features/feed/components/create-post/ComposerImagePreview';
import { getImageDimensions } from '@/features/feed/utils/imageBounds';
import { usePostPoll } from '@/features/feed/hooks/use-post-poll';
import PostVideoCard from '@/features/feed/components/create-post/post-types/PostVideoCard';
import SharedPreview from './create-post/SharedPreview';
import { PostUploadProgressStrip } from '@/features/feed/components/PostUploadProgressStrip';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ComposerMode = 'text' | 'photo' | 'video' | 'poll';

interface FeedComposerInlineProps {
  onOpenArticle: () => void;
  onPostCreated?: () => void;
  editPostId?: string | null;
  editPostData?: any | null;
  onClearEdit?: () => void;
  repostData?: any | null;
  onClearRepost?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const FeedComposerInline = ({ onOpenArticle, onPostCreated, editPostId, editPostData, onClearEdit, repostData, onClearRepost }: FeedComposerInlineProps) => {
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const { addPost, updatePostInFeed } = useFeed();
  const isEditMode = !!editPostId && !!editPostData;

  // ── Core State ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ComposerMode>('text');
  const [text, setText] = useState('');
  const [location, setLocation] = useState<LocationSuggestion | StructuredLocation | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Poll State ────────────────────────────────────────────────────────────
  const poll = usePostPoll();
  const [durationOpen, setDurationOpen] = useState(false);

  // ── Media State (Phase 2: Free Aspect Ratio, 1-12 photos, or 1 video) ──────
  const [selectedImages, setSelectedImages] = useState<ComposerImage[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ file: File; previewUrl: string } | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Mention tracking ─────────────────────────────────────────────────────
  const [inlineMentions, setInlineMentions] = useState<UserMention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Upload Progress State ────────────────────────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'success'>('idle');

  // ── Derived ───────────────────────────────────────────────────────────────
  const avatarUrl = activeProfile?.avatar_url;
  const initial = activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : 'U';
  const isCompanyPost = activeProfile?.type === 'COMPANY';
  const companyId = isCompanyPost ? activeProfile?.id : undefined;

  // ── Repost State in Edit / Normal Mode ────────────────────────────────────
  const [fetchedSharedPost, setFetchedSharedPost] = useState<any | null>(null);

  // Check if the Post button should be enabled
  const effectiveRepostData = repostData || (isEditMode ? (editPostData?.shared_post || editPostData?.sharedPost || fetchedSharedPost) : null);
  const isRepostMode = !!effectiveRepostData;

  const canPost = mode === 'poll'
    ? poll.isPollValid()
    // Bug 4: In repost mode, Post button stays disabled until user adds thoughts (text/media)
    : (text.trim().length > 0 || selectedImages.length > 0 || selectedVideo !== null);
  
  const hasContent = mode === 'poll'
    ? (poll.pollQuestion.trim().length > 0 || poll.pollOptions.some(o => o.text.trim().length > 0))
    // Bug 6: Don't count isRepostMode alone as "hasContent" — user must actually type or add media
    : (text.trim().length > 0 || inlineMentions.length > 0 || selectedImages.length > 0 || selectedVideo !== null);

  const hasMedia = selectedImages.length > 0 || selectedVideo !== null;
  const showLocationFeature = hasContent || location !== null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!isExpanded && e.target.value.length > 0) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleMentionsChange = useCallback((mentions: UserMention[]) => {
    setInlineMentions(mentions);
  }, []);

  const handleLocationToggle = useCallback(() => {
    setShowLocationSelector(true);
  }, []);

  const handleLocationClear = useCallback(() => {
    setLocation(null);
  }, []);

  const resetComposer = useCallback(() => {
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    if (selectedVideo) URL.revokeObjectURL(selectedVideo.previewUrl);
    setSelectedImages([]);
    setSelectedVideo(null);
    setActiveImageIdx(0);
    setText('');
    setLocation(null);
    setFetchedSharedPost(null);
    setInlineMentions([]);
    poll.clearPoll();
    setDurationOpen(false);
    setMode('text');
    setIsExpanded(false);
    if (onClearEdit) onClearEdit();
    if (onClearRepost) onClearRepost();
  }, [selectedImages, selectedVideo, poll, onClearEdit, onClearRepost]);

  // ── Edit Mode Initialization ──────────────────────────────────────────────
  React.useEffect(() => {
    if (isEditMode && editPostData) {
      setIsExpanded(true);
      const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(editPostData.content || '');
      setText(parsedContent);
      setInlineMentions(parsedMentions);

      // Setup Repost Data if editing a repost
      const existingShared = editPostData.shared_post || editPostData.sharedPost;
      if (existingShared) {
        setFetchedSharedPost(existingShared);
      } else if (editPostData.shared_post_id) {
        getPostById(editPostData.shared_post_id)
          .then((backendPost) => {
            if (backendPost) {
              setFetchedSharedPost(mapBackendPostToFrontend(backendPost));
            }
          })
          .catch((err) => console.error("Failed to load shared post for edit:", err));
      } else {
        setFetchedSharedPost(null);
      }
      
      // Setup Location
      if (editPostData.location) {
        setLocation({
          name: editPostData.location,
          formattedAddress: editPostData.location,
          latitude: null,
          longitude: null
        } as unknown as StructuredLocation);
      } else {
        setLocation(null);
      }

      // Setup Post Type & Media
      if (editPostData.post_type === 'poll' && editPostData.poll_question) {
        setMode('poll');
        poll.setPollQuestion(editPostData.poll_question);
        poll.setPollOptions(
          editPostData.poll_options?.map((opt: string) => ({ id: Math.random().toString(), text: opt })) || []
        );
        poll.setPollDuration(editPostData.poll_duration || '1 week');
      } else if (editPostData.post_type === 'image' || (editPostData.images && editPostData.images.length > 0)) {
        setMode('photo');
        if (editPostData.images && Array.isArray(editPostData.images)) {
          const initialImages = editPostData.images.map((url: string, idx: number) => ({
            id: `existing-${idx}`,
            file: new File([""], `existing-image-${idx}.jpg`, { type: "image/jpeg" }),
            previewUrl: url,
            naturalWidth: 800,
            naturalHeight: 600,
            aspectRatio: 800 / 600,
          }));
          setSelectedImages(initialImages);
        }
      } else if (editPostData.post_type === 'video' || editPostData.videoSrc) {
        setMode('video');
        if (editPostData.videoSrc) {
          setSelectedVideo({
            file: new File([""], `existing-video.mp4`, { type: "video/mp4" }),
            previewUrl: editPostData.videoSrc
          });
        }
      } else {
        setMode('text');
      }
    }
  }, [isEditMode, editPostId, editPostData]);

  // ── Media Handlers (Max 12 photos, or 1 video) ─────────────────────────────
  const handleImageClick = useCallback(() => {
    if (mode === 'poll') {
      poll.clearPoll();
      setMode('text');
    }
    if (selectedImages.length >= MAX_COMPOSER_IMAGES) {
      toast.info(`Attached media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})`);
      return;
    }
    if (selectedVideo) {
      toast.error("Only one video file is allowed");
      return;
    }
    fileInputRef.current?.click();
  }, [mode, poll, selectedImages.length, selectedVideo]);

  const handleFilesChosen = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const hasOversized = fileArray.some(file => file.size > MAX_FILE_SIZE);
    if (hasOversized) {
      toast.error("File size cannot exceed 100MB");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const videoFiles = fileArray.filter(f => f.type.startsWith('video/'));
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    // Mixed check in selection
    if (videoFiles.length > 0 && imageFiles.length > 0) {
      toast.error("Cannot upload video and images together");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Video upload
    if (videoFiles.length > 0) {
      if (selectedImages.length > 0) {
        toast.error("Cannot upload video and images together");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (videoFiles.length > 1 || selectedVideo !== null) {
        toast.error("Only one video file is allowed");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const vidFile = videoFiles[0];
      setSelectedVideo({
        file: vidFile,
        previewUrl: URL.createObjectURL(vidFile),
      });
      setMode('video');
      setIsExpanded(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Images upload
    if (imageFiles.length > 0) {
      if (selectedVideo !== null) {
        toast.error("Cannot upload video and images together");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const remainingSlots = MAX_COMPOSER_IMAGES - selectedImages.length;
      if (remainingSlots <= 0) {
        toast.info(`Attached media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const filesToAdd = imageFiles.slice(0, remainingSlots);
      if (imageFiles.length > remainingSlots) {
        toast.info(`Only ${remainingSlots} more photo${remainingSlots > 1 ? 's' : ''} could be added (max ${MAX_COMPOSER_IMAGES}).`);
      }

      const newImages: ComposerImage[] = [];
      for (const file of filesToAdd) {
        try {
          const dims = await getImageDimensions(file);
          newImages.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            naturalWidth: dims.width,
            naturalHeight: dims.height,
            aspectRatio: dims.aspectRatio,
          });
        } catch (e) {
          console.error('Failed to load image dimensions:', e);
        }
      }

      if (newImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages]);
        setMode('photo');
        setIsExpanded(true);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedImages.length, selectedVideo]);

  const handleRemoveVideo = useCallback(() => {
    if (selectedVideo) URL.revokeObjectURL(selectedVideo.previewUrl);
    setSelectedVideo(null);
    setMode('text');
  }, [selectedVideo]);

  const handleRemoveImage = useCallback((id: string) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((img) => img.id !== id);
      if (next.length === 0) setMode('text');
      return next;
    });
    setActiveImageIdx((prev) => Math.max(0, Math.min(prev, selectedImages.length - 2)));
  }, [selectedImages.length]);

  const handleReplaceImage = useCallback(async (id: string, file: File) => {
    try {
      const dims = await getImageDimensions(file);
      const newImg: ComposerImage = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        aspectRatio: dims.aspectRatio,
      };
      setSelectedImages((prev) =>
        prev.map((img) => {
          if (img.id === id) {
            URL.revokeObjectURL(img.previewUrl);
            return newImg;
          }
          return img;
        })
      );
    } catch (e) {
      console.error('Failed to replace image:', e);
    }
  }, []);

  const handleReorderImages = useCallback((fromIdx: number, toIdx: number) => {
    setSelectedImages((prev) => {
      if (fromIdx < 0 || fromIdx >= prev.length || toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
    setActiveImageIdx(toIdx);
  }, []);

  const handleCancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handlePost = useCallback(async () => {
    if (isSubmitting || !canPost || (uploadPhase !== 'idle' && uploadPhase !== 'error' && uploadPhase !== 'success')) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
    abortControllerRef.current = new AbortController();

    // Clear composer visually immediately for new posts
    if (!isEditMode) {
      resetComposer();
    }

    try {
      const locationString = location 
        ? ('formattedAddress' in location ? location.formattedAddress : location.name)
        : null;

      // ── Handle Poll Post ──
      if (mode === 'poll') {
        if (!poll.isPollValid()) {
          setIsSubmitting(false);
          return;
        }

        const payload: any = {
          title: poll.pollQuestion.trim(),
          content: poll.pollQuestion.trim(),
          post_type: 'poll',
          category: 'Professional',
          visibility: 'public',
          location: locationString,
          companyId: companyId || undefined,
          poll_question: poll.pollQuestion.trim(),
          poll_options: poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text.trim())),
          poll_duration: poll.pollDuration || '1 week',
        };

        const { mappedPost } = await postApi.create(payload, []);
        addPost(mappedPost);
        window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));

        setUploadPhase('success');
        setTimeout(() => setUploadPhase('idle'), 3000);
        if (onPostCreated) onPostCreated();
        return;
      }

      // ── Handle Video Post ──
      if (mode === 'video' && selectedVideo) {
        let finalContent = sanitizeContent(text);
        finalContent = formatMentionsForBackend(finalContent, inlineMentions);

        const payload: any = {
          title: '',
          content: finalContent,
          post_type: 'video',
          category: 'Professional',
          visibility: 'public',
          location: locationString,
          companyId: companyId || undefined,
          shared_post_id: repostData?.id || undefined,
        };

        const files = [selectedVideo.file];
        const uploadConfig = {
          signal: abortControllerRef.current.signal,
          onUploadProgress: (percent: number) => {
            setUploadProgress(percent);
            if (percent === 100) setUploadPhase('processing');
          }
        };
        const { mappedPost } = await postApi.create(payload, files, undefined, uploadConfig);

        addPost(mappedPost);
        window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));

        setUploadPhase('success');
        setTimeout(() => setUploadPhase('idle'), 3000);
        if (onPostCreated) onPostCreated();
        return;
      }

      // ── Handle Standard / Photo Post ──
      let finalContent = sanitizeContent(text);
      finalContent = formatMentionsForBackend(finalContent, inlineMentions);

      const sharedPostId = repostData?.id || (isEditMode ? (
        editPostData?.shared_post_id ||
        effectiveRepostData?.id ||
        effectiveRepostData?.post_id ||
        editPostData?.shared_post?.id ||
        editPostData?.sharedPost?.id
      ) : undefined);

      const payload: any = {
        title: '',
        content: finalContent,
        post_type: selectedImages.length > 0 ? 'image' : (editPostData?.post_type || 'text'),
        category: editPostData?.category || 'Professional',
        visibility: editPostData?.visibility || 'public',
        location: locationString,
        companyId: companyId || undefined,
        media_urls: isEditMode ? selectedImages.map((img) => img.previewUrl) : undefined,
        shared_post_id: sharedPostId,
      };

      if (isEditMode && editPostId) {
        await postApi.update(editPostId, payload);
        toast.success('Post updated!');
        updatePostInFeed(editPostId, {
          content: finalContent,
          location: locationString || undefined,
          visibility: payload.visibility,
          ...(effectiveRepostData ? { shared_post: effectiveRepostData } : {})
        });
        window.dispatchEvent(new CustomEvent('postUpdated', { detail: { id: editPostId, ...payload } }));
        resetComposer();
        setUploadPhase('idle');
      } else {
        const files = selectedImages.map((img) => img.file);
        const uploadConfig = {
          signal: abortControllerRef.current.signal,
          onUploadProgress: (percent: number) => {
            setUploadProgress(percent);
            if (percent === 100) setUploadPhase('processing');
          }
        };
        const { mappedPost } = await postApi.create(payload, files, undefined, uploadConfig);
        addPost(mappedPost);
        window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));
        
        setUploadPhase('success');
        setTimeout(() => setUploadPhase('idle'), 3000);
      }

      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('Upload cancelled by user');
        setUploadPhase('idle');
        return;
      }
      setUploadPhase('error');
      const errorMessage = err.response?.data?.message || err.message || 'Failed to publish post';
      console.error('Post action failed:', errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setUploadPhase('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, canPost, mode, poll, text, selectedImages, selectedVideo, inlineMentions, location, companyId, addPost, resetComposer, onPostCreated, isEditMode, editPostId, editPostData, repostData, uploadPhase]);

  // ── Toolbar Actions ───────────────────────────────────────────────────────
  const handlePollClick = useCallback(() => {
    if (mode === 'poll') {
      poll.clearPoll();
      setMode('text');
    } else {
      // Clear media when switching to poll mode
      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (selectedVideo) URL.revokeObjectURL(selectedVideo.previewUrl);
      setSelectedImages([]);
      setSelectedVideo(null);
      setMode('poll');
      setIsExpanded(true);
    }
  }, [mode, poll, selectedImages, selectedVideo]);

  const handleArticleClick = useCallback(() => {
    onOpenArticle();
  }, [onOpenArticle]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="w-full flex flex-col pt-[16px] px-[16px] pb-0 bg-ds-bg border-b border-ds-border max-w-[442px] mx-auto gap-[16px] relative">

        {/* Hidden file input for uploading images & videos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesChosen(e.target.files)}
      />

      {/* ── Mode: Poll Creator ────────────────────────────────────────── */}
      {mode === 'poll' ? (
        <div className="w-full flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-[12px]">
              <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-ds-surface-1 flex items-center justify-center shrink-0 flex-none">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-ds-text-primary text-[11px] font-medium">{initial}</span>
                )}
              </div>
              <span className="font-dmsans text-ds-text-secondary text-[14px] font-medium leading-[20px]">Poll post</span>
            </div>
            <button
              type="button"
              onClick={() => {
                poll.clearPoll();
                setMode('text');
              }}
              className="text-ds-text-muted hover:text-ds-text-primary p-1 cursor-pointer rounded-full transition-colors outline-none"
              title="Cancel poll"
              aria-label="Cancel poll"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Input */}
          <div className="w-full">
            <input
              type="text"
              value={poll.pollQuestion}
              onChange={(e) => poll.setPollQuestion(e.target.value)}
              placeholder="Ask your network..."
              className="w-full bg-transparent border-b border-zinc-800 focus:border-zinc-600 pb-2.5 text-[15px] text-ds-text-primary placeholder:text-ds-text-muted outline-none transition-colors"
            />
          </div>

          {/* Options List */}
          <div className="w-full flex flex-col gap-3">
            {poll.pollOptions.map((opt, index) => {
              const letter = ['A', 'B', 'C', 'D', 'E', 'F'][index] || `${index + 1}`;
              return (
                <div key={opt.id} className="relative flex items-center w-full">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => poll.updatePollOption(opt.id, e.target.value)}
                    placeholder={`Option ${letter}`}
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-zinc-600 pb-2.5 pr-8 text-[14px] text-ds-text-primary placeholder:text-ds-text-muted outline-none transition-colors"
                  />
                  {poll.pollOptions.length > 2 && index >= 2 && (
                    <button
                      type="button"
                      onClick={() => poll.removePollOption(opt.id)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-ds-text-muted hover:text-red-400 cursor-pointer transition-colors outline-none"
                      title="Remove option"
                      aria-label="Remove option"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Option Button (Capsule) */}
            {poll.pollOptions.length < 6 && (
              <button
                type="button"
                onClick={poll.addPollOption}
                className="w-full py-2.5 rounded-full border border-ds-border hover:bg-ds-surface-1 font-dmsans text-[16px] leading-[24px] text-ds-text-primary font-medium flex items-center justify-center gap-[8px] transition-colors cursor-pointer outline-none mt-1"
              >
                <Plus className="w-4 h-4" />
                Add option
              </button>
            )}
          </div>

          {/* Poll Duration Dropdown */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setDurationOpen((prev) => !prev)}
              className="w-full flex items-center justify-between pb-2 text-[14px] text-ds-text-primary cursor-pointer border-b border-zinc-800 focus:border-zinc-600 outline-none"
            >
              <span className={poll.pollDuration ? 'text-ds-text-primary' : 'text-ds-text-muted'}>
                {poll.pollDuration || 'Poll duration'}
              </span>
              <ChevronDown className={`w-4 h-4 text-ds-text-muted transition-transform duration-200 ${durationOpen ? 'rotate-180' : ''}`} />
            </button>

            {durationOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-ds-surface-2 border border-ds-border rounded-xl shadow-lg z-30 p-1">
                {['1 day', '3 days', '1 week', '2 weeks'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      poll.setPollDuration(d);
                      setDurationOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                      poll.pollDuration === d
                        ? 'bg-[var(--ds-accent)] text-white font-medium'
                        : 'text-ds-text-primary hover:bg-ds-surface-1'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Standard Mode: Avatar + Text Area ───────────────────────── */
        <>
          <div className="flex flex-row items-start gap-[12px] w-full">
            {/* Avatar */}
            <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-ds-surface-1 flex items-center justify-center shrink-0 flex-none">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-ds-text-primary text-[11px] font-medium">{initial}</span>
              )}
            </div>

            {/* MentionTextarea — active, editable inline */}
            <div className="flex-grow min-h-[36px]">
              <MentionTextarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onFocus={handleFocus}
                onMentionsChange={handleMentionsChange}
                initialMentions={inlineMentions}
                placeholder="What would you like to share today?"
                className="ds-text-body text-ds-text-primary placeholder:text-ds-text-muted bg-transparent"
              />
            </div>
          </div>

          {/* ── Shared Preview (Repost Mode or Edit Repost Mode) ─ */}
          {isRepostMode && effectiveRepostData && (
            <div className="relative w-full mt-[12px]">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => onClearRepost?.()}
                  className="absolute bottom-full right-0 mb-[8px] p-1 text-[#B8ADA8] hover:text-white transition-colors z-10 cursor-pointer"
                >
                  <X className="w-[20px] h-[20px]" />
                </button>
              )}
              <SharedPreview 
                sharedPost={effectiveRepostData} 
                sharedPostId={effectiveRepostData.id?.toString() || (effectiveRepostData as any).post_id?.toString() || editPostData?.shared_post_id?.toString()}
                isMobile={typeof window !== 'undefined' ? window.innerWidth < 768 : false} 
                clickable={false} 
              />
            </div>
          )}

          {/* ── Attached Images Preview (Free Aspect Ratio, Max 12) ─ */}
          {selectedImages.length > 0 && (
            <div className="w-full">
              <ComposerImagePreview
                images={selectedImages}
                onRemoveImage={handleRemoveImage}
                isEditMode={isEditMode}
              />
            </div>
          )}

          {/* ── Attached Video Preview ─ */}
          {selectedVideo && mode === 'video' && (
            <div className="relative w-full rounded-2xl overflow-hidden group">
              <PostVideoCard
                videoSrc={selectedVideo.previewUrl}
                showHeader={false}
              />
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-30 shadow-md cursor-pointer"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Section 2: Add Location ────────────────────────────────────── */}
      {showLocationFeature && (
        location ? (
          <div className={`flex items-center gap-[8px] ${selectedImages.length > 0 || selectedVideo !== null || mode === 'poll' ? '' : 'pl-[52px]'}`}>
            {/* FIX: Removed MapPin icon when a location is actively selected */}
            {/* FIX: Removed clear 'X' icon so users must click Change instead */}
            <span className="bg-transparent ds-text-small text-ds-text-primary truncate">
              {'formattedAddress' in location ? location.formattedAddress : location.name}
            </span>
            <button
              type="button"
              onClick={handleLocationToggle}
              // FIX: Replaced hardcoded #F95B14 hex with AGENTS.md compliant var(--ds-accent)
              className="ds-text-small text-[var(--ds-accent)] hover:underline cursor-pointer shrink-0"
            >
              <span className="text-ds-text-primary mr-1">•</span> Change
            </button>
          </div>
        ) : (
          <button
            onClick={handleLocationToggle}
            // FIX: Replaced hardcoded #F95B14 hex with AGENTS.md compliant var(--ds-accent)
            className={`${selectedImages.length > 0 || selectedVideo !== null || mode === 'poll' ? '' : 'pl-[52px]'} text-left text-[var(--ds-accent)] ds-text-small cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-colors duration-[120ms] hover:opacity-80 w-fit`}
            aria-label="Add location"
          >
            Add location
          </button>
        )
      )}

        {/* ── Section 3: Bottom Toolbar ──────────────────────────────────── */}
        <div className={`flex flex-row justify-between items-center w-full mt-1 ${selectedImages.length > 0 || selectedVideo !== null || mode === 'poll' ? '' : 'pl-[52px]'}`}>
          {isEditMode ? (
            <>
              <span className="text-white text-[15px] font-medium font-['DM_Sans']">Edit post</span>
              <div className="flex items-center gap-[12px]">
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!canPost || isSubmitting}
                  className="h-[32px] px-[20px] rounded-full bg-[var(--ds-accent)] text-white text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center cursor-pointer outline-none"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={resetComposer}
                  className="h-[32px] px-[16px] rounded-full border border-white/20 text-white text-[14px] font-medium hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer outline-none"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Bug 5: Hide image/poll/article icons in repost mode */}
              {!isRepostMode && (
                <div className="flex flex-row items-center gap-[16px]">
                  {/* Image / Photo */}
                  <button
                    type="button"
                    onClick={handleImageClick}
                    disabled={selectedImages.length >= MAX_COMPOSER_IMAGES}
                    className={`w-[40px] h-[40px] flex items-center justify-center outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-colors duration-[120ms] ${
                      selectedImages.length >= MAX_COMPOSER_IMAGES
                        ? 'opacity-40 cursor-not-allowed text-ds-text-muted'
                        : 'text-ds-text-primary hover:text-[var(--ds-accent)] cursor-pointer'
                    }`}
                    aria-label="Upload image"
                    title={selectedImages.length >= MAX_COMPOSER_IMAGES ? `Media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})` : 'Add photos'}
                  >
                    <Icon name="image" className="w-[20px] h-[20px]" />
                  </button>

                  {/* Poll */}
                  <button
                    onClick={handlePollClick}
                    className={`w-[40px] h-[40px] flex items-center justify-center outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-colors duration-[120ms] cursor-pointer ${
                      mode === 'poll' ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary hover:text-[var(--ds-accent)]'
                    }`}
                    aria-label="Create poll"
                    title="Create poll"
                  >
                    <Icon name="poll" className="w-[20px] h-[20px]" />
                  </button>

                  {/* Article */}
                  <button
                    onClick={handleArticleClick}
                    className="w-[40px] h-[40px] flex items-center justify-center text-ds-text-primary hover:text-[var(--ds-accent)] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-colors duration-[120ms] cursor-pointer"
                    aria-label="Write article"
                    title="Write article"
                  >
                    <Icon name="articles" className="w-[20px] h-[20px]" />
                  </button>
                </div>
              )}

            {/* Post Button */}
            <button
              onClick={handlePost}
              disabled={!canPost || isSubmitting}
              className={`ml-auto h-[36px] px-[16px] rounded-full ds-text-body-1 outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] transition-colors duration-[200ms] ${
                canPost && !isSubmitting
                  ? 'bg-[var(--ds-accent)] text-white hover:opacity-90 cursor-pointer'
                  : 'bg-ds-surface-1 text-ds-text-muted opacity-40 pointer-events-none cursor-default'
              }`}
              aria-label="Publish post"
            >
              {isSubmitting ? 'Publishing...' : 'Post'}
            </button>
          </>
        )}
      </div>

      {/* Location Selector Dialog */}
      <Dialog
        open={showLocationSelector}
        onOpenChange={(open) => {
          if (!open) setShowLocationSelector(false);
        }}
      >
        <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <LocationSelector
            selectedLocation={location}
            onLocationChange={setLocation}
            onCancel={() => setShowLocationSelector(false)}
            onConfirm={() => setShowLocationSelector(false)}
          />
        </BareDialogContent>
      </Dialog>
      </div>

      {/* ── Post Upload Progress Strip (Rendered outside composer box) ── */}
      {uploadPhase !== 'idle' && (
        <div className="w-full max-w-[442px] mx-auto px-4 lg:px-0">
          <PostUploadProgressStrip 
            progress={uploadProgress} 
            phase={uploadPhase as any} 
            onCancel={handleCancelUpload} 
          />
        </div>
      )}
    </>
  );
};

export default FeedComposerInline;
