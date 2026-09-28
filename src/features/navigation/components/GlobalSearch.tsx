"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers, getUserById } from '@/services/api/user';
import { SearchedUser } from '@/types/user';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useToast } from '@/hooks/use-toast';

interface GlobalSearchProps {
  hasSidebar?: boolean;
}

export function GlobalSearch({ hasSidebar = true }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 600);
  const { history, saveSearch, removeSearch, clearAll } = useSearchHistory();
  const { toast } = useToast();

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
          setSearchResults(uniqueResults);
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
      // router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleResultClick = (user: SearchedUser) => {
    saveSearch(user);
    setIsFocused(false);
  };

  const handleRecentUserClick = async (e: React.MouseEvent, user: SearchedUser) => {
    e.preventDefault();
    if (isNavigating) return;

    if (!user.id) {
      toast({ title: "Error", description: "Invalid history record.", variant: "destructive" });
      return;
    }

    if (user.type === 'COMPANY' || user.account_type === 'COMPANY') {
      setIsFocused(false);
      saveSearch(user);
      router.push(getUrlForUser(user));
      return;
    }

    setIsNavigating(true);
    try {
      const liveProfile = await getUserById(user.id);
      const newUsername = liveProfile.user?.account_name;
      
      if (!newUsername) {
        throw new Error('Account name missing');
      }

      setIsFocused(false);
      saveSearch({ ...user, account_name: newUsername });
      router.push(`/profile/${newUsername}`);
    } catch (err) {
      toast({ title: "Error", description: "Unable to load profile. The user may have been deleted or deactivated.", variant: "destructive" });
    } finally {
      setIsNavigating(false);
    }
  };
  
  const getUrlForUser = (user: SearchedUser) => {
    return user.type === 'COMPANY' || user.account_type === 'COMPANY'
      ? `/organization/${user.slug || user.id}`
      : `/profile/${user.account_name || user.id}`;
  };
  
  const renderAvatar = (user: SearchedUser) => {
    const fallbackInitial = (user.full_name || user.name || 'U').charAt(0).toUpperCase();
    if (user.avatar_url || user.avatar) {
      return (
        <img 
          src={user.avatar_url || user.avatar || ''} 
          alt={user.full_name || user.name || ''} 
          className="w-8 h-8 rounded-full object-cover shrink-0" 
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-ds-surface-1 flex items-center justify-center overflow-hidden shrink-0">
        <Icon name="user" className="w-[18px] h-[18px] text-ds-text-primary" />
      </div>
    );
  };

  const showRecent = isFocused && !searchQuery.trim() && history.length > 0;
  const showLive = isFocused && searchQuery.trim().length > 0;

  let paddingRightClass = '';
  if (pathname === '/feed') {
    paddingRightClass = 'md:pr-[220px]';
  } else if (pathname === '/profile') {
    paddingRightClass = 'md:pr-[253px]';
  }

  return (
    <div className={`fixed top-[40px] left-0 ${hasSidebar ? 'sm:left-[220px]' : ''} right-0 pointer-events-none z-50 ${paddingRightClass}`}>
      <div 
        ref={dropdownRef}
        className="w-full pl-4 sm:pl-6 md:pl-8 pr-[120px] md:pr-8"
      >
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">
        <div className="relative w-full max-w-[442px] pointer-events-auto">
          {/* Search Input Bar */}
          <div className="box-border flex flex-row justify-between items-center px-[12px] py-[6px] gap-[10px] w-full h-[40px] border-b border-ds-text-primary bg-transparent">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleSearch}
          className="flex-grow bg-transparent outline-none font-['DM_Sans'] text-[16px] leading-[24px] text-ds-text-primary placeholder:text-ds-text-muted w-full h-full"
        />
        <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary shrink-0 cursor-pointer hover:text-ds-accent transition-colors" onClick={() => {
          if (searchQuery.trim()) {
            setIsFocused(false);
            // router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }
        }} />
      </div>

      {/* Live Search Dropdown */}
      {showLive && (
        <div className="absolute top-[48px] left-0 w-full p-[12px] gap-[16px] flex flex-col bg-ds-bg rounded-[8px] shadow-xl z-50">
          {isSearching ? (
            <div className="text-[14px] leading-5 text-ds-text-muted">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="w-full flex flex-col gap-3 max-h-[276px] overflow-y-auto overscroll-contain scrollbar-hide">
              {searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={getUrlForUser(user)}
                  onClick={() => handleResultClick(user)}
                  className="w-full h-9 flex flex-row items-center justify-between gap-2 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2 h-9 min-w-0 flex-1">
                    {renderAvatar(user)}
                    <div className="h-9 flex flex-col justify-center items-start min-w-0 overflow-hidden flex-1">
                      <p className="text-[14px] leading-5 font-normal font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        {user.full_name || user.name}
                      </p>
                      {user.headline && (
                         <p className="text-[12px] leading-4 font-normal font-['DM_Sans'] text-ds-text-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-[75%]">
                           {user.headline}
                         </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {/*
              <div 
                onClick={() => {
                  setIsFocused(false);
                  // router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="w-full py-2 border-t border-ds-border text-[12px] font-medium text-ds-accent cursor-pointer text-center"
              >
                See all results for "{searchQuery}"
              </div>
              */}
            </div>
          ) : (
            <div className="text-[14px] leading-5 text-ds-text-muted">No results found.</div>
          )}
        </div>
      )}

      {/* Recent / Search History Dropdown */}
      {showRecent && (
        <div className="absolute top-[48px] left-0 w-full p-[12px] gap-[16px] flex flex-col bg-ds-bg rounded-[8px] shadow-xl z-50">
          <div className="flex justify-between items-center w-full mb-1">
            <h3 className="text-[14px] leading-5 font-normal text-ds-text-primary">Recent</h3>
          </div>
          <div className="w-full flex flex-col gap-3 max-h-[276px] overflow-y-auto overscroll-contain scrollbar-hide">
            {history.map((item) => {
              if (item.type === 'QUERY') {
                return (
                  <div key={item.id} className="w-full h-9 flex flex-row items-center justify-between gap-2 group transition-colors">
                    <div 
                      className="flex items-center gap-2 h-9 cursor-pointer flex-grow min-w-0"
                      onClick={() => {
                        setSearchQuery(item.value);
                        saveSearch(item.value);
                        setIsFocused(false);
                        router.push(`/search?q=${encodeURIComponent(item.value)}`);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-ds-surface-1 flex items-center justify-center overflow-hidden shrink-0">
                        <Icon name="search" className="w-[14px] h-[14px] text-ds-text-primary" />
                      </div>
                      <p className="text-[14px] leading-5 font-normal font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        {item.value}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearch(item.id);
                      }}
                      className="text-ds-text-secondary hover:text-ds-text-primary p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
                      aria-label="Remove recent search"
                    >
                      <Icon name="close" className="w-[16px] h-[16px] text-current" />
                    </button>
                  </div>
                );
              }
              
              const user = item.value as SearchedUser;
              return (
                <div key={item.id} className="w-full h-9 flex flex-row items-center justify-between gap-2 group transition-colors">
                  <div
                    className="flex items-center gap-2 h-9 cursor-pointer flex-grow min-w-0"
                    onClick={(e) => handleRecentUserClick(e, user)}
                  >
                    {renderAvatar(user)}
                    <div className="h-9 flex flex-col justify-center items-start min-w-0 overflow-hidden flex-1">
                      <p className="text-[14px] leading-5 font-normal font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        {user.full_name || user.name}
                      </p>
                      {user.headline && (
                        <p className="text-[12px] leading-4 font-normal font-['DM_Sans'] text-ds-text-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-[75%]">
                          {user.headline}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeSearch(item.id);
                    }}
                    className="text-ds-text-secondary hover:text-ds-text-primary p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
                    aria-label="Remove recent search"
                  >
                     <Icon name="close" className="w-[16px] h-[16px] text-current" />
                  </button>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => clearAll()}
            className="w-full text-center text-[12px] leading-5 font-medium text-ds-accent mt-1"
          >
            Clear all
          </button>
        </div>
      )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
