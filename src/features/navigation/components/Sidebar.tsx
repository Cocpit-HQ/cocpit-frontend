"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Icon as CustomIcon, IconName, UserIcon } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useCompanyOnboardingStore } from '@/features/company-onboarding/store/company-onboarding.store';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { activeProfile, isCompany, switchableCompanies, switchProfile } = useActiveProfile();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile();
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const pathname = usePathname();
  
  // Using basic active path matching for the UI
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    if (href === '/channels') return pathname === '/channels' || pathname.startsWith('/channels/') || pathname.startsWith('/channel');
    if (href.startsWith('/organization/') && !href.endsWith('/settings') && !href.endsWith('/analytics')) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const analyticsHref = isCompany && activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics";
  const isCompanyActor = Boolean(isCompany || activeProfile?.type === 'COMPANY');

  const profileHref = activeProfile?.type === 'COMPANY' && activeProfile.slug
    ? `/organization/${activeProfile.slug}`
    : '/profile';
  const settingsHref = isCompany && activeProfile?.slug
    ? `/organization/${activeProfile.slug}/settings`
    : "/settings";

  const sections = useMemo(() => {
    return [
      {
        title: 'Core',
        items: [
          { iconName: 'feed' as IconName, label: 'Feed', href: '/feed' },
          ...(!isCompanyActor ? [{ iconName: 'connection' as IconName, label: 'Connection', href: '/connections' }] : []),
          { iconName: 'chat' as IconName, label: 'Chat', href: '/messaging' },
          // { iconName: 'channel' as IconName, label: 'Channel', href: '/channels' },
        ],
        gapTop: 'mt-0' // First section has no extra top gap
      },
      {
        title: 'Work',
        items: [
          { iconName: 'jobs' as IconName, label: 'Jobs', href: '/jobs' },
        ],
        gapTop: 'mt-[12px]'
      },
      {
        title: 'Insights',
        items: [
          { iconName: 'analytics' as IconName, label: 'Analytics', href: analyticsHref },
          ...(isCompanyActor ? [{ iconName: 'user' as IconName, label: 'Teams', href: '/team' }] : []),
        ],
        gapTop: 'mt-[12px]'
      },
      {
        title: 'Account',
        items: [
          { iconName: 'profile' as IconName, label: 'Profile', href: profileHref },
          { iconName: 'settings' as IconName, label: 'Settings', href: settingsHref },
        ],
        gapTop: 'mt-[12px]'
      }
    ];
  }, [analyticsHref, profileHref, settingsHref, isCompanyActor]);

  // Sort switchableCompanies so the currently active/open company is at the top of the list
  const sortedCompanies = useMemo(() => {
    if (!switchableCompanies || switchableCompanies.length === 0) return [];

    const activeIndex = switchableCompanies.findIndex((company) => {
      const companyId = company.org_id || company.company_id;
      const isActorActive = isCompany && (
        (companyId && activeProfile?.id === companyId) ||
        (company.slug && activeProfile?.slug && company.slug === activeProfile.slug)
      );
      const isPathActive = company.slug
        ? (pathname === `/organization/${company.slug}` || pathname?.startsWith(`/organization/${company.slug}/`))
        : false;
      return isActorActive || isPathActive;
    });

    if (activeIndex <= 0) return switchableCompanies;

    const activeCompany = switchableCompanies[activeIndex];
    const rest = switchableCompanies.filter((_, idx) => idx !== activeIndex);
    return [activeCompany, ...rest];
  }, [switchableCompanies, isCompany, activeProfile?.id, activeProfile?.slug, pathname]);

  const isPersonalActive = !isCompany && activeProfile?.type === 'USER' && (
    !pathname || !pathname.startsWith('/organization/')
  );

  return (
    <aside 
      className={`h-screen w-[220px] flex flex-col bg-ds-bg pl-[16px] sm:pl-[24px] lg:pl-[40px] pt-[60px] sm:pt-[120px] overflow-hidden ${className || ''}`}
    >
      <div className="w-full pr-[16px] lg:pr-[0px] flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-6">
        {/* Main Navigation Sections */}
        {sections.map((section) => (
          <div key={section.title} className={`flex flex-col shrink-0 ${section.gapTop}`}>
            {/* Section Header */}
            <div className="flex flex-row justify-between items-center w-full h-[16px] px-[12px] mb-[12px]">
              <span className="font-['DM_Sans'] font-medium text-[10px] leading-[13px] text-ds-text-muted text-center">
                {section.title}
              </span>
            </div>

            {/* Section Items */}
            <div className="flex flex-col gap-[8px]">
              {section.items.map((item) => {
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`
                      flex flex-row items-center px-[12px] py-[6px] gap-[8px] w-full h-[33px] rounded-full transition-[var(--motion-quick)] group
                      ${active ? 'bg-ds-surface-1' : ''}
                    `}
                  >
                    <CustomIcon 
                      name={item.iconName}
                      className={`w-[20px] h-[20px] shrink-0 ${active ? 'text-ds-text-primary' : 'text-ds-text-secondary group-hover:text-ds-text-primary'}`} 
                    />
                    <span 
                      className={`
                        font-['DM_Sans'] flex items-center text-center
                        ${active ? 'font-medium text-[16px] leading-[21px] text-ds-text-primary' : 'font-normal text-[16px] leading-[24px] text-ds-text-secondary group-hover:text-ds-text-primary'}
                      `}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Personal Section */}
        {user && (
          <div className="flex flex-col mt-[20px] shrink-0">
            {/* Section Header */}
            <div className="flex flex-row justify-between items-center w-full h-[16px] px-[12px] mb-[12px]">
              <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-text-secondary">
                Personal
              </span>
            </div>

            {/* Personal Item */}
            <div className="flex flex-col gap-[8px]">
              <Link
                href="/feed"
                onClick={(e) => {
                  e.preventDefault();
                  switchProfile('USER', user.id);
                }}
                className="flex flex-row items-center px-[12px] py-[6px] gap-[8px] w-full h-[33px] rounded-full transition-[var(--motion-quick)] group"
              >
                {(() => {
                  const personalAvatar = user.image || myProfile?.user?.avatar || (activeProfile?.type === 'USER' ? activeProfile?.avatar_url : undefined);
                  return (
                    <div className={`w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center overflow-hidden ${personalAvatar ? 'bg-ds-surface-1' : 'bg-ds-surface-1 border border-ds-border'}`}>
                      {personalAvatar ? (
                        <img src={personalAvatar} alt={user.name || "Personal"} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-[60%] h-[60%] text-ds-text-secondary" />
                      )}
                    </div>
                  );
                })()}
                <span className={`font-['DM_Sans'] truncate text-[16px] leading-[24px] ${isPersonalActive ? 'font-medium text-ds-text-primary' : 'font-normal text-ds-text-secondary group-hover:text-ds-text-primary'}`}>
                  {user.name || "My Profile"}
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Organization Section (Special 20px Top Gap) */}
        <div className="flex flex-col mt-[20px] shrink-0">
          {/* Section Header */}
          <div className="flex flex-row justify-between items-center w-full h-[16px] px-[12px] mb-[12px] shrink-0">
            <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-text-secondary">
              Organization
            </span>
            <Link
              href="/company-onboarding"
              aria-label="Create Organization"
              title="Create Organization"
              onClick={() => useCompanyOnboardingStore.getState().resetStore()}
              className="w-[24px] h-[24px] -mr-[4px] flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)] rounded"
            >
              <CustomIcon name="plus" className="w-[16px] h-[16px]" />
            </Link>
          </div>

          {/* Organization Items */}
          <div className="flex flex-col gap-[8px]">
            {(showAllOrgs ? sortedCompanies : sortedCompanies.slice(0, 2))?.map((company, index) => {
              const companyId = company.org_id || company.company_id;
              const isCurrentActor = isCompany && (
                (companyId && activeProfile?.id === companyId) ||
                (company.slug && activeProfile?.slug && company.slug === activeProfile.slug)
              );
              const isCurrentPath = company.slug
                ? (pathname === `/organization/${company.slug}` || pathname?.startsWith(`/organization/${company.slug}/`))
                : false;
              const isOrgActive = isCurrentActor || isCurrentPath;
              const orgHref = `/organization/${company.slug}`;
              const firstLetter = company.name ? company.name.charAt(0).toUpperCase() : 'C';
              
              // Alternate fallback colors
              const fallbackColors = ['bg-blue-500', 'bg-gray-500', 'bg-purple-500', 'bg-green-500'];
              const fallbackColor = fallbackColors[index % fallbackColors.length];

              return (
                <Link
                  key={companyId || company.slug || index}
                  href={orgHref}
                  onClick={(e) => {
                    if (companyId) {
                      if (activeProfile?.type === 'COMPANY' && activeProfile.id === companyId && pathname?.startsWith(`/organization/${company.slug}`)) {
                        return;
                      }
                      e.preventDefault();
                      switchProfile('COMPANY', companyId);
                    }
                  }}
                  className="flex flex-row items-center px-[12px] py-[6px] gap-[8px] w-full h-[33px] rounded-full transition-[var(--motion-quick)] group"
                >
                  <div className={`w-[20px] h-[20px] rounded shrink-0 ${fallbackColor} flex items-center justify-center overflow-hidden`}>
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-white font-bold">{firstLetter}</span>
                    )}
                  </div>
                  <span className={`font-['DM_Sans'] truncate text-[16px] leading-[24px] ${isOrgActive ? 'font-medium text-ds-text-primary' : 'font-normal text-ds-text-secondary group-hover:text-ds-text-primary'}`}>
                    {company.name}
                  </span>
                </Link>
              );
            })}

            {/* See more link */}
            {sortedCompanies && sortedCompanies.length > 2 && (
              <div className="pl-[40px] mt-[4px]">
                <button 
                  onClick={() => setShowAllOrgs(!showAllOrgs)}
                  className="font-['DM_Sans'] font-medium text-[10px] text-[#EC6229] text-left"
                >
                  {showAllOrgs ? 'See less' : 'See more'}
                </button>
              </div>
            )}
          </div>
        </div>


      </div>
    </aside>
  );
}

export default Sidebar;
