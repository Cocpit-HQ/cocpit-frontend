"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeactivateAccount } from '@/features/settings/hooks/useAccountSettings';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCompanyAccount?: boolean;
}

export function DeactivateAccountModal({ isOpen, onClose }: DeactivateAccountModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="relative flex flex-col items-center bg-ds-bg border border-ds-border rounded-2xl p-3 gap-4 w-[304px] h-[396px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Frame 2609475 */}
        <div className="flex flex-col items-center w-[278px] h-[240px] gap-[8px] z-0 shrink-0">
          <h2 className="ds-text-body-1 text-ds-text-primary text-center w-full h-[24px] shrink-0 m-0 p-0 leading-[24px]">Deactivate your account?</h2>
          <p className="ds-text-secondary text-ds-text-secondary text-center w-full h-[140px] shrink-0 m-0 p-0 leading-[20px]">
            Your profile will be hidden from cocpit. Access to organizations you’re associated with will be removed, and organizations you own will be deactivated. Your followers, posts, and data will be retained and restored if you reactivate your account.
          </p>
          <p className="ds-text-secondary text-ds-text-primary text-center w-full h-[60px] shrink-0 m-0 p-0 leading-[20px]">
            You can reactivate your account anytime during the recovery period by logging in again
          </p>
        </div>

        {/* Input Wrapper */}
        <div className="flex flex-col justify-center items-start w-[278px] h-[62px] py-[8px] px-0 gap-[10px] border-b border-ds-border z-[1] shrink-0">
          <label className="ds-text-small-1 text-ds-text-secondary text-center w-[62px] h-[16px] shrink-0 m-0 p-0 leading-[16px]">
            Enter code
          </label>
          <div className="flex flex-row justify-between items-center w-[278px] h-[20px] gap-[10px] p-0 shrink-0">
            <input
              type={showPassword ? "text" : "password"}
              className="w-[47px] h-[20px] bg-transparent border-none p-0 focus:outline-none focus:ring-0 ds-text-secondary text-ds-text-primary text-center m-0 shrink-0 leading-[20px] placeholder:text-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Absolute Eye Icon */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute w-[16px] h-[16px] left-[275px] top-[305px] z-[2] text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none p-0 m-0 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <Eye className="w-full h-full" />
          ) : (
            <EyeOff className="w-full h-full" />
          )}
        </button>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-start gap-[8px] w-[220px] h-[36px] p-0 z-[3] shrink-0">
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={!password || deactivateMutation.isPending}
            className={`flex flex-row justify-center items-center px-[12px] py-[6px] w-[106px] h-[36px] rounded-[100px] gap-[10px] shrink-0 transition-all ${
              !password
                ? 'bg-ds-accent/40 text-ds-text-primary/50 cursor-not-allowed'
                : 'bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary'
            }`}
          >
            {deactivateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="ds-text-body-1 w-[82px] h-[24px] text-center leading-[24px]">Deactivate</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] w-[106px] h-[36px] rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 transition-colors text-ds-text-primary gap-[10px] shrink-0"
          >
            <span className="ds-text-body-1 w-[53px] h-[24px] text-center leading-[24px]">Cancel</span>
          </button>
        </div>

      </div>
    </div>
  );
}
