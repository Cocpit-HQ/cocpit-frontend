import React, { useState, useRef, useEffect } from 'react';
import { useMentions } from '@/hooks/use-mentions';
import { UserMention } from '@/services/api/users';
import { HashtagSuggestion } from '@/services/api/hashtags';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CocpitMentionListCard } from '@/shared/commonComponents/CocpitMentionListCard';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  className?: string;
  editorClassName?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

const RichTextEditor = ({
  content,
  onChange,
  className = "",
  editorClassName = "",
  placeholder,
  style
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const {
    query, setQuery,
    mode, setMode,
    showSuggestions, setShowSuggestions,
    suggestionPosition, setSuggestionPosition,
    users, hashtags,
    activeIndex, setActiveIndex,
    isLoading,
    handleKeyDown: mentionKeyDown
  } = useMentions();

  // Sync content updates (e.g. from AI)
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSuggestions) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSuggestions, setShowSuggestions]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || "";

    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);

    if (mentionMatch || hashtagMatch) {
      savedRangeRef.current = range.cloneRange();
      const nextMode = mentionMatch ? 'mention' : 'hashtag';

      if (!showSuggestions || mode !== nextMode) {
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();

        if (editorRect) {
          setSuggestionPosition({
            top: rect.bottom - editorRect.top + 5,
            left: rect.left - editorRect.left
          });
        }
      }

      setQuery(mentionMatch ? mentionMatch[1] : hashtagMatch![1]);
      setMode(nextMode);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMode(null);
      savedRangeRef.current = null;
    }
  };

  const onSelect = (item: any, format: 'account' | 'full' = 'full') => {
    const range = savedRangeRef.current;
    if (!range) return;

    const textNode = range.startContainer;
    const offset = range.startOffset;

    const textContent = textNode.textContent || "";
    const textBefore = textContent.substring(0, offset);
    const textAfter = textContent.substring(offset);

    const matchRegex = mode === 'mention' ? /@([a-zA-Z0-9_]*)$/ : /#([a-zA-Z0-9_]*)$/;
    const match = textBefore.match(matchRegex);

    if (match) {
      const baseLeft = textBefore.substring(0, match.index);
      let injected = "";
      
      if (mode === 'mention') {
        const user = item as UserMention;
        const handle = user.account_name || user.full_name?.replace(/\s+/g, '').toLowerCase();
        const content = format === 'full' ? (user.full_name || handle) : handle;
        injected = `@[${content}](${handle}) `;
      } else {
        const tag = item as HashtagSuggestion;
        injected = `#${tag.tag} `;
      }

      textNode.textContent = baseLeft + injected + textAfter;
      
      const selection = window.getSelection();
      if (selection) {
        const newRange = document.createRange();
        newRange.setStart(textNode, baseLeft.length + injected.length);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      onChange(editorRef.current?.innerHTML || "");
      setShowSuggestions(false);
      setMode(null);
      savedRangeRef.current = null;
      editorRef.current?.focus();
    }
  };

  const highlightMatch = (text: string, queryText: string) => {
    if (!queryText.trim()) return text;
    try {
      const parts = text.split(new RegExp(`(${queryText})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === queryText.toLowerCase()
              ? <b key={i} className="text-primary font-bold">{part}</b>
              : part
          )}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col border rounded-lg border-border relative ${className}`}>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={(e) => mentionKeyDown(e, onSelect)}
        className={`prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3 ${editorClassName}`}
        style={{ outline: "none", ...style }}
        data-placeholder={placeholder}
      />

      {showSuggestions && (
        <div 
          ref={popupRef}
          className={cn(
            "absolute z-[100] bg-ds-bg border border-ds-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95",
            mode === 'mention' ? "w-[300px] h-[282px] p-3 box-border flex flex-col items-center gap-3" : "w-72"
          )}
          style={{ 
            top: suggestionPosition.top, 
            left: Math.min(suggestionPosition.left, (editorRef.current?.clientWidth || 300) - (mode === 'mention' ? 300 : 260)),
          }}
        >
          {mode === 'mention' ? (
            <CocpitMentionListCard
              users={users}
              activeIndex={activeIndex}
              query={query}
              isLoading={isLoading}
              onSelect={(user) => onSelect(user, 'account')}
              onHoverIndex={setActiveIndex}
              onDismiss={() => setShowSuggestions(false)}
              showNoResults={!isLoading && showSuggestions && users.length === 0 && !!query}
            />
          ) : (
            <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {hashtags.map((h, index) => (
                <div
                  key={h.tag}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(h);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer text-xs rounded-md transition-all",
                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                  )}
                >
                  <span className="font-medium text-ds-text-primary text-[var(--ds-text-primary)]" style={{ color: 'var(--ds-text-primary)' }}>#{highlightMatch(h.tag, query)}</span>
                  <span className="text-[10px] text-muted-foreground">{h.usage_count} posts</span>
                </div>
              ))}

              {isLoading && (
                <div className="px-3 py-3 text-[10px] text-muted-foreground animate-pulse text-center">
                  Searching...
                </div>
              )}
              
              {!isLoading && showSuggestions && hashtags.length === 0 && query && (
                <div className="px-3 py-3 text-[10px] text-muted-foreground italic text-center">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
