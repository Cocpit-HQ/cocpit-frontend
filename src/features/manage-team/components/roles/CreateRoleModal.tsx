'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  CreateRoleInput,
  TeamPermission,
  ROLE_COLORS,
  ALL_PERMISSIONS,
} from '../../types/team.types';
import PermissionCheckList from '../permissions/PermissionCheckList';

interface CreateRoleModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  existingRoles?: string[];
  onClose: () => void;
  onSubmit: (input: CreateRoleInput) => void;
}

export default function CreateRoleModal({
  isOpen,
  isSubmitting,
  existingRoles = [],
  onClose,
  onSubmit,
}: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(ROLE_COLORS[0]);
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [showLimitError, setShowLimitError] = useState(false);

  const handleClose = () => {
    setName('');
    setColor(ROLE_COLORS[0]);
    setDescription('');
    setPermissions([]);
    setShowLimitError(false);
    onClose();
  };

  if (!isOpen) return null;

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  const isNameAdmin = name.trim().toLowerCase() === 'admin';
  const isNameTaken = existingRoles.some(r => r.toLowerCase() === name.trim().toLowerCase());
  const hasError = isNameAdmin || isNameTaken;

  const handleSubmit = async () => {
    if (!name.trim() || hasError) return;
    const cleanedPermissions = permissions.filter((p) =>
      ALL_PERMISSIONS.includes(p as TeamPermission)
    );
    onSubmit({
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      permissions: cleanedPermissions,
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-[672px] max-h-[90vh] bg-[#FFFFFF] dark:bg-[#0F1115] border border-transparent dark:border-[#2A2D35] rounded-[24px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 h-[87px]">
          <h2 className="text-[32px] font-semibold text-[#000000] dark:text-white font-['Poppins'] leading-[38px] tracking-[-0.64px]">
            Create new role
          </h2>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center text-[#EF4444] transition-colors hover:opacity-80"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-4">
          
          <div className="flex flex-col gap-4 pt-2">
            {/* Role name */}
            <div className="flex flex-col gap-[11.5px]">
              <label className="text-[16px] text-[#434655] dark:text-[#A1A8B3] font-['Poppins'] font-medium leading-[17px]">
                Role name
              </label>
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="HR Manager"
                  className={`w-full h-[56px] px-4 rounded-[12px] border ${
                    hasError 
                      ? 'border-[#EF4444] focus:border-[#EF4444]' 
                      : 'border-[#E0E0E7] dark:border-[#2A2D35] focus:border-[#1A73E8] dark:focus:border-[#4D9CFF]'
                  } bg-[#FFFFFF] dark:bg-[#121B2B] text-[16px] text-[#434655] dark:text-white font-['Poppins'] font-medium outline-none transition-colors placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3]`}
                />
                {isNameAdmin && (
                  <p className="text-[#EF4444] text-[14px] mt-1 font-['Poppins']">
                    This role is unavailable
                  </p>
                )}
                {isNameTaken && !isNameAdmin && (
                  <p className="text-[#EF4444] text-[14px] mt-1 font-['Poppins']">
                    This role is already taken
                  </p>
                )}
              </div>
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-[11.5px]">
              <label className="text-[16px] text-[#434655] dark:text-[#A1A8B3] font-['Poppins'] font-medium leading-[17px]">
                Role color
              </label>
              <div className="flex gap-3 flex-wrap">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all ${
                      color === c
                        ? 'border border-[#000000] dark:border-white'
                        : ''
                    }`}
                  >
                    <div 
                      className="w-[24px] h-[24px] rounded-full" 
                      style={{ backgroundColor: c }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[12px] w-full">
              <label className="text-[16px] text-[#434655] dark:text-[#A1A8B3] font-['Poppins'] font-medium leading-[17px] h-[17px] flex items-center">
                Role description
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  const val = e.target.value;
                  const newWordCount = val.trim().split(/\s+/).filter(Boolean).length;
                  if (newWordCount <= 200) {
                    setDescription(val);
                    setShowLimitError(false);
                  } else {
                    setShowLimitError(true);
                  }
                }}
                placeholder="Describe the responsibilities and scope of this role..."
                className={`box-border w-full h-[120px] p-4 rounded-[12px] border ${showLimitError ? 'border-red-500' : 'border-[#E0E0E7] dark:border-[#2A2D35]'} bg-[#FFFFFF] dark:bg-[#121B2B] text-[16px] font-medium text-[#434655] dark:text-white leading-[26px] font-['Poppins'] outline-none focus:border-[#1A73E8] dark:focus:border-[#4D9CFF] transition-colors resize-none overflow-y-auto placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3]`}
              />
              <div className="flex justify-between items-start mt-1">
                <div className="flex-1">
                  {showLimitError && (
                    <span className="text-[12px] text-red-500 font-['Poppins']">
                      Description cannot exceed 200 words.
                    </span>
                  )}
                </div>
                <span className={`text-[12px] font-['Poppins'] ${showLimitError ? 'text-red-500' : 'text-[#6B7280] dark:text-[#A1A8B3]'}`}>
                  {wordCount}/200
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-4">
            <PermissionCheckList
              selected={permissions}
              onChange={setPermissions}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-[16px] pt-4 pb-2 mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 h-[40px] rounded-[24px] border border-[#1A73E8] dark:border-[#4D9CFF] bg-[#FFFFFF] dark:bg-transparent text-[14px] font-normal text-[#1A73E8] dark:text-[#4D9CFF] font-['Poppins'] leading-[20px] flex items-center justify-center w-[140px] hover:bg-gray-50 dark:hover:bg-[#121B2B] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 h-[40px] rounded-[24px] border border-[#FFFFFF] dark:border-transparent bg-[#1A73E8] dark:bg-[#4D9CFF] text-[14px] font-normal text-[#FFFFFF] font-['Poppins'] leading-[20px] flex items-center justify-center w-[140px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
