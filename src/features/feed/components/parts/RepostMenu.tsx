import React, { useState, useRef, useEffect } from 'react';
import { Repeat2 } from 'lucide-react';

export const RepostMenu = ({ onRepost, onRepostWithThoughts, shares }: { onRepost?: () => void, onRepostWithThoughts?: () => void, shares?: string | number }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
        className="flex h-[24px] flex-row items-center gap-[16px] group"
        aria-label="Repost"
        title="Repost"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          className="text-foreground transition-colors group-hover:text-gray-600"
        >
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="M8.5 15S5 17.578 5 18.5S8.5 22 8.5 22"/>
            <path d="M5.5 18.5h8c3.288 0 4.931 0 6.038-.908q.304-.25.554-.554C21 15.93 21 14.288 21 11m-5.5-2S19 6.422 19 5.5S15.5 2 15.5 2"/>
            <path d="M18.5 5.5h-8c-3.287 0-4.931 0-6.038.908a4 4 0 0 0-.554.554C3 8.07 3 9.712 3 13"/>
          </g>
        </svg>
        <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground">
          {shares}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-60 p-1.5 bg-white rounded-tl-3xl rounded-tr-3xl rounded-br-3xl outline outline-1 outline-offset-[-1px] outline-indigo-200 z-50 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-sm">
          <button
            onClick={() => { setOpen(false); onRepostWithThoughts?.(); }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-3xl text-sm font-['Poppins'] text-black hover:bg-gray-50 transition-colors"
          >
            <span>Repost with thoughts</span>
            <Repeat2 className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => { setOpen(false); onRepost?.(); }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-3xl text-sm font-['Poppins'] text-black hover:bg-gray-50 transition-colors"
          >
            <span>Repost</span>
            <Repeat2 className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
