"use client";

import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { useActiveProfile } from '@/context/ActiveProfileContext';

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isCompany } = useActiveProfile();

  const handleThemeChange = (newTheme: 'dark') => {
    setTheme(newTheme);
    toast.success('Appearance settings updated');
  };

  const themes = [
    {
      id: 'dark',
      title: 'Dark mode',
      description: 'Pure black for OLED efficiency (Default)',
      icon: Moon,
    },
    /*
    {
      id: 'light',
      title: 'Light mode',
      description: 'Classic clean high-contrast view',
      icon: Sun,
    },
    {
      id: 'system',
      title: 'System',
      description: 'Sync with your operating system',
      icon: Monitor,
    },
    */
  ] as const;

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        
        {/* Header */}
        <div className="flex flex-col w-full h-[56px] justify-between mb-2">
          <h1 className="text-[24px] font-semibold text-black dark:text-foreground leading-[32px]">Appearance</h1>
          <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px]">Customize your view and system behavior.</p>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          <div className="flex flex-row items-center border-b border-white w-full mb-4">
            <h2 className="text-[18px] font-medium text-black dark:text-foreground leading-[26px]">Theme</h2>
          </div>
          
          <div className="flex flex-col w-full border border-[#E5E7EB] dark:border-border rounded-[16px] bg-white dark:bg-card">
            {themes.map((t, index) => {
              const Icon = t.icon;
              const currentTheme = theme || 'dark';
              const isSelected = currentTheme === t.id || (t.id === 'dark' && currentTheme === 'navy');
              
              return (
                <div 
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as 'dark')}
                  className={`flex flex-row items-center justify-between p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-secondary ${
                    index === 0 ? 'rounded-t-[16px]' : ''
                  } ${
                    index === themes.length - 1 ? 'rounded-b-[16px]' : 'border-b border-[#E5E7EB] dark:border-border'
                  }`}
                >
                  <div className="flex flex-row items-center gap-4">
                    <Icon className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
                    <div className="flex flex-col justify-center">
                      <span className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">{t.title}</span>
                      <span className="text-[12px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[16px]">{t.description}</span>
                    </div>
                  </div>
                  
                  {/* Custom Radio Button */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-[2px] transition-colors ${
                    isSelected 
                      ? (isCompany ? 'border-[#1A73E8]' : 'border-[#6366F1]') 
                      : 'border-[#6B7280]'
                  }`}>
                    {isSelected && (
                      <div className={`w-3 h-3 rounded-full ${isCompany ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'}`} />
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
