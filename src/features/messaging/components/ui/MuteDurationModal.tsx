import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, BellOff } from "lucide-react";
import { MUTE_OPTIONS } from "../../utils/muteUtils";

interface MuteDurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDuration: (hours: number | null) => void;
  isGroup?: boolean;
}

export function MuteDurationModal({
  open,
  onOpenChange,
  onSelectDuration,
  isGroup = false,
}: MuteDurationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-[24px] rounded-b-none bg-[var(--ds-bg)] border border-[var(--ds-border)] text-[var(--ds-text-primary)] p-5 md:left-[50%] md:top-[50%] md:right-auto md:bottom-auto md:translate-x-[-50%] md:translate-y-[-50%] md:max-w-[320px] md:rounded-2xl animate-in slide-in-from-bottom duration-300 md:zoom-in-95 md:duration-200 shadow-2xl">
        <AlertDialogHeader className="pb-2">
          <AlertDialogTitle className="text-[var(--ds-text-primary)] font-['DM_Sans'] text-base font-semibold text-center">
            Mute {isGroup ? "group" : "chat"} notifications
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--ds-text-muted)] font-['DM_Sans'] text-xs text-center">
            Choose how long you want to mute notifications.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-1">
          {MUTE_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                onSelectDuration(option.hours);
                onOpenChange(false);
              }}
              className="w-full h-10 px-3.5 rounded-lg flex items-center justify-between text-left font-['DM_Sans'] text-sm text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none border border-transparent hover:border-[var(--ds-border)]"
            >
              <span>{option.label}</span>
              {option.hours ? (
                <Clock className="w-4 h-4 text-[var(--ds-text-muted)]" />
              ) : (
                <BellOff className="w-4 h-4 text-[var(--ds-text-muted)]" />
              )}
            </button>
          ))}
          <Button
            variant="ghost"
            className="w-full h-10 mt-1 font-['DM_Sans'] text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)] border-none"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
