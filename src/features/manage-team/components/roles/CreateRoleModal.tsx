'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  CreateRoleInput,
  TeamPermission,
  ROLE_COLORS,
} from '../../types/team.types';
import PermissionCheckList from '../permissions/PermissionCheckList';

interface CreateRoleModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRoleInput) => void;
}

export default function CreateRoleModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(ROLE_COLORS[0]);
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      permissions,
    });
    // Reset
    setName('');
    setColor(ROLE_COLORS[0]);
    setDescription('');
    setPermissions([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] max-h-[85vh] bg-white dark:bg-[#1A1D24] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-['Poppins']">
            Create new role
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {/* Role name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins'] font-medium">
              Role name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HR Manager"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F1115] text-sm text-gray-800 dark:text-gray-200 font-['Poppins'] outline-none focus:border-[#1A73E8] transition-colors placeholder:text-gray-300"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins'] font-medium">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {ROLE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-[#1A73E8] dark:ring-offset-[#1A1D24]'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins'] font-medium">
              Role description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role's responsibilities and scope of role..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F1115] text-sm text-gray-800 dark:text-gray-200 font-['Poppins'] outline-none focus:border-[#1A73E8] transition-colors resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Permissions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins'] font-medium">
              Permissions
            </label>
            <PermissionCheckList
              selected={permissions}
              onChange={setPermissions}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 font-['Poppins'] hover:bg-gray-50 dark:hover:bg-[#0F1115] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="px-5 py-2 rounded-full bg-[#1A73E8] dark:bg-[#4D9CFF] text-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
