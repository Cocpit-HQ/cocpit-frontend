"use client";

import React from 'react';
import { useLogout } from '@/features/settings/hooks/useAccountSettings';
import { useRouter } from 'next/navigation';
import { hardLogout } from '@/lib/logout';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  mode?: 'single' | 'all';
  isLoading?: boolean;
}

export function LogoutModal({ isOpen, onClose, onConfirm, mode = 'single', isLoading = false }: LogoutModalProps) {
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    logout(undefined, {
      onSuccess: () => {
        onClose();
        hardLogout('manual');
      },
      onError: (error) => {
        console.error('Logout failed:', error);
      }
    });
  };

  return (
    <ActionConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleLogout}
      type="logout"
      title="Log out"
      description={mode === 'all' 
        ? "Your account will be logged out from all other devices except the one you're currently using."
        : "Are you sure you want to log out your account on this device?"}
      confirmText="Log out"
      cancelText="Cancel"
      confirmColor="accent"
      isLoading={isPending || isLoading}
      buttonWidthClass="w-[88px]"
      modalClassName="w-[280px]"
    />
  );
}
