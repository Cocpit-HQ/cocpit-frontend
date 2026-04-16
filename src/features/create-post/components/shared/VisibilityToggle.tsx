import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PostVisibility } from '@/types/entities';

interface VisibilityToggleProps {
  visibility: PostVisibility;
  onToggle: () => void;
  className?: string;
  isMobile?: boolean;
}

const VisibilityToggle = ({
  visibility,
  onToggle,
  className = "",
  isMobile = false
}: VisibilityToggleProps) => {
  if (isMobile) {
    return (
      <button
        onClick={onToggle}
        className={`text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 flex items-center gap-1.5 transition-colors font-medium border border-border ${className}`}
      >
        {visibility === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {visibility === 'public' ? 'Public' : 'Private'}
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted hover:bg-muted/80 flex items-center gap-1 transition-colors border border-border/50 ${className}`}
    >
      {visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {visibility === 'public' ? 'Public' : 'Private'}
    </button>
  );
};

export default VisibilityToggle;
