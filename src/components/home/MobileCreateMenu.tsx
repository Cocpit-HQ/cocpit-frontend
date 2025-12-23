"use client";

import React from 'react';
import { Image, Video, BarChart2, FileText } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

type PostType = 'text' | 'photo' | 'video' | 'poll';

interface MobileCreateMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptionClick: (type: PostType) => void;
}

export default function MobileCreateMenu({
  open,
  onOpenChange,
  onOptionClick,
}: MobileCreateMenuProps) {
  // Removed useTheme

  const options = [
    { type: 'text' as const, label: 'Text', icon: FileText, color: 'text-muted-foreground' },
    { type: 'photo' as const, label: 'Photo', icon: Image, color: 'text-blue-500' },
    { type: 'video' as const, label: 'Video', icon: Video, color: 'text-green-500' },
    { type: 'poll' as const, label: 'Poll', icon: BarChart2, color: 'text-orange-500' },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-xl bg-card border-border">
        <DrawerHeader className="border-b border-border p-4">
          <DrawerTitle className="text-center text-base font-semibold text-foreground">
            Create
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 grid gap-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => onOptionClick(option.type)}
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-muted bg-card border border-border"
              >
                <div className="p-3 rounded-full bg-muted shadow-sm">
                  <Icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <span className="text-lg font-medium text-foreground">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
