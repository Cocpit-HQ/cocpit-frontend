import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon, BusinessBuildingIcon } from '@/components/icons';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers, getUserById } from '@/services/api/user';
import { companyService } from '@/services/organization.service';
import { SearchedUser } from '@/types/user';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useToast } from '@/hooks/use-toast';

interface MobileSearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSearch?: (query: string) => void;
  category?: string;
  placeholder?: string;
}

export function MobileSearchScreen({
  isOpen,
  onClose,
  initialQuery = '',
  onSearch,
  category,
  placeholder,
}: MobileSearchScreenProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
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
    if (isOpen) {
      setSearchQuery(initialQuery || '');
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          transform: `translateY(${window.visualViewport.offsetTop}px)`,
        });
      } else {
        setViewportStyle({
          height: '100dvh',
          transform: 'none',
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

    // Lock background scroll completely when search is open
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      const len = (initialQuery || '').length;
      if (len > 0) {
        inputRef.current.setSelectionRange(len, len);
      }
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
      }

      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!isOpen || !debouncedSearch.trim()) {
        setSearchResults([]);
        setIsSearching(false);
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
  }, [debouncedSearch, isOpen]);

  const executeSearch = (rawTerm: string) => {
    const trimmed = rawTerm.trim();
    if (!trimmed) return;
    saveSearch(trimmed);
    onClose();

    if (onSearch) {
      onSearch(trimmed);
      return;
    }

    const currentPath =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/feed';
    const isAlreadySearch = currentPath.startsWith('/search') || currentPath.startsWith('/jobs/search');
    const safeOrigin = isAlreadySearch ? '/feed' : currentPath;

    if (typeof window !== 'undefined' && !isAlreadySearch) {
      sessionStorage.setItem('cocpit_search_origin', safeOrigin);
    }

    const categoryParam = category ? `&type=${encodeURIComponent(category)}` : '&type=all';
    router.push(`/search?q=${encodeURIComponent(trimmed)}${categoryParam}&returnTo=${encodeURIComponent(safeOrigin)}`);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(searchQuery);
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

    const isOrg = user.type === 'COMPANY' || user.account_type === 'COMPANY' ||
                  user.type === 'INSTITUTION' || user.account_type === 'INSTITUTION' ||
                  user.type === 'ORGANIZATION' || user.account_type === 'ORGANIZATION' ||
                  (user as any).entity_type === 'COMPANY' || (user as any).entity_type === 'INSTITUTION';

    if (isOrg) {
      setIsNavigating(true);
      try {
        const companySlug = user.slug || user.id;
        // Pass skipAuditLog: true so this pre-validation check does not trigger a duplicate audit log
        const liveCompany = await companyService.getCompany(companySlug, undefined, { skipAuditLog: true });
        const targetSlug = liveCompany?.slug || companySlug;
        onClose();
        saveSearch({ ...user, slug: targetSlug });
        router.push(`/organization/${targetSlug}`);
      } catch (err) {
        toast({ title: "Error", description: "Unable to load organization profile. It may have been deleted or deactivated.", variant: "destructive" });
      } finally {
        setIsNavigating(false);
      }
      return;
    }

    setIsNavigating(true);
    try {
      // Pass skipAudit: true & skipAuditLog: true so this pre-validation check does not trigger a duplicate VIEW_USER_PROFILE audit log
      const liveProfile = await getUserById(user.id, undefined, { skipAudit: true, skipAuditLog: true });
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
    const isOrg = user.type === 'COMPANY' || user.account_type === 'COMPANY' ||
                  user.type === 'INSTITUTION' || user.account_type === 'INSTITUTION' ||
                  user.type === 'ORGANIZATION' || user.account_type === 'ORGANIZATION' ||
                  (user as any).entity_type === 'COMPANY' || (user as any).entity_type === 'INSTITUTION';
    return isOrg
      ? `/organization/${user.slug || user.id}`
      : `/profile/${user.account_name || user.id}`;
  };
  
  const renderAvatar = (user: SearchedUser) => {
    const isCompany = user.type === 'COMPANY' || (user as any).type === 'company' || 
                      user.account_type === 'COMPANY' || (user as any).account_type === 'company' ||
                      user.type === 'INSTITUTION' || (user as any).type === 'institution' || 
                      user.account_type === 'INSTITUTION' || (user as any).account_type === 'institution' ||
                      (user as any).entity_type === 'COMPANY' || (user as any).entity_type === 'INSTITUTION';
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
    <div className="fixed inset-0 z-[99999] bg-ds-bg w-full h-full overflow-hidden select-text overscroll-contain md:hidden">
      <div 
        className="absolute inset-x-0 top-0 flex flex-col w-full bg-ds-bg"
        style={viewportStyle}
      >
        {/* Top Bar */}
        <div className="flex flex-row items-center px-4 pt-[max(16px,env(safe-area-inset-top,16px))] pb-3 gap-3 bg-ds-bg">
        <button onClick={onClose} className="text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none shrink-0" aria-label="Close search">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 flex flex-row items-center border-b border-ds-border pb-2 gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder === 'hr' ? 'Search' : (placeholder || 'Search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="flex-1 bg-transparent outline-none font-['DM_Sans'] text-[15px] text-ds-text-primary placeholder:text-ds-text-muted h-[24px]"
          />
          <Icon
            name="search"
            className="w-[18px] h-[18px] text-ds-text-muted shrink-0 cursor-pointer hover:text-ds-text-primary transition-colors"
            onClick={() => {
              executeSearch(searchQuery);
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
              <div className="text-[14px] leading-5 text-ds-text-muted mt-2">Searching...</div>
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
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {user.full_name || user.name}
                        </p>
                        {user.headline && (
                           <p className="text-[13px] leading-4 font-normal font-['DM_Sans'] text-ds-text-secondary whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[95%]">
                             {user.headline}
                           </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-[14px] leading-5 text-ds-text-muted mt-2">No results found.</div>
            )}
            {searchQuery.trim() && (
              <div
                onClick={() => executeSearch(searchQuery)}
                className="w-full py-3 flex items-center gap-2.5 text-ds-accent hover:bg-ds-surface-1 rounded-lg cursor-pointer transition-colors border-t border-ds-border/50 mt-3"
              >
                <Icon name="search" className="w-4 h-4 text-ds-accent shrink-0" />
                <span className="text-sm font-medium font-['DM_Sans'] truncate">
                  See all results for &ldquo;{searchQuery.trim()}&rdquo;
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recent / Search History Dropdown */}
        {showRecent && (
          <div className="flex flex-col w-full mt-2">
            <div className="flex justify-between items-center w-full mb-4">
              <h3 className="text-[15px] leading-5 font-normal text-ds-text-primary">Recent</h3>
              <button 
                onClick={() => clearAll()}
                className="text-[13px] leading-5 font-medium text-ds-accent"
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
                          executeSearch(item.value);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-ds-surface-1 flex items-center justify-center overflow-hidden shrink-0 border border-ds-border">
                          <Icon name="search" className="w-[18px] h-[18px] text-ds-text-muted" />
                        </div>
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {item.value}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(item.id);
                        }}
                        className="text-ds-text-muted hover:text-ds-text-primary p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
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
                        <p className="text-[15px] leading-5 font-medium font-['DM_Sans'] text-ds-text-primary whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {user.full_name || user.name}
                        </p>
                        {user.headline && (
                          <p className="text-[13px] leading-4 font-normal font-['DM_Sans'] text-ds-text-secondary whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[95%]">
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
                      className="text-ds-text-muted hover:text-ds-text-primary p-1 rounded-full transition-colors flex items-center justify-center shrink-0"
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
      </div>
    </div>,
    document.body
  );
}
