import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Loader2, ArrowLeft } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Post, PostVisibility } from '@/types/entities';
import { postApi } from '@/features/create-post/api/post.api';
import { syncPostTags } from '@/services/api/posts';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { TagPeopleSelector } from '@/shared/commonComponents/TagPeopleSelector';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';
import { UserMention } from '@/services/api/users';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import VisibilityToggle from '@/features/create-post/components/shared/VisibilityToggle';
import { PostCarousel } from '@/components/shared/PostCarousel';
import { CustomVideoPlayer } from '@/components/ui/CustomVideoPlayer';

export interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPostId: string;
  onUpdate?: (updatedPost: any) => void;
}

export function EditPostModal({ isOpen, onClose, editPostId, onUpdate }: EditPostModalProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | StructuredLocation | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<UserMention[]>([]);

  // Post type & preview metadata
  const [postType, setPostType] = useState<string>('text');
  const [images, setImages] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [poll, setPoll] = useState<any>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [originalPost, setOriginalPost] = useState<Post | null>(null);

  // Dialog & Selector Visibility
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState<EmojiPickerPosition | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Load post details on open
  useEffect(() => {
    if (isOpen && editPostId) {
      setIsLoading(true);
      postApi.getById(editPostId)
        .then((post) => {
          setOriginalPost(post);
          setDescription(post.content || '');
          setVisibility(post.visibility || 'public');
          setSelectedLocation(post.location ? { id: 0, name: post.location, latitude: '', longitude: '' } : null);
          setTaggedUsers(post.tags || []);

          // Detect type
          const isArticlePost =
            post.category === 'Article' ||
            Boolean(post.articleBody) ||
            post.post_type === 'article' ||
            post.type === 'ARTICLE' ||
            post.type === 'article' ||
            (Boolean(post.title) && !post.poll);

          if (isArticlePost) {
            setPostType('article');
            setArticleTitle(post.title || '');
          } else if (post.images && post.images.length > 0) {
            setPostType('photo');
            setImages(post.images);
          } else if (post.videoSrc) {
            setPostType('video');
            setVideoSrc(post.videoSrc);
          } else if (post.poll) {
            setPostType('poll');
            setPoll(post.poll);
            setDescription(post.content || '');
          } else {
            setPostType('text');
          }
        })
        .catch((err) => {
          console.error("Failed to load post for editing:", err);
          toast.error("Failed to load post data.");
          onClose();
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, editPostId]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  const handleEmojiButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      setEmojiPickerPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const pickerH = 340;
    const pickerW = 310;
    let top = rect.bottom + 8;

    if (top + pickerH > window.innerHeight - 10) {
      top = rect.top - pickerH - 8;
      if (top < 10) top = 10;
    }

    let left = rect.right - pickerW;
    if (left < 10) left = 10;
    if (left + pickerW > window.innerWidth - 10) left = window.innerWidth - pickerW - 10;

    setEmojiPickerPos({ top, left });
    setShowEmojiPicker(true);
  };

  const closeEmojiPicker = () => {
    setShowEmojiPicker(false);
    setEmojiPickerPos(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDescription(prev => prev + emoji);
    } else {
      const start = textarea.selectionStart ?? description.length;
      const end = textarea.selectionEnd ?? description.length;
      const nextDesc = `${description.slice(0, start)}${emoji}${description.slice(end)}`;
      setDescription(nextDesc);

      requestAnimationFrame(() => {
        textarea.focus();
        const nextCursor = start + emoji.length;
        textarea.selectionStart = textarea.selectionEnd = nextCursor;
      });
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInsidePicker = emojiPickerRef.current?.contains(target) || target.closest('.cocpit-emoji-picker');
      const isInsideButton = emojiButtonRef.current?.contains(target);
      if (!isInsidePicker && !isInsideButton) {
        setShowEmojiPicker(false);
        setEmojiPickerPos(null);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showEmojiPicker]);

  const handleSave = async () => {
    if (isSubmitting || !editPostId) return;
    setIsSubmitting(true);

    try {
      const updatePayload: any = {
        content: description.trim(),
        category: originalPost?.category || 'Professional',
        visibility: visibility,
        location: selectedLocation ? ("formattedAddress" in selectedLocation ? selectedLocation.formattedAddress : selectedLocation.name) : null,
      };

      if (postType !== 'poll') {
        updatePayload.post_type = postType === 'photo' ? 'image' : postType;
      }

      if (postType === 'article') {
        updatePayload.title = articleTitle;
      }

      await postApi.update(editPostId, updatePayload);

      // Sync tags
      const tagIds = taggedUsers.map(u => u.id);
      await syncPostTags(editPostId, tagIds);

      if (onUpdate) {
        onUpdate({
          ...originalPost,
          ...updatePayload,
          tags: taggedUsers
        });
      }

      toast.success("Post updated successfully");
      onClose();
    } catch (err) {
      console.error("Failed to update post:", err);
      toast.error("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayAvatar = originalPost?.authorAvatar || currentUser?.image || (currentUser as any)?.avatar;
  const displayName = originalPost?.author || currentUser?.name || 'User';
  const displayUsername = originalPost?.authorSlug || (currentUser as any)?.username || 'user';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent
          className="w-full h-full max-h-screen sm:max-h-[90vh] sm:max-w-[600px] sm:h-[552px] p-0 border-none rounded-none sm:rounded-[24px] bg-card shadow-2xl overflow-hidden font-poppins flex flex-col z-[101] [&>button:last-child]:hidden fixed left-0 top-0 translate-x-0 translate-y-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (
              target &&
              (target.closest('.cocpit-emoji-picker') ||
                target.closest('.cocpit-emoji-picker-backdrop') ||
                target.closest('[role="dialog"]'))
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">Edit Post</DialogTitle>

          {(showTagSelector || showLocationSelector) && (
            <div className="absolute inset-0 bg-black/80 z-[300] pointer-events-auto transition-opacity" />
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground font-poppins">Loading post...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col flex-1 min-h-0 items-center p-4 sm:p-5">
              {/* Mobile Header (Image 2) */}
              <div className="flex sm:hidden flex-row items-center gap-3 w-full border-b border-border/60 pb-3 mb-1 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex flex-col text-left">
                  <h2 className="font-semibold text-[17px] text-foreground leading-snug">Edit post</h2>
                  <p className="text-[12px] text-muted-foreground">Edit and republish your post</p>
                </div>
              </div>

              {/* Desktop Header */}
              <div className="hidden sm:flex w-full flex-col items-center relative mb-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 flex items-center justify-center w-[24px] h-[24px] text-[#FF6B6B] transition-colors"
                >
                  <X className="w-full h-full stroke-[1.5px]" />
                </button>
                <h2 className="font-medium text-[18px] leading-[26px] text-foreground text-center font-poppins">
                  Edit Post
                </h2>
                <p className="font-normal text-[12.5px] leading-[17px] text-muted-foreground text-center mt-1">
                  Update your post details and share changes.
                </p>
              </div>

              {/* Author & Visibility */}
              <div className="relative flex flex-row items-center justify-between w-full mt-2 sm:mt-1 z-[60] shrink-0">
                <div className="flex flex-row items-center justify-start gap-3.5 text-left font-poppins">
                  <div className="w-11 h-11 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-base ring-2 ring-border shadow-sm overflow-hidden shrink-0 select-none">
                    {displayAvatar && displayAvatar !== '/assets/pngegg.png' ? (
                      <img
                        src={displayAvatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[17px] leading-[24px] text-foreground">{displayName}</span>
                    <span className="font-normal text-[12px] leading-[16px] text-[#9CA3AF]">@{displayUsername}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex flex-col w-full flex-1 min-h-0 mt-3 overflow-y-auto custom-scrollbar">
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Previews of existing media */}
                  {postType === 'photo' && images.length > 0 && (
                    <div className="w-full h-[200px] rounded-[16px] overflow-hidden bg-slate-50 relative mt-2 mb-2 shrink-0">
                      {images.length > 1 ? (
                        <PostCarousel images={images} />
                      ) : (
                        <img src={images[0]} className="w-full h-full object-cover" alt="Post attachment" />
                      )}
                    </div>
                  )}

                  {postType === 'video' && videoSrc && (
                    <div className="w-full h-[200px] rounded-[16px] overflow-hidden bg-black relative mt-2 mb-2 flex items-center justify-center shrink-0">
                      <CustomVideoPlayer src={videoSrc} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {postType === 'poll' && poll && (
                    <div className="w-full border border-border bg-[#F8FAFF] dark:bg-transparent rounded-[16px] p-4 mt-2 mb-2 space-y-3 text-left shrink-0">
                      <span className="inline-flex items-center rounded-full bg-[#EEF2FF] dark:bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1] dark:text-indigo-400">
                        Poll Options (Read-only)
                      </span>
                      <div className="space-y-2">
                        {poll.options?.map((option: any) => (
                          <div
                            key={option.option_id}
                            className="w-full py-2.5 px-4 bg-white dark:bg-[#1C2840] border border-[#E8ECFF] dark:border-[#232F45] text-foreground text-[13px] font-medium rounded-[14px] font-poppins"
                          >
                            {option.option_text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {postType === 'article' && articleTitle && (
                    <div className="w-full border border-border rounded-[16px] p-4 mt-2 mb-2 bg-[#F8FAFF] dark:bg-transparent text-left shrink-0">
                      <span className="inline-flex items-center rounded-full bg-[#EEF2FF] dark:bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1] dark:text-indigo-400 mb-2">
                        Article Cover (Read-only)
                      </span>
                      <h4 className="font-semibold text-[15px] text-foreground font-poppins line-clamp-1">{articleTitle}</h4>
                    </div>
                  )}

                  {/* Textarea */}
                  <div className="flex flex-col w-full pr-3">
                    <textarea
                      ref={textareaRef}
                      className="w-full resize-none outline-none font-normal text-[15px] leading-[23px] text-foreground placeholder:text-[#6B7280] bg-transparent font-poppins whitespace-pre-wrap"
                      placeholder="What would you like to update?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ overflow: 'hidden', resize: 'none', height: 'auto', minHeight: '80px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Footer Selectors Row (Image 3) */}
              <div className="flex sm:hidden items-center justify-between w-full py-3 border-t border-border/40 mt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTagSelector(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon icon="la:user-tag" className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-[14px] font-medium text-[#6366F1] font-poppins">
                    {taggedUsers.length > 0 ? `${taggedUsers.length} Tagged` : 'Tag People'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationSelector(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors max-w-[50%]"
                >
                  <Icon icon="hugeicons:location-05" className="w-5 h-5 text-gray-500" />
                  <span className="text-[14px] font-medium text-gray-500 font-poppins truncate">
                    {selectedLocation ? ((selectedLocation as any).name || (selectedLocation as any).formattedAddress) : 'Location'}
                  </span>
                </button>
              </div>

              {/* Mobile Action Buttons (Image 3) */}
              <div className="flex sm:hidden gap-3 w-full pb-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 h-11 border border-[#818CF8]/30 dark:border-border rounded-[24px] text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting || (postType === 'text' && !description.trim())}
                  className="w-1/2 h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[24px] font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                  Save
                </button>
              </div>

              {/* Desktop Footer row: selectors & CTA */}
              <div className="hidden sm:flex flex-col gap-4 w-full mt-auto pt-3 border-t border-border/40 shrink-0">
                <div className="flex items-center justify-between w-full">
                  {/* Selectors */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 relative transition-colors group"
                      title="Tag people"
                      onClick={() => setShowTagSelector(true)}
                    >
                      <Icon icon="la:user-tag" className="w-6 h-6 text-foreground hover:text-primary transition-colors" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                      {taggedUsers.length > 0 && (
                        <span className="text-[14px] leading-[20px] font-normal text-[#818CF8] font-poppins">
                          + {taggedUsers.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 relative transition-colors group"
                      title="Location"
                      onClick={() => setShowLocationSelector(true)}
                    >
                      <Icon icon="hugeicons:location-05" className="w-6 h-6 text-foreground hover:text-primary transition-colors" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                      {selectedLocation && (
                        <span className="text-[14px] leading-[20px] font-normal text-[#818CF8] font-poppins truncate max-w-[150px] text-left">
                          {(selectedLocation as any).name || (selectedLocation as any).formattedAddress}
                        </span>
                      )}
                    </button>
                    <button
                      ref={emojiButtonRef}
                      type="button"
                      className="transition-colors"
                      title="Add emoji"
                      onClick={handleEmojiButtonClick}
                    >
                      <Icon icon="lucide:smile" className="w-6 h-6 text-foreground hover:text-primary transition-colors" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                    </button>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting || (postType === 'text' && !description.trim())}
                    className={`flex flex-row items-center justify-center gap-2 px-7 py-2 border border-transparent rounded-full transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group shadow-sm bg-indigo-500 hover:bg-indigo-600`}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                    <span className="font-medium text-[13.5px] leading-[20px] text-white">
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        {/* Tag People Dialog */}
        <Dialog open={showTagSelector} onOpenChange={(open) => { if (!open) setShowTagSelector(false); }}>
          <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden z-[301]">
            <TagPeopleSelector
              taggedUsers={taggedUsers}
              onTaggedUsersChange={setTaggedUsers}
              onCancel={() => setShowTagSelector(false)}
              onConfirm={() => setShowTagSelector(false)}
            />
          </BareDialogContent>
        </Dialog>

        {/* Location Selector Dialog */}
        <Dialog open={showLocationSelector} onOpenChange={(open) => { if (!open) setShowLocationSelector(false); }}>
          <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden z-[301]">
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              onCancel={() => setShowLocationSelector(false)}
              onConfirm={() => setShowLocationSelector(false)}
            />
          </BareDialogContent>
        </Dialog>
      </Dialog>

      {/* Emoji Picker */}
      <div ref={emojiPickerRef}>
        <EmojiPickerPortal
          isOpen={showEmojiPicker}
          position={emojiPickerPos}
          onClose={closeEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          zIndex={320}
        />
      </div>
    </>
  );
}
