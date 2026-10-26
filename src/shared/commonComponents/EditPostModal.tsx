'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Image as ImageIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { Post, PostVisibility } from '@/types/entities';
import { postApi } from '@/features/feed/api/post.api';
import { getPostById, deletePost as apiDeletePost } from '@/services/api/posts';
import { uploadMedia } from '@/services/api/upload';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { useFeed } from '@/hooks/use-feed';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ComposerImagePreview, ComposerImage, MAX_COMPOSER_IMAGES } from '@/features/feed/components/create-post/ComposerImagePreview';
import { getImageDimensions, getVideoDimensions } from '@/features/feed/utils/imageBounds';
import PostVideoCard from '@/features/feed/components/create-post/post-types/PostVideoCard';
import SharedPreview from '@/features/feed/components/create-post/SharedPreview';
import {
  usePostPoll,
  MAX_POLL_QUESTION_LENGTH,
  MAX_POLL_OPTION_LENGTH,
  POLL_LIMIT_EXCEEDED_MSG,
} from '@/features/feed/hooks/use-post-poll';
import { MentionTextarea } from './MentionTextarea';
import { parseMentionsForFrontend, formatMentionsForBackend } from '@/lib/mentions';
import { UserMention } from '@/services/api/users';
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal';
import DiscardConfirmOverlay from '@/features/feed/components/create-post/shared/DiscardConfirmOverlay';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useBodyScrollLock } from '@/hooks';

const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image limit
const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;       // 100MB video limit
const ACCEPTED_MEDIA_TYPES = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,video/webm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPostId: string;
  postData?: any;
  onUpdate?: (updatedPost: any) => void;
  onDelete?: (postId: string) => void;
}

interface PostEditSnapshot {
  description: string;
  location: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  pollQuestion: string;
  pollOptions: string[];
  pollDuration: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component: Fullscreen Edit Post Modal
// ─────────────────────────────────────────────────────────────────────────────

export function EditPostModal({
  isOpen,
  onClose,
  editPostId,
  postData,
  onUpdate,
  onDelete,
}: EditPostModalProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const { activeProfile } = useActiveProfile();
  const { updatePostInFeed, deletePost } = useFeed(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Snapshot of saved state for change detection (dirty tracking)
  const initialSnapshotRef = useRef<PostEditSnapshot | null>(null);
  const [, setSnapshotState] = useState<PostEditSnapshot | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | StructuredLocation | null>(null);
  const [inlineMentions, setInlineMentions] = useState<UserMention[]>([]);

  // Post type & media
  const [postType, setPostType] = useState<string>('text');
  const [selectedImages, setSelectedImages] = useState<ComposerImage[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ file: File; previewUrl: string; naturalWidth?: number; naturalHeight?: number } | null>(null);
  const [sharedPost, setSharedPost] = useState<any | null>(null);
  const [originalPost, setOriginalPost] = useState<any | null>(null);

  // Poll state
  const poll = usePostPoll();

  // Selector Visibility
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on close (prevent closing while submission is in-flight unless forced)
  const handleClose = useCallback((force?: boolean | React.SyntheticEvent) => {
    const isForced = force === true;
    if (!isForced && isSubmitting) return;
    selectedImages.forEach((img) => {
      if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
    });
    if (selectedVideo && selectedVideo.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    }
    setIsSubmitting(false);
    onClose();
  }, [isSubmitting, selectedImages, selectedVideo, onClose]);

  // Populate data helper
  const populateData = useCallback((post: any) => {
    setOriginalPost(post);

    const rawContent = post.content || '';
    const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(rawContent);
    setDescription(parsedContent);
    setInlineMentions(parsedMentions);

    // Location
    if (post.location) {
      if (typeof post.location === 'object' && post.location !== null) {
        setSelectedLocation(post.location);
      } else {
        setSelectedLocation({ id: 0, name: post.location, latitude: '', longitude: '' } as unknown as StructuredLocation);
      }
    } else {
      setSelectedLocation(null);
    }

    // Shared post / Repost
    const existingShared = post.shared_post || post.sharedPost;
    if (existingShared) {
      setSharedPost(existingShared);
    } else if (post.shared_post_id) {
      getPostById(post.shared_post_id)
        .then((backendPost) => {
          if (backendPost) {
            setSharedPost(mapBackendPostToFrontend(backendPost));
          }
        })
        .catch((err) => console.error('Failed to load shared post for edit:', err));
    } else {
      setSharedPost(null);
    }

    let snapImages: string[] = [];
    let snapVideo: string | null = null;
    let snapPollQ = '';
    let snapPollOpts: string[] = [];
    let snapPollDur = '1 week';

    // Poll
    if (post.post_type === 'poll' && post.poll_question) {
      setPostType('poll');
      poll.setPollQuestion(post.poll_question);
      const pollOpts = post.poll_options?.map((opt: string) => ({ id: Math.random().toString(), text: opt })) || [];
      poll.setPollOptions(pollOpts);
      poll.setPollDuration(post.poll_duration || '1 week');
      setSelectedImages([]);
      setSelectedVideo(null);
      snapPollQ = post.poll_question.trim();
      snapPollOpts = post.poll_options?.map((opt: string) => opt.trim()) || [];
      snapPollDur = post.poll_duration || '1 week';
    } else {
      // Media
      const postImages = post.images && post.images.length > 0
        ? post.images
        : post.imageSrc
          ? [post.imageSrc]
          : [];

      if (postImages.length > 0) {
        setPostType('photo');
        const initialImages: ComposerImage[] = postImages.map((url: string, idx: number) => {
          const dim = post.imageDimensions?.[idx];
          const w = dim?.width;
          const h = dim?.height;
          return {
            id: `existing-${idx}-${encodeURIComponent(url.slice(-20))}`,
            file: new File([''], `existing-image-${idx}.jpg`, { type: 'image/jpeg' }),
            previewUrl: url,
            naturalWidth: w,
            naturalHeight: h,
            aspectRatio: (w && h) ? w / h : undefined,
          };
        });
        setSelectedImages(initialImages);

        // Probe real image natural dimensions asynchronously:
        postImages.forEach((url: string) => {
          const probe = new window.Image();
          probe.src = url;
          probe.onload = () => {
            if (probe.naturalWidth && probe.naturalHeight) {
              setSelectedImages((prev) => {
                const targetIdx = prev.findIndex((i) => i.previewUrl === url);
                if (targetIdx !== -1) {
                  const curr = prev[targetIdx];
                  if (!curr.naturalWidth || curr.naturalWidth !== probe.naturalWidth || curr.naturalHeight !== probe.naturalHeight) {
                    const next = [...prev];
                    next[targetIdx] = {
                      ...curr,
                      naturalWidth: probe.naturalWidth,
                      naturalHeight: probe.naturalHeight,
                      aspectRatio: probe.naturalWidth / probe.naturalHeight,
                    };
                    return next;
                  }
                }
                return prev;
              });
            }
          };
        });

        setSelectedVideo(null);
        snapImages = postImages;
      } else if (post.videoSrc || post.video) {
        setPostType('video');
        const vUrl = post.videoSrc || post.video;
        setSelectedVideo({
          file: new File([''], 'existing-video.mp4', { type: 'video/mp4' }),
          previewUrl: vUrl,
          naturalWidth: post.mediaWidth,
          naturalHeight: post.mediaHeight,
        });
        setSelectedImages([]);
        snapVideo = vUrl;
      } else {
        setPostType(post.post_type || 'text');
        setSelectedImages([]);
        setSelectedVideo(null);
      }
    }

    const rawLoc = post.location as any;
    const snapLocation = typeof rawLoc === 'object' && rawLoc !== null
      ? (rawLoc.formattedAddress || rawLoc.name || null)
      : (rawLoc || null);

    const snap: PostEditSnapshot = {
      description: parsedContent.trim(),
      location: snapLocation,
      imageUrls: snapImages,
      videoUrl: snapVideo,
      pollQuestion: snapPollQ,
      pollOptions: snapPollOpts,
      pollDuration: snapPollDur,
    };
    initialSnapshotRef.current = snap;
    setSnapshotState(snap);
  }, [poll]);

  // Load post details on open
  useEffect(() => {
    if (!isOpen || !editPostId) return;

    // Reset local upload states
    setSelectedImages([]);
    setSelectedVideo(null);
    setSharedPost(null);

    // If pre-loaded post data passed in, use it immediately
    if (postData) {
      populateData(postData);

      // Defensive fallback: If postData lacked location, fetch single post to verify if location exists in DB
      if (!postData.location && editPostId) {
        postApi
          .getById(editPostId)
          .then((freshPost) => {
            if (freshPost?.location) {
              const locAny = freshPost.location as any;
              const freshLoc = typeof locAny === 'object' && locAny !== null
                ? locAny
                : ({ id: 0, name: String(locAny), latitude: '', longitude: '' } as unknown as StructuredLocation);
              setSelectedLocation(freshLoc);
              const freshLocStr = typeof locAny === 'object' && locAny !== null
                ? (locAny.formattedAddress || locAny.name || null)
                : (locAny || null);
              if (initialSnapshotRef.current) {
                initialSnapshotRef.current.location = freshLocStr;
              }
              setSnapshotState((prev) => (prev ? { ...prev, location: freshLocStr } : null));
            }
          })
          .catch((err) => {
            console.warn('Could not fetch fresh post location fallback:', err);
          });
      }
    } else {
      setIsLoading(true);
      postApi
        .getById(editPostId)
        .then((post) => {
          populateData(post);
        })
        .catch((err) => {
          console.error('Failed to load post for editing:', err);
          toast.error('Failed to load post data.');
          onClose();
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, editPostId, postData, populateData, onClose]);


  // Handle remove individual image
  const handleRemoveImage = useCallback((id: string) => {
    setSelectedImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const filtered = prev.filter((i) => i.id !== id);
      if (filtered.length === 0 && !selectedVideo) {
        setPostType('text');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      return filtered;
    });
  }, [selectedVideo]);

  // Handle reorder images
  const handleReorderImages = useCallback((newOrder: ComposerImage[]) => {
    setSelectedImages(newOrder);
  }, []);

  // Handle remove video
  const handleRemoveVideo = useCallback(() => {
    if (selectedVideo && selectedVideo.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    }
    setSelectedVideo(null);
    setPostType('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedVideo]);

  // Process selected, dropped, or pasted media files with Create Post parity constraints
  const processFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const videoFiles = fileArray.filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(f.name));
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|jpe|png|webp|avif|heic|heif)$/i.test(f.name));

    // Validate video file size limit (100MB)
    if (videoFiles.length > 0) {
      const oversizedVideo = videoFiles.find((f) => f.size > MAX_VIDEO_SIZE);
      if (oversizedVideo) {
        toast.error(`Video "${oversizedVideo.name}" exceeds the 100MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Validate image file size limits (10MB per image, 100MB total post images)
    if (imageFiles.length > 0) {
      const oversizedImage = imageFiles.find((f) => f.size > MAX_SINGLE_IMAGE_SIZE);
      if (oversizedImage) {
        toast.error(`Image "${oversizedImage.name}" exceeds the 10MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const currentTotalSize = selectedImages.reduce((sum, img) => sum + (img.file?.size || 0), 0);
      const newImagesSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
      if (currentTotalSize + newImagesSize > MAX_TOTAL_IMAGE_SIZE) {
        toast.error('Total image upload size cannot exceed 100MB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Mixed check in selection
    if (videoFiles.length > 0 && imageFiles.length > 0) {
      toast.error('Cannot upload video and images together');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Poll check
    if (postType === 'poll') {
      toast.error('Cannot attach media while editing a poll');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Video selection
    if (videoFiles.length > 0) {
      if (selectedImages.length > 0) {
        toast.error('Cannot upload video and images together');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (videoFiles.length > 1 || selectedVideo !== null) {
        toast.error('Only one video file is allowed');
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
        setSelectedVideo({
          file: vidFile,
          previewUrl: URL.createObjectURL(vidFile),
        });
      }
      setPostType('video');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Images selection
    if (imageFiles.length > 0) {
      if (selectedVideo) {
        toast.error('Cannot upload video and images together');
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
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            naturalWidth: dims.width,
            naturalHeight: dims.height,
            aspectRatio: dims.aspectRatio,
          });
        } catch {
          newImages.push({
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            naturalWidth: 800,
            naturalHeight: 600,
            aspectRatio: 800 / 600,
          });
        }
      }

      if (newImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages]);
        setPostType('photo');
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedImages, selectedVideo, postType]);

  // Handle file choice for media attachment
  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  // Drag & drop handlers on existing container
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Clipboard paste handler
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
      processFiles(imageFiles);
    }
  }, [processFiles]);

  // Existing Media button helper states
  const isMediaDisabled =
    isSubmitting ||
    selectedImages.length >= MAX_COMPOSER_IMAGES ||
    selectedVideo !== null ||
    postType === 'poll';

  const mediaButtonTitle =
    postType === 'poll'
      ? 'Cannot attach media while editing a poll'
      : selectedVideo !== null
        ? 'Cannot add photos while video is attached'
        : selectedImages.length >= MAX_COMPOSER_IMAGES
          ? `Media limit reached (${MAX_COMPOSER_IMAGES}/${MAX_COMPOSER_IMAGES})`
          : 'Add photos or video';

  const handleMediaClick = () => {
    if (isSubmitting) return;
    if (postType === 'poll') {
      toast.error('Cannot attach media while editing a poll');
      return;
    }
    if (selectedImages.length >= MAX_COMPOSER_IMAGES) {
      return;
    }
    if (selectedVideo) {
      toast.error('Only one video file is allowed');
      return;
    }
    fileInputRef.current?.click();
  };

  // Save handler
  const handleSave = async () => {
    if (isSubmitting || !editPostId) return;
    setIsSubmitting(true);

    try {
      const finalContent = formatMentionsForBackend(description.trim(), inlineMentions);
      const locationString = selectedLocation
        ? 'formattedAddress' in selectedLocation
          ? selectedLocation.formattedAddress
          : selectedLocation.name
        : null;

      // 1. Identify and upload any newly chosen image files to Cloudinary/storage
      const newImageFiles: File[] = selectedImages
        .filter((img) => img.file && img.file.size > 0 && (img.previewUrl.startsWith('blob:') || img.id.startsWith('new-')))
        .map((img) => img.file as File);

      let uploadedImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const uploadRes = await uploadMedia(newImageFiles);
        uploadedImageUrls = (uploadRes || []).map((item: any) =>
          typeof item === 'object' && item !== null ? item.url : item
        );
      }

      // 2. Identify and upload newly chosen video file if any
      let uploadedVideoUrl: string | null = null;
      if (selectedVideo && selectedVideo.file && selectedVideo.file.size > 0 && selectedVideo.previewUrl.startsWith('blob:')) {
        const uploadRes = await uploadMedia([selectedVideo.file]);
        if (uploadRes && uploadRes.length > 0) {
          const item = uploadRes[0];
          uploadedVideoUrl = typeof item === 'object' && item !== null ? item.url : item;
        }
      }

      // 3. Assemble final media URLs in the exact user-arranged order
      let finalMediaUrls: string[] = [];
      let finalVideoUrl: string | null = null;

      if (selectedImages.length > 0) {
        let uploadedIdx = 0;
        finalMediaUrls = selectedImages.map((img) => {
          if (img.file && img.file.size > 0 && (img.previewUrl.startsWith('blob:') || img.id.startsWith('new-'))) {
            const uploadedUrl = uploadedImageUrls[uploadedIdx++];
            return uploadedUrl || img.previewUrl;
          }
          return img.previewUrl;
        });
      } else if (selectedVideo) {
        if (uploadedVideoUrl) {
          finalVideoUrl = uploadedVideoUrl;
          finalMediaUrls = [uploadedVideoUrl];
        } else if (selectedVideo.previewUrl && !selectedVideo.previewUrl.startsWith('blob:')) {
          finalVideoUrl = selectedVideo.previewUrl;
          finalMediaUrls = [selectedVideo.previewUrl];
        }
      }

      // Determine accurate post_type
      const effectivePostType =
        postType === 'poll'
          ? 'poll'
          : originalPost?.post_type === 'article' || postType === 'article'
            ? 'article'
            : finalVideoUrl
              ? 'video'
              : finalMediaUrls.length > 0
                ? 'image'
                : 'text';

      const updatePayload: any = {
        title: originalPost?.title || '',
        content: finalContent,
        post_type: effectivePostType,
        category: originalPost?.category || 'Professional',
        visibility: originalPost?.visibility || 'public',
        location: locationString,
        companyId: originalPost?.author_org_id || originalPost?.companyId || undefined,
        media_urls: finalMediaUrls,
        media_metadata: selectedImages.length > 0
          ? selectedImages.map(img => ({ width: img.naturalWidth, height: img.naturalHeight }))
          : selectedVideo && selectedVideo.naturalWidth && selectedVideo.naturalHeight
            ? [{ width: selectedVideo.naturalWidth, height: selectedVideo.naturalHeight }]
            : [],
      };

      if (postType === 'poll') {
        updatePayload.poll_question = poll.pollQuestion;
        updatePayload.poll_options = poll.pollOptions.map((o) => o.text.trim()).filter(Boolean);
        updatePayload.poll_duration = poll.pollDuration;
      }

      await postApi.update(editPostId, updatePayload);

      // Fetch fresh backend post so we get persisted media URLs and complete updated entity
      let freshMappedPost: any = null;
      try {
        const freshBackendPost = await getPostById(editPostId);
        freshMappedPost = mapBackendPostToFrontend(freshBackendPost);
      } catch (fetchErr) {
        console.warn('Could not fetch fresh post after update:', fetchErr);
      }

      const updatedPostObj = freshMappedPost || {
        ...originalPost,
        ...updatePayload,
        images: finalVideoUrl ? [] : finalMediaUrls,
        imageSrc: finalVideoUrl ? null : (finalMediaUrls[0] || null),
        videoSrc: finalVideoUrl || null,
        post_type: effectivePostType,
        type: effectivePostType,
      };

      // Update feed store optimistically
      updatePostInFeed(editPostId, {
        content: finalContent,
        images: updatedPostObj.images,
        imageSrc: updatedPostObj.imageSrc,
        videoSrc: updatedPostObj.videoSrc,
        type: updatedPostObj.type || effectivePostType,
        post_type: effectivePostType,
        location: locationString || undefined,
        visibility: updatePayload.visibility,
        imageDimensions: updatedPostObj.imageDimensions,
      });

      // Emit global event for active pages (e.g. single post detail, profile)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('postUpdated', {
            detail: updatedPostObj,
          })
        );
      }

      toast.success('Post updated successfully!');
      setIsSubmitting(false);

      // Update snapshot with newly saved post state so hasUnsavedChanges() becomes false,
      // keeping the user on the page with state preserved and Save button inactive!
      populateData(updatedPostObj);
      onUpdate?.(updatedPostObj);
    } catch (err: any) {
      console.error("Failed to update post:", err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update post");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (isDeleting || !editPostId) return;
    setIsDeleting(true);

    try {
      const companyId = originalPost?.author_org_id || originalPost?.companyId;
      await deletePost(editPostId, companyId);

      if (onDelete) {
        onDelete(editPostId);
      }

      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      handleClose(true);
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUnsavedChanges = useCallback((): boolean => {
    const snap = initialSnapshotRef.current;
    if (!snap) return false;

    // 1. Description changed?
    if (description.trim() !== snap.description) return true;

    // 2. Location changed?
    const currentLocation = selectedLocation
      ? 'formattedAddress' in selectedLocation
        ? selectedLocation.formattedAddress
        : (selectedLocation as any).name || null
      : null;
    if (currentLocation !== snap.location) return true;

    // 3. Video changed?
    const currentVideoUrl = selectedVideo ? selectedVideo.previewUrl : null;
    if (currentVideoUrl !== snap.videoUrl) return true;
    if (selectedVideo && selectedVideo.file && selectedVideo.file.size > 0) return true;

    // 4. Images changed?
    const hasNewImageFile = selectedImages.some(
      (img) => !img.id.startsWith('existing-') || (img.file && img.file.size > 0)
    );
    if (hasNewImageFile) return true;
    if (selectedImages.length !== snap.imageUrls.length) return true;
    for (let i = 0; i < selectedImages.length; i++) {
      if (selectedImages[i].previewUrl !== snap.imageUrls[i]) return true;
    }

    // 5. Poll changed?
    if (postType === 'poll') {
      if (poll.pollQuestion.trim() !== snap.pollQuestion) return true;
      if (poll.pollDuration !== snap.pollDuration) return true;
      if (poll.pollOptions.length !== snap.pollOptions.length) return true;
      for (let i = 0; i < poll.pollOptions.length; i++) {
        if (poll.pollOptions[i].text.trim() !== snap.pollOptions[i]) return true;
      }
    }

    return false;
  }, [description, selectedLocation, selectedVideo, selectedImages, postType, poll]);

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      handleClose(false);
    }
  }, [isSubmitting, hasUnsavedChanges, handleClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleteDialogOpen && !showLocationSelector && !showDiscardConfirm) {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleteDialogOpen, showLocationSelector, showDiscardConfirm, handleRequestClose]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const isCompanyPost = activeProfile?.type === 'COMPANY' || Boolean(originalPost?.isCompanyPost || originalPost?.author_org_id || originalPost?.companyId);

  const displayAvatar =
    originalPost?.authorAvatar ||
    originalPost?.avatar ||
    currentUser?.image ||
    (currentUser as any)?.avatar;

  const displayName =
    originalPost?.author ||
    originalPost?.authorName ||
    currentUser?.name ||
    'User';

  const isDirty = hasUnsavedChanges();
  const hasBasicContent =
    description.trim().length > 0 ||
    selectedImages.length > 0 ||
    selectedVideo !== null ||
    sharedPost !== null ||
    (postType === 'poll' && poll.isPollValid());

  const canSave = hasBasicContent && isDirty;

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className="fixed inset-0 z-[150] flex flex-col items-center justify-between overflow-hidden font-dm-sans !top-0 !bottom-0 !left-0 !right-0 h-full w-full overscroll-contain"
        style={{
          backgroundColor: 'var(--ds-bg)',
          color: 'var(--ds-text-primary)',
        }}
      >
        {/* Top-Right Close Button (Figma: 20x20, top: 40px, right: 40px, stroke: #FFECE6, stroke-width: 1.8) */}
        <button
          type="button"
          onClick={handleRequestClose}
          disabled={isSubmitting}
          className="fixed top-[40px] right-[40px] z-[160] flex h-[20px] w-[20px] items-center justify-center p-0 transition-opacity hover:opacity-80 cursor-pointer outline-none disabled:opacity-40 disabled:cursor-default"
          style={{ color: 'var(--ds-text-primary)' }}
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4L16 16M16 4L4 16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Scrollable Main Edit Post Body (Fix: Keep Save bar fixed at bottom while post content scrolls and hide visible scrollbar track) */}
        <div className="flex-1 w-full overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center pt-[60px] pb-[24px]">
          <section className="relative z-[155] w-[371px] max-w-full mx-auto px-4 sm:px-0 flex flex-col items-start gap-[20px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 w-full">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ds-accent)' }} />
                <p className="mt-3 text-sm" style={{ color: 'var(--ds-text-muted)' }}>Loading post...</p>
              </div>
            ) : (
              <>
                {/* Author Header (Figma: 371x32, gap 8, avatar 32x32 rounded-full, DM Sans 16px/24px) */}
                <div className="flex h-[32px] w-[371px] max-w-full shrink-0 flex-row items-center gap-[40px]">
                  <div className="flex h-[32px] shrink-0 flex-row items-center gap-[8px]">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className={`h-[32px] w-[32px] shrink-0 ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} object-cover`}
                      />
                    ) : (
                      <div
                        className={`h-[32px] w-[32px] shrink-0 ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} flex items-center justify-center text-sm font-medium`}
                        style={{
                          backgroundColor: 'var(--ds-surface-2)',
                          color: 'var(--ds-text-primary)',
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="h-[24px] shrink-0 font-dm-sans text-[16px] font-normal leading-[24px]"
                      style={{ color: 'var(--ds-text-primary)' }}
                    >
                      {displayName}
                    </span>
                  </div>
                </div>

                {/* Post Text (Figma: width 371px, min-h 96px, font 16px, line-height 24px, #FFECE6) */}
                {postType !== 'poll' && (
                  <div className="w-[371px] max-w-full shrink-0 flex flex-col">
                    <div className="w-full relative">
                      <MentionTextarea
                        ref={textareaRef}
                        value={description}
                        onChange={(e: any) => setDescription(e.target.value)}
                        onMentionsChange={setInlineMentions}
                        initialMentions={inlineMentions}
                        placeholder="What's on your mind?"
                        rows={1}
                        className="w-full bg-transparent font-dm-sans font-normal text-[16px] leading-[24px] resize-none border-none outline-none whitespace-pre-wrap p-0 focus:ring-0 focus:outline-none focus-visible:ring-0"
                        style={{
                          color: 'var(--ds-text-primary)',
                          caretColor: 'var(--ds-accent)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Poll Creator Mode */}
                {postType === 'poll' && (
                  <div className="w-[371px] max-w-full flex flex-col gap-4">
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
                          className="w-full bg-transparent border-b pb-2.5 text-[15px] outline-none transition-colors"
                          style={{
                            borderColor: poll.questionError ? 'var(--ds-error)' : 'var(--ds-border)',
                            color: 'var(--ds-text-primary)',
                          }}
                        />
                      </div>
                      {poll.questionError && (
                        <p className="text-[var(--ds-error)] text-[12px] font-normal leading-[16px] animate-in fade-in duration-150 select-none">
                          {poll.questionError}
                        </p>
                      )}
                    </div>
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
                                className="w-full bg-transparent border-b pb-2.5 pr-8 text-[14px] outline-none transition-colors"
                                style={{
                                  borderColor: optError ? 'var(--ds-error)' : 'var(--ds-border)',
                                  color: 'var(--ds-text-primary)',
                                }}
                              />
                              {poll.pollOptions.length > 2 && index >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => poll.removePollOption(opt.id)}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:opacity-80 cursor-pointer transition-colors outline-none"
                                  style={{ color: 'var(--ds-text-muted)' }}
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
                      {poll.pollOptions.length < 6 && (
                        <button
                          type="button"
                          onClick={poll.addPollOption}
                          className="w-fit h-[32px] px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer outline-none hover:opacity-80"
                          style={{
                            borderColor: 'var(--ds-border)',
                            color: 'var(--ds-text-primary)',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add option
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Shared Repost Preview */}
                {sharedPost && (
                  <div className="relative w-[371px] max-w-full">
                    <SharedPreview
                      sharedPost={sharedPost}
                      sharedPostId={sharedPost.id?.toString() || (sharedPost as any).post_id?.toString() || originalPost?.shared_post_id?.toString()}
                      isMobile={typeof window !== 'undefined' ? window.innerWidth < 768 : false}
                      disableNavigation
                    />
                  </div>
                )}

                {/* Attached Single Image Preview (Figma: 371x332, radius 8px, remove btn 32x32 #1A1A20) */}
                {selectedImages.length === 1 && (
                  <div
                    className="relative h-[332px] w-[371px] max-w-full shrink-0 overflow-hidden rounded-[8px]"
                    style={{
                      borderRadius: 'var(--radius-card-new, 8px)',
                      backgroundColor: 'var(--ds-surface-1)',
                    }}
                  >
                    <img
                      src={selectedImages[0].previewUrl}
                      alt="Post media"
                      className="block h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(selectedImages[0].id)}
                      aria-label="Remove photo"
                      className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[var(--ds-surface-1)] hover:brightness-110 rounded-full transition-colors z-30 shadow-md cursor-pointer outline-none"
                    >
                      <X className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
                    </button>
                  </div>
                )}

                {/* Attached Multiple Images Preview (Same as Post Creator: ComposerImagePreview) */}
                {selectedImages.length > 1 && (
                  <div className="w-[371px] max-w-full overflow-visible">
                    <ComposerImagePreview
                      images={selectedImages}
                      onRemoveImage={handleRemoveImage}
                      onReorderImages={handleReorderImages}
                      isEditMode={false}
                    />
                  </div>
                )}

                {/* ── Attached media limit inline message ─ */}
                {selectedImages.length >= MAX_COMPOSER_IMAGES && (
                  <div className="w-[371px] max-w-full mt-[4px]">
                    <span className="font-['DM_Sans'] font-medium text-[10px] leading-[12px] text-[#E5484D]">
                      Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
                    </span>
                  </div>
                )}

                {/* Attached Video Preview (Matching FeedComposerInline) */}
                {selectedVideo && (
                  <div className="relative w-[371px] max-w-full rounded-[16px] overflow-hidden group">
                    <PostVideoCard
                      videoSrc={selectedVideo.previewUrl}
                      author={displayName || 'Author'}
                      authorAvatar={displayAvatar}
                      authorRole={''}
                      content=""
                      showHeader={false}
                      showFooter={false}
                      isPreview={false}
                      isMe={true}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-30 shadow-md cursor-pointer"
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Add Location (Figma: width 96px, height 24px, text 16px medium #EC6229) */}
                <div className="w-[371px] max-w-full shrink-0">
                  {selectedLocation ? (
                    <div className="flex items-center gap-2 text-[14px] font-dm-sans">
                      <span
                        className="truncate max-w-[280px]"
                        style={{ color: 'var(--ds-text-primary)' }}
                      >
                        {'formattedAddress' in selectedLocation
                          ? selectedLocation.formattedAddress
                          : selectedLocation.name}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--ds-text-muted)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedLocation(null)}
                        className="hover:opacity-80 cursor-pointer font-medium font-dm-sans"
                        style={{ color: 'var(--ds-error, #E5484D)' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLocationSelector(true)}
                      className="h-[24px] shrink-0 p-0 text-left font-dm-sans text-[16px] font-medium leading-[24px] hover:opacity-85 cursor-pointer outline-none transition-opacity"
                      style={{ color: 'var(--ds-accent)' }}
                    >
                      Add location
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Fixed Bottom Action Row (Fix: Keep Save bar fixed at the bottom of the screen consistent with Create Post UI) */}
        {!isLoading && (
          <div className="shrink-0 w-full flex flex-col items-center justify-center pb-[24px] pt-[12px] bg-[var(--ds-bg)] z-[155] touch-none">
            <div className="flex h-[38px] w-[371px] max-w-full shrink-0 flex-row items-center justify-between gap-[16px] px-4 sm:px-0">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  selectedImages.length > 0
                    ? "image/jpeg, image/png, image/webp, image/avif, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .avif, .heic, .heif"
                    : "image/jpeg, image/png, image/webp, image/avif, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .avif, .heic, .heif, video/mp4, video/quicktime, .mp4, .mov"
                }
                multiple
                onChange={handleFilesChosen}
                className="hidden"
              />

              {/* Media Button (Figma: 94x38, border #2C2C33, rounded-full, px 12 py 8, text 14px #FFECE6) */}
              {!sharedPost ? (
                <div className="flex h-[38px] w-[94px] shrink-0 items-center gap-[12px]">
                  <button
                    type="button"
                    onClick={handleMediaClick}
                    disabled={isMediaDisabled}
                    title={mediaButtonTitle}
                    aria-label={mediaButtonTitle}
                    className={`box-border flex h-[38px] w-[94px] shrink-0 flex-row items-center gap-[8px] rounded-full border px-[12px] py-[8px] transition-opacity outline-none ${isMediaDisabled
                        ? 'opacity-40 cursor-default pointer-events-none'
                        : 'hover:opacity-85 cursor-pointer'
                      }`}
                    style={{
                      borderColor: 'var(--ds-border)',
                    }}
                  >
                    <Plus className="w-[16px] h-[16px]" color="var(--ds-text-primary)" />
                    <span
                      className="text-[14px] font-medium leading-[20px] font-dmsans shrink-0"
                      style={{ color: 'var(--ds-text-primary)' }}
                    >
                      Media
                    </span>
                  </button>
                </div>
              ) : (
                <div />
              )}

              {/* Save + Delete (Figma: container 162x36, gap 8) */}
              <div className="flex h-[36px] w-[162px] shrink-0 flex-row items-center gap-[8px]">
                {/* Save Button (Figma: 77x36, rounded-full, bg #EC6229, text 16px medium #FFECE6) */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting || !canSave}
                  className={cn(
                    "flex h-[36px] w-[77px] shrink-0 flex-row items-center justify-center gap-[10px] rounded-full px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] transition-all outline-none",
                    canSave && !isSubmitting
                      ? "bg-[var(--ds-accent)] text-[var(--ds-text-primary)] cursor-pointer hover:opacity-90 active:scale-95"
                      : "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-60"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2
                      className="w-4 h-4 animate-spin text-[var(--ds-text-primary)]"
                    />
                  ) : (
                    'Save'
                  )}
                </button>

                {/* Delete Button (Figma: 77x36, rounded-full, border #2C2C33, text 16px medium #FFECE6) */}
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSubmitting}
                  className="box-border flex h-[36px] w-[77px] shrink-0 flex-row items-center justify-center gap-[10px] rounded-full border px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default outline-none hover:opacity-85"
                  style={{
                    borderColor: 'var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Selector Dialog */}
      <Dialog
        open={showLocationSelector}
        onOpenChange={(open) => {
          if (!open) setShowLocationSelector(false);
        }}
      >
        <BareDialogContent
          hideOverlay={true}
          className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden z-[301]"
        >
          <DialogTitle className="sr-only">Select Location</DialogTitle>
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onCancel={() => setShowLocationSelector(false)}
            onConfirm={() => setShowLocationSelector(false)}
          />
        </BareDialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        modalClassName="!z-[302]"
        overlayClassName="!z-[301]"
      />

      {/* Discard Confirmation Modal */}
      <DiscardConfirmOverlay
        isOpen={showDiscardConfirm}
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          handleClose(true);
        }}
      />
    </>
  );
}

/* =============================================================================
 * LEGACY EDIT POST MODAL (DEPRECATED)
 * Preserved for reference. Replaced by the fullscreen EditPostModal above.
 * =============================================================================

import { Dialog, DialogContent, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { TagPeopleSelector } from '@/shared/commonComponents/TagPeopleSelector';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';
import VisibilityToggle from '@/features/feed/components/create-post/shared/VisibilityToggle';
import SharedPreview from '@/features/feed/components/create-post/SharedPreview';

export function LegacyEditPostModal({ isOpen, onClose, editPostId, onUpdate }: EditPostModalProps) {
  // Legacy 548-line dialog implementation preserved here
  return null;
}
============================================================================= */

