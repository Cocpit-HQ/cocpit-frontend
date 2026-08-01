"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { 
  Bell
} from 'lucide-react';

const sidebarItems = [
  { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={24} height={24} {...props} /> },
  { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={24} height={24} {...props} /> },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={24} height={24} {...props} /> },
  { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={24} height={24} {...props} /> },
  { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={24} height={24} {...props} /> },
  { id: 'reports', label: 'Account status', icon: (props: any) => <Icon icon="si:info-line" width={24} height={24} {...props} /> },
  { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={24} height={24} {...props} /> },
  { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={24} height={24} {...props} /> },
  { id: 'legal', label: 'Legal & Privacy', icon: (props: any) => <Icon icon="hugeicons:legal-01" width={24} height={24} {...props} /> },
];

export function SettingsSidebar() {
  const pathname = usePathname() || '/settings';

  // Support both /settings and /organization/[slug]/settings
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  return (
    <div className="flex flex-col items-start pt-2 pr-0 pb-2 pl-2 gap-4 w-full md:w-[250px] shrink-0 mb-4 md:mb-0 font-poppins">
      <div className="flex flex-col justify-center items-start px-2.5 gap-2 w-[242px] pb-4 border-b border-[#EEF2FF]">
        <h2 className="text-[24px] font-semibold text-black leading-[32px] text-center">Settings</h2>
        <p className="text-[14px] font-normal text-black leading-[20px] text-center">Manage your preferences</p>
      </div>
      
      <nav className="flex flex-col w-full gap-4">
        {sidebarItems.map((item) => {
          // Check if current path matches this tab
          const isActive = pathname === `${basePath}/${item.id}` || pathname.startsWith(`${basePath}/${item.id}-`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              href={`${basePath}/${item.id}`}
              className={`flex flex-row items-center px-5 py-2.5 gap-1 w-full md:w-[242px] h-[50px] transition-colors ${
                isActive
                  ? 'border-l-[2px] border-[#6366F1] rounded-bl-[16px] bg-white'
                  : 'hover:bg-gray-50 bg-white'
              }`}
            >
              <Icon className="w-6 h-6 text-black shrink-0" strokeWidth={1} />
              <span className="text-[16px] text-black font-normal leading-[24px] ml-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
