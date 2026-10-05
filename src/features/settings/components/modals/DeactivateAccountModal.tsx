"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeactivateAccount } from '@/features/settings/hooks/useAccountSettings';
import { Loader2 } from 'lucide-react';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCompanyAccount?: boolean;
}

export function DeactivateAccountModal({ isOpen, onClose }: DeactivateAccountModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const deactivateMutation = useDeactivateAccount();

  if (!isOpen) return null;

  const handleDeactivate = () => {
    deactivateMutation.mutate({ password }, {
      onSuccess: () => {
        onClose();
        router.push('/?reason=deactivated');
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || 'Failed to deactivate account');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex flex-col items-center bg-ds-surface-2 border border-ds-border rounded-2xl p-6 w-full max-w-[380px] shadow-2xl">

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 mb-4 w-full text-center">
          <h2 className="ds-text-body-2 text-lg font-semibold text-ds-text-primary">Deactivate your account?</h2>
          <p className="ds-text-small text-ds-text-secondary leading-relaxed">
            Your profile will be hidden from COCPIT. Access to organizations you're associated with will be removed, and organizations you own will be deactivated. Your data will be restored if you reactivate.
          </p>
          <p className="ds-text-meta text-ds-text-muted mt-1">
            You can reactivate your account anytime by logging in again.
          </p>
        </div>

        {errorMsg && <p className="ds-text-small text-ds-error mb-3 text-center">{errorMsg}</p>}

        <div className="w-full mb-5">
          <input
            type="password"
            className="ds-input w-full h-[36px] bg-ds-surface-1 border border-ds-border rounded-lg px-3 ds-text-small text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:border-ds-accent"
            placeholder="Enter your password to confirm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center justify-center w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ds-btn flex-1 h-[36px] px-4 rounded-full border border-ds-border bg-ds-surface-1 text-ds-text-primary ds-text-small font-medium hover:bg-ds-surface-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDeactivate}
            disabled={!password || deactivateMutation.isPending}
            className="ds-btn flex-1 h-[36px] px-4 rounded-full bg-ds-error text-white ds-text-small font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {deactivateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
          </button>
        </div>

      </div>
    </div>
  );
}
