import React from "react";
import { Icon } from "@iconify/react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorToolbarProps {
  flipH: boolean;
  flipV: boolean;
  onToggleFlipH: () => void;
  onToggleFlipV: () => void;
  onRotate: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  disableDelete?: boolean;
  deleteIconRed?: boolean; // avatar uses text-[#FF6B6B], profile uses text-red-500
  className?: string;
  onToggleAspectRatio?: () => void;
}

export const ImageEditorToolbar: React.FC<ImageEditorToolbarProps> = ({
  flipH,
  flipV,
  onToggleFlipH,
  onToggleFlipV,
  onRotate,
  onDelete,
  isDeleting = false,
  disableDelete = false,
  deleteIconRed = false,
  className,
  onToggleAspectRatio,
}) => {
  return (
    <div className={cn("flex justify-center items-center gap-4 mb-6", className)}>
      {onToggleAspectRatio && (
        <button
          type="button"
          onClick={onToggleAspectRatio}
          className="p-1.5 text-foreground rounded-md transition-colors cursor-pointer"
          title="Aspect Ratio"
        >
          <Icon icon="ion:resize-outline" className="w-6 h-6" />
        </button>
      )}
      <button
        type="button"
        onClick={onToggleFlipV}
        className="p-1.5 rounded-md transition-colors cursor-pointer text-foreground"
      >
        <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onToggleFlipH}
        className="p-1.5 rounded-md transition-colors cursor-pointer text-foreground"
      >
        <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onRotate}
        className="p-1.5 text-foreground rounded-md transition-colors cursor-pointer"
      >
        <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || disableDelete}
        className={cn(
          "p-1.5 rounded-md transition-colors disabled:opacity-50 cursor-pointer",
          deleteIconRed
            ? "text-[#FF6B6B]"
            : "text-red-500"
        )}
      >
        {isDeleting ? (
          <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        ) : (
          <Icon icon="fluent:delete-16-regular" className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
