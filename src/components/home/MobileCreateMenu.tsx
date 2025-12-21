"use client";

import React from 'react';
import { Image, Video, BarChart2, FileText } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useTheme } from 'next-themes';

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const options = [
    { type: 'text' as const, label: 'Text', icon: FileText, color: 'text-gray-500' },
    { type: 'photo' as const, label: 'Photo', icon: Image, color: 'text-blue-500' },
    { type: 'video' as const, label: 'Video', icon: Video, color: 'text-green-500' },
    { type: 'poll' as const, label: 'Poll', icon: BarChart2, color: 'text-orange-500' },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`rounded-t-xl ${isDark ? 'bg-[#1f2534] border-[#2d3548]' : 'bg-white'}`}>
        <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 p-4">
          <DrawerTitle className={`text-center text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isDark
                    ? 'hover:bg-[#2d3548] bg-[#242b3d]'
                    : 'hover:bg-gray-50 bg-gray-50/50 border border-gray-100'
                }`}
              >
                <div className={`p-3 rounded-full ${isDark ? 'bg-[#171c28]' : 'bg-white'} shadow-sm`}>
                  <Icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <span className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
