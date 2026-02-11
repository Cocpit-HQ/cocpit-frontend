"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Video, Plus, Trash2, Camera, Smile, FileText, Sparkles, Bold, Italic, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Unlink, Loader2, Eye, EyeOff } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';
import { usePostUpload } from '@/context/PostUploadContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { createPost, CreatePostRequest } from '@/services/api/feed';
import { getPostById, updatePost, UpdatePostRequest } from '@/services/api/posts';
import { uploadMedia } from '@/services/api/media';
import { Post } from '@/types/entities';
import { MediaCropper } from './MediaCropper';
import getCroppedImg, { getPaddedImg } from '@/lib/canvasUtils';
import { PostPreview } from './PostPreview';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { toast } from 'sonner';
// Import Area type for onCropComplete
import { Area } from 'react-easy-crop';

export type PostType = 'text' | 'photo' | 'poll' | 'video' | 'article';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPostType?: PostType;
  editPostId?: string;
  onUpdate?: (post: Partial<Post>) => void;
  sharedPostId?: string;
}

interface MediaItem {
  id: string;
  url: string;
  file?: File; // Optional now, since existing media won't have a File object
  type: 'image' | 'video';
  // New fields for cropping
  crop: { x: number; y: number };
  zoom: number;
  croppedBlobUrl?: string;
  pixelCrop?: { x: number; y: number; width: number; height: number }; // Needed for canvas generation
  isExisting?: boolean; // Flag to identify existing media
  fitMode: 'cover' | 'contain';
  previewUrl?: string;
}

interface PollOption {
  id: string;
  text: string;
}

// --- TipTap Editor Components ---

const EditorToolbar = ({ onFormat }: { onFormat: (command: string, value?: string) => void }) => {
  const handleLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) onFormat('createLink', url);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-muted/20 sticky top-0 z-10">
      <button
        onClick={() => onFormat('bold')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormat('italic')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={() => onFormat('formatBlock', 'H2')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormat('formatBlock', 'H3')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={() => onFormat('insertUnorderedList')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormat('insertOrderedList')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={handleLink}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormat('unlink')}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
        title="Unlink"
      >
        <Unlink className="w-4 h-4" />
      </button>
    </div>
  );
};

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync content updates (e.g. from AI)
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card/50 border-border mx-6 mb-6">
      <EditorToolbar onFormat={handleFormat} />
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-6 py-4"
        style={{ outline: 'none' }}
      />
      <style jsx global>{`
        .prose ul { list-style-type: disc; padding-left: 1.5em; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; }
        .prose h2 { font-size: 1.5em; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
        .prose h3 { font-size: 1.25em; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
        .prose p { margin-bottom: 0.75em; line-height: 1.6; }
        .prose a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
      `}</style>
    </div>
  );
};

export function CreatePostModal({ isOpen, onClose, initialPostType = 'text', editPostId, onUpdate, sharedPostId }: CreatePostModalProps) {
  const isMobile = useIsMobile();
  const { addPost, currentUser } = useFeed();
  const { startUpload } = usePostUpload();
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [description, setDescription] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [postCategory, setPostCategory] = useState<'Personal' | 'Professional' | 'Achievement'>('Professional');
  const [uploadedVideos, setUploadedVideos] = useState<MediaItem[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiList, setEmojiList] = useState<string[]>(["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"]);
  const [customEmoji, setCustomEmoji] = useState('');
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const desktopGalleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const photoCaptionRef = useRef<HTMLTextAreaElement>(null);
  const videoCaptionRef = useRef<HTMLTextAreaElement>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [pollDuration, setPollDuration] = useState('1 week');
  const [articleCoverImage, setArticleCoverImage] = useState<MediaItem | null>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  // articleTextAreaRef removed in favor of TipTap
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [articleLink, setArticleLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [originalPost, setOriginalPost] = useState<Post | null>(null);

  // New State for Cropping/Preview
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(4 / 5);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewMediaUrls, setPreviewMediaUrls] = useState<string[]>([]);
  const [sharedPost, setSharedPost] = useState<Post | null>(null);

  // Refs to track media for cleanup without triggering effects
  const uploadedImagesRef = useRef<MediaItem[]>([]);
  const uploadedVideosRef = useRef<MediaItem[]>([]);
  const articleCoverImageRef = useRef<MediaItem | null>(null);
  const previewMediaUrlsRef = useRef<string[]>([]);

  useEffect(() => { uploadedImagesRef.current = uploadedImages; }, [uploadedImages]);
  useEffect(() => { uploadedVideosRef.current = uploadedVideos; }, [uploadedVideos]);
  useEffect(() => { articleCoverImageRef.current = articleCoverImage; }, [articleCoverImage]);
  useEffect(() => { previewMediaUrlsRef.current = previewMediaUrls; }, [previewMediaUrls]);

  // Helper to revoke all object URLs
  const revokeAllMediaUrls = () => {
    uploadedImagesRef.current.forEach(img => {
      if (!img.isExisting) {
        URL.revokeObjectURL(img.url);
        if (img.croppedBlobUrl) URL.revokeObjectURL(img.croppedBlobUrl);
      }
    });
    uploadedVideosRef.current.forEach(video => {
      if (!video.isExisting) URL.revokeObjectURL(video.url);
    });
    if (articleCoverImageRef.current && !articleCoverImageRef.current.isExisting) {
      URL.revokeObjectURL(articleCoverImageRef.current.url);
    }
    previewMediaUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  };

  const isMobilePhotoPost = isMobile && postType === 'photo';
  const isMobileVideoPost = isMobile && postType === 'video';
  const isMobileTextPost = isMobile && postType === 'text';
  const isMobilePollPost = isMobile && postType === 'poll';

  useEffect(() => {
    if (isOpen) {
      if (editPostId) {
        setIsLoadingPost(true);
        getPostById(editPostId)
          .then((post) => {
            // Save original post for diffing
            const mappedOriginal: Post = {
              id: post.post_id,
              authorId: post.author_id, // Add mapping
              author: post.author_name || '',
              title: post.title || '',
              content: post.content,
              category: post.category_name as any,
              visibility: post.visibility as any,
              likes: 0, comments: '', shares: '', timeAgo: '',
              images: post.media?.filter(m => m.media_type === 'image').map(m => m.url),
              videoSrc: post.media?.find(m => m.media_type === 'video')?.url
            };
            setOriginalPost(mappedOriginal);

            // Determine post type
            let type: PostType = 'text';
            if (post.media && post.media.length > 0) {
              type = post.media[0].media_type === 'video' ? 'video' : 'image' as any;
              // Fix mismatch: 'image' from backend -> 'photo' in frontend state
              if ((type as any) === 'image') type = 'photo';
            }
            // Handle article/poll if backend supports it explicitly, but mapping logic might be needed
            // BackendPost has 'poll' field
            if (post.poll) type = 'poll';
            if (post.title && !post.media.length && !post.poll) type = 'article'; // Heuristic

            setPostType(type);
            setPostCategory(post.category_name as any || 'Professional');
            setVisibility(post.visibility);

            // Populate Content
            if (type === 'text') setDescription(post.content);
            else if (type === 'photo') setPhotoCaption(post.content);
            else if (type === 'video') setVideoCaption(post.content);
            else if (type === 'article') {
              setArticleTitle(post.title || '');
              setArticleContent(post.content);
            }

            // Populate Media
            if (post.media) {
              const mediaItems: MediaItem[] = post.media.map(m => ({
                id: m.media_id,
                url: m.url,
                type: m.media_type,
                crop: { x: 0, y: 0 },
                zoom: 1,
                isExisting: true,
                fitMode: 'cover'
              }));
              if (type === 'photo') setUploadedImages(mediaItems);
              if (type === 'video') setUploadedVideos(mediaItems);
            }
          })
          .catch(err => {
            console.error("Failed to fetch post for editing:", err);
            onClose(); // Close on error?
          })
          .finally(() => setIsLoadingPost(false));
      } else {
        setPostType(initialPostType);
        setVisibility('public');
        setOriginalPost(null);

        // Fetch shared post if exists
        if (sharedPostId) {
          getPostById(sharedPostId).then(post => {
            if (post.category_name === 'Personal') {
              toast.error("Personal posts cannot be reposted.");
              onClose();
              return;
            }

            const mapped: Post = {
              id: post.post_id,
              authorId: post.author_id,
              author: post.author_name || '',
              title: post.title || '',
              content: post.content,
              category: post.category_name as any,
              visibility: post.visibility as any,
              likes: 0, comments: '', shares: '', timeAgo: '',
              images: post.media?.filter(m => m.media_type === 'image').map(m => m.url),
              videoSrc: post.media?.find(m => m.media_type === 'video')?.url,
              authorAvatar: post.author_avatar || undefined
            };
            setSharedPost(mapped);
            // Auto-inherit settings
            setPostCategory(post.category_name as any || 'Professional');
            setVisibility(post.visibility as any || 'public');
          })
        }
      }
    } else {
      // Centralized cleanup of URLs
      setTimeout(() => {
        revokeAllMediaUrls();
      }, 1000);

      // Reset state
      setDescription('');
      setPhotoCaption('');
      setVideoCaption('');
      setUploadedImages([]);
      setUploadedVideos([]);
      setPollQuestion('');
      setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
      setPostCategory('Professional');
      setShowEmojiPicker(false);
      setArticleTitle('');
      setArticleContent('');
      setPollDuration('1 week');
      setArticleCoverImage(null);
      setIsLoadingPost(false);
      setOriginalPost(null);
      setSharedPost(null);

      // Reset Cropper/Preview State
      setActiveImageIndex(0);
      setAspectRatio(4 / 5);
      setIsPreviewMode(false);
      setPreviewMediaUrls([]);
    }
  }, [isOpen, initialPostType, editPostId]);

  // Reset emoji picker when post type changes to avoid state conflicts
  useEffect(() => {
    setShowEmojiPicker(false);
  }, [postType]);

  if (!isOpen) return null;

  // Helper function to create a MediaItem
  const createMediaItem = (file: File): MediaItem => ({
    id: `${Date.now()}-${Math.random()}`,
    url: URL.createObjectURL(file),
    file,
    type: file.type.startsWith('image/') ? 'image' : 'video',
    crop: { x: 0, y: 0 },
    zoom: 1,
    fitMode: 'cover'
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    if (editPostId) return; // Disable upload in edit mode

    let file: File | undefined;

    if (e instanceof File) {
      file = e;
    } else {
      file = e.target.files?.[0];
    }

    if (file) {
      const newImage = createMediaItem(file);
      setUploadedImages([newImage]);
      setActiveImageIndex(0); // Reset to first image
    }

    if (!(e instanceof File)) {
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDesktopPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editPostId) return; // Disable upload in edit mode

    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => createMediaItem(file));
      setUploadedImages(prev => {
        const updated = [...prev, ...newImages];
        // If this was the first upload, ensure active index is valid
        if (prev.length === 0) setActiveImageIndex(0);
        return updated;
      });
    }
    e.target.value = '';
  };

  const removeMediaItem = (
    mediaId: string,
    currentMedia: MediaItem[],
    setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  ) => {
    if (editPostId) return; // Disable remove in edit mode

    setMedia(prev => {
      const itemToRemove = prev.find(item => item.id === mediaId);
      if (itemToRemove && !itemToRemove.isExisting) {
        URL.revokeObjectURL(itemToRemove.url);
        if (itemToRemove.croppedBlobUrl) URL.revokeObjectURL(itemToRemove.croppedBlobUrl);
      }

      const filtered = prev.filter(item => item.id !== mediaId);
      // Adjust active index if needed
      if (filtered.length === 0) {
        setActiveImageIndex(0);
      } else if (activeImageIndex >= filtered.length) {
        setActiveImageIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  const removeImage = () => {
    if (editPostId) return; // Disable remove in edit mode

    uploadedImages.forEach(img => {
      if (!img.isExisting) {
        URL.revokeObjectURL(img.url);
        if (img.croppedBlobUrl) URL.revokeObjectURL(img.croppedBlobUrl);
      }
    });
    setUploadedImages([]);
    setActiveImageIndex(0);
  };

  const removeSingleImage = (id: string) => {
    removeMediaItem(id, uploadedImages, setUploadedImages);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editPostId) return; // Disable upload in edit mode

    if (e.target.files && e.target.files.length > 0) {
      const newVideos: MediaItem[] = Array.from(e.target.files).map(file => createMediaItem(file));
      setUploadedVideos(prev => [...prev, ...newVideos]);
    }
    e.target.value = '';
  };
  const removeVideo = (id: string) => {
    removeMediaItem(id, uploadedVideos, setUploadedVideos);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, { id: 'auto-' + Date.now().toString(), text: '' }]);
    }
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((option) => option.id !== id));
    }
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(pollOptions.map((option) => (option.id === id ? { ...option, text } : option)));
  };

  const getActiveState = () => {
    switch (postType) {
      case 'photo': return { text: photoCaption, setText: setPhotoCaption, ref: photoCaptionRef };
      case 'video': return { text: videoCaption, setText: setVideoCaption, ref: videoCaptionRef };
      case 'article': return { text: articleContent, setText: setArticleContent, ref: null }; // No ref for TipTap
      case 'text':
      default: return { text: description, setText: setDescription, ref: textAreaRef };
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const { text, setText, ref } = getActiveState();

    // If no ref (e.g. Article mode with TipTap), just append
    if (!ref || !ref.current) {
      setText((prev) => prev + emoji);
      return;
    }

    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);

    // Restore cursor position after React render
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const addCustomEmoji = () => {
    if (customEmoji.trim() && !emojiList.includes(customEmoji.trim())) {
      setEmojiList([...emojiList, customEmoji.trim()]);
      setCustomEmoji('');
    }
  };

  const handleArticleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editPostId) return; // Disable upload in edit mode

    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only one file for cover or single media upload
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        // Revoke old URL if exists before setting new one
        if (articleCoverImage && !articleCoverImage.isExisting) URL.revokeObjectURL(articleCoverImage.url);
        setArticleCoverImage(createMediaItem(file));
      } else {
        console.warn("Only images and videos are allowed for article cover.");
      }
    }
    e.target.value = '';
  };

  const removeArticleMedia = (url: string, isCover: boolean) => {
    if (editPostId) return; // Disable remove in edit mode

    if (isCover && articleCoverImage) {
      if (!articleCoverImage.isExisting) URL.revokeObjectURL(articleCoverImage.url);
      setArticleCoverImage(null);
    }
  };

  const handleSetPostCategory = (category: 'Personal' | 'Professional' | 'Achievement') => {
    setPostCategory(category);
  };

  // --- CROPPER LOGIC ---

  const handleCropChange = (crop: { x: number; y: number }) => {
    const updatedImages = [...uploadedImages];
    if (updatedImages[activeImageIndex]) {
      updatedImages[activeImageIndex].crop = crop;
      setUploadedImages(updatedImages);
    }
  };

  const handleZoomChange = (zoom: number) => {
    const updatedImages = [...uploadedImages];
    if (updatedImages[activeImageIndex]) {
      updatedImages[activeImageIndex].zoom = zoom;
      setUploadedImages(updatedImages);
    }
  };

  const handleFitModeChange = (mode: 'cover' | 'contain') => {
    const updatedImages = [...uploadedImages];
    if (updatedImages[activeImageIndex]) {
      updatedImages[activeImageIndex].fitMode = mode;
      setUploadedImages(updatedImages);
    }
  };

  const handleCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    const updatedImages = [...uploadedImages];
    if (updatedImages[activeImageIndex]) {
      updatedImages[activeImageIndex].pixelCrop = croppedAreaPixels;
      setUploadedImages(updatedImages);
    }
  };

  const handleAspectChange = (newAspect: number) => {
    setAspectRatio(newAspect);
    // Since images are cropped visually, we don't need to manually reset image crop positions
    // react-easy-crop handles the view update. But we might want to reset zoom or crop if it goes out of bounds?
    // Usually it handles it.
  };

  const generatePreviewBlobs = async () => {
    // Cleanup old previews
    previewMediaUrls.forEach(url => URL.revokeObjectURL(url));

    const newUrls: string[] = [];

    if (postType === 'photo') {
      for (const img of uploadedImages) {
        // Only crop if it's a new file and has crop data
        if (img.pixelCrop && !img.isExisting) {
          try {
            const blob = await getCroppedImg(img.url, img.pixelCrop);
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              newUrls.push(blobUrl);
            } else {
              newUrls.push(img.url);
            }
          } catch (e) {
            console.error("Failed to crop image", e);
            // Fallback to original if crop fails
            newUrls.push(img.url);
          }
        } else {
          newUrls.push(img.url);
        }
      }
    } else if (postType === 'video') {
      // Videos are not cropped
      newUrls.push(...uploadedVideos.map(v => v.url));
    }

    setPreviewMediaUrls(newUrls);
  };

  const togglePreview = async () => {
    if (!isPreviewMode) {
      // Entering preview
      setIsSubmitting(true); // Show loading state briefly if needed
      await generatePreviewBlobs();
      setIsSubmitting(false);
      setIsPreviewMode(true);
    } else {
      // Exiting preview
      setIsPreviewMode(false);
    }
  };

  // --------------------

  const renderEmojiPicker = (isDesktop: boolean) => (
    <div className={isDesktop ? "absolute top-full right-0 mt-2 rounded-lg shadow-xl w-[240px] bg-card border border-border z-[60]" : "mt-2 bg-background border rounded-lg shadow-lg"}>
      <div className="p-2">
        <div className={`grid ${isDesktop ? 'grid-cols-5' : 'grid-cols-8'} gap-1 overflow-y-auto max-h-[200px]`}>
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                handleEmojiClick(emoji);
                if (isDesktop) setShowEmojiPicker(false);
              }}
              type="button"
              className="text-xl hover:bg-muted p-1.5 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border flex gap-2">
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="Add..."
            className="flex-1 px-2 py-1 text-sm border rounded bg-background text-foreground min-w-0"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomEmoji(); } }}
          />
          <button
            onClick={(e) => { e.preventDefault(); addCustomEmoji(); }}
            type="button"
            className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );

  // --- Background Upload Integration ---
  // const { startUpload } = usePostUpload(); // Moved to top

  const handlePost = async () => {
    const { text: finalContent } = getActiveState();

    // Prepare content for background upload
    const payload: CreatePostRequest = {
      title: postType === 'article' ? articleTitle : '',
      content: finalContent,
      category: postCategory,
      visibility: visibility,
      post_type: postType === 'photo' ? 'image' :
        postType === 'article' ? 'article' :
          postType, // video, poll, text
      // shared_post_id: sharedPostId // handled below
    };

    if (sharedPostId) payload.shared_post_id = sharedPostId;

    // Handle Poll
    if (postType === 'poll') {
      const filteredOptions = pollOptions.filter(o => o.text.trim()).map(o => o.text);
      if (filteredOptions.length < 2) return;
      payload.poll_options = filteredOptions;
      payload.poll_duration = pollDuration;
      payload.content = pollQuestion;
      payload.title = "";
    }

    // Collect Files
    let filesToUpload: File[] = [];

    if (postType === 'photo') {
      const processedFiles = await Promise.all(uploadedImages.map(async (item) => {
        if (item.isExisting) return undefined;
        if (item.file) {
          // Handle 'Fit' (Contain) Mode
          if (item.fitMode === 'contain') {
            try {
              // Use global aspectRatio because that's what the UI preview shows
              const blob = await getPaddedImg(item.url, aspectRatio);
              if (blob) {
                return new File([blob], item.file.name, { type: 'image/jpeg' });
              }
            } catch (e) {
              console.error("Pad failed, using original", e);
            }
            return item.file;
          }

          // Handle 'Fill' (Cover) Mode with Crop
          if (item.pixelCrop) {
            try {
              const blob = await getCroppedImg(item.url, item.pixelCrop);
              if (blob) {
                return new File([blob], item.file.name, { type: 'image/jpeg' });
              }
            } catch (e) {
              console.error("Crop failed, using original", e);
            }
          }

          // Fallback to original
          return item.file;
        }
        return undefined;
      }));

      filesToUpload = processedFiles.filter((f): f is File => !!f);
    } else if (postType === 'video') {
      uploadedVideos.forEach(v => { if (v.file) filesToUpload.push(v.file) });
    } else if (postType === 'article' && articleCoverImage?.file) {
      filesToUpload.push(articleCoverImage.file);
    }

    // For edit mode, we still use the old blocking flow because "editing in background" is complex (optimistic updates on existing posts)
    if (editPostId) {
      setIsSubmitting(true);
      try {
        // ... (Keep existing Edit logic or replicate minimal parts? 
        // The instruction said "Update to use background upload". 
        // But usually Edit is distinct. Let's keep Edit blocking for safety as per plan "New posts")

        // For now, let's just delegate NEW posts to background.
        // ... Re-implementing existing Edit logic here would be verbose. 
        // Ideally we should have split Edit and Create.
        // I will assume for this step we focused on CREATE.
        // But I must not break Edit.

        // Re-using the prompt logic: "Remove loading state logic for submission" implies we replace it.
        // But if I replace handlePost entirely, I lose the Edit logic which was inside it in the Previous File Content.

        // I will re-implement the Edit logic briefly here to be safe, or just throw an error if I can't read it all.
        // Actually, I should probably just handle the CREATE case and fall back for EDIT.

        // ... (Existing Edit Logic from previous file view) ...
        // Since I can't see the exact Edit logic in the prompt's context window easily (it was cut off or mixed), 
        // I will try to implement the "Create" part using startUpload and keep "Edit" as a TODO or try to preserve it if I can see it.

        // REVIEW: The previous file view (Step 88) shows handlePost has both Edit (via if editPostId) and Create.
        // I will preserve the Edit logic from Step 88.

        // --- EDIT LOGIC PRESERVED ---
        const updatePayload: UpdatePostRequest = {};
        if (originalPost) {
          if (originalPost.content !== finalContent) updatePayload.content = finalContent;
          if (originalPost.category !== postCategory) updatePayload.category = postCategory;
          if (originalPost.visibility !== visibility) updatePayload.visibility = visibility;
          if (postType === 'article' && originalPost.title !== articleTitle) updatePayload.title = articleTitle;
        } else {
          updatePayload.content = finalContent;
          updatePayload.category = postCategory;
          updatePayload.visibility = visibility;
        }

        if (Object.keys(updatePayload).length > 0) {
          await updatePost(editPostId, updatePayload);
          if (onUpdate) onUpdate({ ...originalPost, ...updatePayload } as Post); // Simplified mapping
          toast.success("Post updated");
        }
        onClose();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update post");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // --- CREATE FLOW (Background) ---
    startUpload(payload, filesToUpload);
    onClose();
    // No toast here, the global indicator handles it.
  };

  const isPostDisabled = () => {
    if (isLoadingPost) return true;
    if (isSubmitting) return true;
    if (postType === 'poll') {
      return !pollQuestion.trim() || pollOptions.filter(o => o.text.trim()).length < 2;
    }
    if (postType === 'photo') return uploadedImages.length === 0;
    if (postType === 'video') return uploadedVideos.length === 0;
    if (postType === 'article') return !articleTitle.trim() || !articleContent.trim() || articleContent === '<p></p>';
    // Text post
    return !description.trim();
  };

  // Common Header Content for Mobile (Visibility + Category)
  const mobileHeaderContent = (
    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
      {/* Visibility Toggle for Mobile */}
      {editPostId && (
        <button
          onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 flex items-center gap-1.5 transition-colors font-medium border border-border"
        >
          {visibility === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {visibility === 'public' ? 'Public' : 'Private'}
        </button>
      )}

      {/* Post Category for Mobile if needed, usually managed via tabs or not shown prominently in mobile create flow */}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className={`relative w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col ${isMobile
            ? 'rounded-2xl bg-zinc-900/95 backdrop-blur-lg border border-white/10 shadow-2xl overflow-hidden'
            : 'rounded-lg bg-card shadow-2xl overflow-visible'
            }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b border-border ${isMobile ? '' : 'bg-card'
              }`}
          >
            <h2 className="text-xl font-semibold text-foreground">
              {editPostId ? 'Edit Post' : (isPreviewMode ? 'Preview Post' : 'Create a post')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {isLoadingPost ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : isPreviewMode ? (
              // --- PREVIEW MODE ---
              <div className="p-4 md:p-6 bg-background/50 h-full overflow-y-auto">
                <PostPreview
                  content={postType === 'photo' ? photoCaption : postType === 'video' ? videoCaption : description}
                  mediaUrls={previewMediaUrls}
                  postType={postType === 'photo' ? 'image' : 'video'} // Only photo/video use preview really
                  currentUser={currentUser}
                  aspectRatio={aspectRatio}
                />
              </div>
            ) : (
              // --- EDITOR MODE ---
              <>
                {(isMobilePhotoPost || isMobileVideoPost || isMobileTextPost || isMobilePollPost) ? (
                  // MOBILE MEDIA POST UI
                  <div className="flex flex-col h-full">
                    {isMobile && mobileHeaderContent}
                    <div className="p-4 flex flex-col flex-grow">
                      {isMobilePhotoPost && (
                        uploadedImages.length === 0 ? (
                          <div className="flex-grow flex flex-col justify-center items-center gap-4">
                            {!editPostId && (
                              <>
                                <button
                                  onClick={() => console.log('Take Photo clicked')}
                                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  <Camera className="w-6 h-6" />
                                  Take Photo
                                </button>
                                <button
                                  onClick={() => galleryInputRef.current?.click()}
                                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-muted hover:bg-muted/90 text-foreground transition-colors"
                                >
                                  <Image className="w-6 h-6" />
                                  Upload from Gallery
                                </button>
                                <input
                                  ref={galleryInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* MOBILE CROPPER AREA */}
                            <div className="w-full">
                              <MediaCropper
                                imageSrc={uploadedImages[activeImageIndex]?.url}
                                crop={uploadedImages[activeImageIndex]?.crop || { x: 0, y: 0 }}
                                zoom={uploadedImages[activeImageIndex]?.zoom || 1}
                                aspect={aspectRatio}
                                onCropChange={handleCropChange}
                                onZoomChange={handleZoomChange}
                                onCropComplete={handleCropComplete}
                                onAspectChange={handleAspectChange}
                                isMobile={true}
                                readOnly={!!editPostId}
                                fitMode={uploadedImages[activeImageIndex]?.fitMode || 'cover'}
                                onFitModeChange={handleFitModeChange}
                              />
                            </div>

                            {/* Thumbnail Strip for Selection */}
                            {uploadedImages.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto py-2">
                                {uploadedImages.map((img, idx) => (
                                  <button
                                    key={img.id}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${idx === activeImageIndex ? 'border-primary' : 'border-transparent opacity-70'
                                      }`}
                                    type="button"
                                  >
                                    <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                                  </button>
                                ))}
                                {!editPostId && (
                                  <button
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="w-16 h-16 flex items-center justify-center bg-muted rounded-md border border-dashed border-border flex-shrink-0"
                                    type="button"
                                  >
                                    <Plus className="w-5 h-5 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            )}

                            <textarea
                              ref={photoCaptionRef}
                              value={photoCaption}
                              onChange={(e) => setPhotoCaption(e.target.value)}
                              placeholder="Write a caption..."
                              className="w-full px-3 py-2 text-base rounded-md border focus:outline-none focus:border-primary resize-none bg-muted/50 text-foreground placeholder-muted-foreground border-border"
                              rows={3}
                            />
                            <div className="flex justify-end mt-1">
                              <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                              >
                                <Smile className="w-5 h-5" />
                              </button>
                            </div>
                            {showEmojiPicker && renderEmojiPicker(false)}
                          </div>
                        )
                      )}

                      {isMobileVideoPost && (
                        uploadedVideos.length === 0 ? (
                          <div className="flex-grow flex flex-col justify-center items-center gap-4">
                            {!editPostId && (
                              <>
                                <button
                                  onClick={() => console.log('Record Video clicked')}
                                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  <Camera className="w-6 h-6" />
                                  Record Video
                                </button>
                                <button
                                  onClick={() => videoInputRef.current?.click()}
                                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-muted hover:bg-muted/90 text-foreground transition-colors"
                                >
                                  <Video className="w-6 h-6" />
                                  Browse from Gallery
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="relative">
                              <video
                                src={uploadedVideos[0].url}
                                controls
                                className="w-full rounded-lg bg-black/5"
                              />
                              {!editPostId && (
                                <button
                                  onClick={() => removeVideo(uploadedVideos[0].id)}
                                  className="absolute top-2 right-2 p-2 rounded-full transition-colors bg-black/50 text-white hover:bg-black/70"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <textarea
                              ref={videoCaptionRef}
                              value={videoCaption}
                              onChange={(e) => setVideoCaption(e.target.value)}
                              placeholder="Write a caption..."
                              className="w-full px-3 py-2 text-base rounded-md border focus:outline-none focus:border-primary resize-none bg-muted/50 text-foreground placeholder-muted-foreground border-border"
                              rows={3}
                            />
                            <div className="flex justify-end mt-1">
                              <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                              >
                                <Smile className="w-5 h-5" />
                              </button>
                            </div>
                            {showEmojiPicker && renderEmojiPicker(false)}
                          </div>
                        )
                      )}

                      {isMobileTextPost && (
                        <div className="flex flex-col h-full relative">
                          <div className="flex-grow flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden">
                            <MentionTextarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="What's on your mind?"
                              className="w-full flex-grow p-4 text-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                            />
                            <div className="p-2 border-t bg-muted/10 flex items-center justify-between">
                              <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                              >
                                <Smile className="w-6 h-6" />
                              </button>
                            </div>
                          </div>

                          {showEmojiPicker && renderEmojiPicker(false)}
                        </div>
                      )}

                      {isMobilePollPost && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Question</label>
                            <input
                              type="text"
                              value={pollQuestion}
                              onChange={(e) => setPollQuestion(e.target.value)}
                              placeholder="Ask a question..."
                              className="w-full px-4 py-3 rounded-lg bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">Options</label>
                            {pollOptions.map((option, index) => (
                              <div key={option.id} className="flex gap-2">
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updatePollOption(option.id, e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                {!editPostId && pollOptions.length > 2 && (
                                  <button onClick={() => removePollOption(option.id)} className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {!editPostId && pollOptions.length < 4 && (
                              <button
                                onClick={addPollOption}
                                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 px-1 py-1"
                              >
                                <Plus className="w-4 h-4" />
                                Add Option
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Poll Duration</label>
                            <select
                              value={pollDuration}
                              onChange={(e) => setPollDuration(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                            >
                              <option value="1 day">1 Day</option>
                              <option value="3 days">3 Days</option>
                              <option value="1 week">1 Week</option>
                              <option value="2 weeks">2 Weeks</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // ORIGINAL POST UI (Desktop)
                  <>
                    {/* Profile Section - Only show in Editor Mode */}
                    <div className="px-6 pt-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                          <img
                            src="/assets/pngegg.png"
                            alt="Your profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-foreground">{currentUser?.name || 'Sally Liang'}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">Post to Anyone</p>
                            {/* Visibility Toggle (only if editing, or could be new feature too) */}
                            {editPostId && (
                              <button
                                onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                                className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 flex items-center gap-1"
                              >
                                {visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {visibility === 'public' ? 'Public' : 'Private'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {(['Personal', 'Professional', 'Achievement'] as const).map((category) => (
                          <button
                            key={category}
                            onClick={() => setPostCategory(category)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${postCategory === category
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* DESKTOP CONTENT AREA */}
                    <div className="px-6 py-6 min-h-[320px]">

                      {/* TEXT POST */}
                      {postType === 'text' && (
                        <div className="relative">
                          <MentionTextarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What do you want to talk about?"
                            className="w-full min-h-[280px] text-lg resize-none border-none focus:ring-0 p-0 pr-10 placeholder:text-muted-foreground/70 bg-transparent focus:outline-none"
                          />
                          {!isMobile && (
                            <div className="absolute top-0 right-0 z-20">
                              <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                type="button"
                                className={`p-2 rounded-md transition-colors flex items-center gap-1 ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                title="Add emoji"
                              >
                                <Smile className="w-5 h-5" />
                              </button>
                              {showEmojiPicker && renderEmojiPicker(true)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SHARED POST PREVIEW */}
                      {sharedPost && (
                        <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-muted/20 backdrop-blur-sm">
                          <div className="p-3 flex items-center gap-3 border-b border-border/50 bg-muted/10">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                              <img src={sharedPost.authorAvatar || '/assets/pngegg.png'} alt={sharedPost.author} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">{sharedPost.author}</span>
                              <span className="text-xs text-muted-foreground">{sharedPost.timeAgo}</span>
                            </div>
                          </div>
                          <div className="p-3">
                            {sharedPost.content && <p className="text-sm text-foreground/80 line-clamp-3 mb-2">{sharedPost.content}</p>}
                            {/* Media Preview (Thumbnail) */}
                            {sharedPost.images && sharedPost.images.length > 0 && (
                              <div className="rounded-lg overflow-hidden h-40 bg-black/5 relative">
                                <img src={sharedPost.images[0]} className="w-full h-full object-cover" alt="Shared Media" />
                                {sharedPost.images.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                    +{sharedPost.images.length - 1}
                                  </div>
                                )}
                              </div>
                            )}
                            {sharedPost.videoSrc && !sharedPost.images?.length && (
                              <div className="rounded-lg overflow-hidden h-40 bg-black relative flex items-center justify-center">
                                <video src={sharedPost.videoSrc} className="h-full max-w-full object-contain" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-full">
                                    <Video className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* POST TYPE BLOCKS (Photo, Video, Article, Poll) */}
                      {/* PHOTO POST */}
                      {postType === 'photo' && (
                        uploadedImages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
                            {!editPostId && (
                              <button
                                onClick={() => desktopGalleryInputRef.current?.click()}
                                className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <div className="p-4 rounded-full bg-muted">
                                  <Image className="w-8 h-8" />
                                </div>
                                <span className="font-semibold text-lg">Upload photos</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 space-y-4" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                            {/* CROPPER AREA - DESKTOP */}
                            <div className="w-full">
                              <MediaCropper
                                imageSrc={uploadedImages[activeImageIndex]?.url}
                                crop={uploadedImages[activeImageIndex]?.crop || { x: 0, y: 0 }}
                                zoom={uploadedImages[activeImageIndex]?.zoom || 1}
                                aspect={aspectRatio}
                                onCropChange={handleCropChange}
                                onZoomChange={handleZoomChange}
                                onCropComplete={handleCropComplete}
                                onAspectChange={handleAspectChange}
                                isMobile={false}
                                readOnly={!!editPostId}
                                fitMode={uploadedImages[activeImageIndex]?.fitMode || 'cover'}
                                onFitModeChange={handleFitModeChange}
                              />
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-2 pt-2">
                              {uploadedImages.map((img, idx) => (
                                <div
                                  key={img.id}
                                  className={`relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 ${idx === activeImageIndex
                                    ? 'border-primary ring-2 ring-primary/20 scale-95 shadow-md'
                                    : 'border-transparent hover:border-border/50 hover:shadow-sm hover:scale-[1.02]'
                                    }`}
                                  onClick={() => setActiveImageIndex(idx)}
                                >
                                  <img
                                    src={img.url}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                  {!editPostId && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); removeSingleImage(img.id); }}
                                      className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground translate-y-[-10px] group-hover:translate-y-0"
                                      title="Remove image"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                  {/* Selection Indicator */}
                                  {idx === activeImageIndex && (
                                    <div className="absolute inset-0 bg-primary/10 pointer-events-none ring-inset ring-1 ring-primary/20" />
                                  )}
                                </div>
                              ))}
                              {!editPostId && (
                                <button
                                  onClick={() => desktopGalleryInputRef.current?.click()}
                                  className="aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-border hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 group hover:shadow-sm"
                                  title="Add more photos"
                                >
                                  <div className="p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:text-primary">
                                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground mt-2 group-hover:text-primary transition-colors">Add</span>
                                </button>
                              )}
                            </div>

                            <div className="relative">
                              <textarea
                                ref={photoCaptionRef}
                                value={photoCaption}
                                onChange={(e) => setPhotoCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full min-h-[80px] text-lg resize-none border-none focus:ring-0 p-0 pr-10 bg-transparent focus:outline-none"
                                style={{ color: '#000000' }}
                              />
                              {!isMobile && (
                                <div className="absolute top-0 right-0 z-20">
                                  <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    type="button"
                                    className={`p-2 rounded-md transition-colors flex items-center gap-1 ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                    title="Add emoji"
                                  >
                                    <Smile className="w-5 h-5" />
                                  </button>
                                  {showEmojiPicker && renderEmojiPicker(true)}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {/* VIDEO POST */}
                      {
                        postType === 'video' && (
                          uploadedVideos.length === 0 ? (
                            <div className="h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
                              {!editPostId && (
                                <button
                                  onClick={() => videoInputRef.current?.click()}
                                  className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <div className="p-4 rounded-full bg-muted">
                                    <Video className="w-8 h-8" />
                                  </div>
                                  <span className="font-semibold text-lg">Upload video</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="border rounded-lg p-4 space-y-4" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {uploadedVideos.map((video) => (
                                  <div key={video.id} className="relative flex-shrink-0 w-48 h-32 bg-black rounded-md overflow-hidden border border-border group">
                                    <video src={video.url} className="w-full h-full object-cover" />
                                    {!editPostId && (
                                      <button
                                        onClick={() => removeVideo(video.id)}
                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {!editPostId && (
                                  <button
                                    onClick={() => videoInputRef.current?.click()}
                                    className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed border-border hover:bg-muted transition-colors"
                                  >
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                                <textarea
                                  ref={videoCaptionRef}
                                  value={videoCaption}
                                  onChange={(e) => setVideoCaption(e.target.value)}
                                  placeholder="Add a caption..."
                                  className="w-full min-h-[80px] text-lg resize-none border-none focus:ring-0 p-0 pr-10 bg-transparent focus:outline-none"
                                  style={{ color: '#000000' }}
                                />
                                {!isMobile && (
                                  <div className="absolute top-0 right-0 z-20">
                                    <button
                                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                      type="button"
                                      className={`p-2 rounded-md transition-colors flex items-center gap-1 ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                      title="Add emoji"
                                    >
                                      <Smile className="w-5 h-5" />
                                    </button>
                                    {showEmojiPicker && renderEmojiPicker(true)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )
                      }

                      {/* ARTICLE POST */}
                      {
                        postType === 'article' && (
                          <div className="flex flex-col h-full space-y-6">
                            {/* Cover Media Section */}
                            <div className="flex flex-col items-center justify-center p-4">
                              {articleCoverImage ? (
                                <div className="relative w-full max-h-96 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                                  {articleCoverImage.file?.type.startsWith('image/') || articleCoverImage.type === 'image' ? (
                                    <img src={articleCoverImage.url} alt="Cover" className="max-h-96 object-contain" />
                                  ) : (
                                    <video src={articleCoverImage.url} controls className="max-h-96 object-contain" />
                                  )}
                                  {!editPostId && (
                                    <button
                                      onClick={() => removeArticleMedia(articleCoverImage.url, true)}
                                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20">
                                  {!editPostId && (
                                    <>
                                      <Image className="w-12 h-12 text-muted-foreground mb-3" />
                                      <p className="text-muted-foreground mb-4">Add a cover image or video to your article.</p>
                                      <input
                                        ref={articleCoverInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleArticleMediaUpload}
                                        className="hidden"
                                      />
                                      <button
                                        onClick={() => articleCoverInputRef.current?.click()}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                      >
                                        Upload from computer
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Title Field */}
                            <input
                              type="text"
                              value={articleTitle}
                              onChange={(e) => setArticleTitle(e.target.value)}
                              placeholder="Start article title here"
                              className="w-full text-xl md:text-2xl px-6 bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/70 text-foreground"
                              style={{ border: 'none', background: 'transparent', outline: 'none' }}
                            />

                            {/* Article Content Editor */}
                            <div className="relative px-6 flex-grow">
                              <RichTextEditor content={articleContent} onChange={setArticleContent} />
                            </div>
                          </div>
                        )
                      }

                      {/* POLL POST */}
                      {
                        postType === 'poll' && (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Your Question</label>
                              <input
                                type="text"
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                placeholder="e.g., What is your biggest challenge?"
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-foreground">Options</label>
                              {pollOptions.map((option, index) => (
                                <div key={option.id} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updatePollOption(option.id, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                  />
                                  {!editPostId && pollOptions.length > 2 && (
                                    <button onClick={() => removePollOption(option.id)} className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors">
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {!editPostId && pollOptions.length < 4 && (
                                <button
                                  onClick={addPollOption}
                                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 px-1 py-1"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Option
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Poll Duration</label>
                              <select
                                value={pollDuration}
                                onChange={(e) => setPollDuration(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                              >
                                <option value="1 day">1 Day</option>
                                <option value="3 days">3 Days</option>
                                <option value="1 week">1 Week</option>
                                <option value="2 weeks">2 Weeks</option>
                              </select>
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </>
                )}
              </>
            )} {/* End Editor Mode */}
          </div>


          {/* Footer Actions */}
          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-border ${isMobile ? '' : 'bg-card'}`}>
            {isPreviewMode ? (
              // Preview Mode Buttons
              <button
                onClick={togglePreview}
                className={`px-6 py-2.5 ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-colors font-semibold text-muted-foreground hover:bg-muted`}
              >
                Back to Edit
              </button>
            ) : (
              // Standard Buttons
              <>
                {(postType === 'photo' || postType === 'video') && (
                  <button
                    onClick={togglePreview}
                    disabled={postType === 'photo' ? uploadedImages.length === 0 : uploadedVideos.length === 0}
                    className={`flex items-center gap-2 px-4 py-2.5 ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-colors font-medium text-primary hover:bg-primary/10 disabled:opacity-50`}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`px-6 py-2.5 ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-colors font-semibold text-muted-foreground hover:bg-muted`}
                >
                  Cancel
                </button>
              </>
            )}

            <button
              onClick={handlePost}
              disabled={isPostDisabled()}
              className={`px-8 py-2.5 font-semibold ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-all ${isPostDisabled()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90'
                }`}
            >
              {isSubmitting ? 'Saving...' : (editPostId ? 'Save' : 'Post')}
            </button>
          </div>
        </div>
      </div>
      <input
        ref={desktopGalleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleDesktopPhotoUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoUpload}
        className="hidden"
      />
    </>
  );
}
