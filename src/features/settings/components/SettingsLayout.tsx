import React from 'react';
import { SettingsSidebar } from './SettingsSidebar';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="w-full flex justify-start items-start pt-[36px] pl-[36px] pb-10 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row items-stretch w-full max-w-[948px] border border-[#EEF2FF] rounded-[24px] bg-white">
        <SettingsSidebar />
        
        {/* Solid vertical divider */}
        <div className="hidden md:block w-[1px] bg-[#EEF2FF] shrink-0"></div>
        
        <main className="flex-1 min-w-0 w-full flex">
          {children}
        </main>
      </div>
    </div>
  );
}
