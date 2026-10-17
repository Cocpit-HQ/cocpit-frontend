"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PeopleListModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  children?: React.ReactNode;
}

export function PeopleListModal({
  title,
  isOpen,
  onClose,
  isLoading = false,
  emptyState,
  children,
}: PeopleListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] w-[90%] max-h-[80vh] p-6 rounded-[24px] bg-white dark:bg-card flex flex-col gap-0 overflow-hidden shadow-xl border-none">
        <DialogHeader className="p-0 pb-4 flex flex-col items-center justify-center border-b border-slate-100 dark:border-border">
          <DialogTitle className="text-center text-lg font-medium font-['Poppins'] leading-6 text-black dark:text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : children ? (
            <div className="flex flex-col gap-2">{children}</div>
          ) : (
            emptyState ?? null
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}