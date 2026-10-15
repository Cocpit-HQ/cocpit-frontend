import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon, BusinessBuildingIcon } from '@/components/icons';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers, getUserById } from '@/services/api/user';
import { SearchedUser } from '@/types/user';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useToast } from '@/hooks/use-toast';

interface MobileSearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchScreen({ isOpen, onClose }: MobileSearchScreenProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 600);
  const { history, saveSearch, removeSearch, clearAll } = useSearchHistory();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({
    height: '100dvh',
    top: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          top: `${window.visualViewport.offsetTop}px`,
        });
      } else {
        setViewportStyle({
          height: '100dvh',
          top: 0,
        });
      }
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    } else {
      window.addEventListener('resize', updateViewport);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleResultClick = (user: SearchedUser) => {
    saveSearch(user);
    onClose();
  };

  const handleRecentUserClick = async (e: React.MouseEvent, user: SearchedUser) => {
    e.preventDefault();
    if (isNavigating) return;

    if (!user.id) {
      toast({ title: "Error", description: "Invalid history record.", variant: "destructive" });
      return;
    }

    if (user.type === 'COMPANY' || user.account_type === 'COMPANY') {
      onClose();
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

      onClose();
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
    const isCompany = user.type === 'COMPANY' || (user as any).type === 'company' || (user as any).account_type === 'COMPANY' || (user as any).account_type === 'company';
    const roundedClass = isCompany ? 'rounded-[8px]' : 'rounded-full';
    if (user.avatar_url || user.avatar) {
      return (
        <img 
          src={user.avatar_url || user.avatar || ''} 
          alt={user.full_name || user.name || ''} 
          className={`w-10 h-10 ${roundedClass} object-cover shrink-0`} 
        />
      );
    }
    return (
      <div className={`w-10 h-10 ${roundedClass} bg-ds-surface-1 flex items-center justify-center overflow-hidden shrink-0`}>
        {isCompany ? (
          <BusinessBuildingIcon className="w-5 h-5 text-ds-text-primary" />
        ) : (
          <Icon name="user" className="w-5 h-5 text-ds-text-primary" />
        )}
      </div>
    );
  };

  if (!isOpen || !mounted) return null;

  const showRecent = !searchQuery.trim() && history.length > 0;
  const showLive = searchQuery.trim().length > 0;

  return createPortal(
    <div 
      className="fixed inset-x-0 z-[99999] bg-ds-bg flex flex-col w-full sm:hidden"
      style={viewportStyle}
    >
      {/* Top Bar */}
      <div className="flex flex-row items-center px-4 pt-12 pb-4 gap-3">
        <button onClick={onClose} className="text-[#A1A1AA] hover:text-white transition-colors outline-none shrink-0" aria-label="Close search">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 flex flex-row items-center border-b border-[#3F3F46] pb-2 gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="flex-1 bg-transparent outline-none font-['DM_Sans'] text-[15px] text-white placeholder:text-[#A1A1AA] h-[24px]"
          />
          <Icon
            name="search"
            className="w-[18px] h-[18px] text-[#A1A1AA] shrink-0 cursor-pointer hover:text-white transition-colors"
            onClick={() => {
              if (searchQuery.trim()) {
                onClose();
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          />
        </div>
      </div>

      <div 
        className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto overscroll-contain px-5 pb-5"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Live Search Dropdown */}
        {showLive && (
          <div className="flex flex-col w-full">
            {isSearching ? (
              <div className="text-[14px] leading-5 text-[#A1A1AA] mt-2">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="w-full flex flex-col gap-5 mt-2">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    href={getUrlForUser(user)}
                    onClick={() => handleResultClick(user)}
                    className="w-full flex flex-row items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {renderAvatar(user)}
                      <div className="flex flex-col justify-center items-start min-w-0 flex-1">
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {user.full_name || user.name}
                        </p>
                        {user.headline && (
                           <p className="text-[13px] leading-4 font-normal font-['DM_Sans'] text-[#A1A1AA] whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[95%]">
                             {user.headline}
                           </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-[14px] leading-5 text-[#A1A1AA] mt-2">No results found.</div>
            )}
          </div>
        )}

        {/* Recent / Search History Dropdown */}
        {showRecent && (
          <div className="flex flex-col w-full mt-2">
            <div className="flex justify-between items-center w-full mb-4">
              <h3 className="text-[15px] leading-5 font-normal text-white">Recent</h3>
              <button 
                onClick={() => clearAll()}
                className="text-[13px] leading-5 font-medium text-[#FF6422]"
              >
                Clear all
              </button>
            </div>
            <div className="w-full flex flex-col gap-5">
              {history.map((item) => {
                if (item.type === 'QUERY') {
                  return (
                    <div key={item.id} className="w-full flex flex-row items-center justify-between gap-3 group">
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-grow min-w-0"
                        onClick={() => {
                          setSearchQuery(item.value);
                          saveSearch(item.value);
                          onClose();
                          router.push(`/search?q=${encodeURIComponent(item.value)}`);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-ds-surface-1 flex items-center justify-center overflow-hidden shrink-0 border border-[#3F3F46]">
                          <Icon name="search" className="w-[18px] h-[18px] text-[#A1A1AA]" />
                        </div>
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {item.value}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(item.id);
                        }}
                        className="text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
                        aria-label="Remove recent search"
                      >
                        <Icon name="close" className="w-[16px] h-[16px] text-current" />
                      </button>
                    </div>
                  );
                }
                
                const user = item.value as SearchedUser;
                return (
                  <div key={item.id} className="w-full flex flex-row items-center justify-between gap-3 group">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-grow min-w-0"
                      onClick={(e) => handleRecentUserClick(e, user)}
                    >
                      {renderAvatar(user)}
                      <div className="flex flex-col justify-center items-start min-w-0 flex-1">
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {user.full_name || user.name}
                        </p>
                        {user.headline && (
                          <p className="text-[13px] leading-4 font-normal font-['DM_Sans'] text-[#A1A1AA] whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[95%]">
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
                      className="text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
                      aria-label="Remove recent search"
                    >
                       <Icon name="close" className="w-[16px] h-[16px] text-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
