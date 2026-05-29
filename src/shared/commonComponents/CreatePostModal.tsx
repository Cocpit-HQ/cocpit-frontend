import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronDown, Check, Sparkles, Smile, Loader2, Plus, Square, RectangleHorizontal, RectangleVertical, ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import Cropper from 'react-easy-crop';
import { CategoryType, CreatePostModalProps, PostType } from '@/features/create-post/types';
import { useCreatePostForm } from '@/features/create-post/hooks/use-create-post-form';

// Post Flows
import VideoFlow from '@/features/create-post/components/flows/VideoFlow';
import PollFlow from '@/features/create-post/components/flows/PollFlow';
import ArticleFlow from '@/features/create-post/components/flows/ArticleFlow';
import SharedPreview from '@/features/create-post/components/SharedPreview';
import { ImageEditorToolbar } from '@/shared/commonComponents/image-editor/ImageEditorToolbar';
import { DiscardConfirmOverlay } from '@/features/create-post/components/shared/DiscardConfirmOverlay';
import AchievementOptionPicker, {
  type AchievementOptionId,
  getAchievementOptionById,
} from '@/features/create-post/components/shared/AchievementOptionPicker';
import { CustomVideoPlayer } from '@/components/ui/CustomVideoPlayer';
import { useUIStore } from '@/store/ui.store';
import { UserMention } from '@/services/api/users';
import { TagPeopleSelector } from '@/shared/commonComponents/TagPeopleSelector';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';
import { sanitizeContent } from '@/lib/contentSanitizer';

export interface CreatePostCommonProps extends CreatePostModalProps {
  currentUser?: {
    name: string;
    avatar?: string;
    image?: string;
    username?: string;
  };
  onPost?: (postData: { payload: any; filesToUpload: any[] }) => void | Promise<void>;
  initialType?: PostType;
}

export const CreatePostModal = (props: CreatePostCommonProps) => {
  const { isOpen, onClose } = props;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const { state, media, poll, actions } = useCreatePostForm({
    ...props,
    initialPostType: props.initialType || props.initialPostType,
    isMobile
  });

  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [photoStep, setPhotoStep] = useState<'edit' | 'caption'>('edit');
  const [videoStep, setVideoStep] = useState<'edit' | 'caption'>('edit');
  const [pollStep, setPollStep] = useState<'edit' | 'preview'>('edit');
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showAchievementOptionPicker, setShowAchievementOptionPicker] = useState(false);
  const [selectedAchievementOptionId, setSelectedAchievementOptionId] = useState<AchievementOptionId | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Tag People State
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);
  const [taggedUsers, setTaggedUsers] = useState<UserMention[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState<EmojiPickerPosition | null>(null);
  const activeEmojiTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const isEdit = !!props.editPostId;

  useEffect(() => {
    if (isOpen) {
      setIsCreatePostOpen(true);
    }
  }, [isOpen]);

  // Handle generic user / session overrides from props
  const activeUser = (props.currentUser || state.currentUser) as any;

  const currentPosterName = (state.currentPoster as any)?.name || activeUser?.name || 'User';
  const currentPosterHandle = (state.currentPoster as any)?.username || activeUser?.username || currentPosterName.toLowerCase().replace(/\s+/g, '');
  const currentPosterLogo = state.isCompanyPost
    ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url || '/assets/pngegg.png')
    : (activeUser?.image || activeUser?.avatar || '/assets/pngegg.png');

  const mediaActions = [
    { icon: 'stash:image', label: 'Image', type: 'photo' },
    { icon: 'fluent:poll-16-regular', label: 'Poll', type: 'poll' },
    { icon: 'solar:document-add-linear', label: 'Article', type: 'article' },
    { icon: 'iconoir:trophy', label: 'Milestone', type: 'milestone' },
  ];

  const hasImages = media.uploadedImages.length > 0;
  const hasVideos = media.uploadedVideos.length > 0;
  const activeImage = media.uploadedImages[media.activeImageIndex];
  const milestoneCategory: CategoryType = !state.isCompanyPost
    ? 'Achievement'
    : (state.currentPoster as any)?.entity_type === 'INSTITUTION'
      ? 'Academic'
      : 'Milestone';
  const selectedAchievementOption = getAchievementOptionById(selectedAchievementOptionId);
  const isMilestoneComposerActive = state.postType === 'text' && state.postCategory === milestoneCategory;
  const composerPlaceholder = isMilestoneComposerActive
    ? selectedAchievementOption?.placeholder || (
      milestoneCategory === 'Academic'
        ? 'Share your academic milestone...'
        : `Share your ${milestoneCategory.toLowerCase()}...`
    )
    : 'What would you like to share today?';

  const isPostButtonDisabled = (() => {
    if (state.isSubmitting) return true;
    switch (state.postType) {
      case 'photo':
        return !state.description.trim() && !hasImages;
      case 'video':
        return !state.description.trim() && !hasVideos;
      case 'poll':
        return !poll.isPollValid();
      case 'article':
        return !state.articleTitle.trim() || !state.articleContent.trim();
      case 'text':
      default:
        return !state.description.trim();
    }
  })();

  const hasUnsavedChanges = () => {
    return (
      state.description.trim().length > 0 ||
      media.uploadedImages.length > 0 ||
      media.uploadedVideos.length > 0 ||
      poll.pollQuestion.trim().length > 0 ||
      state.articleTitle.trim().length > 0 ||
      state.articleContent.trim().length > 0 ||
      !!state.selectedLocation
    );
  };

  const handleRequestClose = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      actions.resetForm();
      onClose();
    }
  };

  // Sync textarea height to auto-grow based on content
  useEffect(() => {
    if (composerTextareaRef.current) {
      composerTextareaRef.current.style.height = 'auto';
      composerTextareaRef.current.style.height = `${composerTextareaRef.current.scrollHeight}px`;
    }
  }, [state.description, state.postType]);

  // Sync state & reset step on close or postType change
  useEffect(() => {
    if (!isOpen) {
      setPhotoStep('edit');
      setVideoStep('edit');
      setPollStep('edit');
      setShowDiscardConfirm(false);
      setShowAchievementOptionPicker(false);
      setSelectedAchievementOptionId(null);
      setShowTagSelector(false);
      setShowLocationSelector(false);
      setTaggedUsers([]);
      setShowEmojiPicker(false);
      setEmojiPickerPos(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.postType !== 'photo' || media.uploadedImages.length === 0) {
      setPhotoStep('edit');
    }
  }, [state.postType, media.uploadedImages.length]);

  useEffect(() => {
    if (state.postType !== 'video' || media.uploadedVideos.length === 0) {
      setVideoStep('edit');
    }
  }, [state.postType, media.uploadedVideos.length]);

  useEffect(() => {
    if (state.postType !== 'poll') {
      setPollStep('edit');
    }
  }, [state.postType]);

  useEffect(() => {
    if (state.postType === 'text' && state.postCategory === milestoneCategory) return;

    setShowAchievementOptionPicker(false);
    setSelectedAchievementOptionId(null);
  }, [state.postCategory, state.postType, milestoneCategory]);

  useEffect(() => {
    if (!isOpen || !isMilestoneComposerActive) return;

    const focusFrame = requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
    });

    return () => cancelAnimationFrame(focusFrame);
  }, [isOpen, isMilestoneComposerActive]);

  const isImageEditorMode = state.postType === 'photo' && hasImages && photoStep === 'edit';
  const isVideoEditorMode = state.postType === 'video' && hasVideos && videoStep === 'edit';

  const handleEmojiButtonClick = (e: React.MouseEvent<HTMLButtonElement>, textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
    e.stopPropagation();
    e.preventDefault();

    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      setEmojiPickerPos(null);
      return;
    }

    activeEmojiTextareaRef.current = textareaRef.current;
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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInsidePicker = emojiPickerRef.current?.contains(target) || target.closest('.cocpit-emoji-picker') || target.closest('.cocpit-emoji-picker-backdrop');
      const isInsideButton = emojiButtonRef.current?.contains(target) || target.closest('[title="Add emoji"]');

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

  const handleEmojiSelect = (emoji: string) => {
    const textarea = activeEmojiTextareaRef.current;

    if (!textarea) {
      state.setDescription(`${state.description}${emoji}`);
    } else {
      const start = textarea.selectionStart ?? state.description.length;
      const end = textarea.selectionEnd ?? state.description.length;
      const nextDescription = `${state.description.slice(0, start)}${emoji}${state.description.slice(end)}`;
      state.setDescription(nextDescription);

      requestAnimationFrame(() => {
        textarea.focus();
        const nextCursor = start + emoji.length;
        textarea.selectionStart = textarea.selectionEnd = nextCursor;
      });
    }
  };

  if (!isOpen) return null;

  const handleAchievementOptionSelect = (optionId: AchievementOptionId) => {
    setSelectedAchievementOptionId(optionId);
    setShowAchievementOptionPicker(false);
    state.setPostType('text');
    state.handleSetPostCategory(milestoneCategory);

    requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
    });
  };

  const handlePostClick = async () => {
    if (props.onPost) {
      const safeCategory = state.postCategory;
      let finalContent = "";
      if (state.postType === 'article') {
        finalContent = `${state.description.trim()}<!-- article_divider -->${state.articleContent}`;
      } else {
        finalContent = sanitizeContent(state.postType === 'poll' ? poll.pollQuestion : state.description);
      }

      const payload = {
        title: state.postType === 'article' ? state.articleTitle.trim() : '',
        content: finalContent,
        category: safeCategory,
        visibility: state.visibility,
        post_type: state.postType === 'photo' ? 'image' : (state.postType === 'article' ? 'article' : state.postType),
        companyId: state.isCompanyPost ? state.postAsCompanyId || undefined : undefined,
        shared_post_id: props.sharedPostId,
        shared_job_id: props.sharedJobId,
        location: state.selectedLocation ? ("formattedAddress" in state.selectedLocation ? state.selectedLocation.formattedAddress : state.selectedLocation.name) : null,
        poll_options: state.postType === 'poll' ? poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text)) : undefined,
        poll_duration: state.postType === 'poll' ? poll.pollDuration : undefined
      };

      try {
        const filesToUpload = await media.prepareFilesToUpload(state.postType, media.aspectRatio);
        await props.onPost({ payload, filesToUpload });
        if (props.onPostCreated) props.onPostCreated();
        actions.resetForm();
        onClose();
      } catch (err) {
        console.error("Custom posting callback failed", err);
      }
    } else {
      await actions.handlePost();
    }
  };

  const renderMediaIcons = () => (
    <div className="flex flex-row items-center gap-2 w-full">
      {mediaActions.map((action, i) => {
        const isMilestoneAction = action.type === 'milestone';
        const isActive = isMilestoneAction
          ? state.postType === 'text' && state.postCategory === milestoneCategory
          : state.postType === action.type;

        return (
          <button
            key={i}
            onClick={() => {
              if (action.type === 'article') {
                const { setArticleMode } = useUIStore.getState();
                onClose();
                setArticleMode(true);
              } else if (action.type === 'milestone') {
                setShowAccountSelector(false);
                setShowAchievementOptionPicker(true);
              } else {
                state.setPostType(action.type as any);
                if (action.type === 'photo' && !hasImages) {
                  setTimeout(() => galleryInputRef.current?.click(), 0);
                }
              }
            }}
            className="w-[56px] h-[32px] rounded-full flex justify-center items-center bg-transparent transition-all duration-200"
            title={action.label}
          >
            <Icon
              icon={action.icon}
              className="w-6 h-6 text-black dark:text-white"
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen && isCreatePostOpen} onOpenChange={(open) => { if (!open) handleRequestClose(); }}>
        <DialogContent
          className={`w-full p-0 border-none rounded-[24px] sm:rounded-[24px] bg-white dark:bg-[#1a1a2e] shadow-2xl overflow-hidden font-poppins flex flex-col z-[101] ${state.postType === 'article'
            ? 'max-w-[1050px] h-[90vh]'
            : (isImageEditorMode || isVideoEditorMode)
              ? 'max-w-[700px]'
              : 'max-w-[600px] h-[552px] max-h-[90vh]'
            } ${(state.postType === 'poll' || showAchievementOptionPicker) ? '[&>button:last-child]:hidden' : ''}`}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (
              target &&
              (target.closest('.cocpit-emoji-picker') ||
                target.closest('.cocpit-emoji-picker-backdrop'))
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">{(isImageEditorMode || isVideoEditorMode) ? 'Edit Media' : 'Create Post'}</DialogTitle>

          {/* ═══════════════════════════════════════════
            IMAGE / VIDEO EDITOR MODE
            ═══════════════════════════════════════════ */}
          {(isImageEditorMode || isVideoEditorMode) ? (
            <div className="flex flex-col items-center p-4 w-full pt-8">
              {/* Content */}
              <div className="flex flex-col items-center gap-4 w-full max-w-[570px]">
                {/* Toolbar Row: + | flip/rotate/delete | counter */}
                <div className="flex flex-row justify-between items-center w-full">
                  {/* Add More */}
                  {!isVideoEditorMode ? (
                    <button
                      onClick={() => addMoreInputRef.current?.click()}
                      className="w-6 h-6 flex items-center justify-center text-black dark:text-white hover:opacity-70 transition-opacity"
                      title="Add more images"
                    >
                      <Plus className="w-6 h-6" strokeWidth={1.5} />
                    </button>
                  ) : (
                    <div className="w-6 h-6" />
                  )}

                  {/* Flip / Rotate / Delete */}
                  <ImageEditorToolbar
                    flipH={isVideoEditorMode ? (media.uploadedVideos[0]?.flipH || false) : (activeImage?.flipH || false)}
                    flipV={isVideoEditorMode ? (media.uploadedVideos[0]?.flipV || false) : (activeImage?.flipV || false)}
                    onToggleFlipH={media.handleFlipHChange}
                    onToggleFlipV={media.handleFlipVChange}
                    onRotate={media.handleRotateChange}
                    onDelete={() => {
                      if (isVideoEditorMode) {
                        media.removeMediaItem(media.uploadedVideos[0].id, media.setUploadedVideos, isEdit);
                      } else {
                        media.removeMediaItem(activeImage.id, media.setUploadedImages, isEdit);
                      }
                    }}
                    deleteIconRed={true}
                    className="mb-0 gap-2"
                  />

                  {/* Counter */}
                  <span className="text-[16px] leading-[24px] font-normal text-black dark:text-white font-poppins text-center min-w-[38px]">
                    {isVideoEditorMode
                      ? "01/01"
                      : `${String(media.activeImageIndex + 1).padStart(2, '0')}/${String(media.uploadedImages.length).padStart(2, '0')}`
                    }
                  </span>
                </div>

                {/* Image / Video Preview */}
                <div className="w-full h-[400px] bg-white dark:bg-[#1a1a2e] border border-[#EEF2FF] dark:border-[#2a2a4a] shadow-[0px_2px_4px_rgba(99,102,241,0.05)] rounded-[24px] overflow-hidden flex items-center justify-center">
                  {isVideoEditorMode && media.uploadedVideos[0] ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <CustomVideoPlayer
                        src={media.uploadedVideos[0].url}
                        className="transition-transform duration-200"
                        style={{
                          transform: `scaleX(${media.uploadedVideos[0].flipH ? -1 : 1}) scaleY(${media.uploadedVideos[0].flipV ? -1 : 1}) rotate(${media.uploadedVideos[0].rotation || 0}deg)`
                        }}
                      />
                    </div>
                  ) : activeImage ? (
                    <div
                      className="relative w-full h-full transition-transform duration-200"
                      style={{
                        transform: `scaleX(${activeImage.flipH ? -1 : 1}) scaleY(${activeImage.flipV ? -1 : 1})`
                      }}
                    >
                      {isEdit ? (
                        <img src={activeImage.url} className="w-full h-full object-contain" alt="Post media" />
                      ) : (
                        <Cropper
                          image={activeImage.url}
                          crop={activeImage.crop || { x: 0, y: 0 }}
                          zoom={activeImage.zoom || 1}
                          rotation={activeImage.rotation || 0}
                          aspect={media.aspectRatio}
                          onCropChange={media.handleCropChange}
                          onZoomChange={media.handleZoomChange}
                          onCropComplete={media.handleCropComplete}
                          showGrid={true}
                          objectFit="contain"
                          style={{
                            containerStyle: { background: '#fff', borderRadius: '24px' },
                            cropAreaStyle: { border: '2px solid rgba(99,102,241,0.3)', borderRadius: '8px' },
                          }}
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Thumbnails when multiple */}
                {!isVideoEditorMode && media.uploadedImages.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto py-2 w-full justify-center custom-scrollbar">
                    {media.uploadedImages.map((img, idx) => {
                      const isActive = idx === media.activeImageIndex;
                      return (
                        <div key={img.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => media.setActiveImageIndex(idx)}
                            className={`relative w-[68px] h-[48px] rounded-[10px] overflow-hidden border-[2px] transition-all duration-200 shadow-sm ${isActive
                              ? 'border-[#6366F1] scale-[0.98]'
                              : 'border-transparent opacity-75 hover:opacity-100'
                              }`}
                            type="button"
                          >
                            <img src={img.url} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                          </button>
                          <span className={`text-[10px] leading-[14px] font-poppins transition-colors duration-200 ${isActive
                            ? 'text-black dark:text-white font-semibold'
                            : 'text-[#9CA3AF] dark:text-[#6B7280] font-normal'
                            }`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zoom Slider */}
                {!isEdit && !isVideoEditorMode && (
                  <div className="flex flex-col items-start w-[300px]">
                    <span className="text-[12px] leading-[16px] font-normal text-black dark:text-white font-poppins">
                      Zoom
                    </span>
                    <div className="relative flex flex-row items-center w-[300px] h-8 gap-0">
                      <div
                        className="h-2 rounded-l-[16px] rounded-r-[2px] bg-[#6366F1]"
                        style={{ width: `${((activeImage?.zoom || 1) - 1) / 2 * 100}%`, minWidth: '4px' }}
                      />
                      <div className="w-[2px] h-8 bg-[#6366F1] rounded-[2px] flex-shrink-0" />
                      <div className="h-2 rounded-l-[2px] rounded-r-[16px] bg-[#E0E7FF] dark:bg-[#2a2a4a] flex-1 relative">
                        <div className="absolute w-1 h-1 rounded-full bg-[#6366F1] right-1 top-1/2 -translate-y-1/2" />
                      </div>
                      <input
                        type="range"
                        value={activeImage?.zoom || 1}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => media.handleZoomChange(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Aspect Ratio Selector */}
                {!isEdit && !isVideoEditorMode && (
                  <div className="flex flex-row items-center gap-3 w-[300px]">
                    <span className="text-[12px] leading-[16px] font-normal text-black dark:text-white font-poppins">
                      Ratio
                    </span>
                    <div className="flex gap-1 bg-[#EEF2FF] dark:bg-[#2a2a4a] p-1 rounded-[12px]">
                      {[
                        { value: 1 / 1, label: '1:1', Icon: Square },
                        { value: 4 / 5, label: '4:5', Icon: RectangleVertical },
                        { value: 16 / 9, label: '16:9', Icon: RectangleHorizontal },
                      ].map((ratio) => {
                        const isActive = media.aspectRatio === ratio.value;
                        return (
                          <button
                            key={ratio.label}
                            type="button"
                            onClick={() => media.setAspectRatio(ratio.value)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[12px] font-medium font-poppins transition-all duration-200 ${isActive
                              ? 'bg-white dark:bg-[#1a1a2e] text-[#6366F1] shadow-sm'
                              : 'text-[#6B7280] hover:text-black dark:hover:text-white'
                              }`}
                            title={ratio.label}
                          >
                            <ratio.Icon className="w-3.5 h-3.5" />
                            <span>{ratio.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Back / Next */}
                <div className="flex flex-row items-start gap-4 w-[300px]">
                  <button
                    onClick={() => {
                      media.clearMedia();
                      state.setPostType('text');
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 h-10 bg-white dark:bg-transparent border border-[#818CF8] rounded-[24px] hover:bg-[#818CF8]/10 transition-all duration-200"
                  >
                    <span className="text-[14px] leading-[20px] font-normal text-[#818CF8] font-poppins text-center">
                      Back
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      setIsGeneratingPreviews(true);
                      try {
                        if (isVideoEditorMode) {
                          await media.generatePreviewBlobs('video');
                          setVideoStep('caption');
                        } else {
                          await media.generatePreviewBlobs('photo');
                          setPreviewActiveIndex(0);
                          setPhotoStep('caption');
                        }
                      } catch (e) {
                        console.error("Preview generation failed", e);
                      } finally {
                        setIsGeneratingPreviews(false);
                      }
                    }}
                    disabled={isGeneratingPreviews}
                    className="flex-grow flex-1 flex items-center justify-center px-4 py-2 h-10 bg-[#6366F1] border border-white/60 rounded-[24px] hover:bg-[#6366F1]/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {isGeneratingPreviews ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="text-[14px] leading-[20px] font-normal text-white font-poppins text-center">
                        Next
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden add-more input */}
              <input
                ref={addMoreInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => isMobile ? media.handlePhotoUpload(e, isEdit) : media.handleDesktopPhotoUpload(e, isEdit)}
                className="hidden"
              />
            </div>
          ) : (
            /* ═══════════════════════════════════════════
               NORMAL CREATE POST MODE
               ═══════════════════════════════════════════ */
            <>
              <div className={`w-full flex flex-col flex-1 min-h-0 ${state.postType === 'article' ? 'p-0' : 'items-center p-4'}`}>
                {/* Header — FIXED */}
                {state.postType !== 'article' && (
                  state.postType === 'poll' && pollStep === 'edit' ? (
                    <div className="relative w-full flex flex-col items-center">
                      <h2 className="font-bold text-[19.5px] leading-[28px] text-black dark:text-white tracking-tight text-center font-poppins">Create a poll</h2>
                      <p className="font-normal text-[12.5px] leading-[17px] text-[#6B7280] dark:text-[#9CA3AF] text-center mt-1 font-poppins">
                        Let people vote on your question
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestClose}
                        className="absolute top-0 right-1 p-1 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center gap-1.5 w-full">
                      <h2 className="font-semibold text-[19px] leading-[28px] text-black dark:text-white tracking-tight text-center">Create</h2>
                      <p className="font-normal text-[12.5px] leading-[17px] text-[#6B7280] dark:text-[#9CA3AF] text-center">
                        Post jobs, insights, or milestones to grow your presence.
                      </p>
                      {state.postType === 'poll' && (
                        <button
                          type="button"
                          onClick={handleRequestClose}
                          className="absolute top-0 right-1 p-1 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Profile — FIXED */}
                {state.postType !== 'article' && (
                  <div className="relative flex flex-row items-center justify-start gap-3.5 w-full mt-5 z-[60]">
                    <div className="flex flex-row items-center justify-start gap-3.5 text-left font-poppins">
                      <img
                        src={currentPosterLogo}
                        alt="avatar"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-[#2a2a4a] shadow-sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[17px] leading-[24px] text-black dark:text-white">{currentPosterName}</span>
                        <span className="font-normal text-[12px] leading-[16px] text-[#9CA3AF]">@{currentPosterHandle}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Action Icons — FIXED */}
                {state.postType !== 'article' && !(state.postType === 'photo' && hasImages) && !(state.postType === 'video' && hasVideos) && state.postType !== 'poll' && (
                  <div className="mt-4 w-full">
                    {renderMediaIcons()}
                  </div>
                )}

                {/* Scrollable content area — overflow-y: auto */}
                <div className={`flex flex-col w-full flex-1 min-h-0 ${state.postType === 'article' ? '' : 'mt-3 overflow-y-auto custom-scrollbar'}`}>
                  {state.postType !== 'article' ? (
                    <div className="relative flex flex-col gap-4 w-full">
                      {isMilestoneComposerActive && (
                        <div className="flex">
                          <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1 text-[12px] font-medium text-[#6366F1]">
                            {selectedAchievementOption?.label || milestoneCategory}
                          </span>
                        </div>
                      )}

                      {/* Media preview and controls wrapper */}
                      {((state.postType === 'photo' && hasImages) || (state.postType === 'video' && hasVideos)) && (
                        <div className="flex flex-col gap-2 w-full items-center">
                          {/* Photo preview attachment */}
                          {state.postType === 'photo' && hasImages && (
                            <div className="relative w-full bg-slate-50 dark:bg-[#1a1a2e] border border-gray-100 dark:border-[#2a2a4a] rounded-[24px] overflow-hidden flex flex-col items-center justify-center shadow-sm">
                              <div className="w-full flex items-center justify-center p-3">
                                <img
                                  src={media.previewMediaUrls[previewActiveIndex] || media.uploadedImages[previewActiveIndex]?.url}
                                  className="w-full max-h-[260px] object-contain rounded-lg"
                                  alt="Cropped post media"
                                />
                              </div>
                            </div>
                          )}

                          {/* Video preview attachment */}
                          {state.postType === 'video' && hasVideos && (
                            <div className="relative w-full h-[232px] bg-slate-50 dark:bg-[#1a1a2e] border border-gray-100 dark:border-[#2a2a4a] rounded-[24px] overflow-hidden flex flex-col items-center justify-center shadow-sm">
                              <div className="w-full flex-1 flex items-center justify-center p-3">
                                <div className="w-full h-full rounded-lg overflow-hidden bg-black">
                                  <CustomVideoPlayer
                                    src={media.previewMediaUrls[0] || media.uploadedVideos[0]?.url}
                                    hideControls={true}
                                    style={{
                                      transform: `scaleX(${media.uploadedVideos[0]?.flipH ? -1 : 1}) scaleY(${media.uploadedVideos[0]?.flipV ? -1 : 1}) rotate(${media.uploadedVideos[0]?.rotation || 0}deg)`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Controls row */}
                          <div className="flex items-center justify-between w-full px-1">
                            {/* Left: counter pill */}
                            {state.postType === 'photo' && hasImages ? (
                              <div className="flex items-center gap-3.5 bg-white dark:bg-[#1a1a2e] px-4 py-1.5 rounded-full shadow-[0px_4px_12px_rgba(99,102,241,0.08)] border border-indigo-50/50 dark:border-[#2a2a4a]/50">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === 0 ? media.uploadedImages.length - 1 : prev - 1)); }}
                                  className={`p-0.5 text-[#6366F1] dark:text-indigo-400 hover:opacity-70 transition-opacity ${media.uploadedImages.length <= 1 ? 'opacity-30 pointer-events-none' : ''}`}
                                  title="Previous image"
                                >
                                  <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                                <span className="text-[13px] font-semibold text-black dark:text-white min-w-[18px] text-center font-poppins">
                                  {String(previewActiveIndex + 1).padStart(2, '0')}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === media.uploadedImages.length - 1 ? 0 : prev + 1)); }}
                                  className={`p-0.5 text-[#6366F1] dark:text-indigo-400 hover:opacity-70 transition-opacity ${media.uploadedImages.length <= 1 ? 'opacity-30 pointer-events-none' : ''}`}
                                  title="Next image"
                                >
                                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <div />
                            )}
                            {/* Right: edit + delete */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => state.postType === 'video' ? setVideoStep('edit') : setPhotoStep('edit')}
                                className="p-1.5 text-gray-500 hover:text-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#2a2a4a] rounded-full transition-colors"
                                title="Edit media"
                              >
                                <Icon icon="proicons:pencil" className="w-[24px] h-[24px] text-black dark:text-white" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                              </button>
                              <button
                                type="button"
                                onClick={() => media.clearMedia()}
                                className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                                title="Remove media"
                              >
                                <Icon icon="hugeicons:delete-02" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Unified Content Textarea (Part of scroll unit) */}
                      <div className="flex flex-col w-full">
                        <textarea
                          ref={composerTextareaRef}
                          className="w-full resize-none outline-none font-normal text-[15px] leading-[23px] text-black dark:text-white placeholder:text-[#6B7280] bg-transparent font-poppins whitespace-pre-wrap"
                          placeholder={composerPlaceholder}
                          value={state.description}
                          onChange={(e) => state.setDescription(e.target.value)}
                          style={{ overflow: 'hidden', resize: 'none', height: 'auto', minHeight: '80px' }}
                        />
                      </div>

                      {/* Poll Flow Options (Step === edit) */}
                      {state.postType === 'poll' && pollStep === 'edit' && (
                        <PollFlow
                          pollQuestion={poll.pollQuestion}
                          onQuestionChange={poll.setPollQuestion}
                          pollOptions={poll.pollOptions}
                          onAddOption={poll.addPollOption}
                          onRemoveOption={poll.removePollOption}
                          onUpdateOption={poll.updatePollOption}
                          pollDuration={poll.pollDuration}
                          onDurationChange={poll.setPollDuration}
                          isEdit={isEdit}
                          isMobile={isMobile}
                        />
                      )}

                      {/* Poll Preview Card (Step === preview) */}
                      {state.postType === 'poll' && pollStep === 'preview' && (
                        <div className="flex flex-col w-full gap-4">
                          {/* Poll Preview Card */}
                          <div className="w-full border border-gray-100 dark:border-[#2a2a4a] bg-[#F8FAFC]/50 dark:bg-[#1e1e38]/50 rounded-[24px] p-5 space-y-3.5 shadow-sm">
                            <h3 className="font-bold text-[15.5px] leading-[22px] text-[#1F2937] dark:text-white text-left font-poppins">
                              {poll.pollQuestion}
                            </h3>
                            <div className="space-y-2">
                              {poll.pollOptions
                                .filter((option) => option.text.trim() !== '')
                                .map((option) => (
                                  <div
                                    key={option.id}
                                    className="w-full h-11 flex items-center justify-start px-5 bg-[#EEF2FF] dark:bg-indigo-500/10 text-gray-800 dark:text-white text-[13.5px] font-medium rounded-full font-poppins select-none"
                                  >
                                    {option.text}
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-end text-[11.5px] font-semibold text-[#6366F1] dark:text-indigo-400 font-poppins w-full pt-1">
                              <span>0 votes • {poll.pollDuration} left • View result</span>
                            </div>
                          </div>

                          {/* Card Controls */}
                          <div className="flex justify-end gap-3 w-full">
                            <button
                              type="button"
                              onClick={() => setPollStep('edit')}
                              className="p-1.5 text-gray-500 hover:text-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#2a2a4a] rounded-full transition-colors"
                              title="Edit poll"
                            >
                              <Pencil className="w-5 h-5 stroke-[1.8]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                poll.clearPoll();
                                state.setPostType('text');
                              }}
                              className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                              title="Delete poll"
                            >
                              <Trash2 className="w-5 h-5 stroke-[1.8]" />
                            </button>
                          </div>
                        </div>
                      )}

                      <SharedPreview sharedPost={state.sharedPost} isMobile={isMobile} />
                    </div>
                  ) : (
                    <ArticleFlow
                      title={state.articleTitle}
                      onTitleChange={state.setArticleTitle}
                      content={state.articleContent}
                      onContentChange={state.setArticleContent}
                      coverImage={media.uploadedImages[0] || null}
                      onCoverUpload={(e) => media.handlePhotoUpload(e, isEdit)}
                      onRemoveCover={() => media.clearMedia()}
                      isEdit={isEdit}
                      coverInputRef={articleCoverInputRef}
                      caption={state.description}
                      onCaptionChange={state.setDescription}
                      onPost={handlePostClick}
                      isSubmitting={state.isSubmitting}
                      onClose={onClose}
                      currentUser={activeUser}
                      currentPoster={state.currentPoster}
                      isCompanyPost={state.isCompanyPost}
                    />
                  )}
                </div>

                {/* Footer — FIXED */}
                {state.postType !== 'article' && (
                  state.postType === 'poll' && pollStep === 'edit' ? (
                    <div className="flex flex-row justify-end items-center gap-3.5 w-full mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          poll.clearPoll();
                          state.setPostType('text');
                        }}
                        className="flex flex-row items-center justify-center px-6 py-2 border border-[#818CF8] rounded-full bg-white dark:bg-transparent text-[#818CF8] hover:bg-[#818CF8]/10 transition-all duration-200 font-poppins text-[13.5px] font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setPollStep('preview')}
                        disabled={!poll.isPollValid()}
                        className="flex flex-row items-center justify-center gap-2 px-6 py-2 disabled:bg-[#C7D2FE] bg-[#818CF8] hover:bg-[#6366F1] border border-white/60 rounded-full text-white disabled:opacity-50 transition-all duration-200 shadow-sm font-poppins text-[13.5px] font-medium"
                      >
                        <span>Next</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full mt-auto pt-5">
                      {/* Tag, Location, Smile icons row */}
                      <div className="flex items-center gap-3 px-1">
                        <button className="relative transition-colors" title="Tag people" onClick={() => { setIsCreatePostOpen(false); setShowTagSelector(true); }}>
                          <Icon icon="la:user-tag" className="w-6 h-6 text-black dark:text-white" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                        </button>
                        <button className="relative transition-colors" title="Location" onClick={() => { setIsCreatePostOpen(false); setShowLocationSelector(true); }}>
                          <Icon icon="hugeicons:location-05" className="w-6 h-6 text-black dark:text-white" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                          {state.selectedLocation && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
                        </button>
                        <button
                          ref={emojiButtonRef}
                          type="button"
                          className="transition-colors"
                          title="Add emoji"
                          onClick={(e) => handleEmojiButtonClick(e, composerTextareaRef)}
                        >
                          <Icon icon="lucide:smile" className="w-6 h-6 text-black dark:text-white" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                        </button>
                      </div>

                      <div className="flex flex-row justify-between items-center w-full">
                        <button className="flex flex-row items-center justify-center gap-2 px-5 py-2.5 border border-[#818CF8] rounded-full bg-white dark:bg-transparent hover:bg-[#818CF8]/10 dark:hover:bg-[#818CF8]/10 transition-all duration-200 group">
                          <Sparkles className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                          <span className="font-medium text-[13.5px] leading-[20px] text-[#818CF8]">Enhance with AI</span>
                        </button>

                        <button
                          onClick={handlePostClick}
                          disabled={isPostButtonDisabled}
                          className="flex flex-row items-center justify-center gap-2 px-7 py-2.5 bg-[#C7D2FE] border border-white/60 rounded-full enabled:hover:bg-[#818CF8] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group shadow-sm"
                        >
                          {state.isSubmitting ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : null}
                          <span className="font-medium text-[13.5px] leading-[20px] text-white">
                            {state.isSubmitting ? 'Posting...' : 'Post'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Achievement Option Picker */}
          <AchievementOptionPicker
            isOpen={showAchievementOptionPicker}
            selectedOptionId={selectedAchievementOptionId}
            onClose={() => setShowAchievementOptionPicker(false)}
            onSelect={(option) => handleAchievementOptionSelect(option.id)}
          />

          {/* Context Switch Warning */}
          {state.showContextWarning && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-[#2a2a4a] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 font-poppins">
                <h3 className="text-[18px] leading-[26px] font-semibold text-black dark:text-white">Discard changes?</h3>
                <p className="text-[14px] leading-[20px] text-[#6B7280]">Switching accounts will discard your current draft. Do you want to proceed?</p>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => state.setShowContextWarning(false)}
                    className="px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-black dark:text-white border border-gray-200 dark:border-[#3a3a5a] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={actions.confirmContextSwitch}
                    className="px-5 py-2 rounded-full text-sm font-medium bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90 transition-colors shadow-sm"
                  >
                    Discard & Switch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discard Confirmation Overlay */}
          <DiscardConfirmOverlay
            isOpen={showDiscardConfirm}
            onCancel={() => setShowDiscardConfirm(false)}
            onConfirm={() => {
              setShowDiscardConfirm(false);
              actions.resetForm();
              onClose();
            }}
          />

          {/* Hidden file input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              if (isMobile) {
                media.handlePhotoUpload(e, isEdit);
              } else {
                media.handleDesktopPhotoUpload(e, isEdit);
              }
            }}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      {/* Tag People Dialog */}
      <Dialog
        open={showTagSelector}
        onOpenChange={(open) => {
          if (!open) {
            setShowTagSelector(false);
            setIsCreatePostOpen(true);
          }
        }}
      >
        <BareDialogContent className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <TagPeopleSelector
            taggedUsers={taggedUsers}
            onTaggedUsersChange={setTaggedUsers}
            onCancel={() => {
              setShowTagSelector(false);
              setIsCreatePostOpen(true);
            }}
            onConfirm={() => {
              setShowTagSelector(false);
              setIsCreatePostOpen(true);
            }}
          />
        </BareDialogContent>
      </Dialog>

      {/* Location Selector Dialog */}
      <Dialog
        open={showLocationSelector}
        onOpenChange={(open) => {
          if (!open) {
            setShowLocationSelector(false);
            setIsCreatePostOpen(true);
          }
        }}
      >
        <BareDialogContent className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <LocationSelector
            selectedLocation={state.selectedLocation}
            onLocationChange={state.setSelectedLocation}
            onCancel={() => {
              setShowLocationSelector(false);
              setIsCreatePostOpen(true);
            }}
            onConfirm={() => {
              setShowLocationSelector(false);
              setIsCreatePostOpen(true);
            }}
          />
        </BareDialogContent>
      </Dialog>

      <div ref={emojiPickerRef}>
        <EmojiPickerPortal
          isOpen={showEmojiPicker}
          position={emojiPickerPos}
          onClose={closeEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          zIndex={200}
        />
      </div>
    </>
  );
};
