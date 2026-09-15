"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { NotificationPopover } from '@/features/notification/components/NotificationPopover';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { SearchedUser } from '@/types/user';

interface TopHeaderProps {
  className?: string;
}

export function TopHeader({ className }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeProfile, isCompany } = useActiveProfile();

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const cleanQuery = debouncedSearch.startsWith('#') ? debouncedSearch.slice(1) : debouncedSearch;
        if (cleanQuery.trim()) {
          const results = await searchUsers(cleanQuery);
          const uniqueResults = Array.from(new Map(results.map((u) => [u.id, u])).values());
          setSearchResults(uniqueResults.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (pathname && !pathname.startsWith('/search')) {
      setSearchQuery('');
    }
  }, [pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const profileHref = activeProfile?.type === 'COMPANY' && activeProfile.slug
    ? `/organization/${activeProfile.slug}`
    : '/profile';

  const avatarUrl = activeProfile?.avatar_url;
  const initial = activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className={`w-full flex items-center justify-between pointer-events-none ${className || ''}`}>
      {/* Full-width top background bar to seamlessly occlude scrolling feed across the entire screen */}
      <div className="fixed top-0 left-0 md:left-[220px] right-0 h-[100px] bg-ds-bg z-40 pointer-events-none" />

      {/* Cocpit Logo (Bottom Right) */}
      <div className="fixed bottom-[40px] right-[40px] flex items-center h-[40px] pointer-events-auto z-50">
        <Link href="/feed">
          <Icon name="cocpit-logo" className="text-ds-text-primary hover:opacity-80 transition-opacity" width={110} height={32} />
        </Link>
      </div>

      {/* Center Search Column (View Port Perspective Center) */}
      <div 
        ref={dropdownRef}
        className="fixed top-[40px] left-1/2 -translate-x-1/2 w-[442px] pointer-events-auto z-50"
      >
        <div className="box-border flex flex-row justify-between items-center px-3 py-1.5 gap-2.5 w-[442px] h-10 border-b border-ds-text-primary flex-none order-0 flex-grow-0 bg-transparent">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleSearch}
            className="flex-grow bg-transparent outline-none font-['DM_Sans'] text-[16px] leading-[24px] text-ds-text-muted placeholder:text-ds-text-muted"
          />
          <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary shrink-0 cursor-pointer hover:text-ds-accent transition-colors" onClick={() => {
            if (searchQuery.trim()) {
              setIsFocused(false);
              router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }} />
        </div>

        {/* Live Search Dropdown */}
        {isFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-[40px] left-0 w-full mt-2 bg-ds-surface-1 border border-ds-border rounded-xl shadow-xl overflow-hidden flex flex-col">
            {isSearching ? (
              <div className="px-4 py-3 text-sm text-ds-text-muted">Searching...</div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.map((user) => {
                  const url = user.type === 'COMPANY' || user.account_type === 'COMPANY'
                    ? `/organization/${user.slug || user.id}`
                    : `/profile/${user.account_name || user.id}`;
                  
                  const fallbackInitial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

                  return (
                    <Link
                      key={user.id}
                      href={url}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-ds-surface-2 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-ds-surface-2 flex items-center justify-center overflow-hidden shrink-0 border border-ds-border">
                        {user.avatar_url || user.avatar ? (
                          <img src={user.avatar_url || user.avatar || ''} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-ds-text-primary text-xs font-medium">{fallbackInitial}</span>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-ds-text-primary truncate">
                          {user.full_name || user.name}
                        </span>
                        {user.headline && (
                          <span className="text-xs text-ds-text-muted truncate">
                            {user.headline}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
                <div 
                  onClick={() => {
                    setIsFocused(false);
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="px-4 py-3 border-t border-ds-border text-xs font-medium text-ds-accent hover:bg-ds-surface-2 cursor-pointer text-center"
                >
                  See all results for "{searchQuery}"
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-sm text-ds-text-muted">No results found.</div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions Section */}
      <div className="fixed top-[40px] right-[40px] flex items-center gap-[12px] h-[40px] pointer-events-auto z-50">
        {/* Notification Bell */}
        <NotificationPopover 
          className="group relative w-[40px] h-[40px] p-[8px] flex flex-row items-center justify-center bg-transparent hover:bg-ds-surface-1 data-[state=open]:bg-ds-surface-1 rounded-[24px] transition-colors"
          icon={<Icon name="notification" className="w-[20px] h-[20px] text-ds-text-primary group-hover:text-ds-accent group-data-[state=open]:text-ds-accent transition-colors" />}
        />

        {/* User Avatar */}
        <Link href={profileHref} className="cursor-pointer block">
          <div className="w-[24px] h-[24px] rounded-full overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-ds-surface-1 border border-ds-border text-ds-text-primary text-[10px] font-medium cursor-pointer">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default TopHeader;
