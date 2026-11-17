'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { LeftArrowIcon } from '@/components/icons';
import { GlobalSearch } from '@/features/navigation/components/GlobalSearch';
import { MobileSearchScreen } from '@/features/navigation/components/MobileSearchScreen';
import { SearchCategory } from '../types/search.types';

interface SearchHeaderBarProps {
  initialQuery: string;
  onSearch: (newQuery: string) => void;
  onBack?: () => void;
  onClose?: () => void;
  placeholder?: string;
  category?: SearchCategory;
}

export const isSafeExitUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string' || !url.startsWith('/')) return false;
  // Reject protocol-relative URLs (open-redirect security risk)
  if (url.startsWith('//') || url.startsWith('/\\')) return false;
  // Reject looping back into search
  if (url.startsWith('/search') || url.startsWith('/jobs/search')) return false;
  return true;
};

export const isInvalidSearchExit = (url: string | null | undefined): boolean => !isSafeExitUrl(url);

export const SearchHeaderBar: React.FC<SearchHeaderBarProps> = ({
  initialQuery,
  onSearch,
  onBack,
  onClose,
  placeholder = 'hr',
  category,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const referrer = document.referrer;
    if (
      referrer &&
      referrer.includes(window.location.host) &&
      !referrer.includes('/search')
    ) {
      try {
        const urlObj = new URL(referrer);
        sessionStorage.setItem('cocpit_pre_search_url', urlObj.pathname + urlObj.search);
        sessionStorage.setItem('cocpit_search_origin', urlObj.pathname + urlObj.search);
      } catch {
        // Ignore parse error
      }
    }
  }, []);

  const handleExitSearch = () => {
    let targetDestination: string | null = null;

    // 1. Explicit returnTo param takes highest priority if safe
    const returnTo = searchParams?.get('returnTo');
    if (returnTo && isSafeExitUrl(returnTo)) {
      targetDestination = returnTo;
    } else if (typeof window !== 'undefined') {
      // 2. Explicitly tracked search origin
      const searchOrigin = sessionStorage.getItem('cocpit_search_origin');
      if (searchOrigin && isSafeExitUrl(searchOrigin)) {
        targetDestination = searchOrigin;
      } else {
        // 3. Tracked real base origin outside of search (e.g. /feed, /jobs)
        const outsideSearch = sessionStorage.getItem('cocpit_last_location_outside_search');
        if (outsideSearch && isSafeExitUrl(outsideSearch)) {
          targetDestination = outsideSearch;
        } else {
          // 4. Fallback to pre-search URL if valid
          const preSearch = sessionStorage.getItem('cocpit_pre_search_url');
          if (preSearch && isSafeExitUrl(preSearch)) {
            targetDestination = preSearch;
          } else {
            // 5. Fallback to general last location if valid
            const lastLocation = sessionStorage.getItem('cocpit_last_location');
            if (lastLocation && isSafeExitUrl(lastLocation)) {
              targetDestination = lastLocation;
            }
          }
        }
      }
    }

    // Clean up temporary search keys only after resolving targetDestination
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cocpit_search_steps');
      sessionStorage.removeItem('cocpit_last_search_url');
      sessionStorage.removeItem('cocpit_search_origin');
      sessionStorage.removeItem('cocpit_pre_search_url');
    }

    if (targetDestination) {
      router.push(targetDestination);
      return;
    }

    const typeParam = searchParams?.get('type');
    if (typeParam === 'jobs') {
      router.push('/jobs');
      return;
    }

    // Default safe return is feed
    router.push('/feed');
  };

  const handleBack = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const rawSteps = sessionStorage.getItem('cocpit_search_steps');
        const steps: string[] = rawSteps ? JSON.parse(rawSteps) : [];
        if (steps.length > 1) {
          steps.pop();
          const prevStepUrl = steps[steps.length - 1];
          sessionStorage.setItem('cocpit_search_steps', JSON.stringify(steps));
          router.push(prevStepUrl, { scroll: false });
          return;
        }
      } catch {
        // ignore
      }
    }

    handleExitSearch();
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onClose) {
      onClose();
      return;
    }
    handleExitSearch();
  };

  return (
    <>
      {/* Mobile Header Bar (< md) */}
      <div className="md:hidden flex items-center gap-3 px-4 pt-3 pb-2 w-full bg-ds-bg">
        <button
          type="button"
          onClick={handleBack}
          className="text-ds-text-primary hover:opacity-80 transition-opacity bg-transparent border-none outline-none p-0 cursor-pointer shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className="flex-1 flex justify-between items-center border-b border-ds-text-primary pb-1 bg-transparent min-w-0 cursor-text"
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <input
            type="text"
            readOnly
            value={localQuery}
            onFocus={() => setIsMobileSearchOpen(true)}
            placeholder={placeholder === 'hr' ? 'Search' : (placeholder || 'Search')}
            className="bg-transparent text-ds-text-primary placeholder:text-ds-text-muted text-base w-full focus:outline-none font-dm-sans cursor-text"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileSearchOpen(true);
            }}
            className="text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none p-0 cursor-pointer shrink-0 ml-2"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <MobileSearchScreen
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          initialQuery={localQuery}
          onSearch={(newQuery) => {
            setLocalQuery(newQuery);
            onSearch(newQuery);
          }}
          placeholder={placeholder}
          category={category}
        />
      </div>

      {/* Desktop Header Bar (>= md) */}
      <div className="hidden md:flex w-full items-center justify-center relative px-4 sm:px-10 pt-[40px] pb-1">
        {/* Back Button (Top Left) */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-4 sm:left-10 md:left-[40px] top-[40px] h-10 flex items-center gap-2 cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity bg-transparent border-none outline-none font-dm-sans select-none z-10 focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm"
          aria-label="Back"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span className="hidden sm:inline text-base font-medium leading-6">Back</span>
        </button>

        {/* Center Search Bar */}
        <GlobalSearch
          variant="embedded"
          initialQuery={localQuery}
          onSearch={(newQuery) => {
            setLocalQuery(newQuery);
            onSearch(newQuery);
          }}
          placeholder={placeholder}
          category={category}
        />

        {/* Cancel/Close Button (Top Right) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 sm:right-10 md:right-[40px] top-[40px] h-10 w-10 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none outline-none select-none z-10 focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm"
          aria-label="Close search"
        >
          <X className="w-5 h-5 text-ds-text-primary shrink-0" />
        </button>
      </div>
    </>
  );
};
