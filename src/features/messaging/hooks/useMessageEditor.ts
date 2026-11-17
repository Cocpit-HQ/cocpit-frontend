"use client";

import { useState, useEffect, useRef } from "react";

export const useMessageEditor = (
  initialText: string,
  isEditing: boolean = false,
  onSave?: (text: string) => void,
  onCancel?: () => void,
) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset text when editing starts
  useEffect(() => {
    if (isEditing) {
      setText(initialText);
      // Focus and resize after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length,
          );
          adjustHeight();
        }
      }, 0);
    }
  }, [isEditing, initialText]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  // Auto-resize on text change
  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave?.(text);
    } else if (e.key === "Escape") {
      onCancel?.();
    }
  };

  return { text, setText, textareaRef, handleKeyDown };
};

