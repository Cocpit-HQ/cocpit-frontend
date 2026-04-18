import React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import RichTextEditor from '../shared/RichTextEditor';
import { MediaItem } from '../../types';

interface ArticleFlowProps {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (html: string) => void;
  coverImage: MediaItem | null;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover: () => void;
  isEdit: boolean;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
}

const ArticleFlow = ({
  title,
  onTitleChange,
  content,
  onContentChange,
  coverImage,
  onCoverUpload,
  onRemoveCover,
  isEdit,
  coverInputRef
}: ArticleFlowProps) => {

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Cover Media Section */}
      <div className="flex flex-col items-center justify-center p-4">
        {coverImage ? (
          <div className="relative w-full max-h-96 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            {coverImage.file?.type.startsWith('image/') || coverImage.type === 'image' ? (
              <img src={coverImage.url} alt="Cover" className="max-h-96 object-contain" />
            ) : (
              <video src={coverImage.url} controls className="max-h-96 object-contain" />
            )}
            {!isEdit && (
              <button
                onClick={onRemoveCover}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20">
            {!isEdit && (
              <>
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Add a cover image or video to your article.</p>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={onCoverUpload}
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Upload from computer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title Field */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Start article title here"
        className="w-full text-xl md:text-2xl px-6 bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/70 text-foreground"
      />

      {/* Article Content Editor */}
      <div className="relative flex-grow">
        <RichTextEditor
          content={content}
          onChange={onContentChange}
          className="mx-6 mb-6 bg-card/50 min-h-[300px] border-none shadow-none"
          editorClassName="min-h-[300px] px-0 py-4"
          placeholder="Write your article here..."
        />
      </div>
    </div>
  );
};

export default ArticleFlow;
