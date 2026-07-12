'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MousePointer2, Hand, MessageCircle, Paperclip, Grid3x3, Link as LinkIcon, Code2 } from 'lucide-react';
import * as channelService from '../services/channel.service';
import { CollaborationMode } from '../types/channel.types';

interface ChannelCollaborationBarProps {
  mode: CollaborationMode;
  onModeChange: (mode: CollaborationMode) => void;
}

const modeButtons: { mode: CollaborationMode; icon: React.ReactNode; title: string }[] = [
  { mode: 'select', icon: <MousePointer2 className="w-4 h-4" />, title: 'Select' },
  { mode: 'pan', icon: <Hand className="w-4 h-4" />, title: 'Pan' },
  { mode: 'comment', icon: <MessageCircle className="w-4 h-4" />, title: 'Comment' },
];

const insertTools = [
  { icon: <Paperclip className="w-4 h-4" />, title: 'Attach' },
  { icon: <Grid3x3 className="w-4 h-4" />, title: 'Table' },
  { icon: <LinkIcon className="w-4 h-4" />, title: 'Link embed' },
  { icon: <Code2 className="w-4 h-4" />, title: 'Code block' },
];

export default function ChannelCollaborationBar({ mode, onModeChange }: ChannelCollaborationBarProps) {
  const requestEdit = useMutation({
    mutationFn: () => channelService.requestEditAccess(),
    onSuccess: () => toast.success('Edit access requested from the channel owner.'),
  });

  return (
    <div className="fixed bottom-6 left-1/2 md:left-[calc(50%+116px)] -translate-x-1/2 z-50 flex items-center gap-1 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-[#2E3445] rounded-full shadow-lg px-2 py-2">
      {modeButtons.map((btn) => (
        <button
          key={btn.mode}
          onClick={() => onModeChange(btn.mode)}
          title={btn.title}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            mode === btn.mode
              ? 'bg-[#1A73E8] text-white'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1C2340]'
          }`}
        >
          {btn.icon}
        </button>
      ))}

      <button
        onClick={() => requestEdit.mutate()}
        disabled={requestEdit.isPending}
        className="ml-1 px-4 h-9 rounded-full bg-[#EFF4FF] dark:bg-[#1A2435] text-[#1A73E8] dark:text-[#4D9CFF] text-xs font-semibold font-['Poppins'] hover:bg-[#dbe7ff] transition-colors disabled:opacity-50"
      >
        Ask to edit
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-[#2E3445] mx-1" />

      {insertTools.map((tool) => (
        <button
          key={tool.title}
          title={`${tool.title} (open the editor to use this)`}
          onClick={() => toast.info(`${tool.title} is available while writing an article.`)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1C2340] transition-colors"
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
