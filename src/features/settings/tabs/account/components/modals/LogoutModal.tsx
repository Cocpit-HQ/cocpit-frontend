"use client";

import React from 'react';
import { useLogout } from '../../../../hooks/useAccountSettings';
import { useRouter } from 'next/navigation';
import { hardLogout } from '@/lib/logout';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

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
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Log out"
      description={mode === 'all' 
        ? "Your account will be logged out from all other devices except the one you're currently using."
        : "Are you sure you want to log out your account on this device?"}
      confirmText="Log out"
      onConfirm={handleLogout}
      isLoading={isPending || isLoading}
    />
  );
}
