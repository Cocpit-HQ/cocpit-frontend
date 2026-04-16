import React from 'react';
import { Video, Plus, X, Trash2 } from 'lucide-react';
import RichTextEditor from '../shared/RichTextEditor';
import { MediaItem } from '../../types';

interface VideoFlowProps {
  uploadedVideos: MediaItem[];
  isMobile: boolean;
  isEdit: boolean;
  caption: string;
  onCaptionChange: (html: string) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (id: string) => void;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
}

const VideoFlow = ({
  uploadedVideos,
  isMobile,
  isEdit,
  caption,
  onCaptionChange,
  onVideoUpload,
  onRemoveVideo,
  videoInputRef
}: VideoFlowProps) => {

  const hasVideos = uploadedVideos.length > 0;

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
            <div className="relative">
              <video
                src={uploadedVideos[0].url}
                controls
                className="w-full rounded-lg bg-black/5"
              />
              {!isEdit && (
                <button
                  onClick={() => onRemoveVideo(uploadedVideos[0].id)}
                  className="absolute top-2 right-2 p-2 rounded-full transition-colors bg-black/50 text-white hover:bg-black/70"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <RichTextEditor
              content={caption}
              onChange={onCaptionChange}
              placeholder="Write a caption..."
              className="bg-transparent border shadow-none"
              editorClassName="min-h-[100px]"
            />
          </div>
        )}
        <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideoUpload} className="hidden" />
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
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedVideos.map((video) => (
              <div key={video.id} className="relative flex-shrink-0 w-48 h-32 bg-black rounded-md overflow-hidden border border-border group">
                <video src={video.url} className="w-full h-full object-cover" />
                {!isEdit && (
                  <button
                    onClick={() => onRemoveVideo(video.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!isEdit && (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed border-border hover:bg-muted transition-colors"
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
          <RichTextEditor
            content={caption}
            onChange={onCaptionChange}
            className="bg-transparent border-none min-h-[100px]"
            editorClassName="min-h-[100px]"
            placeholder="Add a caption..."
          />
        </div>
      )}
      <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={onVideoUpload} className="hidden" />
    </div>
  );
};

export default VideoFlow;
