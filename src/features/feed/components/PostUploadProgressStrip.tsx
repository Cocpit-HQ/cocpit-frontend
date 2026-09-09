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
      <div className="w-full flex items-center justify-between py-3 px-4 bg-ds-surface-1 border border-ds-border rounded-[8px] mt-4">
        <span className="text-[16px] text-ds-text-primary font-medium">
          Posted
        </span>
        <div className="w-5 h-5 rounded-full border-[2px] border-[var(--ds-success)] flex items-center justify-center">
          <Check className="w-3 h-3 text-[var(--ds-success)]" strokeWidth={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center items-end gap-[8px] py-[8px] px-[12px] bg-ds-surface-1 border border-ds-border rounded-[8px] mt-4 min-h-[70px]">
      <div className="flex items-center justify-between self-stretch">
        <span className="font-['DM_Sans'] text-[12px] leading-[16px] font-medium text-ds-text-primary tracking-normal text-center">
          {phase === 'uploading' && 'Post uploading'}
          {phase === 'processing' && 'Processing...'}
          {phase === 'error' && 'Upload failed'}
        </span>
        <span className="font-['DM_Sans'] text-[12px] leading-[16px] font-medium text-ds-text-primary tracking-normal text-center">
          {phase === 'uploading' && `${progress} %`}
          {phase === 'processing' && '100 %'}
        </span>
      </div>

      <div className="self-stretch h-[4px] bg-ds-surface-2 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            phase === 'error' ? "bg-red-500" : "bg-[var(--ds-accent)]",
            phase === 'processing' && "w-full animate-pulse"
          )}
          style={{ width: phase === 'processing' || phase === 'error' ? '100%' : `${progress}%` }}
        />
      </div>

      {phase === 'uploading' && (
        <button
          onClick={onCancel}
          className="text-[12px] text-[var(--ds-accent)] hover:underline cursor-pointer outline-none"
        >
          Cancel upload
        </button>
      )}
    </div>
  );
};
