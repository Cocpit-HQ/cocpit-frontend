"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useDeactivateAccount } from '../../hooks/useAccountSettings';
import { MobileSettingsHeader } from './MobileSettingsHeader';

export function MobileDeactivateView({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const pathname = usePathname() || '/settings';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const deactivateMutation = useDeactivateAccount();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.replace(`${basePath}/account`);
    }
  };

  const handleDeactivate = () => {
    if (!password) {
      setErrorMsg('Password is required');
      return;
    }
    setErrorMsg('');
    deactivateMutation.mutate({ password }, {
      onSuccess: () => {
        router.push('/?reason=deactivated');
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || 'Incorrect password');
      }
    });
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-120px)] text-ds-text-primary font-sans select-none">
      <MobileSettingsHeader title="Deactivate" onBack={handleBack} />

      <div className="flex-1 flex flex-col px-4 py-2 gap-5 w-full max-w-[480px]">
        <h2 className="text-ds-text-primary text-[18px] font-medium font-['DM_Sans'] leading-[24px] m-0">
          Deactivate your account?
        </h2>

        <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
          Your profile will be hidden from cocpit. Access to organizations you&apos;re associated with will be removed, and organizations you own will be deactivated. Your followers, posts, and data will be retained and restored if you reactivate your account.
        </p>

        <p className="text-ds-text-primary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
          You can reactivate your account anytime during the recovery period by logging in again
        </p>

        {/* Password Confirmation */}
        <div className="flex flex-col w-full gap-1 pt-2">
          <div className={`flex flex-row items-center justify-between pb-2 border-b ${errorMsg ? 'border-ds-error' : 'border-ds-border'}`}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password to confirm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-transparent border-none p-0 focus:outline-none text-[14px] text-ds-text-primary placeholder:text-ds-text-muted font-['DM_Sans']"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-ds-text-secondary hover:text-ds-text-primary transition-colors p-1"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errorMsg && (
            <span className="text-ds-error text-xs pt-1 font-['DM_Sans']">{errorMsg}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={!password || deactivateMutation.isPending}
            className={`h-9 px-6 rounded-full flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium ${
              !password || deactivateMutation.isPending
                ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed opacity-60'
                : 'bg-ds-accent text-white hover:opacity-90 active:scale-95'
            }`}
          >
            {deactivateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              'Deactivate'
            )}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="h-9 px-6 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
