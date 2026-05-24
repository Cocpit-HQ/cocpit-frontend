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
}) => {
  return (
    <div className={cn("flex justify-center items-center gap-4 mb-6", className)}>
      <button
        type="button"
        onClick={onToggleFlipV}
        className={cn(
          "p-1.5 rounded-md transition-colors cursor-pointer",
          flipV ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
        )}
      >
        <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onToggleFlipH}
        className={cn(
          "p-1.5 rounded-md transition-colors cursor-pointer",
          flipH ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
        )}
      >
        <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onRotate}
        className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
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
            ? "text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
            : "text-red-500 hover:bg-red-500/10"
        )}
      >
        {isDeleting ? (
          <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        ) : deleteIconRed ? (
          <Icon icon="fluent:delete-32-regular" className="w-6 h-6" />
        ) : (
          <Trash2 className="w-6 h-6" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
};
