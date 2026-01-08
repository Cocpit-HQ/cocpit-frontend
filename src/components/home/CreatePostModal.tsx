"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Video, Plus, Trash2, Camera, Smile, FileText, Link } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { createPost, CreatePostRequest } from '@/services/api/feed';
import { uploadMedia } from '@/services/api/media';
import { Post } from '@/types/entities';


export type PostType = 'text' | 'photo' | 'poll' | 'video' | 'article';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPostType?: PostType;
}

interface MediaItem {
  id: string;
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface PollOption {
  id: string;
  text: string;
}

export function CreatePostModal({ isOpen, onClose, initialPostType = 'text' }: CreatePostModalProps) {
  const isMobile = useIsMobile();
  const { addPost, currentUser } = useFeed();
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
  const articleTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [articleLink, setArticleLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs to track media for cleanup without triggering effects
  const uploadedImagesRef = useRef<MediaItem[]>([]);
  const uploadedVideosRef = useRef<MediaItem[]>([]);
  const articleCoverImageRef = useRef<MediaItem | null>(null);

  useEffect(() => { uploadedImagesRef.current = uploadedImages; }, [uploadedImages]);
  useEffect(() => { uploadedVideosRef.current = uploadedVideos; }, [uploadedVideos]);
  useEffect(() => { articleCoverImageRef.current = articleCoverImage; }, [articleCoverImage]);

  // Helper to revoke all object URLs
  const revokeAllMediaUrls = () => {
    uploadedImagesRef.current.forEach(img => URL.revokeObjectURL(img.url));
    uploadedVideosRef.current.forEach(video => URL.revokeObjectURL(video.url));
    if (articleCoverImageRef.current) URL.revokeObjectURL(articleCoverImageRef.current.url);
  };

  const isMobilePhotoPost = isMobile && postType === 'photo';
  const isMobileVideoPost = isMobile && postType === 'video';
  const isMobileTextPost = isMobile && postType === 'text';
  const isMobilePollPost = isMobile && postType === 'poll';

  useEffect(() => {
    if (isOpen) {
      setPostType(initialPostType);
    } else {
      // Centralized cleanup of URLs
      revokeAllMediaUrls();

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
      setShowLinkInput(false);
      setArticleLink('');
    }
  }, [isOpen, initialPostType]);
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
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | undefined;

    if (e instanceof File) {
      file = e;
    } else {
      file = e.target.files?.[0];
    }

    if (file) {
      const newImage = createMediaItem(file);
      setUploadedImages([newImage]);
    }

    if (!(e instanceof File)) {
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDesktopPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => createMediaItem(file));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
    e.target.value = '';
  };

  const removeMediaItem = (
    mediaId: string,
    currentMedia: MediaItem[],
    setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  ) => {
    setMedia(prev => {
      const itemToRemove = prev.find(item => item.id === mediaId);
      if (itemToRemove) URL.revokeObjectURL(itemToRemove.url);
      return prev.filter(item => item.id !== mediaId);
    });
  };

  const removeImage = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
  };

  const removeSingleImage = (id: string) => {
    removeMediaItem(id, uploadedImages, setUploadedImages);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      case 'article': return { text: articleContent, setText: setArticleContent, ref: articleTextAreaRef };
      case 'text':
      default: return { text: description, setText: setDescription, ref: textAreaRef };
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const { text, setText, ref } = getActiveState();
    const textarea = ref?.current;

    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

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
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only one file for cover or single media upload
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          // Revoke old URL if exists before setting new one
          if (articleCoverImage) URL.revokeObjectURL(articleCoverImage.url);
          setArticleCoverImage(createMediaItem(file));
        } else {
          console.warn("Only images and videos are allowed for article cover.");
        }
    }
    e.target.value = '';
  };

  const removeArticleMedia = (url: string, isCover: boolean) => {
    if (isCover && articleCoverImage) {
      URL.revokeObjectURL(articleCoverImage.url);
      setArticleCoverImage(null);
    }
  };

  const handleSetPostCategory = (category: 'Personal' | 'Professional' | 'Achievement') => {
    setPostCategory(category);
  };

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
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomEmoji(); } }}
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

  const handlePost = async () => {
    setIsSubmitting(true);
    const { text: finalContent } = getActiveState();

    let media_urls: string[] = [];
    try {
      const selectedFiles: File[] = [];
      if (postType === 'photo') {
        selectedFiles.push(...uploadedImages.map(img => img.file));
      } else if (postType === 'video') {
        selectedFiles.push(...uploadedVideos.map(vid => vid.file));
      } else if (postType === 'article' && articleCoverImage) {
        selectedFiles.push(articleCoverImage.file);
      }

      if (selectedFiles.length > 0) {
        console.log("Starting media upload...", selectedFiles);
        const uploaded = await uploadMedia(selectedFiles);
        media_urls = uploaded.map(m => m.url);
        console.log("Media uploaded successfully:", media_urls);
      }

      // Construct the payload
      const payload: CreatePostRequest = {
        title: postType === 'article' ? articleTitle : '',
        content: finalContent,
        category: postCategory,
        visibility: 'public',
        post_type: postType === 'photo' ? 'image' :
                   postType === 'article' ? 'text' :
                   postType, // video, poll, text
        media_urls,
      };

      // Handle Poll
      if (postType === 'poll') {
        const filteredOptions = pollOptions.filter(o => o.text.trim()).map(o => o.text);
        if (filteredOptions.length < 2) {
          setIsSubmitting(false);
          return;
        }
        payload.poll_options = filteredOptions;
        payload.poll_duration = pollDuration;
        payload.content = pollQuestion;
        payload.title = "";
      }

      console.log("Creating post with category:", payload.category);
      const response = await createPost(payload);

      const newPost: Post = {
        id: response.postId,
        author: currentUser?.name || 'Anonymous',
        authorAvatar: '/assets/pngegg.png',
        title: response.title || (response.category || 'Post'),
        timeAgo: 'Just now',
        content: response.content,
        imageSrc: response.media_urls && response.media_type === 'image' && response.media_urls.length > 0 ? response.media_urls[0] : undefined,
        images: response.media_urls && response.media_type === 'image' ? response.media_urls : undefined,
        videoSrc: response.media_urls && response.media_type === 'video' && response.media_urls.length > 0 ? response.media_urls[0] : undefined,
        likes: '0',
        comments: '0',
        shares: '0',
        commentData: [],
        category: response.category as any,
        visibility: response.visibility as any,
        poll: response.poll && 'options' in response.poll ? {
           poll_id: response.poll.poll_id || 'temp-id',
           total_votes: response.poll.total_votes || 0,
           // @ts-ignore
           options: (response.poll.options || []).map((opt: any, idx) => ({
             option_id: opt.option_id || `opt-${idx}`,
             option_text: opt.option_text || opt,
             vote_count: opt.vote_count || 0
           }))
        } : null
      };

      addPost(newPost);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostDisabled = () => {
    if (isSubmitting) return true;
    if (postType === 'poll') {
      return !pollQuestion.trim() || pollOptions.filter(o => o.text.trim()).length < 2;
    }
    if (postType === 'photo') return uploadedImages.length === 0;
    if (postType === 'video') return uploadedVideos.length === 0;
    if (postType === 'article') return !articleTitle.trim() || !articleContent.trim();
    
    // Text post
    return !description.trim();
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col ${
          isMobile 
            ? 'rounded-2xl bg-white/80 backdrop-blur-lg border border-white/30 shadow-2xl overflow-hidden' 
            : 'rounded-lg bg-card shadow-2xl overflow-visible'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-border ${
            isMobile ? '' : 'bg-card'
          }`}
        >
          <h2 className="text-xl font-semibold text-foreground">Create a post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {(isMobilePhotoPost || isMobileVideoPost || isMobileTextPost || isMobilePollPost) ? (
            // MOBILE MEDIA POST UI
            <div className="p-4 flex flex-col h-full">
              {isMobilePhotoPost && (
                uploadedImages.length === 0 ? (
                <div className="flex-grow flex flex-col justify-center items-center gap-4">
                  <button
                    onClick={() => console.log('Take Photo clicked - should be handled via a separate camera modal or component')}
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
                  {/* Hidden input for gallery upload */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={uploadedImages[0].url}
                      alt="Upload preview"
                      className="w-full rounded-lg object-contain bg-black/5"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 rounded-full transition-colors bg-black/50 text-white hover:bg-black/70"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        src={uploadedVideos[0].url}
                        controls
                        className="w-full rounded-lg bg-black/5"
                      />
                      <button
                        onClick={() => removeVideo(uploadedVideos[0].id)}
                        className="absolute top-2 right-2 p-2 rounded-full transition-colors bg-black/50 text-white hover:bg-black/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                    <textarea
                      ref={textAreaRef}
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
                        {pollOptions.length > 2 && (
                          <button onClick={() => removePollOption(option.id)} className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
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
          ) : (
            // ORIGINAL POST UI
            <>
              {/* Profile Section */}
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
                    <p className="text-sm text-muted-foreground">Post to Anyone</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {(['Personal', 'Professional', 'Achievement'] as const).map((category) => (
                    <button
                      key={category}
                      onClick={() => setPostCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        postCategory === category
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
                    <textarea
                      ref={textAreaRef}
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

                {/* PHOTO POST */}
                {postType === 'photo' && (
                  uploadedImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
                      <button
                        onClick={() => desktopGalleryInputRef.current?.click()}
                        className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="p-4 rounded-full bg-muted">
                          <Image className="w-8 h-8" />
                        </div>
                        <span className="font-semibold text-lg">Upload photos</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-4" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {uploadedImages.map((img) => (
                          <div key={img.id} className="relative flex-shrink-0 w-32 h-32 bg-muted rounded-md overflow-hidden border border-border group">
                            <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeSingleImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => desktopGalleryInputRef.current?.click()}
                          className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed border-border hover:bg-muted transition-colors"
                        >
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </button>
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
                {postType === 'video' && (
                  uploadedVideos.length === 0 ? (
                    <div className="h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="p-4 rounded-full bg-muted">
                          <Video className="w-8 h-8" />
                        </div>
                        <span className="font-semibold text-lg">Upload video</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-4" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {uploadedVideos.map((video) => (
                          <div key={video.id} className="relative flex-shrink-0 w-48 h-32 bg-black rounded-md overflow-hidden border border-border group">
                            <video src={video.url} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeVideo(video.id)}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => videoInputRef.current?.click()}
                          className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed border-border hover:bg-muted transition-colors"
                        >
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </button>
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
                )}

                {/* ARTICLE POST */}
                {postType === 'article' && (
                  <div className="flex flex-col h-full space-y-6">
                    {/* Cover Media Section */}
                    <div className="flex flex-col items-center justify-center p-4">
                      {articleCoverImage ? (
                        <div className="relative w-full max-h-96 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                          {articleCoverImage.file.type.startsWith('image/') ? (
                            <img src={articleCoverImage.url} alt="Cover" className="max-h-96 object-contain" />
                          ) : (
                            <video src={articleCoverImage.url} controls className="max-h-96 object-contain" />
                          )}
                          <button
                            onClick={() => removeArticleMedia(articleCoverImage.url, true)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20">
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
                      <textarea
                        ref={articleTextAreaRef}
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        placeholder="Start writing your article..."
                        className="w-full min-h-[300px] text-lg resize-none bg-transparent border-none outline-none focus:ring-0 p-0 pr-12 placeholder:text-muted-foreground/70"
                        style={{ border: 'none', background: 'transparent', outline: 'none' }}
                      />
                      {!isMobile && (
                        <div className="absolute top-0 right-6 z-10">
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
                )}

                {/* POLL POST */}
                {postType === 'poll' && (
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
                          {pollOptions.length > 2 && (
                            <button onClick={() => removePollOption(option.id)} className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
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
            </>
          )}
        </div>


        {/* Footer Actions */}
        <div
          className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-border ${
            isMobile ? '' : 'bg-card'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2.5 ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-colors font-semibold text-muted-foreground hover:bg-muted`}
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isPostDisabled()}
            className={`px-8 py-2.5 font-semibold ${isMobile ? 'rounded-md' : 'rounded-lg'} transition-all ${
              isPostDisabled()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
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
