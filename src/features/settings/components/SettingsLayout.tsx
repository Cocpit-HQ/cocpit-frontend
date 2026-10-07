"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SettingsSidebar } from './SettingsSidebar';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  
  // Check if we are at the root of settings to handle mobile menu visibility
  const isRoot = pathname === '/settings' || pathname?.match(/^\/organization\/[^\/]+\/settings\/?$/);

  return (
    <>
      <style>{`
        .settings-page-wrapper {
          padding-top: 16px;
          box-sizing: border-box;
        }
        @media (min-width: 768px) {
          .settings-page-wrapper {
            padding-top: clamp(24px, calc(100dvh - 680px), 126px);
          }
        }
        @media (min-width: 768px) and (min-height: 850px) {
          .settings-page-wrapper {
            padding-top: 126px;
          }
        }
      `}</style>
      <div className="settings-page-wrapper w-full h-full max-h-screen bg-ds-bg text-ds-text-primary font-sans flex justify-start items-start overflow-hidden box-border">
        {/* Frame 2608689: Outer box max 980px, fills available height */}
        <div className="w-full max-w-[980px] h-full p-2 sm:p-4 md:p-[0px_16px] flex flex-col items-start gap-0 rounded-[24px] overflow-hidden">
          {/* Frame 2608633: Inner box max 948px, fills height */}
          <div className="w-full max-w-[948px] h-full p-0 flex flex-col md:flex-row items-start gap-0 overflow-hidden">
            {/* Fixed Sidebar - Stationarily scrolls internally on desktop; scrollable on mobile */}
            <aside className={`w-full md:w-[236px] shrink-0 h-full overflow-y-auto scrollbar-hide overscroll-contain ${isRoot ? 'block' : 'hidden md:block'}`}>
              <SettingsSidebar />
            </aside>
            
            {/* Main Content Pane - Only this tab component scrolls, extending all the way to the bottom */}
            <main className={`flex-1 min-w-0 w-full max-w-[712px] h-full overflow-y-auto scrollbar-hide ${isRoot ? 'hidden md:flex' : 'flex'} flex-col pb-24`}>
              {children}
            </main>
          </div>
        </div>
      </div>
  </>
);
}


