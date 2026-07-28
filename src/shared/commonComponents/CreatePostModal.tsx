import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronDown, Check, Sparkles, Smile, Loader2, Plus, Square, RectangleHorizontal, RectangleVertical, ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { CategoryType, CreatePostModalProps, PostType } from '@/features/create-post/types';
import { useCreatePostForm } from '@/features/create-post/hooks/use-create-post-form';
import { AdaptiveCropper } from '@/features/create-post/components/AdaptiveCropper';

// Post Flows
import VideoFlow from '@/features/create-post/components/flows/VideoFlow';
import PollFlow from '@/features/create-post/components/flows/PollFlow';
import ArticleFlow from '@/features/create-post/components/flows/ArticleFlow';
import SharedPreview from '@/features/create-post/components/SharedPreview';
import { ImageEditorToolbar } from '@/shared/commonComponents/image-editor/ImageEditorToolbar';
import { DiscardConfirmOverlay } from '@/features/create-post/components/shared/DiscardConfirmOverlay';
import { AchievementPickerDialog, type AchievementOptionId, getAchievementOptionById } from '@/features/create-post/components/shared/AchievementPickerDialog';
import type { AchievementOption } from '@/features/create-post/components/shared/AchievementPickerDialog';
import { AchievementPhotoPickerDialog } from '@/features/create-post/components/shared/AchievementPhotoPickerDialog';
import { CustomVideoPlayer } from '@/components/ui/CustomVideoPlayer';
import { useUIStore } from '@/store/ui.store';
import { UserMention } from '@/services/api/users';
import { TagPeopleSelector } from '@/shared/commonComponents/TagPeopleSelector';
import { LocationSelector } from '@/shared/commonComponents/LocationSelector';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';
import { sanitizeContent } from '@/lib/contentSanitizer';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const isEdit = !!props.editPostId;

  const { state, media, poll, actions } = useCreatePostForm({
    ...props,
    initialPostType: props.initialType || props.initialPostType,
    isMobile
  });

  useEffect(() => {
    if (isOpen && state.postType === 'article' && !state.articleData && !isEdit) {
      const { setArticleMode, setActiveModal } = useUIStore.getState();
      setActiveModal(null);
      setArticleMode(true);
      router.push('/feed');
    }
  }, [isOpen, state.postType, state.articleData, isEdit, router]);

  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [photoStep, setPhotoStep] = useState<'edit' | 'caption'>(isEdit ? 'caption' : 'edit');
  const [videoStep, setVideoStep] = useState<'edit' | 'caption'>(isEdit ? 'caption' : 'edit');
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [selectedAchievementOptionId, setSelectedAchievementOptionId] = useState<AchievementOptionId | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [showAchievementPhotoPicker, setShowAchievementPhotoPicker] = useState(false);

  const handleAchievementPhotoSelect = (image: { id: number; url: string }) => {
    state.setAchievementImageId(image.id);
    media.setUploadedImages([{
      id: 'achievement-preset',
      url: image.url,
      type: 'image',
      crop: { x: 0, y: 0 },
      zoom: 1,
      isExisting: true,
    }]);
    state.setPostType('photo');
    setPhotoStep('caption');
    setShowAchievementPhotoPicker(false);
  };

  // Tag People State
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);
  const [taggedUsers, setTaggedUsers] = useState<UserMention[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCompactView, setIsCompactView] = useState(true);
  const [emojiPickerPos, setEmojiPickerPos] = useState<EmojiPickerPosition | null>(null);
  const activeEmojiTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsCreatePostOpen(true);
    }
  }, [isOpen]);

  // Handle generic user / session overrides from props
  const activeUser = (props.currentUser || state.currentUser) as any;

  const currentPosterName = (state.currentPoster as any)?.name || activeUser?.name || 'User';
  const currentPosterHandle = (state.currentPoster as any)?.username || activeUser?.username || currentPosterName.toLowerCase().replace(/\s+/g, '');
  const rawPosterLogo = state.isCompanyPost
    ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url)
    : (activeUser?.image || activeUser?.avatar);
  const currentPosterLogo = rawPosterLogo && rawPosterLogo !== '/assets/pngegg.png' ? rawPosterLogo : null;

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
  const composerPlaceholder = 'What would you like to share today?';

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
  }, [state.description, state.postType, photoStep, videoStep]);

  // Sync state & reset step on close or postType change
  useEffect(() => {
    if (!isOpen) {
      setPhotoStep(isEdit ? 'caption' : 'edit');
      setVideoStep(isEdit ? 'caption' : 'edit');
      setVideoStep(isEdit ? 'caption' : 'edit');
      setShowDiscardConfirm(false);
      setSelectedAchievementOptionId(null);
      setShowTagSelector(false);
      setShowLocationSelector(false);
      setTaggedUsers([]);
      setShowEmojiPicker(false);
      setEmojiPickerPos(null);
    }
  }, [isOpen, isEdit]);

  useEffect(() => {
    if (!isEdit && (state.postType !== 'photo' || media.uploadedImages.length === 0)) {
      setPhotoStep('edit');
    }
  }, [state.postType, media.uploadedImages.length, isEdit]);

  useEffect(() => {
    if (!isEdit && (state.postType !== 'video' || media.uploadedVideos.length === 0)) {
      setVideoStep('edit');
    }
  }, [state.postType, media.uploadedVideos.length, isEdit]);



  useEffect(() => {
    if ((state.postType === 'text' || state.postType === 'photo') && state.postCategory === milestoneCategory) return;

    setSelectedAchievementOptionId(null);
  }, [state.postCategory, state.postType, milestoneCategory]);

  useEffect(() => {
    if (isOpen && isEdit && state.originalPost) {
      const post = state.originalPost;
      const category = post.category as string;
      const isAchievement = category === 'Achievement' || category === 'Milestone' || category === 'Academic';
      if (isAchievement && post.images && post.images.length > 0) {
        const imageUrl = post.images[0].toLowerCase();
        const isTemplateUrl = imageUrl.endsWith('.svg') || imageUrl.includes('/images/achievement/');

        if (isTemplateUrl) {
          let optionId: AchievementOptionId = 'certificate';
          if (imageUrl.includes('project') || imageUrl.includes('new-project') || imageUrl.includes('helpingpartner')) {
            optionId = 'new-project';
          } else if (imageUrl.includes('role') || imageUrl.includes('new-role') || imageUrl.includes('newmember') || imageUrl.includes('newteammember') || imageUrl.includes('work anniversary')) {
            optionId = 'new-role';
          } else if (imageUrl.includes('academic') || imageUrl.includes('graduation') || imageUrl.includes('celebration')) {
            optionId = 'academic-milestone';
          }
          setSelectedAchievementOptionId(optionId);
          state.setPostType('photo');
        }
      }
    }
  }, [isOpen, isEdit, state.originalPost]);

  useEffect(() => {
    if (!isOpen || !isMilestoneComposerActive) return;

    const focusFrame = requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
    });

    return () => cancelAnimationFrame(focusFrame);
  }, [isOpen, isMilestoneComposerActive]);

  const isImageEditorMode = state.postType === 'photo' && hasImages && photoStep === 'edit' && !selectedAchievementOption;
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
    state.setPostType('text');
    state.handleSetPostCategory(milestoneCategory);

    requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
    });
  };

  const handleAchievementDialogSelect = (option: any) => {
    state.handleSetPostCategory('Achievement');

    // Convert new_project to new-project if needed
    const mappedId = typeof option === 'string' ? option.replace('_', '-') : (option.id ? option.id.replace('_', '-') : 'new-project');
    setSelectedAchievementOptionId(mappedId as AchievementOptionId);

    const label = ({
      'new-project': 'Launched a project',
      'new-role': 'New role',
      'academic-milestone': 'Academic milestone',
      'certificate': 'Certificate',
    } as Record<string, string>)[mappedId] || 'Achievement';

    state.setAchievementTitle(label);
    handleAchievementOptionSelect(mappedId as AchievementOptionId);
  };

  const handlePostClick = async () => {
    if (props.onPost) {
      const safeCategory = state.postCategory;
      let finalContent = "";
      if (state.postType === 'article') {
        finalContent = `${state.description.trim()}<!-- article_divider -->${state.articleContent}`;
      } else if (state.articleData) {
        finalContent = `${state.description.trim()}<!-- article_divider -->${state.articleData.content}`;
      } else {
        finalContent = sanitizeContent(state.description);
      }

      const payload: any = {
        title: state.postType === 'poll' ? poll.pollQuestion : (state.postType === 'article' ? state.articleTitle.trim() : (state.articleData ? state.articleData.title : '')),
        content: finalContent,
        category: safeCategory,
        visibility: state.visibility,
        post_type: state.postType === 'photo' ? 'image' : ((state.postType === 'article' || state.articleData) ? 'article' : state.postType),
        companyId: state.isCompanyPost ? state.postAsCompanyId || undefined : undefined,
        shared_post_id: props.sharedPostId,
        shared_job_id: props.sharedJobId,
        location: state.selectedLocation ? ("formattedAddress" in state.selectedLocation ? state.selectedLocation.formattedAddress : state.selectedLocation.name) : null,
        achievement_image_id: state.achievementImageId,
        poll_options: state.postType === 'poll' ? poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text)) : undefined,
        poll_duration: state.postType === 'poll' ? poll.pollDuration : undefined,
        tags: taggedUsers.map(u => u.id)
      };

      if (state.articleData) {
        payload.article_cover_image = state.articleData.coverImage;
        payload.article_title = state.articleData.title;
        payload.article_subtitle = state.articleData.subtitle;
      }

      try {
        const filesToUpload = await media.prepareFilesToUpload(state.articleData ? 'article' : state.postType, media.aspectRatio);
        await props.onPost({ payload, filesToUpload });
        if (props.onPostCreated) props.onPostCreated();
        actions.resetForm();
        onClose();
      } catch (err) {
        console.error("Custom posting callback failed", err);
      }
    } else {
      await actions.handlePost(taggedUsers.map(u => u.id));
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
                router.push('/feed');
              } else if (action.type === 'milestone') {
                setShowAccountSelector(false);
                setShowAchievementDialog(true);
              } else {
                if (state.postCategory === 'Achievement') {
                  state.handleSetPostCategory(state.getDefaultCategory());
                  state.setAchievementTitle(undefined);
                  state.setAchievementImageId(undefined);
                }
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
              className="w-6 h-6 text-foreground"
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
          className={`w-full p-0 border-none rounded-none sm:rounded-[24px] bg-card shadow-2xl overflow-hidden font-poppins flex flex-col z-[101] ${(state.postType === 'article' && !state.articleData)
            ? 'max-w-[1050px] h-[100dvh] max-h-[100dvh] sm:h-[90vh] sm:max-h-[90vh]'
            : (isImageEditorMode || isVideoEditorMode)
              ? 'max-w-[700px] h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-none'
              : 'max-w-[600px] h-[100dvh] max-h-[100dvh] sm:h-[552px] sm:max-h-[90vh]'
            } [&>button:last-child]:hidden ${showAchievementDialog || showAchievementPhotoPicker ? 'opacity-0 pointer-events-none' : ''}`}
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

          {/* Dimmer Overlay for Tag/Location Selectors */}
          {(showTagSelector || showLocationSelector) && (
            <div className="absolute inset-0 bg-black/80 z-[300] pointer-events-auto transition-opacity" />
          )}

          {/* ═══════════════════════════════════════════
            IMAGE / VIDEO EDITOR MODE
            ═══════════════════════════════════════════ */}
          {(isImageEditorMode || isVideoEditorMode) ? (
            <div className="flex flex-col items-center p-4 w-full pt-8">
              {/* Content */}
              <div className="flex flex-col items-center gap-4 w-full max-w-[570px]">
                {/* Toolbar Row: + | flip/rotate/delete | counter */}
                <div className="self-stretch inline-flex justify-between items-center">
                  {/* Add More */}
                  {!isVideoEditorMode ? (
                    <button
                      onClick={() => addMoreInputRef.current?.click()}
                      className="w-6 h-6 flex items-center justify-center text-foreground hover:opacity-70 transition-opacity"
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
                    onToggleAspectRatio={() => {
                      const ratios = [4 / 5, 1, 16 / 9];
                      const current = media.aspectRatio;
                      const closestIdx = ratios.findIndex(r => Math.abs(r - current) < 0.01);
                      const nextIdx = (closestIdx + 1) % ratios.length;
                      media.handleAspectChange(ratios[nextIdx]);
                    }}
                  />

                  {/* Counter */}
                  {isVideoEditorMode ? (
                    <div className="w-[38px]" />
                  ) : (
                    <span className="text-[16px] leading-[24px] font-normal text-foreground font-poppins text-center min-w-[38px]">
                      {`${String(media.activeImageIndex + 1).padStart(2, '0')}/${String(media.uploadedImages.length).padStart(2, '0')}`}
                    </span>
                  )}
                </div>

                {/* Image / Video Preview */}
                <div className="w-[570px] h-96 bg-white rounded-3xl shadow-[0px_2px_4px_0px_rgba(99,102,241,0.05)] outline outline-1 outline-offset-[-1px] outline-indigo-50 overflow-hidden flex items-center justify-center">
                  {isVideoEditorMode && media.uploadedVideos[0] ? (
                    <div className="relative w-full h-full">
                      {media.uploadedVideos[0].isExisting ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                          <CustomVideoPlayer
                            src={media.uploadedVideos[0].url}
                            className="transition-transform duration-200"
                            style={{
                              transform: `scaleX(${media.uploadedVideos[0].flipH ? -1 : 1}) scaleY(${media.uploadedVideos[0].flipV ? -1 : 1}) rotate(${media.uploadedVideos[0].rotation || 0}deg)`
                            }}
                          />
                        </div>
                      ) : (
                        <AdaptiveCropper
                          video={media.uploadedVideos[0].url}
                          crop={media.uploadedVideos[0].crop || { x: 0, y: 0 }}
                          zoom={media.uploadedVideos[0].zoom || 1}
                          rotation={media.uploadedVideos[0].rotation || 0}
                          aspect={media.aspectRatio}
                          onCropChange={media.handleVideoCropChange}
                          onZoomChange={media.handleVideoZoomChange}
                          onCropComplete={media.handleVideoCropComplete}
                          containerStyle={{ background: '#000000', borderRadius: '24px', width: '100%', height: '100%' }}
                          cropAreaStyle={{ border: '2px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}
                        />
                      )}
                    </div>
                  ) : activeImage ? (
                    <div
                      className="relative w-full h-full transition-transform duration-200"
                      style={{
                        transform: `scaleX(${activeImage.flipH ? -1 : 1}) scaleY(${activeImage.flipV ? -1 : 1})`
                      }}
                    >
                      {activeImage?.isExisting ? (
                        <img src={activeImage.url} className="w-full h-full object-cover" alt="Post media" />
                      ) : (
                        <div className="relative w-full h-full">
                          <AdaptiveCropper
                            image={activeImage.url}
                            crop={activeImage.crop || { x: 0, y: 0 }}
                            zoom={activeImage.zoom || 1}
                            rotation={activeImage.rotation || 0}
                            aspect={media.aspectRatio}
                            onCropChange={media.handleCropChange}
                            onZoomChange={media.handleZoomChange}
                            onCropComplete={media.handleCropComplete}
                            onMediaLoaded={media.handleActiveMediaLoaded}
                            containerStyle={{ background: '#ffffff', borderRadius: '24px', width: '100%', height: '100%' }}
                            cropAreaStyle={{ border: '2px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}
                          />
                        </div>
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
                              ? (state.isCompanyPost ? 'border-[#1A73E8] scale-[0.98]' : 'border-[#6366F1] scale-[0.98]')
                              : 'border-transparent opacity-75 hover:opacity-100'
                              }`}
                            type="button"
                          >
                            <img src={img.url} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                          </button>
                          <span className={`text-[10px] leading-[14px] font-poppins transition-colors duration-200 ${isActive
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground font-normal'
                            }`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zoom Slider */}
                {!isEdit && (isImageEditorMode || isVideoEditorMode) && (
                  <div className="w-72 flex flex-col justify-start items-start">
                    <span className="text-center text-black text-xs font-normal font-['Poppins'] leading-4">
                      Zoom
                    </span>
                    <div className="relative flex flex-row items-center w-full h-8 gap-0">
                      <div
                        className={`h-2 rounded-l-[16px] rounded-r-[2px] ${state.isCompanyPost ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'}`}
                        style={{
                          width: `${(((isVideoEditorMode ? media.uploadedVideos[0] : activeImage)?.zoom || 1) - 1) / 2 * 100}%`,
                          minWidth: '4px'
                        }}
                      />
                      <div className={`w-[2px] h-8 rounded-[2px] flex-shrink-0 ${state.isCompanyPost ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'}`} />
                      <div className={`h-2 rounded-l-[2px] rounded-r-[16px] flex-1 relative ${state.isCompanyPost ? 'bg-[#1A73E8]/20 dark:bg-[#1A73E8]/20' : 'bg-[#E0E7FF] dark:bg-[#2a2a4a]'}`}>
                        <div className={`absolute w-1 h-1 rounded-full right-1 top-1/2 -translate-y-1/2 ${state.isCompanyPost ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'}`} />
                      </div>
                      <input
                        type="range"
                        value={(isVideoEditorMode ? media.uploadedVideos[0] : activeImage)?.zoom || 1}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (isVideoEditorMode) {
                            media.handleVideoZoomChange(val);
                          } else {
                            media.handleZoomChange(val);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="w-72 inline-flex justify-start items-start gap-4">
                  <button
                    onClick={() => {
                      media.clearMedia();
                      state.setPostType('text');
                    }}
                    className={`flex-1 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 ${state.isCompanyPost ? 'outline-[#1A73E8]' : 'outline-indigo-400'}`}
                  >
                    <span className={`text-center text-sm font-normal font-['Poppins'] leading-5 ${state.isCompanyPost ? 'text-[#1A73E8]' : 'text-indigo-400'}`}>Back</span>
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
                    className={`flex-1 h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 disabled:opacity-50 ${state.isCompanyPost ? 'bg-[#1A73E8]' : 'bg-indigo-500'}`}
                  >
                    {isGeneratingPreviews ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="text-center text-white text-sm font-normal font-['Poppins'] leading-5">Next</span>
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
              <div className="w-full flex flex-col flex-1 min-h-0 items-center p-4">
                {/* Frame 2608580: Close Button Block */}
                <div className="w-full flex flex-col items-end mb-2">
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    className="flex items-center justify-center w-[24px] h-[24px] text-[#FF6B6B] transition-colors"
                  >
                    <X className="w-full h-full stroke-[1.5px]" />
                  </button>
                </div>
                {/* Header — FIXED */}
                {(state.postType !== 'article' || !!state.articleData) && (
                  state.postType === 'poll' ? (
                    <div className="relative w-full flex flex-col items-center">
                      <h2 className="font-medium text-[18px] leading-[26px] text-[#000000] dark:text-white text-center font-poppins">Create a poll</h2>
                      <p className="font-normal text-[12.5px] leading-[17px] text-muted-foreground text-center mt-1 font-poppins">
                        Let people vote on your question
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center gap-1.5 w-full">
                      <h2 className="font-medium text-[18px] leading-[26px] text-[#000000] dark:text-white text-center font-poppins">
                        {isEdit ? 'Edit Post' : 'Create'}
                      </h2>
                      <p className="font-normal text-[12.5px] leading-[17px] text-muted-foreground text-center">
                        {isEdit ? 'Update your post details and share changes.' : 'Post jobs, insights, or milestones to grow your presence.'}
                      </p>
                    </div>
                  )
                )}

                {/* Profile — FIXED */}
                {(state.postType !== 'article' || !!state.articleData) && (
                  <div className="relative flex flex-row items-center justify-start gap-3.5 w-full mt-5 z-[60]">
                    <div className="flex flex-row items-center justify-start gap-3.5 text-left font-poppins">
                      <div className="w-11 h-11 rounded-full bg-white text-[#6366F1] flex items-center justify-center font-semibold text-base ring-2 ring-border shadow-sm overflow-hidden shrink-0 select-none">
                        {currentPosterLogo ? (
                          <img
                            src={currentPosterLogo}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{currentPosterName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[17px] leading-[24px] text-foreground">{currentPosterName}</span>
                        <span className="font-normal text-[12px] leading-[16px] text-[#9CA3AF]">@{currentPosterHandle}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Action Icons — FIXED */}
                {state.postType !== 'article' && !(state.postType === 'photo' && hasImages) && !(state.postType === 'video' && hasVideos) && state.postType !== 'poll' && !state.sharedPost && (
                  <div className="mt-4 w-full">
                    {renderMediaIcons()}
                  </div>
                )}

                {/* Scrollable content area — overflow-y: auto */}
                <div className={`flex flex-col w-full flex-1 min-h-0 ${(state.postType === 'article' && !state.articleData) ? '' : 'mt-3 overflow-y-auto custom-scrollbar'
                  } ${state.postType === 'poll' ? 'pb-24 overflow-visible' : ''}`}>
                  {(state.postType !== 'article' || !!state.articleData) ? (
                    <div className="relative flex flex-col gap-4 w-full">


                      {/* Media preview and controls wrapper */}
                      {selectedAchievementOption && state.postType === 'photo' && hasImages ? (
                        <div className="flex flex-col gap-2 w-full items-center">
                          {isCompactView ? (
                            <div className="flex items-center justify-between w-full p-2 bg-card border border-[#EEF2FF] rounded-[16px]">
                              {/* Left: Thumbnail + Title */}
                              <div className="flex items-center gap-3">
                                <div className="w-[56px] h-[56px] rounded-[12px] overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                                  <img
                                    src={media.previewMediaUrls[0] || media.uploadedImages[0]?.url}
                                    className="w-full h-full object-cover"
                                    alt="Achievement media"
                                  />
                                </div>
                                <div className="flex flex-col overflow-hidden max-w-[200px]">
                                  <span className="text-[14px] font-medium text-foreground truncate font-poppins">
                                    {{
                                      'new-project': 'Launched a project',
                                      'new-role': 'New role',
                                      'academic-milestone': 'Academic milestone',
                                      'certificate': 'Certificate',
                                    }[selectedAchievementOption.id] || 'Achievement'}
                                  </span>
                                  <span className="text-[12px] text-gray-500 font-poppins truncate max-w-[200px]">
                                    {selectedAchievementOption.description}
                                  </span>
                                </div>
                              </div>
                              {/* Right: Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsCompactView(false)}
                                  className="p-1.5 text-[#000000] rounded-full transition-colors"
                                  title="Show full preview"
                                >
                                  <Icon icon="fluent:eye-off-24-regular" className="w-[24px] h-[24px]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowAchievementPhotoPicker(true); }}
                                  className="p-1.5 text-[#000000] rounded-full transition-colors"
                                  title="Edit achievement photo"
                                >
                                  <Icon icon="proicons:pencil" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { media.clearMedia(); setSelectedAchievementOptionId(null); }}
                                  className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                                  title="Remove achievement"
                                >
                                  <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Full size preview */}
                              <div className="w-full bg-white relative">
                                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[8px]">
                                  <img
                                    src={media.previewMediaUrls[0] || media.uploadedImages[0]?.url}
                                    className="w-full h-full object-contain"
                                    alt="Achievement media"
                                  />
                                </div>
                              </div>
                              {/* Centered translated category label */}
                              <div className="text-center text-gray-500 text-[12px] font-normal font-poppins mt-1">
                                {{
                                  'new-project': 'Launched a project',
                                  'new-role': 'New role',
                                  'academic-milestone': 'Academic milestone',
                                  'certificate': 'Certificate',
                                }[selectedAchievementOption.id] || 'Achievement'}
                              </div>
                              {/* Right aligned edit and delete controls */}
                              <div className="flex justify-end gap-3 w-full pr-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setIsCompactView(true)}
                                  className="p-1 text-gray-500 hover:text-[#6366F1] transition-colors"
                                  title="Show compact preview"
                                >
                                  <Icon icon="fluent:eye-24-regular" className="w-[24px] h-[24px]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowAchievementPhotoPicker(true); }}
                                  className="p-1 text-gray-500 hover:text-[#6366F1] transition-colors"
                                  title="Edit achievement photo"
                                >
                                  <Icon icon="proicons:pencil" className="w-[24px] h-[24px] text-foreground" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { media.clearMedia(); setSelectedAchievementOptionId(null); }}
                                  className="p-1 text-[#FF6B6B] hover:text-red-600 transition-colors"
                                  title="Remove achievement"
                                >
                                  <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : ((state.postType === 'photo' && hasImages) || (state.postType === 'video' && hasVideos)) && (
                        <div className="flex flex-col gap-2 w-full items-center">
                          {/* Photo preview attachment */}
                          {state.postType === 'photo' && hasImages && (
                            isCompactView ? (
                              <div className="flex items-center justify-between w-full p-2 bg-card border border-[#EEF2FF] rounded-[16px]">
                                {/* Left: Thumbnail + File Info */}
                                <div className="flex items-center gap-3">
                                  <div className="w-[56px] h-[56px] rounded-[12px] overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                                    <img
                                      src={media.previewMediaUrls[previewActiveIndex] || media.uploadedImages[previewActiveIndex]?.url}
                                      onError={(e) => {
                                        const rawUrl = media.uploadedImages[previewActiveIndex]?.url;
                                        if (rawUrl && e.currentTarget.src !== rawUrl) {
                                          e.currentTarget.src = rawUrl;
                                        }
                                      }}
                                      className="w-full h-full object-cover"
                                      alt="Attached media"
                                    />
                                  </div>
                                  <div className="flex flex-col overflow-hidden max-w-[200px]">
                                    <span className="text-[14px] font-medium text-foreground truncate font-poppins">
                                      {media.uploadedImages[previewActiveIndex]?.file?.name || 'Attached_Image.jpg'}
                                    </span>
                                    <span className="text-[12px] text-gray-500 uppercase font-poppins">
                                      {media.uploadedImages[previewActiveIndex]?.file?.type?.split('/')[1] || 'JPEG'}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Controls */}
                                <div className="flex items-center gap-2">
                                  {media.uploadedImages.length > 1 && (
                                    <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-full mr-1">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === 0 ? media.uploadedImages.length - 1 : prev - 1)); }}
                                        className="p-0.5 text-gray-500 hover:text-foreground transition-colors"
                                      >
                                        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                                      </button>
                                      <span className="text-[12px] font-semibold text-foreground min-w-[16px] text-center font-poppins">
                                        {previewActiveIndex + 1}/{media.uploadedImages.length}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === media.uploadedImages.length - 1 ? 0 : prev + 1)); }}
                                        className="p-0.5 text-gray-500 hover:text-foreground transition-colors"
                                      >
                                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setIsCompactView(false)}
                                    className="p-1.5 text-[#000000] rounded-full transition-colors"
                                    title="Show full preview"
                                  >
                                    <Icon icon="fluent:eye-off-24-regular" className="w-[24px] h-[24px]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPhotoStep('edit')}
                                    className="p-1.5 text-[#000000] rounded-full transition-colors"
                                    title="Edit image"
                                  >
                                    <Icon icon="proicons:pencil" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => media.clearMedia()}
                                    className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                                    title="Remove image"
                                  >
                                    <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Large Full-Width Preview */}
                                <div className="box-border flex flex-row justify-between items-start p-0 gap-4 w-full h-[200px] border border-[#EEF2FF] rounded-[24px] overflow-hidden">
                                  <div
                                    className="flex flex-col items-center p-0 gap-2 mx-auto h-[200px]"
                                    style={{ aspectRatio: media.aspectRatio }}
                                  >
                                    <img
                                      src={media.previewMediaUrls[previewActiveIndex] || media.uploadedImages[previewActiveIndex]?.url}
                                      onError={(e) => {
                                        const rawUrl = media.uploadedImages[previewActiveIndex]?.url;
                                        if (rawUrl && e.currentTarget.src !== rawUrl) {
                                          e.currentTarget.src = rawUrl;
                                        }
                                      }}
                                      className="w-full h-full object-cover"
                                      alt="Cropped post media"
                                    />
                                  </div>
                                </div>

                                {/* Controls row for large preview */}
                                <div className="flex items-center justify-between w-full px-1">
                                  {/* Left: counter pill */}
                                  {media.uploadedImages.length > 1 ? (
                                    <div className="flex items-center gap-3.5 bg-card px-4 py-1.5 rounded-full">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === 0 ? media.uploadedImages.length - 1 : prev - 1)); }}
                                        className="p-0.5 text-primary hover:opacity-70 transition-opacity"
                                        title="Previous image"
                                      >
                                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                                      </button>
                                      <span className="text-[13px] font-semibold text-foreground min-w-[18px] text-center font-poppins">
                                        {String(previewActiveIndex + 1).padStart(2, '0')}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPreviewActiveIndex(prev => (prev === media.uploadedImages.length - 1 ? 0 : prev + 1)); }}
                                        className="p-0.5 text-primary hover:opacity-70 transition-opacity"
                                        title="Next image"
                                      >
                                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div />
                                  )}
                                  {/* Right: eye + edit + delete */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setIsCompactView(true)}
                                      className="p-1.5 text-[#000000] rounded-full transition-colors"
                                      title="Hide full preview"
                                    >
                                      <Icon icon="fluent:eye-24-regular" className="w-[24px] h-[24px]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPhotoStep('edit')}
                                      className="p-1.5 text-[#000000] rounded-full transition-colors"
                                      title="Edit media"
                                    >
                                      <Icon icon="proicons:pencil" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => media.clearMedia()}
                                      className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                                      title="Remove media"
                                    >
                                      <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )
                          )}

                          {/* Video preview attachment */}
                          {state.postType === 'video' && hasVideos && (
                            <>
                              <div className="box-border flex flex-row justify-between items-start p-0 gap-4 w-full h-[200px] border border-[#EEF2FF] rounded-[24px] overflow-hidden">
                                <div
                                  className="flex flex-col items-center p-0 gap-2 mx-auto h-[200px]"
                                  style={{ aspectRatio: media.aspectRatio }}
                                >
                                  <CustomVideoPlayer
                                    src={media.previewMediaUrls[0] || media.uploadedVideos[0]?.url}
                                    hideControls={true}
                                    className="object-cover w-full h-full bg-black"
                                    style={{
                                      transform: `scaleX(${media.uploadedVideos[0]?.flipH ? -1 : 1}) scaleY(${media.uploadedVideos[0]?.flipV ? -1 : 1}) rotate(${media.uploadedVideos[0]?.rotation || 0}deg)`
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Controls row for video */}
                              <div className="flex items-center justify-between w-full px-1">
                                <div />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setVideoStep('edit')}
                                    className="p-1.5 text-gray-500 hover:text-[#6366F1] hover:bg-secondary rounded-full transition-colors"
                                    title="Edit video"
                                  >
                                    <Icon icon="proicons:pencil" className="w-[24px] h-[24px] text-foreground" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => media.clearMedia()}
                                    className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                                    title="Remove video"
                                  >
                                    <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Article Preview Card */}
                      {state.postType === 'article' && state.articleData && (
                        <div className="flex justify-center w-full mt-3 mb-4">
                          <div className="relative group w-full max-w-[420px]">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="block w-full bg-card border border-border rounded-[24px] overflow-hidden shadow-sm transition-all hover:shadow-md"
                            >
                              <div className="w-full h-[180px] overflow-hidden">
                                {state.articleData.coverImage ? (
                                  <img src={state.articleData.coverImage.url} alt={state.articleData.title || 'Article cover'} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                                    <Icon icon="ph:article" className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="bg-[#EEF2FF] py-3.5 px-5 text-center">
                                <h3 className="line-clamp-2 text-[13px] font-semibold text-[#312E81] font-poppins leading-tight">
                                  {state.articleData.title || 'Untitled Article'}
                                </h3>
                              </div>
                            </a>
                            {state.postType === 'article' && (
                              <div className="flex justify-end gap-3 w-full mt-2 pr-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (isEdit) {
                                      state.setArticleData(null);
                                      state.setPostType('article');
                                    } else {
                                      const { setArticleMode, setActiveModal } = useUIStore.getState();
                                      setActiveModal(null);
                                      setArticleMode(true);
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-[#6366F1] transition-colors"
                                  title="Edit article"
                                >
                                  <Icon icon="proicons:pencil" className="w-[24px] h-[24px] text-foreground" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Unified Content Textarea (Part of scroll unit) */}
                      {(state.postType !== 'poll' && (state.postType !== 'article' || !!state.articleData)) && (
                        <div className="flex flex-col w-full pr-3">
                          <textarea
                            ref={composerTextareaRef}
                            className="w-full resize-none outline-none font-normal text-[15px] leading-[23px] text-foreground placeholder:text-[#6B7280] bg-transparent font-poppins whitespace-pre-wrap"
                            placeholder={state.postType === 'article' ? "Say something about your article..." : composerPlaceholder}
                            value={state.description}
                            onChange={(e) => state.setDescription(e.target.value)}
                            style={{ overflow: 'hidden', resize: 'none', height: 'auto', minHeight: '80px' }}
                          />
                        </div>
                      )}


                      {/* Poll Flow Options */}
                      {state.postType === 'poll' && (
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



                      <SharedPreview sharedPost={state.sharedPost} isMobile={isMobile} />


                    </div>
                  ) : isEdit ? (
                    <ArticleFlow
                      title={state.articleTitle}
                      onTitleChange={state.setArticleTitle}
                      content={state.articleContent}
                      onContentChange={state.setArticleContent}
                      coverImage={media.uploadedImages[0] || null}
                      onCoverChange={(url) => {
                        if (url) {
                          media.setUploadedImages([{ id: `cover-${Date.now()}`, url, type: 'image', crop: { x: 0, y: 0 }, zoom: 1, isExisting: true }]);
                        } else {
                          media.clearMedia();
                        }
                      }}
                      onRemoveCover={() => media.clearMedia()}
                      isEdit={isEdit}
                      caption={state.description}
                      onCaptionChange={state.setDescription}
                      onPost={handlePostClick}
                      isSubmitting={state.isSubmitting}
                      onClose={() => state.setPostType('text')}
                      currentUser={activeUser}
                      currentPoster={state.currentPoster}
                      isCompanyPost={state.isCompanyPost}
                      onArticleComplete={(data) => {
                        state.setArticleData(data);
                      }}
                    />
                  ) : null}
                </div>

                {/* Footer — FIXED */}
                {(state.postType !== 'article' || !!state.articleData) && (
                    <div className="flex flex-col gap-4 w-full mt-auto pt-5">
                      {/* Tag, Location, Smile icons row */}
                      <div className="flex items-center gap-4 px-1">
                        <button className="flex items-center gap-2 relative transition-colors group" title="Tag people" onClick={() => { setShowTagSelector(true); }}>
                          <Icon icon="la:user-tag" className="w-6 h-6 text-foreground" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                          {taggedUsers.length > 0 && (
                            <span className={`text-[14px] leading-[20px] font-normal font-poppins ${state.isCompanyPost ? 'text-[#1A73E8]' : 'text-[#818CF8]'}`}>
                              + {taggedUsers.length}
                            </span>
                          )}
                        </button>
                        <button className="flex items-center gap-2 relative transition-colors group" title="Location" onClick={() => { setShowLocationSelector(true); }}>
                          <Icon icon="hugeicons:location-05" className="w-6 h-6 text-foreground" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                          {state.selectedLocation && (
                            <span className={`text-[14px] leading-[20px] font-normal font-poppins truncate max-w-[200px] text-left ${state.isCompanyPost ? 'text-[#1A73E8]' : 'text-[#818CF8]'}`}>
                              {(state.selectedLocation as any).name || (state.selectedLocation as any).formattedAddress}
                            </span>
                          )}
                        </button>
                        <button
                          ref={emojiButtonRef}
                          type="button"
                          className="transition-colors"
                          title="Add emoji"
                          onClick={(e) => handleEmojiButtonClick(e, composerTextareaRef)}
                        >
                          <Icon icon="lucide:smile" className="w-6 h-6 text-foreground" style={{ strokeWidth: '0.5px', stroke: 'currentColor' }} />
                        </button>
                      </div>

                      <div className="flex flex-row justify-between items-center w-full">
                        <button className={`flex flex-row items-center justify-center gap-2 px-5 py-2.5 border rounded-full bg-transparent transition-all duration-200 group ${state.isCompanyPost ? 'border-[#1A73E8] hover:bg-[#1A73E8]/10 dark:hover:bg-[#1A73E8]/10' : 'border-[#818CF8] hover:bg-[#818CF8]/10 dark:hover:bg-[#818CF8]/10'}`}>
                          <Sparkles className={`w-4 h-4 group-hover:scale-110 transition-transform ${state.isCompanyPost ? 'text-[#1A73E8]' : 'text-[#818CF8]'}`} />
                          <span className={`font-medium text-[13.5px] leading-[20px] ${state.isCompanyPost ? 'text-[#1A73E8]' : 'text-[#818CF8]'}`}>Enhance with AI</span>
                        </button>

                        <button
                          onClick={handlePostClick}
                          disabled={isPostButtonDisabled}
                          className={`flex flex-row items-center justify-center gap-2 px-7 py-2.5 border border-white/60 rounded-full transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group shadow-sm ${isPostButtonDisabled
                              ? (state.isCompanyPost ? 'bg-[#1A73E8]/50' : 'bg-indigo-200')
                              : (state.isCompanyPost ? 'bg-[#1A73E8]' : 'bg-indigo-500')
                            }`}
                        >
                          {state.isSubmitting ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : null}
                          <span className="font-medium text-[13.5px] leading-[20px] text-white">
                            {state.isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}
                          </span>
                        </button>
                      </div>
                    </div>
                )}
              </div>
            </>
          )}


          {/* Context Switch Warning */}
          {state.showContextWarning && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 font-poppins">
                <h3 className="text-[18px] leading-[26px] font-semibold text-foreground">Discard changes?</h3>
                <p className="text-[14px] leading-[20px] text-[#6B7280]">Switching accounts will discard your current draft. Do you want to proceed?</p>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => state.setShowContextWarning(false)}
                    className="px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary text-foreground border border-border transition-colors"
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
          }
        }}
      >
        <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <TagPeopleSelector
            taggedUsers={taggedUsers}
            onTaggedUsersChange={setTaggedUsers}
            onCancel={() => {
              setShowTagSelector(false);
            }}
            onConfirm={() => {
              setShowTagSelector(false);
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
          }
        }}
      >
        <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <LocationSelector
            selectedLocation={state.selectedLocation}
            onLocationChange={state.setSelectedLocation}
            onCancel={() => {
              setShowLocationSelector(false);
            }}
            onConfirm={() => {
              setShowLocationSelector(false);
            }}
          />
        </BareDialogContent>
      </Dialog>

      {/* Achievement Picker Dialog — separate Dialog, matching Tag People flow */}
      <Dialog
        open={showAchievementDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAchievementDialog(false);
          }
        }}
      >
        <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <DialogTitle className="sr-only">Select Milestone Option</DialogTitle>
          <AchievementPickerDialog
            isOpen={showAchievementDialog}
            onClose={() => {
              setShowAchievementDialog(false);
            }}
            onSelect={(option) => {
              handleAchievementDialogSelect(option);
              setShowAchievementDialog(false);
              setShowAchievementPhotoPicker(true);
            }}
          />
        </BareDialogContent>
      </Dialog>

      {/* Achievement Photo Picker Dialog */}
      <Dialog
        open={showAchievementPhotoPicker}
        onOpenChange={(open) => {
          if (!open) {
            setShowAchievementPhotoPicker(false);
          }
        }}
      >
        <BareDialogContent hideOverlay={true} className="p-0 bg-transparent border-none shadow-none w-fit overflow-visible [&>button]:hidden">
          <DialogTitle className="sr-only">Select Achievement Photo</DialogTitle>
          <AchievementPhotoPickerDialog
            isOpen={showAchievementPhotoPicker}
            selectedOption={selectedAchievementOption ? (selectedAchievementOption.id.replace('-', '_') as any) : null}
            onClose={() => {
              setShowAchievementPhotoPicker(false);
            }}
            onBack={() => {
              setShowAchievementPhotoPicker(false);
              setShowAchievementDialog(true);
            }}
            onPhotoSelect={handleAchievementPhotoSelect}
            onUploadPhoto={() => {
              setShowAchievementPhotoPicker(false);
              setTimeout(() => galleryInputRef.current?.click(), 0);
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
