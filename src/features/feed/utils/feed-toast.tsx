import React from 'react';
import { toast } from 'sonner';
import BottomToast from '@/shared/commonComponents/BottomToast';

export const feedToast = {
  success: (message: string) => {
    toast.custom((t) => (
      <BottomToast message={message} onClose={() => toast.dismiss(t)} duration={3500} />
    ));
  },
  error: (message: string) => {
    // Keep error as it is (standard sonner toast)
    toast.error(message);
  },
  info: (message: string) => {
    toast.custom((t) => (
      <BottomToast message={message} onClose={() => toast.dismiss(t)} duration={3500} />
    ));
  }
};
