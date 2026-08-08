"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SettingsSidebar } from './SettingsSidebar';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { ChevronLeft } from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCompany } = useActiveProfile();
  
  // Check if we are at the root of settings to handle mobile menu visibility
  const isRoot = pathname === '/settings' || pathname?.match(/^\/organization\/[^\/]+\/settings\/?$/);

  return (
    <div className={`w-full flex justify-start items-start md:pt-[36px] md:pl-[36px] pb-10 min-h-screen bg-white ${isCompany ? 'dark:bg-company-bg' : 'dark:bg-background'}`}>
      <div className={`flex flex-col md:flex-row items-stretch w-full md:max-w-[948px] border-0 md:border md:border-[#EEF2FF] md:rounded-[24px] bg-white ${isCompany ? 'md:dark:border-company-border dark:bg-company-bg md:dark:bg-company-card' : 'md:dark:border-border dark:bg-background md:dark:bg-card'}`}>
        <div className={`w-full md:w-auto ${isRoot ? 'block' : 'hidden md:block'}`}>
          <SettingsSidebar />
        </div>
        
        {/* Solid vertical divider */}
        <div className={`hidden md:block w-[1px] bg-[#EEF2FF] shrink-0 ${isCompany ? 'dark:bg-company-border' : 'dark:bg-border'}`}></div>
        
        {/* Main Content Pane - hidden on mobile when viewing the root menu */}
        <main className={`flex-1 min-w-0 w-full flex-col ${isRoot ? 'hidden md:flex' : 'flex'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
