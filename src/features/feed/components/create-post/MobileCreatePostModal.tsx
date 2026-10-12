import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Image as ImageIcon, BarChart3, Loader2, Loader, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePostForm } from '../../hooks/use-create-post-form';
import {
  MAX_POLL_QUESTION_LENGTH,
  MAX_POLL_OPTION_LENGTH,
  POLL_LIMIT_EXCEEDED_MSG,
} from '../../hooks/use-post-poll';
import { MentionTextarea } from '@/shared/commonComponents/MentionTextarea';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import RichTextRenderer from '../parts/RichTextRenderer';
import { CarouselDots } from '../parts/CarouselDots';
import { Icon } from '@/components/icons';
import { useUIStore } from '@/store/ui.store';
import { Reorder, useDragControls } from 'framer-motion';
import { deletePost } from '@/services/api/posts';
import { useFeed } from '@/hooks/use-feed';
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal';
import { useBodyScrollLock } from '@/hooks';
import { cn } from '@/lib/utils';

// --- Draggable Image Component ---
const DraggableImage = ({ img, imageToDelete, setImageToDelete, onRemove, scrollContainerRef, dragBoundsRef, isSingleImage }: any) => {
  const controls = useDragControls();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const lastX = useRef<number | null>(null);
  const rAFRef = useRef<number | null>(null);

  // Scoped global selection prevention while dragging
  useEffect(() => {
    if (!isDragging) return;

    const prevBodyUserSelect = document.body.style.userSelect;
    const prevBodyWebkitUserSelect = document.body.style.webkitUserSelect;
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.body.style.userSelect = prevBodyUserSelect;
      document.body.style.webkitUserSelect = prevBodyWebkitUserSelect;
    };
  }, [isDragging]);

  // Edge auto-scrolling and native scroll prevention
  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    
    if (isDragging && scrollContainer) {
      scrollContainer.style.scrollSnapType = 'none';

      // Calculate the true maximum scroll exactly ONCE before the loop starts.
      // Doing this here prevents layout thrashing (checking clientWidth in the loop).
      // This strict cap prevents Framer Motion's transforms from artificially expanding 
      // the container's scrollWidth and creating an "infinite treadmill".
      const numItems = scrollContainer.childElementCount;
      const totalWidth = (numItems * 178) + ((numItems - 1) * 8);
      const trueMaxScroll = Math.max(0, totalWidth - scrollContainer.clientWidth);

      const scrollLoop = () => {
        if (lastX.current !== null) {
          const threshold = 60; // active edge zone width
          const speed = 8; // adjusted speed for smoother edge panning
          
          if (lastX.current < threshold) {
            if (scrollContainer.scrollLeft > 0) {
              scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft - speed);
            }
          } else if (lastX.current > window.innerWidth - threshold) {
            if (scrollContainer.scrollLeft < trueMaxScroll) {
              scrollContainer.scrollLeft = Math.min(scrollContainer.scrollLeft + speed, trueMaxScroll);
            }
          }
        }
        rAFRef.current = requestAnimationFrame(scrollLoop);
      };
      
      rAFRef.current = requestAnimationFrame(scrollLoop);

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches[0]) lastX.current = e.touches[0].clientX;
      };
      const handlePointerMove = (e: PointerEvent) => {
        lastX.current = e.clientX;
      };
      const handlePointerUp = () => {
        setIsDragging(false); // Failsafe cleanup to restore scrolling
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      
      return () => {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        if (scrollContainer) scrollContainer.style.scrollSnapType = 'x mandatory';
      };
    }
  }, [isDragging, scrollContainerRef]);

  const startDrag = (e: React.PointerEvent) => {
    // 1. Immediately wipe any accidental selection in the window
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }

    // 2. Unfocus any active input/textarea to disengage the iOS cursor/selection engine
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      // Clear selection again right as Framer Motion drag controls take over
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
      setIsDragging(true);
      controls.start(e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
  };

  const cancelDrag = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePointerMoveItem = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - startX.current);
    const dy = Math.abs(e.clientY - startY.current);
    if (dx > 10 || dy > 10) {
      cancelDrag();
    }
  };

  return (
    <Reorder.Item
      value={img}
      dragListener={false} // Disable default drag listener to preserve scroll
      dragControls={controls}
      onDragEnd={() => setIsDragging(false)}
      onPointerDown={startDrag}
      onPointerUp={cancelDrag}
      onPointerCancel={cancelDrag}
      onPointerMove={handlePointerMoveItem}
      onContextMenu={(e) => e.preventDefault()} // Prevent iOS context menu / callout on long press
      className={`relative flex-shrink-0 snap-center rounded-xl overflow-hidden bg-ds-surface-1 select-none [-webkit-touch-callout:none] ${isSingleImage ? "w-full h-auto max-h-[500px]" : "w-[178px] h-[223px]"}`}
      style={{ 
        touchAction: isDragging ? 'none' : 'pan-x pan-y', // Lock touch action when dragging, allow native scrolling when idle
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      animate={{
        scale: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : 0,
        boxShadow: isDragging ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "none",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="w-full h-full relative select-none [-webkit-touch-callout:none]">
        <img
          src={img.url}
          alt="Upload preview"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={`pointer-events-none select-none rounded-[8px] [-webkit-touch-callout:none] ${isSingleImage ? "w-full h-auto max-h-[500px] object-contain" : "w-full h-full object-cover"}`}
        />

        {/* Delete Button (Figma spec: top-right circular cross) */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()} // prevent long-press drag
          onClick={(e) => {
            e.stopPropagation();
            onRemove(img.id);
          }}
          className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[#1A1A20] rounded-full shadow-md cursor-pointer outline-none pointer-events-auto"
          aria-label="Remove photo"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
        </button>
      </div>
    </Reorder.Item>
  );
};


interface MobileCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSharedPost?: any;
  editPostId?: string | null;
  onUpdate?: (updatedPost: any) => void;
}

export const MobileCreatePostModal = ({ isOpen, onClose, initialSharedPost, editPostId, onUpdate }: MobileCreatePostModalProps) => {
  const resolvedSharedPostId = initialSharedPost?.id || initialSharedPost?._id || (initialSharedPost as any)?.post_id;

  const { state, media, poll, actions } = useCreatePostForm({
    isOpen,
    onClose,
    isMobile: true,
    initialSharedPost,
    sharedPostId: resolvedSharedPostId,
    editPostId: editPostId || undefined,
    onUpdate
  });

  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<any>(null);
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  const { removePostFromFeed } = useFeed();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!editPostId) return;
    try {
      setIsDeleting(true);
      await deletePost(editPostId);
      removePostFromFeed(editPostId);
      toast.success("Post deleted successfully");
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };


  useEffect(() => {
    if (activeImageIndex >= media.uploadedImages.length) {
      setActiveImageIndex(Math.max(0, media.uploadedImages.length - 1));
    }
  }, [media.uploadedImages.length, activeImageIndex]);

  useBodyScrollLock(isOpen);

  const handleCarouselScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container || media.uploadedImages.length <= 1) return;

    if (scrollRafRef.current !== null) return;
    
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (clientWidth === 0) return;
      
      const maxScroll = scrollWidth - clientWidth;
      let closestIndex = 0;

      // Force first and last dots at absolute scroll boundaries
      if (scrollLeft <= 2) {
        closestIndex = 0;
      } else if (scrollLeft >= maxScroll - 2) {
        closestIndex = media.uploadedImages.length - 1;
      } else {
        // Calculate active dot perfectly based on exact viewport center vs item center
        const containerCenter = scrollLeft + (clientWidth / 2);
        const itemWidth = 178;
        const gap = 8;
        const stride = itemWidth + gap;

        let minDistance = Infinity;

        for (let i = 0; i < media.uploadedImages.length; i++) {
          const itemCenter = (i * stride) + (itemWidth / 2);
          const distance = Math.abs(containerCenter - itemCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
      }

      setActiveImageIndex((prevIndex) => prevIndex !== closestIndex ? closestIndex : prevIndex);
    });
  }, [media.uploadedImages.length]);

  const handleDotClick = useCallback((index: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const child = children[index];
    if (child) {
      const targetScrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, []);

  const handleMediaClick = useCallback(() => {
    if (state.postType === 'poll') return;
    if (media.uploadedVideos.length >= 1) {
      toast.error("Only one video file is allowed");
      return;
    }
    if (media.uploadedImages.length >= 12) {
      toast.error("Maximum 12 images allowed");
      return;
    }
    galleryInputRef.current?.click();
  }, [state.postType, media.uploadedVideos.length, media.uploadedImages.length]);

  if (!isOpen) return null;

  const hasMedia = media.uploadedImages.length > 0 || media.uploadedVideos.length > 0;

  const isPostEnabled = state.postType === 'poll'
    ? (state.description.trim().length > 0 || poll.pollQuestion.trim().length > 0) && poll.pollOptions.filter(o => o.text.trim().length > 0).length >= 2
    : state.description.trim().length > 0 || hasMedia || !!state.sharedPost;

  const posterImage = state.isCompanyPost
    ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url || (state.currentPoster as any)?.image)
    : state.currentUser?.image;

  // Repost logic
  const sharedUser = state.sharedPost?.user
    || (typeof state.sharedPost?.author === 'object' ? state.sharedPost?.author : null)
    || state.sharedPost?.created_by
    || state.sharedPost?.posted_by;

  const sharedName = sharedUser?.name
    || sharedUser?.full_name
    || (sharedUser?.firstName && sharedUser?.lastName ? `${sharedUser.firstName} ${sharedUser.lastName}` : null)
    || (typeof state.sharedPost?.author === 'string' ? state.sharedPost?.author : null)
    || state.sharedPost?.userName
    || state.sharedPost?.authorName
    || state.sharedPost?.name;

  const sharedAvatar = sharedUser?.image
    || sharedUser?.avatar
    || sharedUser?.avatar_url
    || sharedUser?.profile_picture
    || sharedUser?.photo
    || state.sharedPost?.authorAvatar
    || state.sharedPost?.authorImg
    || state.sharedPost?.image;

  const sharedRole = sharedUser?.title
    || sharedUser?.role
    || sharedUser?.designation
    || sharedUser?.headline
    || state.sharedPost?.authorHeadline;

  const sharedContent = state.sharedPost?.content || state.sharedPost?.description || state.sharedPost?.text;
  const sharedImage = state.sharedPost?.images?.[0] || state.sharedPost?.imageSrc;

  const handleClose = () => {
    state.setSharedPost(null);
    useUIStore.getState().setSharedPostData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <BareDialogContent
        hideOverlay
        className="fixed inset-0 z-[101] bg-ds-bg max-w-none rounded-none flex flex-col pt-0 pb-0 !top-0 !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0 ds-animate-sheet-up data-[state=closed]:slide-out-to-bottom-[100%] data-[state=open]:slide-in-from-bottom-[100%] duration-300 h-full w-full overscroll-contain select-text"
      >
        {isSettingLocation && (
          <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <LocationSelector
              selectedLocation={state.selectedLocation}
              onLocationChange={state.setSelectedLocation}
              onCancel={() => setIsSettingLocation(false)}
              onConfirm={() => setIsSettingLocation(false)}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] touch-none shrink-0 select-none">
          <DialogTitle className="ds-text-body-2 text-ds-text-primary font-semibold select-none">{editPostId ? 'Edit post' : 'Create post'}</DialogTitle>
          <button onClick={handleClose} className="p-2 -mr-2 text-ds-text-secondary hover:text-ds-text-primary transition-colors">
            <X className="w-5 h-5 ds-icon-20" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-4 pt-4 pb-4 flex flex-col gap-4 no-scrollbar">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-ds-surface-2 text-ds-text-primary flex items-center justify-center font-semibold text-xs border border-ds-border overflow-hidden select-none">
              {posterImage && posterImage !== '/assets/pngegg.png' ? (
                <img
                  src={posterImage}
                  alt="Profile"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Icon name="user" className="w-[18px] h-[18px] text-ds-text-secondary" />
              )}
            </div>

            {/* Textarea or Poll Title */}
            <div className={`flex-1 ${state.postType === 'poll' ? 'flex items-center' : 'pt-1'}`}>
              {state.postType === 'poll' ? (
                <span className="text-[14px] text-ds-text-primary">Poll post</span>
              ) : (
                <MentionTextarea
                  value={state.description}
                  onChange={(e) => state.setDescription(e.target.value)}
                  onMentionsChange={state.setInlineMentions}
                  placeholder="What would you like to share today?"
                  className="w-full min-h-[40px] bg-transparent ds-text-body text-ds-text-primary placeholder:text-ds-text-muted resize-none border-none focus:ring-0 p-0 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Repost Preview */}
          {state.sharedPost && (
            <div className="ml-11 relative flex flex-col mt-2 animate-in fade-in duration-200">
              <div className="w-full border border-ds-border rounded-xl p-3 bg-transparent relative">
                {/* Remove Shared Post Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.setSharedPost(null);
                    useUIStore.getState().setSharedPostData(null);
                  }}
                  className="absolute top-2 right-2 p-1 text-ds-text-muted hover:text-ds-text-primary rounded-full hover:bg-ds-surface-1 transition-colors z-10"
                  title="Remove repost"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Original Author */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-ds-surface-1 flex-shrink-0 flex items-center justify-center font-medium text-[10px]">
                    {sharedAvatar && sharedAvatar !== '/assets/pngegg.png' ? (
                      <img
                        src={sharedAvatar}
                        alt={sharedName || "Author"}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span>{(sharedName || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-ds-text-primary font-semibold">{sharedName || "Unknown User"}</span>
                    {sharedRole && (
                      <span className="text-[10px] text-ds-text-muted">{sharedRole}</span>
                    )}
                  </div>
                </div>

                {/* Repost Content */}
                {sharedContent && (
                  <div className="text-[12px] text-ds-text-primary line-clamp-3 mb-2">
                    <RichTextRenderer
                      content={sharedContent}
                      authorName={sharedName}
                      disableLinks={true}
                      mentionedUsers={state.sharedPost?.mentioned_users}
                    />
                  </div>
                )}

                {/* Repost Media */}
                {sharedImage && (
                  <div className="rounded-lg overflow-hidden border border-ds-border">
                    <img src={sharedImage} alt="Post media" className="w-full max-h-[200px] object-cover" />
                  </div>
                )}

                {/* Repost Poll Options */}
                {state.sharedPost.poll?.options && state.sharedPost.poll.options.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {state.sharedPost.poll.options.map((opt: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border border-ds-border rounded-lg p-2 px-3 bg-ds-surface-1/50 opacity-80">
                        <span className="text-[12px] text-ds-text-primary truncate">{opt.option_text || opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Poll Flow */}
          {state.postType === 'poll' && !state.sharedPost && (
            <div className="ml-11 -mt-2 flex flex-col gap-2 pb-2 animate-in fade-in duration-200">
              <div className="flex flex-col gap-1 w-full">
                <div className="relative flex items-center border-b border-ds-border">
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
                    className="w-full bg-transparent py-[10px] pr-2 text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none"
                  />
                </div>
                {poll.questionError && (
                  <p className="text-[var(--ds-error)] text-[12px] font-normal leading-[16px] animate-in fade-in duration-150 select-none">
                    {poll.questionError}
                  </p>
                )}
              </div>
              {poll.pollOptions.map((option, index) => {
                const optError = poll.optionErrors?.[option.id];
                return (
                  <div key={option.id} className="flex flex-col gap-1 w-full">
                    <div className="relative flex items-center border-b border-ds-border">
                      <input
                        type="text"
                        value={option.text}
                        maxLength={MAX_POLL_OPTION_LENGTH}
                        onKeyDown={(e) => {
                          const input = e.currentTarget;
                          const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
                          const isControlKey = e.ctrlKey || e.metaKey || e.altKey;
                          const isNavKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', 'Enter', 'Escape'].includes(e.key);
                          if (!isControlKey && !isNavKey && e.key.length === 1 && !hasSelection && option.text.length >= MAX_POLL_OPTION_LENGTH) {
                            e.preventDefault();
                            poll.setOptionErrors((prev: Record<string, string>) => ({ ...prev, [option.id]: POLL_LIMIT_EXCEEDED_MSG }));
                          }
                        }}
                        onChange={(e) => poll.updatePollOption(option.id, e.target.value)}
                        placeholder={`Option ${['A', 'B', 'C', 'D', 'E', 'F'][index] || index + 1}`}
                        className="w-full bg-transparent py-[10px] pr-8 text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none"
                      />
                      {poll.pollOptions.length > 2 && (
                        <div className="absolute right-0 flex items-center select-none">
                          <button
                            onClick={() => poll.removePollOption(option.id)}
                            className="p-1 text-ds-text-muted hover:text-ds-text-primary"
                            type="button"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              {poll.pollOptions.length < 4 && (
                <div className="pt-4 pb-2">
                  <button
                    onClick={poll.addPollOption}
                    className="w-full py-[8px] flex items-center justify-center gap-1.5 rounded-full border border-ds-border text-ds-text-primary text-[13px] hover:bg-ds-surface-1 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3.5V12.5M3.5 8H12.5" /></svg> Add option
                  </button>
                </div>
              )}
              <div className="py-[10px] border-b border-ds-border relative mt-1">
                <button
                  type="button"
                  onClick={() => setDurationOpen((open) => !open)}
                  className={`w-full flex items-center justify-between bg-transparent text-[14px] focus:outline-none appearance-none relative z-10 text-left ${!poll.pollDuration ? 'text-ds-text-muted' : 'text-ds-text-primary'}`}
                >
                  <span>{poll.pollDuration || 'Poll duration'}</span>
                  <ChevronDown className={`w-4 h-4 text-ds-text-muted pointer-events-none transition-transform duration-200 ${durationOpen ? 'rotate-180' : ''}`} />
                </button>
                {durationOpen && (
                  <div className="absolute left-0 right-0 top-full bg-ds-bg rounded-b-2xl z-[999] py-2 flex flex-col shadow-2xl border-b border-l border-r border-ds-border/30">
                    {['1 day', '3 days', '1 week', '2 weeks'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { poll.setPollDuration(d); setDurationOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-[14px] font-dmsans transition-colors cursor-pointer bg-transparent hover:bg-white/5 ${
                          poll.pollDuration === d
                            ? 'text-ds-accent font-medium'
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
          )}

          {/* Multiple Image Preview */}
          {media.uploadedImages.length > 0 && state.postType !== 'poll' && !state.sharedPost && (
            <div className="ml-11 flex flex-col gap-2" ref={dragBoundsRef}>
              <Reorder.Group
                as="div"
                axis="x"
                layoutScroll
                values={media.uploadedImages}
                onReorder={(newOrder) => media.setUploadedImages(newOrder)}
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-[8px] no-scrollbar pb-2 select-none [-webkit-touch-callout:none]"
                style={{ touchAction: 'pan-x pan-y', WebkitTouchCallout: 'none' }} // Fix: allow native horizontal scrolling
              >
                {media.uploadedImages.map((img) => (
                  <DraggableImage
                    key={img.id}
                    img={img}
                    imageToDelete={imageToDelete}
                    setImageToDelete={setImageToDelete}
                    onRemove={(id: string) => media.removeMediaItem(id, media.setUploadedImages, false)}
                    scrollContainerRef={carouselRef}
                    dragBoundsRef={dragBoundsRef}
                    isSingleImage={media.uploadedImages.length === 1}
                  />
                ))}
              </Reorder.Group>

              {/* Pagination Dots & Limit Text */}
              {media.uploadedImages.length > 1 && (
                <div className="flex justify-center mt-1">
                  <CarouselDots
                    total={media.uploadedImages.length}
                    activeIndex={activeImageIndex}
                    onDotClick={handleDotClick}
                  />
                </div>
              )}
              {media.uploadedImages.length >= 12 && (
                <p className="text-center text-[var(--ds-error)] text-[10px] mt-1 font-medium">
                  Attached media limit reached ({media.uploadedImages.length}/12)
                </p>
              )}
            </div>
          )}

          {/* Video Preview */}
          {media.uploadedVideos.length > 0 && state.postType !== 'poll' && !state.sharedPost && (
            <div className="ml-11 flex flex-col gap-2">
              <div className="relative w-full rounded-xl overflow-hidden border border-ds-border">
                <video
                  src={media.uploadedVideos[0].url}
                  controls
                  className="w-full h-auto max-h-[300px] object-contain bg-black"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    media.removeMediaItem(media.uploadedVideos[0].id, media.setUploadedVideos, false);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-30 shadow-md cursor-pointer"
                  title="Remove video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ds-border px-4 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] bg-ds-bg touch-none shrink-0">
          {/* Location placeholder */}
          {!state.sharedPost && (
            <div className="mb-3 ml-11">
              {state.selectedLocation ? (
                <span className="text-[12px] text-ds-text-muted">
                  {"formattedAddress" in state.selectedLocation ? state.selectedLocation.formattedAddress : state.selectedLocation.name} • <button onClick={() => state.setSelectedLocation(null)} className="text-ds-error font-medium hover:underline ml-1">Remove</button>
                </span>
              ) : (
                <button onClick={() => setIsSettingLocation(true)} className="text-[12px] text-[var(--ds-accent)] font-medium hover:underline">Add location</button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between ml-11">
            <div className="flex gap-4">
              {!state.sharedPost && (
                <>
                  <button
                    onClick={handleMediaClick}
                    className={`transition-colors ${
                      state.postType === 'poll' || media.uploadedVideos.length >= 1 || media.uploadedImages.length >= 12
                        ? 'text-ds-text-secondary/50 cursor-default'
                        : 'text-ds-text-secondary hover:text-ds-text-primary cursor-pointer'
                    }`}
                    title={
                      media.uploadedVideos.length >= 1
                        ? "Only one video allowed"
                        : media.uploadedImages.length >= 12
                        ? "Maximum 12 images allowed"
                        : "Add Photo or Video"
                    }
                    disabled={state.postType === 'poll'}
                  >
                    <ImageIcon className="w-5 h-5 ds-icon-20" />
                  </button>
                  {!editPostId && (
                    <button
                      onClick={() => state.setPostType(state.postType === 'poll' ? 'text' : 'poll')}
                      className={`transition-colors ${state.postType === 'poll' ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'}`}
                      title={state.postType === 'poll' ? 'Remove Poll' : 'Add Poll'}
                    >
                      <BarChart3 className="w-5 h-5 ds-icon-20" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-[12px] ml-auto">
              {editPostId ? (
                <>
                  <button
                    onClick={() => actions.handlePost()}
                    disabled={!isPostEnabled || state.isSubmitting}
                    className={cn(
                      "flex h-[36px] w-[77px] shrink-0 flex-row items-center justify-center gap-[10px] rounded-full px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] transition-all outline-none",
                      isPostEnabled && !state.isSubmitting
                        ? "bg-[var(--ds-accent)] text-[var(--ds-text-primary)] cursor-pointer hover:opacity-90 active:scale-95"
                        : "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-60"
                    )}
                  >
                    {state.isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-text-primary)]" />
                    ) : (
                      'Save'
                    )}
                  </button>
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={state.isSubmitting}
                    className="box-border flex h-[36px] w-[77px] shrink-0 flex-row items-center justify-center gap-[10px] rounded-full border px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default outline-none hover:opacity-85"
                    style={{
                      borderColor: 'var(--ds-border)',
                      color: 'var(--ds-text-primary)',
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleClose}
                    disabled={state.isSubmitting}
                    className="h-[36px] w-[77px] px-[12px] py-[6px] rounded-full border border-ds-border text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-2 active:scale-[0.98] transition-colors duration-[120ms] flex flex-row items-center justify-center gap-[10px] cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => actions.handlePost()}
                    disabled={!isPostEnabled || state.isSubmitting}
                    className={`w-[77px] h-[36px] flex items-center justify-center gap-[10px] px-[12px] py-[6px] rounded-full text-[16px] leading-[24px] font-medium font-dmsans transition-all ${state.isSubmitting
                        ? 'bg-ds-surface-1 border-none cursor-default'
                        : isPostEnabled
                          ? 'bg-[var(--ds-accent)] hover:opacity-90 text-white cursor-pointer'
                          : 'bg-ds-surface-2 text-ds-text-muted opacity-50 cursor-default'
                      }`}
                  >
                    {state.isSubmitting ? (
                      <Loader className="w-[24px] h-[24px] text-ds-text-secondary animate-spin" />
                    ) : (
                      'Post'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept={
            media.uploadedImages.length > 0
              ? "image/jpeg, image/png, image/webp, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .heic, .heif"
              : "image/jpeg, image/png, image/webp, image/heic, image/heif, .jpg, .jpeg, .png, .webp, .heic, .heif, video/mp4, video/quicktime, .mp4, .mov"
          }
          multiple
          onChange={(e) => media.handleDesktopPhotoUpload(e, false)}
          className="hidden"
        />
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          modalClassName="!z-[302]"
          overlayClassName="!z-[301]"
        />
      </BareDialogContent>
    </Dialog>
  );
};
