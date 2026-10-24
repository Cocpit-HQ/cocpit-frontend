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
  { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={20} height={20} {...props} /> },
  { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={20} height={20} {...props} /> },
  { id: 'notifications', label: 'Notifications', icon: (props: any) => <Bell className="w-5 h-5 shrink-0" {...props} /> },
  { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={20} height={20} {...props} /> },
  { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={20} height={20} {...props} /> },
  { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={20} height={20} {...props} /> },
  { id: 'reports', label: 'Account status', icon: (props: any) => <Icon icon="si:info-line" width={20} height={20} {...props} /> },
  { id: 'organizations', label: 'Organizations', icon: (props: any) => <Building2 className="w-5 h-5 shrink-0" {...props} /> },
  { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={20} height={20} {...props} /> },
  { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={20} height={20} {...props} /> },
  { id: 'legal', label: 'Legal & Privacy', icon: (props: any) => <Icon icon="hugeicons:legal-01" width={20} height={20} {...props} /> },
];

const companySidebarItems = [
  { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={20} height={20} {...props} /> },
  { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={20} height={20} {...props} /> },
  { id: 'notifications', label: 'Notifications', icon: (props: any) => <Bell className="w-5 h-5 shrink-0" {...props} /> },
  { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={20} height={20} {...props} /> },
  { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={20} height={20} {...props} /> },
  { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={20} height={20} {...props} /> },
  { id: 'reports', label: 'Account status', icon: (props: any) => <Icon icon="si:info-line" width={20} height={20} {...props} /> },
  { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={20} height={20} {...props} /> },
  { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={20} height={20} {...props} /> },
  { id: 'legal', label: 'Legal & Privacy', icon: (props: any) => <Icon icon="hugeicons:legal-01" width={20} height={20} {...props} /> },
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
      { id: 'account', label: 'Account', icon: (props: any) => <Icon icon="iconoir:profile-circle" width={20} height={20} {...props} /> },
      { id: 'privacy', label: 'Privacy', icon: (props: any) => <Icon icon="material-symbols-light:admin-panel-settings-outline-rounded" width={20} height={20} {...props} /> },
      { id: 'notifications', label: 'Notifications', icon: (props: any) => <Bell className="w-5 h-5 shrink-0" {...props} /> },
    ]
  },
  {
    title: 'Content',
    items: [
      { id: 'appearance', label: 'Appearance', icon: (props: any) => <Icon icon="iconoir:color-wheel" width={20} height={20} {...props} /> },
      { id: 'saved', label: 'Saved posts', icon: (props: any) => <Icon icon="solar:bookmark-linear" width={20} height={20} {...props} /> },
      { id: 'activity', label: 'Your activity', icon: (props: any) => <Icon icon="hugeicons:activity-03" width={20} height={20} {...props} /> },
      { id: 'reports', label: 'Your reports', icon: (props: any) => <Icon icon="si:info-line" width={20} height={20} {...props} /> },
      { id: 'organizations', label: 'Organizations', icon: (props: any) => <Building2 className="w-5 h-5 shrink-0" {...props} /> },
      { id: 'blocked', label: 'Blocked accounts', icon: (props: any) => <Icon icon="ic:baseline-block" width={20} height={20} {...props} /> },
    ]
  },
  {
    title: 'Legal & Privacy',
    items: [
      { id: 'legal', label: 'Legal & Privacy', icon: (props: any) => <Icon icon="hugeicons:legal-01" width={20} height={20} {...props} /> },
    ]
  },
  {
    title: 'Help & Support',
    items: [
      { id: 'support', label: 'Help & Support', icon: (props: any) => <Icon icon="streamline:customer-support-1" width={20} height={20} {...props} /> },
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
        if (isCompany && item.id === 'organizations') return false;
        return true;
      })
    };
  });

  const handleExitSettings = () => {
    router.push(isCompany && activeProfile?.slug ? `/organization/${activeProfile.slug}` : '/profile');
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Frame 2608631) --- */}
      <div className="hidden md:flex flex-col items-start w-[236px] p-[14px_0px_8px_8px] gap-[12px] rounded-[24px_0px_0px_24px] font-sans">
        <nav className="flex flex-col w-full gap-[12px]">
          {items.map((item) => {
            const isActive = 
              pathname === `${basePath}/${item.id}` || 
              (pathname === basePath && item.id === 'account') ||
              pathname.startsWith(`${basePath}/${item.id}-`) ||
              pathname.startsWith(`${basePath}/${item.id}/`) ||
              (item.id === 'saved' && (pathname.startsWith('/saved') || pathname.includes('/saved')));
            
            return (
              <Link
                key={item.id}
                href={`${basePath}/${item.id}`}
                style={{
                  borderLeft: isActive ? '2px solid var(--ds-accent)' : '2px solid transparent',
                  borderRadius: '0px 0px 0px 16px',
                }}
                className="box-border flex flex-row items-center p-[10px] gap-1 w-[228px] h-[44px] self-stretch transition-colors shrink-0"
              >
                <span
                  style={{ color: 'var(--ds-text-primary)' }}
                  className="h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary flex-none order-0 grow-0 whitespace-nowrap"
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- MOBILE MENU --- */}
      <div className="flex md:hidden flex-col w-full min-h-full bg-ds-bg text-ds-text-primary font-sans pb-4">
        {/* Mobile Header: < Settings */}
        <div className="flex items-center justify-between w-full px-4 h-6 mb-4 select-none shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={handleExitSettings}
              aria-label="Back from Settings"
              className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
            </button>
            <h1 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] h-6 flex items-center m-0 truncate">
              Settings
            </h1>
          </div>
        </div>

        {/* Mobile Sections */}
        <div className="flex flex-col w-full">
          {filteredMobileGroups.map((group, groupIdx) => (
            <React.Fragment key={groupIdx}>
              {groupIdx > 0 && (
                <div className="w-full h-0 border-t border-ds-border" />
              )}
              <div className={`flex flex-col w-full px-4 py-3 ${groupIdx > 0 ? 'mt-2' : ''}`}>
                <h3 className="mb-2 ds-text-small-1 uppercase tracking-wider text-ds-text-muted">
                  {group.title}
                </h3>
                
                <div className="flex flex-col w-full">
                  {group.items.map((item, itemIdx) => {
                    const IconComp = item.icon;
                    return (
                      <Link
                        key={`${item.id}-${itemIdx}`}
                        href={`${basePath}/${item.id}`}
                        className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors"
                      >
                        <div className="flex flex-row items-center gap-3">
                          <IconComp className="text-ds-text-secondary shrink-0" />
                          <span className="ds-text-body text-ds-text-primary">
                            {item.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-row items-center gap-2">
                          {item.rightText && (
                            <span className="ds-text-small text-ds-text-muted">
                              {item.rightText}
                            </span>
                          )}
                          {!item.hideChevron && (
                            <ChevronRight className="w-4 h-4 text-ds-text-muted" strokeWidth={1.5} />
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

