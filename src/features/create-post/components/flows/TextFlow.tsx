import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { MentionTextarea } from '@/components/ui/MentionTextarea';

interface TextFlowProps {
  value: string;
  onChange: (value: string) => void;
  isMobile: boolean;
  sharedPost?: any;
  placeholder?: string;
  renderEmojiPicker?: (isDesktop: boolean) => React.ReactNode;
}

const TextFlow = ({
  value,
  onChange,
  isMobile,
  sharedPost,
  placeholder = "What's on your mind?",
  renderEmojiPicker
}: TextFlowProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-grow flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden">
          <MentionTextarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full flex-grow p-4 text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] bg-background text-black placeholder:text-muted-foreground resize-none focus:outline-none"
          />
          <div className="p-2 border-t bg-muted/10 flex items-center justify-between">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Smile className="w-6 h-6" />
            </button>
          </div>
        </div>
        {showEmojiPicker && renderEmojiPicker?.(false)}
      </div>
    );
  }

  return (
    <div className="relative">
      <MentionTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${sharedPost ? 'min-h-[80px] max-h-[200px] overflow-y-auto' : 'min-h-[280px]'} text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-black resize-none border-none focus:ring-0 p-0 pr-10 placeholder:text-muted-foreground/70 bg-transparent focus:outline-none`}
      />
      <div className="absolute top-0 right-0 z-20">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          type="button"
          className={`p-2 rounded-md transition-colors flex items-center gap-1 ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        {showEmojiPicker && renderEmojiPicker?.(true)}
      </div>
    </div>
  );
};

export default TextFlow;
