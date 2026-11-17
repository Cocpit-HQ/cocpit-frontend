"use client";

import React from "react";
import { Message } from "@/types/messaging";
import { useMessageEditor } from "../../hooks/useMessageEditor";

export interface MessageEditorProps {
  message: Message;
  isEditing?: boolean;
  onSaveEdit?: (text: string) => void;
  onCancelEdit?: () => void;
}

export const MessageEditor = ({
  message,
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
}: MessageEditorProps) => {
  const { text, setText, textareaRef, handleKeyDown } = useMessageEditor(
    message.text || message.text_content || "",
    isEditing,
    onSaveEdit,
    onCancelEdit,
  );

  return (
    <div className="flex flex-col gap-1 w-full min-w-[220px] sm:min-w-[300px] md:min-w-[400px] p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent outline-none resize-none p-1 text-inherit leading-snug overflow-hidden min-h-[40px]"
        rows={1}
      />
      <div className="flex justify-between items-center text-[10px] opacity-60 px-1 mt-1">
        <span>Enter to save, Esc to cancel</span>
      </div>
    </div>
  );
};

export default MessageEditor;

