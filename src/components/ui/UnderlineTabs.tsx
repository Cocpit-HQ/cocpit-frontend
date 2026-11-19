'use client';

import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  badge?: boolean;
  featureKey?: string;
  disabled?: boolean;
  wrapper?: (button: React.ReactElement, tab: TabItem<T>) => React.ReactNode;
}

interface UnderlineTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  rightElement?: React.ReactNode;
  tablistAriaLabel?: string;
  gap?: string;
  padding?: string;
}

/**
 * Standard UnderlineTabs component following the Cocpit design system.
 * - Width dynamically hugs text length + horizontal padding (`px-3` / 12px or customizable)
 * - Underline: `h-[3px] rounded-full left-[1%] right-[1%] bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)]`
 * - Compliant with `newGlobal.css` tokens and DM Sans font
 * - Fully accessible keyboard navigation (`ArrowRight` / `ArrowLeft`)
 */
export function UnderlineTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
  rightElement,
  tablistAriaLabel,
  gap = 'gap-[12px]',
  padding = 'px-3',
}: UnderlineTabsProps<T>) {
  const tablistRef = React.useRef<HTMLDivElement>(null);
  const prevActiveTabRef = React.useRef<T>(activeTab);

  // Auto-scroll on tab change bidirectionally (reveals next tab when moving forward, reveals previous tab when moving backward)
  React.useEffect(() => {
    const prevTab = prevActiveTabRef.current;
    const prevIndex = tabs.findIndex((t) => t.id === prevTab);
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    prevActiveTabRef.current = activeTab;

    // Do not scroll on initial mount or if tab hasn't changed
    if (prevTab === activeTab) return;

    const container = tablistRef.current;
    if (!container) return;

    const activeBtn = container.querySelector(`[aria-selected="true"]`) as HTMLElement | null;
    if (!activeBtn) return;

    const containerRect = container.getBoundingClientRect();

    if (currentIndex < prevIndex) {
      // Moving backward: ensure previous tab (or current tab if first) is revealed to the left
      const targetBtn = (activeBtn.previousElementSibling as HTMLElement | null) || activeBtn;
      const targetRect = targetBtn.getBoundingClientRect();
      if (targetRect.left < containerRect.left) {
        const diff = targetRect.left - containerRect.left - 16;
        container.scrollBy({ left: diff, behavior: 'smooth' });
      }
    } else if (currentIndex > prevIndex) {
      // Moving forward: ensure next tab (or current tab if last) is revealed to the right
      const targetBtn = (activeBtn.nextElementSibling as HTMLElement | null) || activeBtn;
      const targetRect = targetBtn.getBoundingClientRect();
      if (targetRect.right > containerRect.right) {
        const diff = targetRect.right - containerRect.right + 16;
        container.scrollBy({ left: diff, behavior: 'smooth' });
      }
    }
  }, [activeTab, tabs]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      let nextIndex = (index + 1) % tabs.length;
      while (tabs[nextIndex].disabled && nextIndex !== index) {
        nextIndex = (nextIndex + 1) % tabs.length;
      }
      if (!tabs[nextIndex].disabled) {
        onChange(tabs[nextIndex].id);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      let prevIndex = (index - 1 + tabs.length) % tabs.length;
      while (tabs[prevIndex].disabled && prevIndex !== index) {
        prevIndex = (prevIndex - 1 + tabs.length) % tabs.length;
      }
      if (!tabs[prevIndex].disabled) {
        onChange(tabs[prevIndex].id);
      }
    }
  };

  const textSize = size === 'sm' ? 'text-[14px] leading-[20px]' : 'text-[16px] leading-[24px]';

  return (
    <div
      className={`w-full flex items-center justify-between h-9 select-none font-['DM_Sans'] ${className}`}
    >
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={tablistAriaLabel}
        aria-orientation="horizontal"
        className={`flex items-center ${gap} h-9 overflow-x-auto scrollbar-hide no-scrollbar scroll-smooth touch-pan-x flex-1 min-w-0`}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          const buttonElement = (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              tabIndex={isActive && !isDisabled ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={(e) => {
                if (!isDisabled) {
                  const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                  onChange(tab.id);
                  const container = tablistRef.current;
                  if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const target = e.currentTarget;
                    if (index < currentIndex) {
                      // Moving backward: reveal previous tab to the left
                      const prevTabEl = (target.previousElementSibling as HTMLElement | null) || target;
                      const prevRect = prevTabEl.getBoundingClientRect();
                      if (prevRect.left < containerRect.left) {
                        const diff = prevRect.left - containerRect.left - 16;
                        container.scrollBy({ left: diff, behavior: 'smooth' });
                      }
                    } else if (index > currentIndex) {
                      // Moving forward: reveal next tab to the right
                      const nextTabEl = (target.nextElementSibling as HTMLElement | null) || target;
                      const nextRect = nextTabEl.getBoundingClientRect();
                      if (nextRect.right > containerRect.right) {
                        const diff = nextRect.right - containerRect.right + 16;
                        container.scrollBy({ left: diff, behavior: 'smooth' });
                      }
                    }
                  }
                }
              }}
              className={`relative flex flex-col justify-between items-center h-9 ${padding} py-1.5 bg-transparent border-none focus:outline-none shrink-0 ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed select-none'
                  : 'cursor-pointer group'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {tab.badge && (
                  <span
                    className="w-1 h-1 rounded-full bg-ds-accent shrink-0 inline-block"
                    style={{
                      boxShadow:
                        '-1px -1px 4px rgba(255, 236, 230, 0.4), 1px 1px 4px rgba(255, 236, 230, 0.4)',
                    }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`font-['DM_Sans'] font-medium ${textSize} transition-colors whitespace-nowrap ${
                    isDisabled
                      ? 'text-ds-text-muted'
                      : isActive
                      ? 'text-ds-text-primary'
                      : 'text-ds-text-secondary group-hover:text-ds-text-primary'
                  }`}
                >
                  {tab.label}
                </span>
                {typeof tab.count === 'number' && (
                  <span className="text-xs text-ds-text-muted">
                    ({tab.count})
                  </span>
                )}
              </div>
              {isActive && !isDisabled ? (
                <span
                  className="absolute bottom-0 left-[1%] right-[1%] h-[3px] rounded-full bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)] transition-all"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="absolute bottom-0 left-[1%] right-[1%] h-[3px] bg-transparent transition-all"
                  aria-hidden="true"
                />
              )}
            </button>
          );

          if (tab.wrapper) {
            return (
              <React.Fragment key={tab.id}>
                {tab.wrapper(buttonElement, tab)}
              </React.Fragment>
            );
          }

          return buttonElement;
        })}
      </div>

      {rightElement && (
        <div className="flex items-center shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
}
export default UnderlineTabs;
