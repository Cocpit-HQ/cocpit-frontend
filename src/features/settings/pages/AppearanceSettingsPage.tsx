"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
// import { SystemIcon, SunIcon } from '@/components/icons';
import { MoonIcon } from '@/components/icons';

export function AppearanceSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/appearance';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');

  useEffect(() => {
    setMounted(true);
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  const handleSelectTheme = (id: string) => {
    setSelectedTheme(id);
    try {
      setTheme(id);
    } catch {
      // fallback
    }
  };

  const themeOptions = [
    /*
    {
      id: 'system',
      label: 'System',
      description: 'Optimal for long focus sessions',
      icon: SystemIcon,
      hasBorderBottom: true,
    },
    {
      id: 'light',
      label: 'Light mode',
      description: 'Classic clean high-contrast view',
      icon: SunIcon,
      hasBorderBottom: true,
    },
    */
    {
      id: 'dark',
      label: 'Dark mode',
      description: 'Pure black for OLED efficiency',
      icon: MoonIcon,
      hasBorderBottom: false,
    },
  ];

  return (
    <div className="w-full max-w-[712px] md:min-h-[490px] p-[8px_0px] flex flex-col items-start gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Theme Section */}
      <div className="w-full max-w-[712px] px-3 sm:px-4 py-2 flex flex-col items-start gap-3 self-stretch">
        {/* Title: Theme & Mobile Back */}
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => router.replace(basePath)}
            aria-label="Back to settings menu"
            className="-ml-1.5 flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
          <h2 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center">
            Theme
          </h2>
        </div>

        {/* Options List */}
        <div 
          className="self-stretch w-full inline-flex flex-col justify-start items-start"
          role="radiogroup" 
          aria-label="Theme selection"
        >
          {themeOptions.map((option) => {
            const isSelected = (mounted ? selectedTheme : 'dark') === option.id;
            const IconComponent = option.icon;

            return (
              <div
                key={option.id}
                onClick={() => handleSelectTheme(option.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectTheme(option.id);
                  }
                }}
                className={`self-stretch w-full py-2 rounded-xl inline-flex justify-between items-center cursor-pointer group transition-colors select-none ${
                  option.hasBorderBottom ? 'border-b border-ds-border' : ''
                }`}
              >
                {/* Left content: Icon + Title & Description */}
                <div className="flex justify-start items-center gap-4">
                  <div className="size-5 relative overflow-hidden flex items-center justify-center shrink-0">
                    <IconComponent 
                      className={`size-5 transition-colors ${
                        isSelected 
                          ? 'text-ds-text-primary' 
                          : 'text-ds-text-secondary group-hover:text-ds-text-primary'
                      }`} 
                    />
                  </div>
                  <div className="inline-flex flex-col justify-center items-start">
                    <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 transition-colors">
                      {option.label}
                    </div>
                    <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                      {option.description}
                    </div>
                  </div>
                </div>

                {/* Right content: Radio Button */}
                {isSelected ? (
                  <div className="size-6 p-1.5 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-ds-accent flex justify-center items-center gap-2.5 shrink-0">
                    <div className="size-2 bg-ds-accent rounded-full shrink-0" />
                  </div>
                ) : (
                  <div className="size-6 relative shrink-0">
                    <div className="size-6 left-0 top-0 absolute rounded-[100px] border-[1.5px] border-ds-text-muted group-hover:border-ds-text-secondary transition-colors" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

