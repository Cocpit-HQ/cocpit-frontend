'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import {
  TeamRole,
  UpdateRoleInput,
  TeamPermission,
  ROLE_COLORS,
  ALL_PERMISSIONS,
} from '../../types/team.types';
import PermissionCheckList from '../permissions/PermissionCheckList';
import {
  MAX_ROLE_DESCRIPTION_CHARS,
  handleDescriptionPaste,
} from '../../utils/role-description.util';

const DISABLED_ROLE_PERMISSIONS: TeamPermission[] = ['ANALYTICS', 'JOBS', 'JOBS_CHAT', 'CHAT'];

interface EditRoleModalProps {
  isOpen: boolean;
  role: TeamRole | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateRoleInput) => void;
}

export default function EditRoleModal({
  isOpen,
  role,
  isSubmitting,
  onClose,
  onSubmit,
}: EditRoleModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(ROLE_COLORS[0]);
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      if (textareaRef.current.scrollHeight > 24) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
      }
    }
  }, [description, isOpen]);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setColor(role.color);
      setDescription(role.description || '');

      let rawPerms: any[] = [];
      if (Array.isArray(role.permissions)) {
        rawPerms = role.permissions;
      } else if (typeof role.permissions === 'string') {
        try {
          const parsed = JSON.parse(role.permissions);
          rawPerms = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          rawPerms = (role.permissions as string).split(',').map((s) => s.trim());
        }
      }

      const normalized = rawPerms.map((p: any) =>
        typeof p === 'string' ? p.toUpperCase().trim().replace(/\s+/g, '_') : ''
      );

      const validPermissions = normalized.filter((p: string) =>
        ALL_PERMISSIONS.includes(p as TeamPermission) && !DISABLED_ROLE_PERMISSIONS.includes(p as TeamPermission)
      ) as TeamPermission[];

      setPermissions(validPermissions);
    }
  }, [role]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !role) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    const cleanedPermissions = permissions.filter((p) =>
      ALL_PERMISSIONS.includes(p as TeamPermission) && !DISABLED_ROLE_PERMISSIONS.includes(p as TeamPermission)
    );
    onSubmit({
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      permissions: cleanedPermissions,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] md:flex md:items-center md:justify-center">
      {/* Backdrop — hidden on mobile */}
      <div
        className="hidden md:block absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal / Full-screen sheet on mobile */}
      <div className="relative w-full h-full md:w-[600px] md:h-auto md:max-h-[90vh] bg-ds-bg md:border md:border-ds-border md:rounded-[16px] md:shadow-2xl flex flex-col md:grid md:grid-rows-[auto_minmax(0,1fr)_auto] overflow-y-auto md:overflow-hidden select-text">
        {/* Close Button - Desktop only */}
        <button
          type="button"
          onClick={onClose}
          className="hidden md:flex absolute right-[12px] top-[12px] w-[20px] h-[20px] items-center justify-center text-ds-text-secondary transition-colors hover:text-ds-text-primary cursor-pointer z-10"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>

        {/* Top Header - Back button on mobile, centered title on desktop */}
        <div className="flex flex-col md:items-center md:justify-center pt-4 md:pt-[24px] pb-3 md:pb-4 px-4 md:px-[12px] gap-4 md:gap-0 relative shrink-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden flex items-center gap-2 text-ds-text-primary w-fit cursor-pointer -ml-1"
          >
            <Icon name="arrow-left" className="w-5 h-5 text-ds-text-primary" />
            <span className="font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px]">
              Back
            </span>
          </button>

          <h2 className="text-[18px] leading-[26px] font-medium font-['DM_Sans',sans-serif] text-ds-text-primary text-left md:text-center w-full">
            Edit role
          </h2>
        </div>

        {/* Content */}
        <div className="overflow-y-auto min-h-0 px-4 md:px-[12px] pb-6 flex flex-col scrollbar-hide flex-1">
          <div className="flex flex-col gap-6 md:gap-[16px] pt-2 md:pt-0">
            {/* Role name */}
            <div className="flex flex-col gap-2 md:gap-[10px] border-b border-ds-border pb-2 md:py-[8px]">
              <label className="text-[16px] leading-[24px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-medium">
                Role name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HR manager"
                className="w-full bg-transparent text-[14px] leading-[20px] text-ds-text-primary font-['DM_Sans',sans-serif] outline-none placeholder:text-ds-text-secondary"
              />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-3 md:gap-[11.5px]">
              <label className="text-[16px] leading-[24px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-normal">
                Role color
              </label>
              <div className="flex items-center justify-between w-full md:flex-nowrap overflow-x-auto md:overflow-visible scrollbar-hide py-1">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-[32px] h-[32px] flex items-center justify-center focus:outline-none shrink-0"
                  >
                    <div
                      className={`w-[24px] h-[24px] rounded-full transition-all ${
                        color === c
                          ? 'ring-1 ring-offset-[3px] ring-offset-ds-bg ring-ds-text-secondary'
                          : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2 md:gap-[10px] border-b border-ds-border pb-2 md:py-[8px] relative mb-4">
              <label className="text-[12px] leading-[16px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-medium">
                Role description
              </label>
              <textarea
                ref={textareaRef}
                rows={1}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  e.target.style.height = '24px';
                  if (e.target.scrollHeight > 24) {
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                  }
                }}
                onPaste={(e) => handleDescriptionPaste(e, description, setDescription, MAX_ROLE_DESCRIPTION_CHARS)}
                maxLength={MAX_ROLE_DESCRIPTION_CHARS}
                placeholder="Describe the responsibilities and scope of this role..."
                className="w-full h-[24px] min-h-[24px] bg-transparent text-[16px] leading-[24px] text-ds-text-primary font-['DM_Sans',sans-serif] outline-none resize-none max-h-[140px] overflow-y-auto scrollbar-hide placeholder:text-ds-text-secondary p-0 m-0"
              />
              <div className="flex justify-end items-center mt-1 absolute top-full right-0">
                <span className={`text-[12px] font-['DM_Sans',sans-serif] ${description.length >= MAX_ROLE_DESCRIPTION_CHARS ? 'text-ds-error' : 'text-ds-text-secondary'}`}>
                  {description.length}/{MAX_ROLE_DESCRIPTION_CHARS}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-4 md:mt-[16px]">
            <PermissionCheckList
              selected={permissions}
              onChange={setPermissions}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-center gap-2 pt-4 pb-8 md:pb-6 mt-auto border-t border-transparent">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting || description.length > MAX_ROLE_DESCRIPTION_CHARS}
            className={`w-[82px] h-[36px] px-[12px] py-[6px] rounded-[100px] text-[16px] leading-[24px] font-medium font-['DM_Sans',sans-serif] flex items-center justify-center transition-all ${
              !name.trim() || isSubmitting
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
                : 'bg-ds-accent text-white hover:brightness-110 cursor-pointer'
            }`}
          >
            {isSubmitting ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-[82px] h-[36px] px-[12px] py-[6px] rounded-[100px] border border-ds-border bg-transparent text-[16px] leading-[24px] font-medium text-ds-text-primary font-['DM_Sans',sans-serif] flex items-center justify-center hover:bg-ds-surface-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
