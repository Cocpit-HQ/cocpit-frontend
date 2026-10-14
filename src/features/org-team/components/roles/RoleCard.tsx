'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons';
import { TeamRole, TeamMember, TeamPermission, PERMISSION_LABELS, getPermissionLabel } from '../../types/team.types';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';

interface MemberAvatarProps {
  member: TeamMember;
  zIndex: number;
}

function MemberAvatar({ member, zIndex }: MemberAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = member.avatarUrl || (member as any).avatar || (member as any).avatar_url;

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={member.name || 'Member'}
        onError={() => setImgError(true)}
        className="w-6 h-6 rounded-full border border-white object-cover flex-shrink-0 relative box-border"
        style={{ zIndex }}
      />
    );
  }

  return (
    <div
      className="w-6 h-6 rounded-full border border-white bg-ds-surface-1 flex items-center justify-center overflow-hidden flex-shrink-0 relative box-border"
      style={{ zIndex }}
    >
      <Icon name="user" className="w-3.5 h-3.5 text-ds-text-primary" />
    </div>
  );
}

interface RoleCardProps {
  role: TeamRole;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}

export default function RoleCard({ role, onClick, onEdit, onDelete, onInvite }: RoleCardProps) {
  const { activeProfile } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);

  const isAdminRole = role.name?.toLowerCase() === 'admin';
  const canInviteToRole = isAdminRole
    ? Boolean(perms.isOwner || perms.isAdmin)
    : Boolean(perms.isOwner || perms.canManageMembers);

  const hasMenuActions = canInviteToRole || (role.name !== 'Admin');

  const [showMenu, setShowMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  const getActiveMenuEl = useCallback(() => {
    if (desktopMenuRef.current && desktopMenuRef.current.offsetParent !== null) {
      return desktopMenuRef.current;
    }
    if (mobileMenuRef.current && mobileMenuRef.current.offsetParent !== null) {
      return mobileMenuRef.current;
    }
    return desktopMenuRef.current || mobileMenuRef.current;
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    function handleClickOutside(event: MouseEvent) {
      const activeEl = getActiveMenuEl();
      if (activeEl && !activeEl.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    function checkVisibility() {
      const activeEl = getActiveMenuEl();
      if (!activeEl) return;
      const rect = activeEl.getBoundingClientRect();
      const headerHeight = window.innerWidth >= 1024 ? 90 : 60;
      if (rect.bottom <= headerHeight || rect.top >= window.innerHeight) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', checkVisibility, { capture: true, passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    const activeEl = getActiveMenuEl();
    let observer: IntersectionObserver | null = null;
    if (activeEl && typeof IntersectionObserver !== 'undefined') {
      const headerHeight = window.innerWidth >= 1024 ? 90 : 60;
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && !entry.isIntersecting) {
            setShowMenu(false);
          }
        },
        {
          rootMargin: `-${headerHeight}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      observer.observe(activeEl);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', checkVisibility, { capture: true });
      window.removeEventListener('resize', checkVisibility);
      observer?.disconnect();
    };
  }, [showMenu, getActiveMenuEl]);

  const formatPermissions = (perms: TeamPermission[]) => {
    if (!perms || perms.length === 0) return 'No permissions';
    const filtered = perms.filter((p) => {
      const u = String(p).toUpperCase().trim();
      return u !== 'CHANNEL' && u !== 'CHANNELS';
    });
    if (filtered.length === 0) return 'No permissions';
    const mapped = filtered.map(p => getPermissionLabel(p));
    const shouldTruncate = mapped.length > 3;
    const displayPerms = shouldTruncate ? mapped.slice(0, 3) : mapped;
    const str = displayPerms.join(', ') + (shouldTruncate ? '...' : '');
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const members = role.members || [];
  const totalCount = members.length > 0 ? members.length : (role.memberCount ?? 0);
  const hasOverflow = totalCount > 3;
  const visibleMembers = hasOverflow ? members.slice(0, 2) : members.slice(0, 3);
  const remainingCount = totalCount - visibleMembers.length;

  return (
    <div
      onClick={onClick}
      className="w-full px-4 py-3 lg:py-0 lg:h-[60px] flex flex-col lg:flex-row justify-between lg:items-center transition-colors cursor-pointer rounded-[8px] hover:bg-ds-surface-1 gap-2 lg:gap-0"
    >
      {/* Top row on mobile/tablet: Name + Menu */}
      <div className="flex items-center justify-between lg:justify-start lg:w-[200px] lg:flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: role.color }}
          />
          <div className="justify-center text-ds-text-primary ds-text-body-1 truncate">
            {role.name}
          </div>
        </div>
        {/* Mobile/tablet menu button */}
        {hasMenuActions && (
          <div className={`lg:hidden relative ${showMenu ? 'z-30' : ''}`} ref={mobileMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-ds-text-secondary hover:text-ds-text-primary transition-colors"
            >
              <Icon name="menu" className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-[40px] w-[111px] flex flex-col items-start p-[12px] gap-[16px] bg-ds-bg border border-ds-border rounded-[16px] z-30 box-border">
                {canInviteToRole && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onInvite(); }}
                    className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                  >
                    Add member
                  </button>
                )}
                {role.name !== 'Admin' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                      className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                    >
                      Edit role
                    </button>
                    {!role.isSystemRole && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                        className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                      >
                        Delete role
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom row on mobile/tablet: Member count + Avatars */}
      <div className="flex items-center gap-4 lg:contents">
        <div className="lg:w-[120px] lg:flex-shrink-0 flex justify-start items-center">
          <div className="text-ds-text-primary ds-text-body-1 truncate">
            {totalCount} Member{totalCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="lg:w-[120px] lg:flex-shrink-0 flex justify-start items-center -space-x-2">
          {visibleMembers.map((member, index) => (
            <MemberAvatar
              key={member.id || index}
              member={member}
              zIndex={index}
            />
          ))}
          {hasOverflow && remainingCount > 0 && (
            <div
              className="w-6 h-6 rounded-full bg-[#1A73E8] border border-white flex items-center justify-center flex-shrink-0 relative box-border"
              style={{ zIndex: visibleMembers.length }}
            >
              <span className="font-['Poppins'] text-[12px] leading-[16px] font-normal text-white text-center select-none whitespace-nowrap">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permissions — hidden below lg */}
      <div className="hidden lg:flex flex-1 min-w-0 justify-start items-center pr-4">
        <div className="text-ds-text-primary ds-text-body-1 truncate w-full">
          {role.name === 'Admin' ? 'All permissions' : formatPermissions(role.permissions)}
        </div>
      </div>

      {/* Desktop menu button — only on lg+ */}
      {hasMenuActions ? (
        <div className={`hidden lg:flex w-[40px] flex-shrink-0 relative justify-end items-center ${showMenu ? 'z-30' : ''}`} ref={desktopMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-ds-text-secondary hover:text-ds-text-primary transition-colors"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-[40px] w-[111px] flex flex-col items-start p-[12px] gap-[16px] bg-ds-bg border border-ds-border rounded-[16px] z-30 box-border">
              {canInviteToRole && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onInvite(); }}
                  className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                >
                  Add member
                </button>
              )}
              {role.name !== 'Admin' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                    className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                  >
                    Edit role
                  </button>
                  {!role.isSystemRole && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                      className="w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary hover:text-ds-text-primary transition-colors whitespace-nowrap"
                    >
                      Delete role
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="hidden lg:flex w-[40px] flex-shrink-0" />
      )}
    </div>
  );
}

