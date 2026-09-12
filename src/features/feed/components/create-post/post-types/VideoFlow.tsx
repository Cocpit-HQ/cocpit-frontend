import React from 'react';
import { Video, X, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import RichTextEditor from '../shared/RichTextEditor';
import { MediaItem } from '../types';
import PostVideoCard from './PostVideoCard';

interface VideoFlowProps {
  uploadedVideos: MediaItem[];
  isMobile: boolean;
  isEdit: boolean;
  caption: string;
  onCaptionChange: (html: string) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (id: string) => void;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  isEditingMedia?: boolean;
  setIsEditingMedia?: (isEditing: boolean) => void;
  currentUser?: any;
  currentPoster?: any;
  isCompanyPost?: boolean;
}

const VideoFlow = ({
  uploadedVideos,
  isMobile,
  isEdit,
  caption,
  onCaptionChange,
  onVideoUpload,
  onRemoveVideo,
  videoInputRef,
  isEditingMedia,
  setIsEditingMedia,
  currentUser,
  currentPoster,
  isCompanyPost
}: VideoFlowProps) => {
  const hasVideos = uploadedVideos.length > 0;

  const authorName = (isCompanyPost ? currentPoster?.name : (currentPoster?.name || currentUser?.name)) || 'Marcus avery';
  const authorAvatar = (isCompanyPost 
    ? (currentPoster?.logo_url || currentPoster?.avatar_url || currentPoster?.logo || currentPoster?.image)
    : (currentUser?.image || currentPoster?.logo_url || '/assets/pngegg.png')) || '/assets/pngegg.png';
  const authorRole = (isCompanyPost ? 'Company' : (currentUser?.headline || currentUser?.role)) || 'Senior product designer';

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {!hasVideos ? (
          <div className="flex-grow flex flex-col justify-center items-center gap-4">
            {!isEdit && (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-muted hover:bg-muted/90 text-foreground transition-colors"
              >
                <Video className="w-6 h-6" />
                Browse from Gallery
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <RichTextEditor
              content={caption}
              onChange={onCaptionChange}
              placeholder="Write a caption..."
              className={`bg-transparent border shadow-none transition-none ${(isEdit && isEditingMedia) ? 'absolute opacity-0 pointer-events-none -z-10 w-0 h-0 overflow-hidden m-0 p-0 border-none' : ''}`}
              editorClassName="overflow-y-auto resize-none custom-scrollbar min-h-0"
              style={{ minHeight: '96px', maxHeight: '200px' }}
            />

            <div className="relative group max-w-[442px] mx-auto w-full">
              <PostVideoCard
                videoSrc={uploadedVideos[0].url}
                author={authorName}
                authorId={currentUser?.id || currentPoster?.id}
                authorAvatar={authorAvatar}
                authorRole={authorRole}
                content={caption}
                showHeader={true}
                showFooter={true}
                isPreview={true}
                isMe={true}
                isCompanyPost={isCompanyPost}
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => onRemoveVideo(uploadedVideos[0].id)}
                  className="absolute top-3 left-3 p-2 rounded-full transition-colors bg-black/60 text-white hover:bg-black/80 z-30 shadow-md cursor-pointer"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {isEdit && !isEditingMedia && setIsEditingMedia && (
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(true)}
                  className="absolute top-3 left-3 p-2 bg-black/60 text-white rounded-full opacity-100 transition-opacity hover:bg-black/80 z-30 cursor-pointer shadow-md"
                  title="Edit video"
                >
                  <Icon icon="proicons:pencil" className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEdit && isEditingMedia && setIsEditingMedia && (
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(false)}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        <input ref={videoInputRef} type="file" accept="image/*,video/*" multiple onChange={onVideoUpload} className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasVideos ? (
        <div className="h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
          {!isEdit && (
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
        <div className="border rounded-lg p-4 space-y-4 bg-background border-border">
          <RichTextEditor
            content={caption}
            onChange={onCaptionChange}
            className={`bg-transparent border-none transition-none ${(isEdit && isEditingMedia) ? 'absolute opacity-0 pointer-events-none -z-10 w-0 h-0 overflow-hidden m-0 p-0' : ''}`}
            editorClassName="overflow-y-auto resize-none custom-scrollbar min-h-0"
            style={{ minHeight: '96px', maxHeight: '200px' }}
            placeholder="Add a caption..."
          />

          {(!isEdit || !isEditingMedia) && uploadedVideos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="relative flex-shrink-0 w-48 h-32 bg-black rounded-md overflow-hidden border border-border group">
                  <video src={video.url} className="w-full h-full object-cover" />
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => onRemoveVideo(video.id)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="relative group max-w-[442px] mx-auto w-full">
            <PostVideoCard
              videoSrc={uploadedVideos[0].url}
              author={authorName}
              authorId={currentUser?.id || currentPoster?.id}
              authorAvatar={authorAvatar}
              authorRole={authorRole}
              content={caption}
              showHeader={true}
              showFooter={true}
              isPreview={true}
              isMe={true}
              isCompanyPost={isCompanyPost}
            />
            {!isEdit && (
              <button
                type="button"
                onClick={() => onRemoveVideo(uploadedVideos[0].id)}
                className="absolute top-3 left-3 p-2 rounded-full transition-colors bg-black/60 text-white hover:bg-black/80 z-30 shadow-md cursor-pointer"
                title="Remove video"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isEdit && !isEditingMedia && setIsEditingMedia && (
              <button
                type="button"
                onClick={() => setIsEditingMedia(true)}
                className="absolute top-3 left-3 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-30 cursor-pointer shadow-md"
                title="Edit video"
              >
                <Icon icon="proicons:pencil" className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEdit && isEditingMedia && setIsEditingMedia && (
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsEditingMedia(false)}
                className="px-6 py-2 text-sm font-medium text-muted-foreground border border-border hover:bg-muted rounded-full transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMedia(false)}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <input ref={videoInputRef} type="file" accept="image/*,video/*" multiple onChange={onVideoUpload} className="hidden" />
    </div>
  );
};

export default VideoFlow;
