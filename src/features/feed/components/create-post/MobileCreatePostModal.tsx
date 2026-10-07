import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Image as ImageIcon, BarChart3, Loader2, Loader, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePostForm } from '../../hooks/use-create-post-form';
import { MentionTextarea } from '@/shared/commonComponents/MentionTextarea';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import RichTextRenderer from '../parts/RichTextRenderer';
import { CarouselDots } from '../parts/CarouselDots';
import { Icon } from '@/components/icons';
import { useUIStore } from '@/store/ui.store';

interface MobileCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSharedPost?: any;
  editPostId?: string | null;
}

export const MobileCreatePostModal = ({ isOpen, onClose, initialSharedPost, editPostId }: MobileCreatePostModalProps) => {
  const resolvedSharedPostId = initialSharedPost?.id || initialSharedPost?._id || (initialSharedPost as any)?.post_id;

  const { state, media, poll, actions } = useCreatePostForm({
    isOpen,
    onClose,
    isMobile: true,
    initialSharedPost,
    sharedPostId: resolvedSharedPostId,
    editPostId: editPostId || undefined
  });

  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeImageIndex >= media.uploadedImages.length) {
      setActiveImageIndex(Math.max(0, media.uploadedImages.length - 1));
    }
  }, [media.uploadedImages.length, activeImageIndex]);

  const handleCarouselScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container || media.uploadedImages.length <= 1) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    if (scrollLeft <= 4) {
      setActiveImageIndex(0);
      return;
    }
    if (scrollLeft >= scrollWidth - clientWidth - 4) {
      setActiveImageIndex(media.uploadedImages.length - 1);
      return;
    }

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const containerCenter = scrollLeft + clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveImageIndex(closestIndex);
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
        className="fixed inset-0 z-[101] bg-ds-bg max-w-none rounded-none flex flex-col pt-0 pb-0 !top-0 !left-0 !translate-x-0 !translate-y-0 ds-animate-sheet-up data-[state=closed]:slide-out-to-bottom-[100%] data-[state=open]:slide-in-from-bottom-[100%] duration-300"
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
        <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)]">
          <DialogTitle className="ds-text-body-2 text-ds-text-primary font-semibold">{editPostId ? 'Edit post' : 'Create post'}</DialogTitle>
          <button onClick={handleClose} className="p-2 -mr-2 text-ds-text-secondary hover:text-ds-text-primary transition-colors">
            <X className="w-5 h-5 ds-icon-20" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-4 no-scrollbar">
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
            <div className="ml-11 -mt-2 flex flex-col pb-2 animate-in fade-in duration-200">
              <input
                type="text"
                value={poll.pollQuestion}
                onChange={(e) => poll.setPollQuestion(e.target.value)}
                placeholder="Ask your network..."
                className="w-full bg-transparent border-b border-ds-border py-[10px] text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none"
              />
              {poll.pollOptions.map((option, index) => (
                <div key={option.id} className="relative flex items-center border-b border-ds-border">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => poll.updatePollOption(option.id, e.target.value)}
                    placeholder={`Option ${['A', 'B', 'C', 'D', 'E', 'F'][index] || index + 1}`}
                    className="w-full bg-transparent py-[10px] pr-8 text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none"
                  />
                  {poll.pollOptions.length > 2 && (
                    <button
                      onClick={() => poll.removePollOption(option.id)}
                      className="absolute right-0 p-1 text-ds-text-muted hover:text-ds-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
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
            <div className="ml-11 flex flex-col gap-2">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar pb-2"
              >
                {media.uploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-[80vw] sm:w-[300px] flex-shrink-0 snap-center rounded-xl overflow-hidden border border-ds-border"
                    onClick={() => setImageToDelete(imageToDelete === img.id ? null : img.id)}
                  >
                    <img
                      src={img.url}
                      alt="Upload preview"
                      className="w-full h-auto max-h-[300px] object-cover"
                    />

                    {/* Delete Overlay */}
                    {imageToDelete === img.id && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            media.removeMediaItem(img.id, media.setUploadedImages, false);
                            setImageToDelete(null);
                          }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center text-white mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </div>
                          <span className="text-[var(--ds-error)] text-sm font-medium">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

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
              <div
                className="relative w-full rounded-xl overflow-hidden border border-ds-border"
                onClick={() => setImageToDelete(imageToDelete === media.uploadedVideos[0].id ? null : media.uploadedVideos[0].id)}
              >
                <video
                  src={media.uploadedVideos[0].url}
                  controls
                  className="w-full h-auto max-h-[300px] object-contain bg-black"
                />

                {/* Delete Overlay */}
                {imageToDelete === media.uploadedVideos[0].id && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        media.removeMediaItem(media.uploadedVideos[0].id, media.setUploadedVideos, false);
                        setImageToDelete(null);
                      }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center text-white mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </div>
                      <span className="text-[var(--ds-error)] text-sm font-medium">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ds-border px-4 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] bg-ds-bg">
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
                  <button
                    onClick={() => state.setPostType(state.postType === 'poll' ? 'text' : 'poll')}
                    className={`transition-colors ${state.postType === 'poll' ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'}`}
                    title={state.postType === 'poll' ? 'Remove Poll' : 'Add Poll'}
                  >
                    <BarChart3 className="w-5 h-5 ds-icon-20" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-[12px] ml-auto">
              <button
                onClick={handleClose}
                disabled={state.isSubmitting}
                className="h-[36px] w-[77px] px-[12px] py-[6px] rounded-full border border-ds-border text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-2 active:scale-[0.98] transition-colors duration-[120ms] flex flex-row items-center justify-center gap-[10px] cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              >
                Cancel
              </button>
              {/* Bug Fix: Post button upload loading state matches Figma design (w-77px, h-36px, ds-surface-1, 24x24 ds-text-secondary loader) */}
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
                  editPostId ? 'Save' : 'Post'
                )}
              </button>
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
      </BareDialogContent>
    </Dialog>
  );
};
