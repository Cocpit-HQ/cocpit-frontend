import React, { useState, useRef, useEffect } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';
import { Smile } from 'lucide-react';

interface CommentSectionProps {
  comments: CommentType[];
  isDark?: boolean; // Optional for compatibility
  onAddComment: (commentText: string) => void;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
      setShowPicker(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newComment;
    const newText = text.substring(0, start) + emoji + text.substring(end);

    setNewComment(newText);

    // Restore cursor position after React render
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
    setShowPicker(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="p-4 md:p-6 bg-muted/30 overflow-visible">

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3 mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden flex-shrink-0">
          {/* This would be the current user's avatar */}
          <img src="/assets/pngegg.png" alt="Your avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 pr-10 border rounded-lg focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border min-h-[80px]"
              rows={2}
            />
            
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showPicker && (
              <div ref={pickerRef} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] md:absolute md:top-auto md:left-auto md:right-0 md:bottom-full md:mb-2 md:translate-x-0 md:translate-y-0 shadow-xl rounded-lg overflow-hidden bg-card border border-border w-64">
                <div className="p-2 grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="p-1.5 hover:bg-muted rounded text-xl transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
            >
              Post
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="md:max-h-96 md:overflow-y-auto overflow-visible">

        <CommentList comments={comments} />
      </div>
    </div>
  );
}
