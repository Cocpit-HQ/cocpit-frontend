import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CreatePostModalProps } from '../types';
import { useCreatePostForm } from '../hooks/use-create-post-form';
import RichTextEditor from './shared/RichTextEditor';
import { useUIStore } from '@/store/ui.store';

// Shared Layout Components
import CreatePostHeader from './CreatePostHeader';
import CreatePostFooter from './CreatePostFooter';
import PostTypeSelector from './PostTypeSelector';
import CategorySelector from './shared/CategorySelector';
import PostIdentity from './shared/PostIdentity';
import SharedPreview from './SharedPreview';

// Post Flows
import TextFlow from './flows/TextFlow';
import PhotoFlow from './flows/PhotoFlow';
import VideoFlow from './flows/VideoFlow';
import PollFlow from './flows/PollFlow';
import ArticleFlow from './flows/ArticleFlow';

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
      router.push('/feed');
    }
  }, [isOpen, state.postType, state.articleData, isEdit, router]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);

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
            onAspectChange={media.setAspectRatio}
            galleryInputRef={galleryInputRef}
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
          />
        );
      case 'article':
        if (state.articleData) {
          return (
            <div className="border rounded-lg p-4 space-y-4 bg-background border-border">
              <RichTextEditor
                content={state.description}
                onChange={state.setDescription}
                className="bg-transparent border-none min-h-[100px]"
                editorClassName="min-h-[100px]"
                placeholder="Add a caption..."
              />
              
              <div className="flex justify-center w-full">
                <div className="relative group w-full max-w-[420px]">
                  <button
                    type="button"
                    onClick={() => {
                      const { setArticleMode, setActiveModal, setArticleDraft } = useUIStore.getState();
                      setArticleDraft({
                        title: state.articleTitle,
                        content: state.articleContent,
                        coverImage: media.uploadedImages[0] || null,
                        description: state.description,
                        articleData: null
                      });
                      state.setArticleData(null);
                      onClose();
                      setArticleMode(true);
                      router.push('/feed');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-destructive transition-all duration-200 z-10 cursor-pointer"
                    title="Edit article"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="block w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="w-full h-[180px] bg-indigo-50 overflow-hidden">
                      {state.articleData.coverImage ? (
                        <img src={state.articleData.coverImage.url} alt={state.articleData.title || 'Article cover'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-400">
                          <Icon icon="ph:article" className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-4 text-left">
                      <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-foreground font-poppins">
                        {state.articleData.title || 'Untitled Article'}
                      </h3>
                      {state.articleData.subtitle && (
                        <p className="line-clamp-2 text-[12px] leading-4 text-muted-foreground font-poppins">
                          {state.articleData.subtitle}
                        </p>
                      )}
                      <span className="text-[12px] font-medium text-[#6366F1] transition-colors font-poppins">
                        Read More
                      </span>
                    </div>
                  </a>
                </div>
              </div>
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
            onCoverUpload={(e) => media.handlePhotoUpload(e, isEdit)}
            onRemoveCover={() => media.clearMedia()}
            isEdit={isEdit}
            coverInputRef={articleCoverInputRef}
            caption={state.description}
            onCaptionChange={state.setDescription}
            onPost={actions.handlePost}
            isSubmitting={state.isSubmitting}
            onClose={handleArticleBack}
            currentUser={state.currentUser}
            currentPoster={state.currentPoster}
            isCompanyPost={state.isCompanyPost}
            onArticleComplete={handleArticleComplete}
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
            ? "w-full h-full max-w-none rounded-none flex flex-col pt-0 pb-0"
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
              ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url || '/assets/pngegg.png')
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
          "flex-1 overflow-y-auto custom-scrollbar bg-background/50",
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
                    router.push('/feed');
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
                  router.push('/feed');
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

            <SharedPreview sharedPost={state.sharedPost} isMobile={isMobile} />
          </div>
        </div>

        {(state.postType !== 'article' || isArticleCompose) && (
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
