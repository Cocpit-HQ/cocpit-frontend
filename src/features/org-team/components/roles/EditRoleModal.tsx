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

const DISABLED_ROLE_PERMISSIONS: TeamPermission[] = ['ANALYTICS', 'JOBS', 'JOBS_CHAT', 'CHAT', 'SETTINGS'];

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
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 140)}px`;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[600px] max-h-[90vh] bg-ds-bg border border-ds-border rounded-[16px] shadow-2xl grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        {/* Close Button - Figma Frame 2609536: top 12px, right 12px, 20x20px */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[12px] top-[12px] w-[20px] h-[20px] flex items-center justify-center text-ds-text-secondary transition-colors hover:text-ds-text-primary cursor-pointer z-10"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>

        {/* Header - Starts at y=32px (12px top offset + 20px Frame 2609536 height) */}
        <div className="flex items-center justify-center pt-[32px] pb-4 px-7 relative">
          <h2 className="text-[18px] leading-[26px] font-medium font-['DM_Sans',sans-serif] text-center text-ds-text-primary">
            Edit role
          </h2>
        </div>

        {/* Content */}
        <div className="overflow-y-auto min-h-0 px-7 pb-6 flex flex-col scrollbar-hide">
          
          <div className="flex flex-col gap-6 pt-2">
            {/* Role name */}
            <div className="flex flex-col gap-2 border-b border-ds-border pb-1">
              <label className="text-[16px] leading-[24px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-medium">
                Role name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HR Manager"
                className="w-full bg-transparent text-[14px] leading-[20px] text-ds-text-primary font-['DM_Sans',sans-serif] outline-none placeholder-ds-text-muted"
              />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-3">
              <label className="text-[16px] leading-[24px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-medium">
                Role color
              </label>
              <div className="flex gap-[19.2px] flex-wrap items-center">
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
            <div className="flex flex-col gap-2 border-b border-ds-border pb-1 relative mb-[20px]">
              <label className="text-[12px] leading-[16px] text-ds-text-secondary font-['DM_Sans',sans-serif] font-medium">
                Role description
              </label>
              <textarea
                ref={textareaRef}
                rows={1}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  e.target.style.height = 'auto';
                  const scrollH = e.target.scrollHeight;
                  e.target.style.height = `${Math.min(scrollH, 140)}px`;
                }}
                onPaste={(e) => handleDescriptionPaste(e, description, setDescription, MAX_ROLE_DESCRIPTION_CHARS)}
                maxLength={MAX_ROLE_DESCRIPTION_CHARS}
                placeholder="Describe the responsibilities and scope of this role..."
                className="w-full bg-transparent text-[14px] leading-[20px] text-ds-text-primary font-['DM_Sans',sans-serif] outline-none resize-none max-h-[140px] overflow-y-auto scrollbar-hide placeholder-ds-text-muted p-0 m-0"
              />
              <div className="flex justify-end items-center mt-1 absolute top-full right-0">
                <span className={`text-[12px] font-['DM_Sans',sans-serif] ${description.length >= MAX_ROLE_DESCRIPTION_CHARS ? 'text-ds-error' : 'text-ds-text-secondary'}`}>
                  {description.length}/{MAX_ROLE_DESCRIPTION_CHARS}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-[28px]">
            <PermissionCheckList
              selected={permissions}
              onChange={setPermissions}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-center gap-4 pt-4 pb-6 mt-auto border-t border-transparent">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting || description.length > MAX_ROLE_DESCRIPTION_CHARS}
            className="w-[82px] h-[36px] px-[12px] py-[6px] rounded-[100px] bg-ds-accent text-[16px] leading-[24px] font-medium font-['DM_Sans',sans-serif] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 text-ds-text-primary"
          >
            {isSubmitting ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-[82px] h-[36px] px-[12px] py-[6px] rounded-[100px] border border-ds-border bg-transparent text-[16px] leading-[24px] font-medium text-ds-text-primary font-['DM_Sans',sans-serif] flex items-center justify-center hover:bg-ds-surface-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
