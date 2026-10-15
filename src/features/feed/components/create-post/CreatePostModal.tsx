import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CreatePostModalProps } from './types';
import { useCreatePostForm } from '../../hooks/use-create-post-form';
import RichTextEditor from './shared/RichTextEditor';
import { useUIStore } from '@/store/ui.store';

// Shared Layout Components
import CreatePostHeader from './CreatePostHeader';
import CreatePostFooter from './CreatePostFooter';
import PostTypeSelector from './PostTypeSelector';
import CategorySelector from './shared/CategorySelector';
import PostIdentity from './shared/PostIdentity';
import SharedPreview from './SharedPreview';

// Post Flows (from clean barrel index)
import { TextFlow, PhotoFlow, VideoFlow, PollFlow, ArticleFlow } from './post-types';

export const CreatePostModal = (props: CreatePostModalProps) => {
  const { isOpen, onClose } = props;
  const isEdit = !!props.editPostId;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const router = useRouter();

  const { state, media, poll, actions } = useCreatePostForm({ ...props, isMobile });

  React.useEffect(() => {
    if (isOpen && state.postType === 'article' && !state.articleData && !isEdit) {
      const { setArticleMode, setActiveModal } = useUIStore.getState();
      setActiveModal(null);
      setArticleMode(true);
      router.push('/article/create');
    }
  }, [isOpen, state.postType, state.articleData, isEdit, router]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleArticleComplete = (data: any) => {
    state.setArticleData(data);
  };

  const handleArticleBack = () => {
    state.setPostType('text');
  };

  if (!isOpen) return null;

  const renderPostFlow = () => {
    switch (state.postType) {
      case 'text':
        return (
          <TextFlow
            value={state.description}
            onChange={state.setDescription}
            isMobile={isMobile}
            sharedPost={state.sharedPost}
            onMentionsChange={state.setInlineMentions}
          />
        );
      case 'photo':
        return (
          <PhotoFlow
            uploadedImages={media.uploadedImages}
            activeImageIndex={media.activeImageIndex}
            setActiveImageIndex={media.setActiveImageIndex}
            aspectRatio={media.aspectRatio}
            isMobile={isMobile}
            isEdit={isEdit}
            caption={state.description}
            onCaptionChange={state.setDescription}
            onPhotoUpload={(e) => isMobile ? media.handlePhotoUpload(e, isEdit) : media.handleDesktopPhotoUpload(e, isEdit)}
            onRemoveImage={(id) => media.removeMediaItem(id, media.setUploadedImages, isEdit)}
            onCropChange={media.handleCropChange}
            onZoomChange={media.handleZoomChange}
            onCropComplete={media.handleCropComplete}
            onAspectChange={media.handleAspectChange}
            onMediaLoaded={media.handleActiveMediaLoaded}
            onCropInteraction={media.handleCropInteraction}
            aspectMode={media.aspectRatioMode}
            galleryInputRef={galleryInputRef}
            isEditingMedia={state.isEditingMedia}
            setIsEditingMedia={state.setIsEditingMedia}
          />
        );
      case 'video':
        return (
          <VideoFlow
            uploadedVideos={media.uploadedVideos}
            isMobile={isMobile}
            isEdit={isEdit}
            caption={state.description}
            onCaptionChange={state.setDescription}
            onVideoUpload={(e) => media.handleVideoUpload(e, isEdit)}
            onRemoveVideo={(id) => media.removeMediaItem(id, media.setUploadedVideos, isEdit)}
            videoInputRef={videoInputRef}
            isEditingMedia={state.isEditingMedia}
            setIsEditingMedia={state.setIsEditingMedia}
            currentUser={state.currentUser}
            currentPoster={state.currentPoster}
            isCompanyPost={state.isCompanyPost}
          />
        );
      case 'poll':
        return (
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
            questionError={poll.questionError}
            optionErrors={poll.optionErrors}
          />
        );
      case 'article':
        if (state.articleData) {
          return (
            <div className="border rounded-lg p-4 bg-background border-border flex flex-col gap-4">
              <div className="flex justify-center w-full">
                <div className="relative group w-full max-w-[420px]">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="block w-full bg-card border border-border rounded-[24px] overflow-hidden shadow-sm transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="w-full aspect-[16/3] overflow-hidden">
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
                            router.push('/article/create');
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

              <RichTextEditor
                content={state.description}
                onChange={state.setDescription}
                className="bg-transparent border-none min-h-[100px]"
                editorClassName="min-h-[100px]"
                placeholder="Say something about your article..."
              />
            </div>
          );
        }
        return isEdit ? (
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
            onPost={actions.handlePost}
            isSubmitting={state.isSubmitting}
            onClose={handleArticleBack}
            currentUser={state.currentUser}
            currentPoster={state.currentPoster}
            isCompanyPost={state.isCompanyPost}
            onArticleComplete={handleArticleComplete}
            inlineFiles={state.inlineFiles}
            setInlineFiles={state.setInlineFiles}
          />
        ) : null;
      default:
        return null;
    }
  };

  const isArticleCompose = state.postType === 'article' && !!state.articleData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "p-0 border-none shadow-2xl overflow-hidden z-[101] bg-background",
          isMobile
            ? "w-full h-full max-w-none rounded-none flex flex-col pt-0 pb-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !data-[state=closed]:slide-out-to-bottom-[100%] !data-[state=open]:slide-in-from-bottom-[100%] !data-[state=open]:zoom-in-100 !data-[state=closed]:zoom-out-100 duration-300"
            : cn(
              "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full rounded-2xl max-h-[90vh] flex flex-col transition-all duration-300",
              (state.postType === 'article' && !state.articleData) ? "max-w-4xl h-[85vh]" : "max-w-3xl"
            )
        )}
      >
        <div className="sr-only">
          <DialogTitle>{isEdit ? 'Edit Post' : 'Create Post'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update your post content and settings' : 'Share a new update with your network'}
          </DialogDescription>
        </div>

        {(state.postType !== 'article' || isArticleCompose) && (
          <CreatePostHeader
            onClose={onClose}
            isCompanyPost={state.isCompanyPost}
            currentPosterName={(state.currentPoster as any)?.name || state.currentUser?.name || 'User'}
            currentPosterLogo={state.isCompanyPost
              ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url || (state.currentPoster as any)?.company_logo || (state.currentPoster as any)?.logo || (state.currentPoster as any)?.image)
              : (state.currentUser?.image || '/assets/pngegg.png')}
            visibility={state.visibility}
            onVisibilityToggle={() => state.setVisibility(v => v === 'public' ? 'private' : 'public')}
            userCompanies={state.userCompanies}
            onContextSwitch={actions.requestContextSwitch}
            currentUser={state.currentUser}
            isMobile={isMobile}
            isEdit={isEdit}
            activeCompanyId={state.postAsCompanyId}
          />
        )}

        <div className={cn(
          "flex-1 overflow-y-auto min-h-0 custom-scrollbar bg-background/50",
          isMobile ? "px-4 py-4" : "p-0",
          (state.postType === 'article' && !state.articleData) && "flex flex-col"
        )}>
          {!isMobile && (state.postType !== 'article' || isArticleCompose) && (
            <PostIdentity
              isCompanyPost={state.isCompanyPost}
              currentPoster={state.currentPoster}
              currentUser={state.currentUser}
            />
          )}

          {!isMobile && state.postType !== 'article' && (
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border/50">
              <PostTypeSelector
                activeType={state.postType}
                onTypeChange={(type) => {
                  if (type === 'article') {
                    const { setArticleMode } = useUIStore.getState();
                    onClose();
                    setArticleMode(true);
                    router.push('/article/create');
                  } else {
                    state.setPostType(type);
                  }
                }}
                isEdit={isEdit}
                isMobile={false}
              />
            </div>
          )}

          {isMobile && !isEdit && state.postType !== 'article' && (
            <PostTypeSelector
              activeType={state.postType}
              onTypeChange={(type) => {
                if (type === 'article') {
                  const { setArticleMode } = useUIStore.getState();
                  onClose();
                  setArticleMode(true);
                  router.push('/article/create');
                } else {
                  state.setPostType(type);
                }
              }}
              isEdit={isEdit}
              isMobile={true}
              className="mb-4"
            />
          )}

          {!isMobile && state.postType !== 'article' && (
            <CategorySelector
              isCompanyPost={state.isCompanyPost}
              currentPoster={state.currentPoster}
              postCategory={state.postCategory}
              onCategoryChange={state.handleSetPostCategory}
            />
          )}

          <div className={cn(isMobile ? "" : ((state.postType === 'article' && !state.articleData) ? "p-0 flex-1 flex flex-col" : "p-6"))}>
            {renderPostFlow()}
           <SharedPreview sharedPost={state.sharedPost} isMobile={isMobile} disableNavigation />
          </div>
        </div>

        {!state.isEditingMedia && (state.postType !== 'article' || isArticleCompose) && (
          <CreatePostFooter
            onPost={actions.handlePost}
            isSubmitting={state.isSubmitting}
            isMobile={isMobile}
            isEdit={isEdit}
            isCompanyPost={state.isCompanyPost}
            notifyEmployees={state.notifyEmployees}
            onNotifyEmployeesToggle={state.setNotifyEmployees}
            isBroadcast={state.isBroadcast}
            onBroadcastToggle={state.setIsBroadcast}
            postType={state.postType}
          />
        )}

        {state.showContextWarning && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-popover border rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold">Discard changes?</h3>
              <p className="text-sm text-muted-foreground">Switching accounts will discard your current draft. Do you want to proceed?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => state.setShowContextWarning(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={actions.confirmContextSwitch}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard & Switch
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
