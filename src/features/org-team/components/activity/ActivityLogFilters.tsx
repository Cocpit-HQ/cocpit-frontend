'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { Icon } from '@/components/icons';
import { ActivityLogFilters } from '../../types/team.types';
import RoleDropdown from './RoleDropdown';

interface ActivityLogFiltersProps {
  filters: ActivityLogFilters;
  onFiltersChange: (filters: ActivityLogFilters) => void;
  roleOptions?: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  hideRoleDropdown?: boolean;
  variant?: 'default' | 'compact';
}

const DATE_RANGE_OPTIONS = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'all_time', label: 'All time' },
];

export default function ActivityLogFiltersBar({
  filters,
  onFiltersChange,
  memberOptions,
  roleOptions = [],
  hideRoleDropdown = false,
  variant = 'default',
}: ActivityLogFiltersProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<'roles' | 'members' | 'dateRange' | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(isMobileFilterOpen);

  const update = (patch: Partial<ActivityLogFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const allRoleOptions = React.useMemo(() => {
    if (roleOptions.some((o) => o.value === 'all')) return roleOptions;
    return [{ value: 'all', label: 'All roles' }, ...roleOptions];
  }, [roleOptions]);

  const allMemberOptions = React.useMemo(() => {
    if (memberOptions.some((o) => o.value === 'all')) return memberOptions;
    return [{ value: 'all', label: 'All members' }, ...memberOptions];
  }, [memberOptions]);

  const selectedRoleLabel =
    allRoleOptions.find((o) => o.value === filters.roleId)?.label || 'All roles';

  const selectedMemberLabel =
    allMemberOptions.find((o) => o.value === filters.memberId)?.label || 'All members';

  const selectedDateRangeLabel =
    DATE_RANGE_OPTIONS.find((o) => o.value === filters.dateRange)?.label || 'Last 7 days';

  if (variant === 'compact') {
    const hasActiveFilters =
      filters.memberId !== 'all' ||
      filters.dateRange !== 'last_7_days' ||
      (!hideRoleDropdown && filters.roleId !== 'all');

    return (
      <>
        <div className="flex flex-row items-center p-0 gap-[12px] md:gap-[16px] w-full max-w-[800px] h-[40px] mb-2">
          {/* Search box */}
          <div className="box-border flex flex-row justify-between items-center px-[12px] py-[6px] gap-[10px] flex-1 h-[40px] border-b border-ds-text-primary">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search"
              className="flex-1 font-['DM_Sans',sans-serif] font-normal text-[16px] leading-[24px] text-ds-text-primary bg-transparent outline-none placeholder:text-ds-text-muted text-left"
            />
            <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary shrink-0" />
          </div>

          {/* Mobile Filter Button (< md) */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Filter activity logs"
            className="md:hidden relative flex items-center justify-center w-[20px] h-[20px] text-ds-text-primary hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 6.25H17.5M5 10H15M7.5 13.75H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ds-accent" />
            )}
          </button>

          {/* Desktop Filter Pills (>= md) */}
          <div className="hidden md:flex items-center gap-[16px] shrink-0">
            {!hideRoleDropdown && (
              <RoleDropdown
                options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
                value={filters.roleId}
                onChange={(v) => update({ roleId: v })}
                placeholder="All roles"
                variant="pill"
              />
            )}
            <RoleDropdown
              options={[{ value: 'all', label: 'All members' }, ...memberOptions]}
              value={filters.memberId}
              onChange={(v) => update({ memberId: v })}
              placeholder="All members"
              variant="pill"
            />
            <RoleDropdown
              options={DATE_RANGE_OPTIONS}
              value={filters.dateRange}
              onChange={(v) => update({ dateRange: v })}
              placeholder="Last 7 days"
              variant="pill"
            />
          </div>
        </div>

        {/* Mobile Bottom-up Filter Modal */}
        {mounted && isMobileFilterOpen && createPortal(
          <div className="fixed inset-0 z-[9999] md:hidden overscroll-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
              onClick={() => {
                setIsMobileFilterOpen(false);
                setExpandedSection(null);
              }}
            />

            {/* Bottom Sheet */}
            <div
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto overscroll-contain bg-ds-bg rounded-t-[8px] px-3 pt-2 pb-[max(24px,env(safe-area-inset-bottom,24px))] flex flex-col gap-4 border-t border-ds-border select-none animate-in slide-in-from-bottom duration-200 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div
                className="w-full flex items-center justify-center h-[20px] cursor-pointer"
                onClick={() => {
                  setIsMobileFilterOpen(false);
                  setExpandedSection(null);
                }}
              >
                <div className="w-[50px] h-[2px] rounded-full bg-ds-text-muted" />
              </div>

              {/* Header: Title + Clear */}
              <div className="flex items-center justify-between w-full h-[36px] px-1">
                <h3 className="font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] text-ds-text-primary">
                  Filter
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    update({
                      memberId: 'all',
                      dateRange: 'last_7_days',
                      ...(!hideRoleDropdown ? { roleId: 'all' } : {}),
                    });
                    setExpandedSection(null);
                  }}
                  className="font-['DM_Sans',sans-serif] font-normal text-[14px] leading-[20px] text-ds-error hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Roles filter (if not hidden) */}
              {!hideRoleDropdown && roleOptions.length > 0 && (
                <div className="flex flex-col items-start gap-[10px] w-full py-2 px-0">
                  <label className="font-['DM_Sans',sans-serif] font-medium text-[12px] leading-[16px] text-ds-text-secondary">
                    Roles
                  </label>
                  <div className="relative w-full flex flex-col gap-[10px]">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'roles' ? null : 'roles')}
                      className={`w-full h-[36px] flex items-center justify-between px-3 py-1.5 rounded-[100px] text-ds-text-primary font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] outline-none cursor-pointer transition-colors ${
                        expandedSection === 'roles' ? 'bg-ds-surface-1' : 'bg-transparent'
                      }`}
                    >
                      <span className="truncate">{selectedRoleLabel}</span>
                      <Icon
                        name="chevron-down"
                        className={`w-4 h-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
                          expandedSection === 'roles' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedSection === 'roles' && (
                      <div className="flex flex-col items-start px-3 py-1.5 gap-3 w-full max-h-[128px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {allRoleOptions.map((opt) => {
                          const isSelected = filters.roleId === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                update({ roleId: opt.value });
                                setExpandedSection(null);
                              }}
                              className={`w-full text-left font-['DM_Sans',sans-serif] font-normal text-[14px] leading-[20px] transition-colors cursor-pointer ${
                                isSelected ? 'text-ds-accent' : 'text-ds-text-primary hover:opacity-80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members filter */}
              <div className="flex flex-col items-start gap-[10px] w-full py-2 px-0">
                <label className="font-['DM_Sans',sans-serif] font-medium text-[12px] leading-[16px] text-ds-text-secondary">
                  Member
                </label>
                <div className="relative w-full flex flex-col gap-[10px]">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'members' ? null : 'members')}
                    className={`w-full h-[36px] flex items-center justify-between px-3 py-1.5 rounded-[100px] text-ds-text-primary font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] outline-none cursor-pointer transition-colors ${
                      expandedSection === 'members' ? 'bg-ds-surface-1' : 'bg-transparent'
                    }`}
                  >
                    <span className="truncate">{selectedMemberLabel}</span>
                    <Icon
                      name="chevron-down"
                      className={`w-4 h-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
                        expandedSection === 'members' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedSection === 'members' && (
                    <div className="flex flex-col items-start px-3 py-1.5 gap-3 w-full max-h-[128px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {allMemberOptions.map((opt) => {
                        const isSelected = filters.memberId === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              update({ memberId: opt.value });
                              setExpandedSection(null);
                            }}
                            className={`w-full text-left font-['DM_Sans',sans-serif] font-normal text-[14px] leading-[20px] transition-colors cursor-pointer ${
                              isSelected ? 'text-ds-accent' : 'text-ds-text-primary hover:opacity-80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Date range filter */}
              <div className="flex flex-col items-start gap-[10px] w-full py-2 px-0">
                <label className="font-['DM_Sans',sans-serif] font-medium text-[12px] leading-[16px] text-ds-text-secondary">
                  Date range
                </label>
                <div className="relative w-full flex flex-col gap-[10px]">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'dateRange' ? null : 'dateRange')}
                    className={`w-full h-[36px] flex items-center justify-between px-3 py-1.5 rounded-[100px] text-ds-text-primary font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] outline-none cursor-pointer transition-colors ${
                      expandedSection === 'dateRange' ? 'bg-ds-surface-1' : 'bg-transparent'
                    }`}
                  >
                    <span className="truncate">{selectedDateRangeLabel}</span>
                    <Icon
                      name="chevron-down"
                      className={`w-4 h-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
                        expandedSection === 'dateRange' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedSection === 'dateRange' && (
                    <div className="flex flex-col items-start px-3 py-1.5 gap-3 w-full max-h-[128px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {DATE_RANGE_OPTIONS.map((opt) => {
                        const isSelected = filters.dateRange === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              update({ dateRange: opt.value });
                              setExpandedSection(null);
                            }}
                            className={`w-full text-left font-['DM_Sans',sans-serif] font-normal text-[14px] leading-[20px] transition-colors cursor-pointer ${
                              isSelected ? 'text-ds-accent' : 'text-ds-text-primary hover:opacity-80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className="w-full flex flex-row items-start gap-6 max-w-[960px] sticky top-[72px] z-20 bg-ds-bg pt-2.5 pb-3">
      {/* Search logs */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Search logs
        </span>
        <div className="flex items-center gap-2 px-6 h-[50px] rounded-[24px] border border-ds-border bg-transparent w-full box-border">
          <Icon name="search" className="ds-icon-16 text-ds-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search..."
            className="flex-1 ds-text-body text-ds-text-primary outline-none bg-transparent placeholder:text-ds-text-muted"
          />
        </div>
      </div>

      {/* Role */}
      {!hideRoleDropdown && (
        <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
          <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
            Role
          </span>
          <RoleDropdown
            options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
            value={filters.roleId}
            onChange={(v) => update({ roleId: v })}
            placeholder="All roles"
          />
        </div>
      )}

      {/* Member */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Member
        </span>
        <RoleDropdown
          options={[{ value: 'all', label: 'All members' }, ...memberOptions]}
          value={filters.memberId}
          onChange={(v) => update({ memberId: v })}
          placeholder="All members"
        />
      </div>

      {/* Date range */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Date range
        </span>
        <RoleDropdown
          options={DATE_RANGE_OPTIONS}
          value={filters.dateRange}
          onChange={(v) => update({ dateRange: v })}
          placeholder="Date range"
        />
      </div>
    </div>
  );
}

