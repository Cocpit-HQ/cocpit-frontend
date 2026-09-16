import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PostUploadProgressStripProps {
  progress: number;
  phase: 'uploading' | 'processing' | 'error' | 'success';
  onCancel: () => void;
}

export const PostUploadProgressStrip = ({
  progress,
  phase,
  onCancel,
}: PostUploadProgressStripProps) => {
  if (phase === 'success') {
    return (
      <div className="w-full flex items-center justify-between py-3 mt-2">
        <span className="ds-text-body text-ds-text-primary">
          Posted
        </span>
        <div className="w-5 h-5 rounded-full border-[2px] border-[var(--ds-success)] flex items-center justify-center">
          <Check className="w-3 h-3 text-[var(--ds-success)]" strokeWidth={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center gap-2 pt-2 pb-1 mt-2">
      <div className="flex items-center justify-between self-stretch">
        <span className="ds-text-body text-ds-text-primary tracking-normal">
          {phase === 'uploading' && 'Post uploading'}
          {phase === 'processing' && 'Processing...'}
          {phase === 'error' && 'Upload failed'}
        </span>
        <span className="ds-text-body text-ds-text-primary tracking-normal">
          {phase === 'uploading' && `${progress} %`}
          {phase === 'processing' && '100 %'}
        </span>
      </div>

      <div className="self-stretch h-[6px] bg-ds-surface-2 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            phase === 'error' ? "bg-[var(--ds-error)]" : "bg-[var(--ds-accent)]",
            phase === 'processing' && "w-full animate-pulse"
          )}
          style={{ width: phase === 'processing' || phase === 'error' ? '100%' : `${progress}%` }}
        />
      </div>

      {phase === 'uploading' && (
        <div className="flex justify-end w-full mt-1">
          <button
            onClick={onCancel}
            className="ds-text-secondary text-ds-accent hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0"
          >
            Cancel upload
          </button>
        </div>
      )}
    </div>
  );
};
