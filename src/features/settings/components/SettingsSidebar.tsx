"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { 
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';

const userSidebarItems = [
  { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={24} height={24} {...props} /> },
  { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={24} height={24} {...props} /> },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={24} height={24} {...props} /> },
  { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={24} height={24} {...props} /> },
  { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={24} height={24} {...props} /> },
  { id: 'reports', label: 'Account status', icon: (props: any) => <Icon icon="si:info-line" width={24} height={24} {...props} /> },
  { id: 'organizations', label: 'Organizations', icon: (props: any) => <Building2 width={24} height={24} {...props} /> },
  { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={24} height={24} {...props} /> },
  { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={24} height={24} {...props} /> },
  { id: 'legal', label: 'Legal & Privacy', icon: (props: any) => <Icon icon="hugeicons:legal-01" width={24} height={24} {...props} /> },
];

const companySidebarItems = [
  { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={24} height={24} {...props} /> },
  { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={24} height={24} {...props} /> },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={24} height={24} {...props} /> },
  { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={24} height={24} {...props} /> },
  { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={24} height={24} {...props} /> },
  { id: 'reports', label: 'Account status', icon: (props: any) => <Icon icon="si:info-line" width={24} height={24} {...props} /> },
  { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={24} height={24} {...props} /> },
  { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={24} height={24} {...props} /> },
];

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  rightText?: string;
  hideChevron?: boolean;
};

const mobileMenuGroups: { title: string, items: MenuItem[] }[] = [
  {
    title: 'Account',
    items: [
      { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={24} height={24} {...props} /> },
      { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={24} height={24} {...props} /> },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ]
  },
  {
    title: 'Content',
    items: [
      { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={24} height={24} {...props} /> },
      { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={24} height={24} {...props} /> },
      { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={24} height={24} {...props} /> },
      { id: 'reports', label: 'Your reports', icon: (props: any) => <Icon icon="si:info-line" width={24} height={24} {...props} /> },
      { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={24} height={24} {...props} /> },
    ]
  },
  {
    title: 'Legal & Privacy',
    items: [
      { id: 'legal', label: 'Privacy policy', icon: (props: any) => <Icon icon="hugeicons:document-validation" width={24} height={24} {...props} /> },
      { id: 'legal', label: 'Terms & conditions', icon: (props: any) => <Icon icon="hugeicons:document-attachment" width={24} height={24} {...props} /> },
      { id: 'legal', label: 'Community guidelines', icon: (props: any) => <Icon icon="ph:users" width={24} height={24} {...props} /> },
      { id: 'legal', label: 'Cookie policy', icon: (props: any) => <Icon icon="lucide:cookie" width={24} height={24} {...props} /> },
    ]
  },
  {
    title: 'Help & Support',
    items: [
      { id: 'support', label: 'App version', rightText: 'v2.4.1', hideChevron: true, icon: (props: any) => <Icon icon="lucide:smartphone" width={24} height={24} {...props} /> },
      { id: 'support', label: 'Share feedback', icon: (props: any) => <Icon icon="lucide:share-2" width={24} height={24} {...props} /> },
      { id: 'support', label: 'Help center', icon: (props: any) => <Icon icon="lucide:headphones" width={24} height={24} {...props} /> },
      { id: 'support', label: 'Contact support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={24} height={24} {...props} /> },
    ]
  }
];

export function SettingsSidebar() {
  const pathname = usePathname() || '/settings';
  const router = useRouter();
  const { isCompany, activeProfile } = useActiveProfile();

  // Support both /settings and /organization/[slug]/settings
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const items = isCompany ? companySidebarItems : userSidebarItems;
  const subtitle = isCompany ? activeProfile?.name : "Manage your preferences";

  // Filter mobile groups to remove User-only items if we are in company mode
  const filteredMobileGroups = mobileMenuGroups.map(group => {
    return {
      ...group,
      items: group.items.filter(item => {
        // Exclude organizations item for company profile if it was in mobile groups
        if (isCompany && item.id === 'organizations') return false;
        return true;
      })
    }
  });

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:flex flex-col items-start pt-2 pr-0 pb-2 pl-2 gap-4 w-[250px] shrink-0 font-poppins">
        <div className={`flex flex-col justify-center items-start px-2.5 gap-2 w-[242px] pb-4 border-b border-[#EEF2FF] ${isCompany ? 'dark:border-company-border' : 'dark:border-border'}`}>
          <h2 className={`text-[24px] font-semibold text-black leading-[32px] text-center ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`}>Settings</h2>
          <p className={`text-[14px] font-normal text-black leading-[20px] text-center w-full truncate ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`} title={subtitle || ''}>{subtitle}</p>
        </div>
        
        <nav className="flex flex-col w-full gap-4">
          {items.map((item) => {
            // Check if current path matches this tab
            const isActive = 
              pathname === `${basePath}/${item.id}` || 
              (pathname === basePath && item.id === 'account') ||
              pathname.startsWith(`${basePath}/${item.id}-`) ||
              pathname.startsWith(`${basePath}/${item.id}/`) ||
              (item.id === 'saved' && (pathname.startsWith('/saved') || pathname.includes('/saved')));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={`${basePath}/${item.id}`}
                className={`flex flex-row items-center px-5 py-2.5 gap-1 w-[242px] h-[50px] transition-colors ${
                  isActive
                    ? `border-l-[2px] border-[#1A73E8] rounded-bl-[24px] rounded-tl-none bg-white ${isCompany ? 'dark:border-company-primary dark:bg-company-card' : 'dark:border-primary dark:bg-card'}`
                    : `hover:bg-gray-50 bg-transparent ${isCompany ? 'dark:hover:bg-company-card dark:bg-transparent' : 'dark:hover:bg-card dark:bg-transparent'}`
                }`}
              >
                <Icon className={`w-6 h-6 text-black shrink-0 ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`} strokeWidth={1} />
                <span className={`text-[16px] text-black font-normal leading-[24px] ml-1 ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- MOBILE MENU --- */}
      <div className="flex md:hidden flex-col w-full min-h-[100dvh] bg-white dark:bg-background font-poppins pb-24">
        {/* Mobile Header */}
        <div className="flex flex-row items-center gap-4 p-4 sticky top-0 bg-white dark:bg-background z-10">
          <button 
            onClick={() => router.back()}
            className="flex flex-row justify-center items-center p-2 w-[48px] h-[48px] border border-[#DADADA] rounded-[100px] backdrop-blur-[12px] active:bg-gray-100 dark:active:bg-card transition-colors shrink-0"
          >
            <ChevronLeft className={`w-6 h-6 text-[#6B7280]`} strokeWidth={1.5} />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className={`text-[18px] font-medium leading-[26px] text-black ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'} truncate`}>
              Settings
            </h1>
            <p className={`text-[12px] font-normal leading-[16px] text-[#6B7280] ${isCompany ? 'dark:text-company-secondary' : 'dark:text-muted-foreground'} truncate`}>
              Manage your preferences
            </p>
          </div>
        </div>

        {/* Mobile Sections */}
        <div className="flex flex-col w-full">
          {filteredMobileGroups.map((group, groupIdx) => (
            <React.Fragment key={groupIdx}>
              {groupIdx > 0 && (
                <div className="w-full h-0 border-t-[4px] border-[#EEF2FF] dark:border-border" />
              )}
              <div className={`flex flex-col w-full px-4 ${groupIdx > 0 ? 'mt-4' : ''}`}>
                <h3 className={`mb-2 text-[12px] font-medium leading-[16px] text-[#6B7280] ${isCompany ? 'dark:text-company-secondary' : 'dark:text-muted-foreground'}`}>
                  {group.title}
                </h3>
                
                <div className="flex flex-col w-full">
                  {group.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${item.id}-${itemIdx}`}
                        href={`${basePath}/${item.id}`}
                        className="flex flex-row items-center justify-between py-4 w-full h-[50px] active:bg-gray-50 dark:active:bg-card transition-colors"
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon className={`w-6 h-6 text-black ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`} strokeWidth={1.5} />
                          <span className={`text-[16px] font-normal leading-[24px] text-black ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`}>
                            {item.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-row items-center gap-2">
                          {item.rightText ? (
                            <span className={`text-[16px] font-normal leading-[24px] text-[#6B7280] ${isCompany ? 'dark:text-company-secondary' : 'dark:text-muted-foreground'}`}>
                              {item.rightText}
                            </span>
                          ) : null}
                          
                          {!item.hideChevron && (
                            <ChevronRight className={`w-6 h-6 text-black ${isCompany ? 'dark:text-company-text' : 'dark:text-foreground'}`} strokeWidth={1.5} />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
