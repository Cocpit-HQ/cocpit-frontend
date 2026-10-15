'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useFeed } from '@/hooks/use-feed';
import { MentionTextarea } from '@/shared/commonComponents/MentionTextarea';
import { Icon } from '@/components/icons';
import { postApi } from '@/features/feed/api/post.api';
import { sanitizeContent } from '@/lib/contentSanitizer';
import { formatMentionsForBackend } from '@/lib/mentions';
import { UserMention } from '@/services/api/users';
import { toast } from 'sonner';
import { X, Plus, ChevronDown, Search, Loader } from 'lucide-react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { ComposerImagePreview, ComposerImage, MAX_COMPOSER_IMAGES } from '@/features/feed/components/create-post/ComposerImagePreview';
import { getImageDimensions, getVideoDimensions } from '@/features/feed/utils/imageBounds';
import {
  usePostPoll,
  MAX_POLL_QUESTION_LENGTH,
  MAX_POLL_OPTION_LENGTH,
  POLL_LIMIT_EXCEEDED_MSG,
} from '@/features/feed/hooks/use-post-poll';
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
  disabled?: boolean;
  disabledPlaceholder?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const FeedComposerInline = ({
  onOpenArticle,
  onPostCreated,
  editPostId,
  editPostData,
  onClearEdit,
  repostData,
  onClearRepost,
  disabled = false,
  disabledPlaceholder = "Posting is disabled for your role",
}: FeedComposerInlineProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();
  // Pass false to avoid redundant initial feed fetch in composer
  const { addPost, updatePostInFeed } = useFeed(false);
  // const { addPost, updatePostInFeed } = useFeed();
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
  const [selectedVideo, setSelectedVideo] = useState<{ file: File; previewUrl: string; naturalWidth?: number; naturalHeight?: number } | null>(null);
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

  // If repostData is a repost-without-thoughts wrapper (empty content + has shared_post), unwrap to the original post
  const isContentEmpty = (text?: string) => !text || text.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '';
  const resolvedRepostData = (effectiveRepostData && isContentEmpty(effectiveRepostData.content) && effectiveRepostData.shared_post)
    ? effectiveRepostData.shared_post
    : effectiveRepostData;

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
  const canCancel = hasContent || location !== null || isRepostMode || mode === 'poll';

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
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Purpose of Bug Fix: Auto-expand inline composer when repostData (quoted post) is provided
  React.useEffect(() => {
    if (repostData) {
      setIsExpanded(true);
    }
  }, [repostData]);

  /* ===== LEGACY INLINE EDIT (Replaced by Fullscreen EditPostModal) =====
  React.useEffect(() => {
    if (isEditMode && editPostData) {
      setIsExpanded(true);
      const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(editPostData.content || '');
      setText(parsedContent);
      setInlineMentions(parsedMentions);

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
  ===== END LEGACY INLINE EDIT ===== */

  // ── Media Handlers (Max 12 photos, or 1 video) ─────────────────────────────
  const handleImageClick = useCallback(() => {
    if (mode === 'poll') {
      poll.clearPoll();
      setMode('text');
    }
    if (selectedImages.length >= MAX_COMPOSER_IMAGES) {
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

    // Media upload size constraints:
    // - Per image limit: 10MB maximum (reject individual file > 10MB)
    // - Total image upload limit: 120MB maximum (reject cumulative size > 120MB for up to 12 images)
    // - Video limit: 100MB maximum
    const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image limit
    const MAX_TOTAL_IMAGE_SIZE = 120 * 1024 * 1024; // 120MB total images limit
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB video limit

    const videoFiles = fileArray.filter(f => f.type.startsWith('video/'));
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    // Validate video file size limit (100MB)
    if (videoFiles.length > 0) {
      const oversizedVideo = videoFiles.find(f => f.size > MAX_VIDEO_SIZE);
      if (oversizedVideo) {
        toast.error(`Video "${oversizedVideo.name}" exceeds the 100MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Validate image file size limits (10MB per image, 120MB total post images)
    if (imageFiles.length > 0) {
      const oversizedImage = imageFiles.find(f => f.size > MAX_SINGLE_IMAGE_SIZE);
      if (oversizedImage) {
        toast.error(`Image "${oversizedImage.name}" exceeds the 10MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const currentTotalSize = selectedImages.reduce((sum, img) => sum + (img.file?.size || 0), 0);
      const newImagesSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
      if (currentTotalSize + newImagesSize > MAX_TOTAL_IMAGE_SIZE) {
        toast.error("Total image upload size cannot exceed 120MB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

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
      try {
        const dims = await getVideoDimensions(vidFile);
        setSelectedVideo({
          file: vidFile,
          previewUrl: URL.createObjectURL(vidFile),
          naturalWidth: dims.width,
          naturalHeight: dims.height,
        });
      } catch (e) {
        console.error('Failed to load video dimensions:', e);
        setSelectedVideo({
          file: vidFile,
          previewUrl: URL.createObjectURL(vidFile),
        });
      }
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
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const filesToAdd = imageFiles.slice(0, remainingSlots);

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
      if (next.length === 0) {
        setMode('text');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(e.dataTransfer.files);
    }
  }, [handleFilesChosen]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      imageFiles.forEach((f) => dt.items.add(f));
      handleFilesChosen(dt.files);
    }
  }, [handleFilesChosen]);

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

      let finalContent = sanitizeContent(text);
      finalContent = formatMentionsForBackend(finalContent, inlineMentions);

      const sharedPostId = resolvedRepostData?.id || (isEditMode ? (
        editPostData?.shared_post_id ||
        resolvedRepostData?.id ||
        resolvedRepostData?.post_id ||
        editPostData?.shared_post?.id ||
        editPostData?.sharedPost?.id
      ) : undefined);

      /* ===== LEGACY INLINE EDIT (Replaced by Fullscreen EditPostModal) =====
      if (isEditMode && editPostId) {
        if (mode === 'poll' && !poll.isPollValid()) {
          setIsSubmitting(false);
          setUploadPhase('idle');
          return;
        }

        const newFilesToUpload: File[] = [];
        if (mode === 'video' && selectedVideo?.file && selectedVideo.file.size > 0) {
          newFilesToUpload.push(selectedVideo.file);
        } else if (mode === 'photo' || selectedImages.length > 0) {
          selectedImages.forEach(img => {
            if (img.file && img.file.size > 0) {
              newFilesToUpload.push(img.file);
            }
          });
        }

        const updatePayload: any = {
          title: mode === 'poll' ? poll.pollQuestion.trim() : (editPostData?.title || ''),
          content: finalContent,
          post_type: mode === 'poll' ? 'poll' : (selectedVideo ? 'video' : (selectedImages.length > 0 ? 'image' : (editPostData?.post_type || 'text'))),
          category: editPostData?.category || 'Professional',
          visibility: editPostData?.visibility || 'public',
          location: locationString,
          companyId: companyId || undefined,
          shared_post_id: sharedPostId,
        };

        if (selectedImages.length > 0) {
          updatePayload.media_urls = selectedImages.map(img => img.previewUrl);
        } else if (selectedVideo) {
          updatePayload.media_urls = [selectedVideo.previewUrl];
        }

        await postApi.update(editPostId, updatePayload, newFilesToUpload);
        toast.success('Post updated!');
        updatePostInFeed(editPostId, {
          content: finalContent,
          location: locationString || undefined,
          visibility: updatePayload.visibility,
          ...(effectiveRepostData ? { shared_post: effectiveRepostData } : {})
        });
        window.dispatchEvent(new CustomEvent('postUpdated', { detail: { id: editPostId, ...updatePayload } }));
        resetComposer();
        setUploadPhase('idle');
        if (onPostCreated) onPostCreated();
        return;
      }
      ===== END LEGACY INLINE EDIT ===== */

      // ── Handle Create Post Mode ──
      // 1. Poll Post
      if (mode === 'poll') {
        if (!poll.isPollValid()) {
          setIsSubmitting(false);
          setUploadPhase('idle');
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
        queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts-preview'] });
        queryClient.invalidateQueries({ queryKey: ['orgPosts'] });
        queryClient.invalidateQueries({ queryKey: ['orgPostsFallback'] });
        queryClient.invalidateQueries({ queryKey: ['orgPostsPreview'] });
        queryClient.invalidateQueries({ queryKey: ['company-posts'] });
        window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));

        setUploadPhase('success');
        setTimeout(() => setUploadPhase('idle'), 3000);
        if (onPostCreated) onPostCreated();
        return;
      }

      // 2. Video Post
      if (mode === 'video' && selectedVideo) {
        const payload: any = {
          title: '',
          content: finalContent,
          post_type: 'video',
          category: 'Professional',
          visibility: 'public',
          location: locationString,
          companyId: companyId || undefined,
          media_metadata: selectedVideo && selectedVideo.naturalWidth && selectedVideo.naturalHeight ? [{ width: selectedVideo.naturalWidth, height: selectedVideo.naturalHeight }] : undefined,
          shared_post_id: resolvedRepostData?.id || undefined,
        };

        const files = (selectedVideo.file && selectedVideo.file.size > 0) ? [selectedVideo.file] : [];
        const uploadConfig = {
          signal: abortControllerRef.current.signal,
          onUploadProgress: (percent: number) => {
            setUploadProgress(percent);
            if (percent === 100) setUploadPhase('processing');
          }
        };
        const { mappedPost } = await postApi.create(payload, files, undefined, uploadConfig);

        addPost(mappedPost);
        queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts-preview'] });
        queryClient.invalidateQueries({ queryKey: ['orgPosts'] });
        queryClient.invalidateQueries({ queryKey: ['orgPostsFallback'] });
        queryClient.invalidateQueries({ queryKey: ['orgPostsPreview'] });
        queryClient.invalidateQueries({ queryKey: ['company-posts'] });
        window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));
        if (resolvedRepostData?.id) toast.success("Post reposted successfully!");

        setUploadPhase('success');
        setTimeout(() => setUploadPhase('idle'), 3000);
        if (onPostCreated) onPostCreated();
        return;
      }

      // ── Handle Standard / Photo Post ──
      const payload: any = {
        title: '',
        content: finalContent,
        post_type: selectedImages.length > 0 ? 'image' : 'text',
        category: 'Professional',
        visibility: 'public',
        location: locationString,
        companyId: companyId || undefined,
        media_metadata: selectedImages.length > 0 ? selectedImages.map(img => ({ width: img.naturalWidth, height: img.naturalHeight })) : undefined,
        shared_post_id: sharedPostId,
      };

      const files = selectedImages.filter((img) => img.file && img.file.size > 0).map((img) => img.file);
      const uploadConfig = {
        signal: abortControllerRef.current.signal,
        onUploadProgress: (percent: number) => {
          setUploadProgress(percent);
          if (percent === 100) setUploadPhase('processing');
        }
      };
      const { mappedPost } = await postApi.create(payload, files, undefined, uploadConfig);
      addPost(mappedPost);
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts-preview'] });
      queryClient.invalidateQueries({ queryKey: ['orgPosts'] });
      queryClient.invalidateQueries({ queryKey: ['orgPostsFallback'] });
      queryClient.invalidateQueries({ queryKey: ['orgPostsPreview'] });
      queryClient.invalidateQueries({ queryKey: ['company-posts'] });
      window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));
      if (sharedPostId) toast.success("Post reposted successfully!");

      setUploadPhase('success');
      setTimeout(() => setUploadPhase('idle'), 3000);
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
  }, [isSubmitting, canPost, mode, poll, text, selectedImages, selectedVideo, inlineMentions, location, companyId, addPost, resetComposer, onPostCreated, isEditMode, editPostId, editPostData, repostData, uploadPhase, queryClient]);

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
      poll.setPollDuration('1 week');
      setIsExpanded(true);
    }
  }, [mode, poll, selectedImages, selectedVideo]);

  const handleArticleClick = useCallback(() => {
    onOpenArticle();
  }, [onOpenArticle]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className={`hidden md:flex w-full flex-col pt-[16px] px-[16px] pb-[16px] bg-ds-bg border-b border-ds-border max-w-[442px] max-h-[calc(100vh-140px)] mx-auto gap-[16px] relative ${
          disabled ? 'opacity-50 pointer-events-none select-none cursor-not-allowed' : ''
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
      >

        {/* Hidden file input for uploading images & videos */}
        <input
          ref={fileInputRef}
          type="file"
          accept={
            selectedImages.length > 0
              ? "image/jpeg, image/png, image/webp, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .heic, .heif"
              : "image/jpeg, image/png, image/webp, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .heic, .heif, video/mp4, video/quicktime, .mp4, .mov"
          }
          multiple
          className="hidden"
          onChange={(e) => handleFilesChosen(e.target.files)}
        />

        {/* Content scroll area: expands naturally to screen bottom, then scrolls upward with hidden scrollbar */}
        <div className={`w-full flex-1 min-h-0 flex flex-col gap-[12px] no-scrollbar ${mode === 'poll' ? 'overflow-visible' : 'overflow-y-auto'}`}>

          {/* ── Mode: Poll Creator ────────────────────────────────────────── */}
          {mode === 'poll' ? (
            <div className="w-full flex flex-col gap-4 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-[12px]">
                  <div className={`w-[32px] h-[32px] ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} overflow-hidden bg-ds-surface-1 flex items-center justify-center shrink-0 flex-none select-none`}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className={`w-full h-full object-cover ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} select-none pointer-events-none`}
                      />
                    ) : (
                      <Icon name="user" className="w-full h-full p-1 text-ds-text-primary" />
                    )}
                  </div>
                  <span className="font-dmsans text-ds-text-secondary text-[14px] font-medium leading-[20px]">Poll post</span>
                </div>
              </div>

              {/* Form Content aligned at pl-[44px] */}
              <div className="w-full flex flex-col gap-4 pl-[44px]">
                {/* Question Input */}
                <div className="w-full flex flex-col gap-1">
                  <div className="relative flex items-center w-full">
                    <input
                      type="text"
                      value={poll.pollQuestion}
                      maxLength={MAX_POLL_QUESTION_LENGTH}
                      onKeyDown={(e) => {
                        const input = e.currentTarget;
                        const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
                        const isControlKey = e.ctrlKey || e.metaKey || e.altKey;
                        const isNavKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', 'Enter', 'Escape'].includes(e.key);
                        if (!isControlKey && !isNavKey && e.key.length === 1 && !hasSelection && poll.pollQuestion.length >= MAX_POLL_QUESTION_LENGTH) {
                          e.preventDefault();
                          poll.setQuestionError(POLL_LIMIT_EXCEEDED_MSG);
                        }
                      }}
                      onChange={(e) => poll.setPollQuestion(e.target.value)}
                      placeholder="Ask your network..."
                      className={`w-full bg-transparent border-b pb-2.5 text-[15px] text-ds-text-primary placeholder:text-ds-text-muted outline-none transition-colors ${
                        poll.questionError
                          ? 'border-[var(--ds-error)] focus:border-[var(--ds-error)]'
                          : 'border-ds-border focus:border-[var(--ds-accent)]'
                      }`}
                    />
                  </div>
                  {poll.questionError && (
                    <p className="text-[var(--ds-error)] text-[12px] font-normal leading-[16px] animate-in fade-in duration-150 select-none">
                      {poll.questionError}
                    </p>
                  )}
                </div>

                {/* Options List */}
                <div className="w-full flex flex-col gap-3">
                  {poll.pollOptions.map((opt, index) => {
                    const letter = ['A', 'B', 'C', 'D', 'E', 'F'][index] || `${index + 1}`;
                    const optError = poll.optionErrors?.[opt.id];
                    return (
                      <div key={opt.id} className="flex flex-col gap-1 w-full">
                        <div className="relative flex items-center w-full">
                          <input
                            type="text"
                            value={opt.text}
                            maxLength={MAX_POLL_OPTION_LENGTH}
                            onKeyDown={(e) => {
                              const input = e.currentTarget;
                              const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
                              const isControlKey = e.ctrlKey || e.metaKey || e.altKey;
                              const isNavKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', 'Enter', 'Escape'].includes(e.key);
                              if (!isControlKey && !isNavKey && e.key.length === 1 && !hasSelection && opt.text.length >= MAX_POLL_OPTION_LENGTH) {
                                e.preventDefault();
                                poll.setOptionErrors((prev: Record<string, string>) => ({ ...prev, [opt.id]: POLL_LIMIT_EXCEEDED_MSG }));
                              }
                            }}
                            onChange={(e) => poll.updatePollOption(opt.id, e.target.value)}
                            placeholder={`Option ${letter}`}
                            className={`w-full bg-transparent border-b pb-2.5 pr-8 text-[14px] text-ds-text-primary placeholder:text-ds-text-muted outline-none transition-colors ${
                              optError
                                ? 'border-[var(--ds-error)] focus:border-[var(--ds-error)]'
                                : 'border-ds-border focus:border-[var(--ds-accent)]'
                            }`}
                          />
                          {poll.pollOptions.length > 2 && index >= 2 && (
                            <button
                              type="button"
                              onClick={() => poll.removePollOption(opt.id)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-ds-text-muted hover:text-[var(--ds-error)] cursor-pointer transition-colors outline-none"
                              title="Remove option"
                              aria-label="Remove option"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {optError && (
                          <p className="text-[var(--ds-error)] text-[12px] font-normal leading-[16px] animate-in fade-in duration-150 select-none">
                            {optError}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Option Button (Capsule) */}
                  {poll.pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={poll.addPollOption}
                      className="w-full h-[36px] rounded-full border border-ds-border hover:bg-ds-surface-1 font-dmsans text-[16px] leading-[24px] text-ds-text-primary font-medium flex items-center justify-center gap-[8px] transition-colors cursor-pointer outline-none mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add option
                    </button>
                  )}
                </div>

                {/* Poll Duration Dropdown */}
                <div className={`relative w-full transition-all duration-200 z-[50]`}>
                  <button
                    type="button"
                    onClick={() => setDurationOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-3 text-[14px] text-ds-text-secondary font-medium cursor-pointer bg-transparent outline-none"
                  >
                    <span>{poll.pollDuration || 'Poll duration'}</span>
                    <ChevronDown className={`w-4 h-4 text-ds-text-secondary transition-transform duration-200 ${durationOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {durationOpen && (
                    <div className="absolute left-0 right-0 top-full bg-ds-bg rounded-b-2xl z-[999] py-2 flex flex-col shadow-2xl border-b border-l border-r border-ds-border/30">
                      {['1 day', '3 days', '1 week', '2 weeks'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            poll.setPollDuration(d);
                            setDurationOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[14px] font-dmsans transition-colors cursor-pointer bg-transparent hover:bg-white/5 ${poll.pollDuration === d
                              ? 'text-[var(--ds-accent)] font-medium'
                              : 'text-ds-text-secondary'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Standard Mode: Avatar + Text Area ───────────────────────── */
            <>
              <div className="flex flex-row items-start gap-[12px] w-full">
                {/* Avatar */}
                <div
                  className={`w-[32px] h-[32px] ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} overflow-hidden bg-ds-surface-1 flex items-center justify-center shrink-0 flex-none cursor-pointer select-none`}
                  onClick={() => textareaRef.current?.focus()}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className={`w-full h-full object-cover ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} select-none pointer-events-none`}
                    />
                  ) : (
                    <Icon name="user" className="w-full h-full p-1 text-ds-text-primary" />
                  )}
                </div>

                {/* MentionTextarea — active, editable inline */}
                <div className="flex-grow mt-[4px]">
                  <MentionTextarea
                    ref={textareaRef}
                    value={text}
                    disabled={disabled}
                    onChange={handleTextChange}
                    onFocus={disabled ? undefined : handleFocus}
                    onMentionsChange={handleMentionsChange}
                    onPaste={disabled ? undefined : handlePaste}
                    onDrop={disabled ? undefined : handleDrop}
                    onDragOver={disabled ? undefined : handleDragOver}
                    initialMentions={inlineMentions}
                    placeholder={disabled ? disabledPlaceholder : "What would you like to share today?"}
                    className="ds-text-body text-ds-text-primary placeholder:text-ds-text-muted bg-transparent"
                  />
                </div>
              </div>

              {/* ── Shared Preview (Repost Mode or Edit Repost Mode) ─ */}
              {isRepostMode && resolvedRepostData && (
                <div className="relative w-full pl-[44px]">
                  <SharedPreview
                    sharedPost={resolvedRepostData}
                    sharedPostId={resolvedRepostData.id?.toString() || (resolvedRepostData as any).post_id?.toString() || editPostData?.shared_post_id?.toString()}
                    isMobile={typeof window !== 'undefined' ? window.innerWidth < 768 : false}
                    disableNavigation
                  />
                </div>
              )}

              {/* ── Attached Images Preview (Free Aspect Ratio, Max 12) ─ */}
              {selectedImages.length > 0 && (
                <div className="w-full pl-[44px] mt-[4px]">
                  <ComposerImagePreview
                    images={selectedImages}
                    onRemoveImage={handleRemoveImage}
                    onReorderImages={setSelectedImages}
                    isEditMode={isEditMode}
                  />
                </div>
              )}

              {/* ── Attached media limit inline message ─ */}
              {selectedImages.length >= MAX_COMPOSER_IMAGES && (
                <div className="w-full pl-[44px] mt-[4px]">
                  <span className="font-['DM_Sans'] font-medium text-[10px] leading-[12px] text-[#E5484D]">
                    Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
                  </span>
                </div>
              )}

              {/* ── Attached Video Preview ─ */}
              {selectedVideo && mode === 'video' && (
                <div className="w-full pl-[44px]">
                  <div className="relative w-full max-w-[442px] rounded-2xl overflow-hidden group">
                    <PostVideoCard
                      videoSrc={selectedVideo.previewUrl}
                      author={activeProfile?.name || 'Marcus avery'}
                      authorId={(activeProfile as any)?.id}
                      authorAvatar={avatarUrl}
                      authorRole={(activeProfile as any)?.headline || (activeProfile as any)?.role || 'Senior product designer'}
                      content=""
                      showHeader={false}
                      showFooter={false}
                      isPreview={false}
                      isMe={true}
                      isCompanyPost={isCompanyPost}
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
                </div>
              )}
            </>
          )}

          {/* ── Section 2: Add Location (Figma Frame 2609598: ds-text-body-1 16px/24px, 4px dot, ds-text-body-1 text-ds-accent) ── */}
          {showLocationFeature && (
            location ? (
              <div className="flex items-center gap-[8px] h-[24px] pl-[44px]">
                <span className="bg-transparent ds-text-body-1 text-ds-text-primary truncate">
                  {'formattedAddress' in location ? location.formattedAddress : location.name}
                </span>
                <span className="w-[4px] h-[4px] rounded-full bg-ds-text-muted shrink-0" />
                <button
                  type="button"
                  onClick={handleLocationClear}
                  className="ds-text-body-1 text-ds-error hover:opacity-80 cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={handleLocationToggle}
                className="pl-[44px] text-left text-[var(--ds-accent)] text-[16px] font-medium font-dmsans cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-colors duration-[120ms] hover:opacity-80 w-fit"
                aria-label="Add location"
              >
                Add location
              </button>
            )
          )}
        </div>

        {/* ── Section 3: Bottom Toolbar ──────────────────────────────────── */}
        <div className="shrink-0 flex flex-row justify-between items-center w-full mt-auto">
          {/* ===== LEGACY INLINE EDIT (Replaced by Fullscreen EditPostModal) =====
          {isEditMode && (
            <>
              <span className="text-ds-text-primary text-[15px] font-medium font-dmsans">Edit post</span>
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
                  className="h-[36px] w-[77px] px-[12px] py-[6px] rounded-full border border-ds-border text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-2 active:scale-[0.98] transition-colors duration-[120ms] flex flex-row items-center justify-center gap-[10px] cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          ===== END LEGACY INLINE EDIT ===== */}

          {/* Hide image/poll/article icons in repost mode. Also enforce mutual exclusion between media attachments and polls/articles */}
          {!isRepostMode && (
            mode === 'poll' ? (
              <div className="flex flex-row items-center gap-[12px]">
                <button
                  type="button"
                  onClick={handlePollClick}
                  className="flex justify-center items-center gap-[8px] w-[77px] h-[36px] px-[12px] py-[8px] rounded-full border border-ds-border transition-colors duration-[120ms] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] text-[var(--ds-accent)] cursor-pointer"
                >
                  <Icon name="poll" className="w-[20px] h-[20px]" />
                  <span className="text-[14px] leading-[20px] font-normal font-dmsans">Poll</span>
                </button>
              </div>
            ) : !hasContent ? (
              <div className="flex flex-row items-center gap-[12px]">
                {/* Image / Photo */}
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={selectedImages.length >= MAX_COMPOSER_IMAGES || selectedVideo !== null}
                  className={`flex justify-center items-center gap-[8px] w-[92px] h-[36px] px-[12px] py-[8px] rounded-full border border-ds-border transition-all duration-[120ms] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] ${selectedImages.length >= MAX_COMPOSER_IMAGES || selectedVideo !== null
                      ? 'opacity-40 cursor-default pointer-events-none text-ds-text-muted'
                      : 'text-ds-text-primary hover:bg-ds-surface-2 active:scale-[0.98] cursor-pointer'
                    }`}
                  aria-label="Upload image"
                  title={
                    selectedImages.length >= MAX_COMPOSER_IMAGES
                      ? `Media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})`
                      : 'Add photos'
                  }
                >
                  <Icon name="image" className="w-[20px] h-[20px]" />
                  <span className="text-[14px] leading-[20px] font-normal font-dmsans">Media</span>
                </button>

                {/* Poll */}
                <button
                  type="button"
                  onClick={handlePollClick}
                  disabled={hasMedia}
                  className={`flex justify-center items-center gap-[8px] w-[77px] h-[36px] px-[12px] py-[8px] rounded-full border border-ds-border transition-all duration-[120ms] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] ${hasMedia
                      ? 'opacity-40 cursor-default pointer-events-none text-ds-text-muted'
                      : 'text-ds-text-primary hover:bg-ds-surface-2 active:scale-[0.98] cursor-pointer'
                    }`}
                  aria-label="Create poll"
                  title={hasMedia ? 'Cannot create a poll while media is attached' : 'Create poll'}
                >
                  <Icon name="poll" className="w-[20px] h-[20px]" />
                  <span className="text-[14px] leading-[20px] font-normal font-dmsans">Poll</span>
                </button>

                {/* Article */}
                {/* <button
                  type="button"
                  onClick={handleArticleClick}
                  disabled={hasMedia}
                  className={`flex justify-center items-center gap-[8px] w-[97px] h-[36px] px-[12px] py-[8px] rounded-full border border-ds-border transition-all duration-[120ms] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] ${hasMedia
                      ? 'opacity-40 cursor-default pointer-events-none text-ds-text-muted'
                      : 'text-ds-text-primary hover:bg-ds-surface-2 active:scale-[0.98] cursor-pointer'
                    }`}
                  aria-label="Write article"
                  title={
                    hasMedia
                      ? 'Cannot write article while media is active'
                      : 'Write article'
                  }
                >
                  <Icon name="articles" className="w-[20px] h-[20px]" />
                  <span className="text-[14px] leading-[20px] font-normal font-dmsans">Article</span>
                </button> */}
              </div>
            ) : (
              <div className="flex flex-row items-center gap-[12px]">
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={selectedImages.length >= MAX_COMPOSER_IMAGES || selectedVideo !== null}
                  className={`flex justify-center items-center gap-[8px] h-[36px] px-[12px] py-[6px] rounded-full border border-ds-border transition-all duration-[120ms] outline-none ${selectedImages.length >= MAX_COMPOSER_IMAGES || selectedVideo !== null
                      ? 'opacity-40 cursor-default pointer-events-none text-ds-text-muted'
                      : 'text-ds-text-primary hover:bg-ds-surface-2 active:scale-[0.98] cursor-pointer'
                    }`}
                  aria-label="Add more media"
                  title={
                    selectedImages.length >= MAX_COMPOSER_IMAGES
                      ? `Media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})`
                      : 'Add more photos'
                  }
                >
                  <Plus className="w-[16px] h-[16px]" />
                  <span className="text-[14px] leading-[20px] font-medium font-dmsans">Media</span>
                </button>
              </div>
            )
          )}

          {/* Action Buttons: Post + Cancel */}
          <div className="flex items-center gap-[12px] ml-auto">
            {/* Bug Fix: Post button upload loading state matches Figma design (w-77px, h-36px, ds-surface-1, 24x24 ds-text-secondary loader) */}
            <button
              onClick={handlePost}
              disabled={!canPost || isSubmitting}
              className={`w-[77px] h-[36px] flex items-center justify-center gap-[10px] px-[12px] py-[6px] rounded-full text-[16px] leading-[24px] font-medium font-dmsans outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] transition-colors duration-[200ms] ${isSubmitting
                  ? 'bg-ds-surface-1 border-none cursor-default'
                  : canPost
                    ? 'bg-[var(--ds-accent)] text-white hover:opacity-90 cursor-pointer'
                    : 'bg-ds-surface-1 text-ds-text-muted pointer-events-none cursor-default'
                }`}
              aria-label="Publish post"
            >
              {isSubmitting ? (
                <Loader className="w-[24px] h-[24px] text-ds-text-secondary animate-spin" />
              ) : (
                'Post'
              )}
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={resetComposer}
                disabled={isSubmitting}
                className="h-[36px] w-[77px] px-[12px] py-[6px] rounded-full border border-ds-border text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-2 active:scale-[0.98] transition-colors duration-[120ms] flex flex-row items-center justify-center gap-[10px] cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                aria-label="Cancel post"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Location Selector Dialog */}
        <Dialog
          open={showLocationSelector}
          onOpenChange={(open) => {
            if (!open) setShowLocationSelector(false);
          }}
        >
          <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
            <DialogTitle className="sr-only">Select Location</DialogTitle>
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

