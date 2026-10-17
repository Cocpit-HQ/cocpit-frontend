import React from 'react';

interface CommentActionSnackbarProps {
  message: string;
  onUndo?: () => void;
}

export function CommentActionSnackbar({ message, onUndo }: CommentActionSnackbarProps) {
  return (
    <div className="flex items-center justify-between w-full min-h-[48px] bg-ds-surface-2 px-4 py-2.5 rounded-[8px] border border-ds-border font-dmsans transition-all duration-300 animate-in fade-in">
      <span className="text-ds-text-primary text-[14px] font-normal leading-tight flex-1 mr-4">
        {message}
      </span>
      {onUndo && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUndo();
          }}
          className="text-ds-accent text-[14px] font-medium hover:opacity-80 transition-opacity cursor-pointer focus:outline-none flex-shrink-0 select-none"
        >
          Undo
        </button>
      )}
    </div>
  );
}
