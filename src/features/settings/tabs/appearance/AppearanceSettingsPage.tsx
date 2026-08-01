"use client";

import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { updateAppearance } from '@/features/settings/api/preferences';

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      await updateAppearance(newTheme);
      toast.success('Appearance settings updated');
    } catch (error) {
      toast.error('Failed to save appearance settings');
    }
  };

  const themes = [
    {
      id: 'system',
      title: 'System',
      description: 'Optimal for long focus sessions',
      icon: Monitor,
    },
    {
      id: 'light',
      title: 'Light mode',
      description: 'Classic clean high-contrast view',
      icon: Sun,
    },
    {
      id: 'dark',
      title: 'Dark mode',
      description: 'Pure black for OLED efficiency',
      icon: Moon,
    }
  ] as const;

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        
        {/* Header */}
        <div className="flex flex-col w-full h-[56px] justify-between mb-2">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Appearance</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px]">Customize your view and system behavior.</p>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          <div className="flex flex-row items-center border-b border-white w-full mb-4">
            <h2 className="text-[18px] font-medium text-black leading-[26px]">Theme</h2>
          </div>
          
          <div className="flex flex-col w-full">
            {themes.map((t, index) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              
              return (
                <div 
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as 'system' | 'light' | 'dark')}
                  className={`flex flex-row items-center justify-between p-4 cursor-pointer rounded-[12px] transition-colors hover:bg-gray-50 ${index !== themes.length - 1 ? 'border-b border-[#DADADA]' : ''}`}
                >
                  <div className="flex flex-row items-center gap-4">
                    <Icon className="w-6 h-6 text-black" strokeWidth={1.5} />
                    <div className="flex flex-col justify-center">
                      <span className="text-[16px] font-normal text-black leading-[24px]">{t.title}</span>
                      <span className="text-[12px] font-normal text-[#6B7280] leading-[16px]">{t.description}</span>
                    </div>
                  </div>
                  
                  {/* Custom Radio Button */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${isSelected ? 'border-[#6366F1]' : 'border-[#6B7280]'}`}>
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
