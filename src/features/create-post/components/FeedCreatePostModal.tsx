import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Image as ImageIcon, BarChart2, FileText, Target, Users, Sparkles, ChevronDown, Check } from 'lucide-react';
import { CreatePostModalProps } from '../types';
import { useCreatePostForm } from '../hooks/use-create-post-form';

// Post Flows
import PhotoFlow from './flows/PhotoFlow';
import VideoFlow from './flows/VideoFlow';
import PollFlow from './flows/PollFlow';
import ArticleFlow from './flows/ArticleFlow';
import SharedPreview from './SharedPreview';

export const FeedCreatePostModal = (props: CreatePostModalProps) => {
  const { isOpen, onClose } = props;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  const { state, media, poll, actions } = useCreatePostForm({ ...props, isMobile });
  
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!props.editPostId;

  const currentPosterName = (state.currentPoster as any)?.name || state.currentUser?.name || 'User';
  // Use either username or a fallback based on name
  const currentPosterHandle = (state.currentPoster as any)?.username || currentPosterName.toLowerCase().replace(/\s+/g, '');
  const currentPosterLogo = state.isCompanyPost 
    ? ((state.currentPoster as any)?.logo_url || (state.currentPoster as any)?.avatar_url || '/assets/pngegg.png') 
    : (state.currentUser?.image || '/assets/pngegg.png');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] w-full p-0 border-none rounded-[24px] bg-white shadow-2xl overflow-hidden font-poppins h-[492px] flex flex-col items-center z-[101]">
        <DialogTitle className="sr-only">Create Post</DialogTitle>
        
        {/* Close Button */}
        <div 
          className="absolute right-[21.8px] top-[21.8px] w-6 h-6 flex justify-center items-center cursor-pointer z-10" 
          onClick={onClose}
        >
          <div className="w-[20px] h-[20px] rounded-sm bg-transparent flex items-center justify-center">
             <X className="w-5 h-5 text-[#FF6B6B]" strokeWidth={2} />
          </div>
        </div>

        <div className="w-full max-w-[568px] flex flex-col items-center pt-6 gap-4 px-4 h-full">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 w-full">
            <h2 className="font-medium text-[18px] leading-[26px] text-black">Create</h2>
            <p className="font-normal text-[12px] leading-[16px] text-[#6B7280]">
              Post jobs, insights, or milestones to grow your presence.
            </p>
          </div>

          {/* Profile */}
          <div className="relative flex flex-row items-center justify-start gap-4 w-full h-[42px] mt-2 z-[60]">
            <button 
              onClick={() => !isEdit && setShowAccountSelector(!showAccountSelector)}
              className="flex flex-row items-center justify-start gap-4 hover:opacity-80 transition-opacity text-left"
              disabled={isEdit}
            >
              <img 
                src={currentPosterLogo} 
                alt="avatar" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-[18px] leading-[26px] text-black">{currentPosterName}</span>
                  {!isEdit && <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${showAccountSelector ? 'rotate-180' : ''}`} />}
                </div>
                <span className="font-normal text-[12px] leading-[16px] text-[#6B7280]">@{currentPosterHandle}</span>
              </div>
            </button>

            {showAccountSelector && !isEdit && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-xl shadow-xl z-[100] overflow-hidden">
                <div className="p-2 max-h-[250px] overflow-y-auto">
                  <button
                    onClick={() => { actions.requestContextSwitch(null); setShowAccountSelector(false); }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <img src={state.currentUser?.image || '/assets/pngegg.png'} className="w-8 h-8 rounded-full border" />
                    <div className="flex-grow flex flex-col min-w-0">
                      <span className="text-xs font-bold text-black truncate">{state.currentUser?.name}</span>
                      <span className="text-[10px] text-[#6B7280]">Personal Account</span>
                    </div>
                    {!state.isCompanyPost && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                  <div className="h-px bg-gray-200 my-2" />
                  {state.userCompanies.map(c => {
                    const cid = c.company_id || (c as any).org_id;
                    return (
                      <button
                        key={cid}
                        onClick={() => { actions.requestContextSwitch(cid || null); setShowAccountSelector(false); }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <img src={c.logo_url || (c as any).avatar_url || '/assets/pngegg.png'} className="w-8 h-8 rounded-full border bg-white" />
                        <div className="flex-grow flex flex-col min-w-0">
                          <span className="text-xs font-bold text-black truncate">{c.name}</span>
                          <span className="text-[10px] text-[#6B7280]">Organization</span>
                        </div>
                        {state.isCompanyPost && cid === state.postAsCompanyId && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Media Actions */}
          <div className="flex flex-row items-start gap-4 w-full h-[40px] mt-2">
            {[
              { icon: ImageIcon, label: 'Image', type: 'photo' },
              { icon: BarChart2, label: 'Poll', type: 'poll' },
              { icon: FileText, label: 'Article', type: 'article' },
              { icon: Target, label: 'Milestone', type: 'milestone' },
              { icon: Users, label: 'Find expert', type: 'expert' }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => state.setPostType(action.type as any)}
                className={`w-14 h-10 rounded-[24px] bg-white flex justify-center items-center transition-colors border ${state.postType === action.type ? 'border-indigo-200 bg-indigo-50' : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                title={action.label}
              >
                <action.icon className="w-6 h-6 text-black" strokeWidth={1.5} />
              </button>
            ))}
          </div>

          {/* Flow Content */}
          <div className="flex flex-col w-full flex-1 mt-4 overflow-y-auto custom-scrollbar">
            {state.postType === 'text' && (
              <textarea
                className="w-full h-full resize-none outline-none font-medium text-[16px] leading-[24px] text-black placeholder:text-[#6B7280] bg-transparent custom-scrollbar"
                placeholder="What would you like to share today?"
                value={state.description}
                onChange={(e) => state.setDescription(e.target.value)}
              />
            )}
            
            {state.postType === 'photo' && (
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
                onFitModeChange={media.handleFitModeChange}
                onCropComplete={media.handleCropComplete}
                onAspectChange={media.setAspectRatio}
                galleryInputRef={galleryInputRef}
              />
            )}

            {state.postType === 'video' && (
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
            )}

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

            {state.postType === 'article' && (
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
              />
            )}

            <SharedPreview sharedPost={state.sharedPost} isMobile={isMobile} />
          </div>

          {/* Footer */}
          <div className="flex flex-row justify-between items-center w-full h-[40px] mt-auto pb-6">
            <button className="flex flex-row items-center justify-center gap-2 px-4 py-2 border border-[#818CF8] rounded-[24px] bg-white hover:bg-[#818CF8]/10 transition-colors">
              <Sparkles className="w-4 h-4 text-[#818CF8]" />
              <span className="font-normal text-[14px] leading-[20px] text-[#818CF8]">Enhance with AI</span>
            </button>
            
            <button 
              onClick={actions.handlePost}
              disabled={state.isSubmitting || !state.description.trim()}
              className="flex flex-row items-center justify-center px-6 py-2 bg-[#C7D2FE] border border-white rounded-[24px] hover:bg-[#818CF8] transition-colors disabled:opacity-50 disabled:hover:bg-[#C7D2FE]"
            >
              <span className="font-normal text-[14px] leading-[20px] text-white">
                {state.isSubmitting ? 'Posting...' : 'Post'}
              </span>
            </button>
          </div>
        </div>

        {/* Context Switch Warning */}
        {state.showContextWarning && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 font-poppins">
              <h3 className="text-[18px] leading-[26px] font-medium text-black">Discard changes?</h3>
              <p className="text-[14px] leading-[20px] text-[#6B7280]">Switching accounts will discard your current draft. Do you want to proceed?</p>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => state.setShowContextWarning(false)}
                  className="px-4 py-2 rounded-[24px] text-sm font-medium hover:bg-gray-100 text-black border transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={actions.confirmContextSwitch}
                  className="px-4 py-2 rounded-[24px] text-sm font-medium bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90 transition-colors"
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
