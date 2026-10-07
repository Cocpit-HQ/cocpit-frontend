"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { 
  useAccountSettings, 
  useUpdatePassword, 
  useRequestPasswordResetLink, 
  useResetLinkStatus 
} from '../hooks/useAccountSettings';
import { getFirstMissingPasswordRequirement, isPasswordFullyValid } from '@/lib/validators';
import { PasswordRequirementsCard } from '@/components/shared/PasswordRequirementsCard';

interface ManagePasswordPageProps {
  mode?: 'change' | 'add';
}

export function ManagePasswordPage({ mode: modeProp }: ManagePasswordPageProps = {}) {
  const pathname = usePathname() || '/settings/account-password';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';
  const router = useRouter();

  const { data: accountData, isLoading: isAccountLoading } = useAccountSettings();
  
  const isAddRoute = pathname.includes('account-add-password');
  // Dynamic single key check: accountData?.hasPassword
  // If user has no password (hasPassword === false) or explicit mode='add' or isAddRoute, show Add password
  const isAddMode = modeProp === 'add' || (accountData && accountData.hasPassword === false) || (!accountData && isAddRoute);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  
  const updatePasswordMutation = useUpdatePassword();
  const requestResetLinkMutation = useRequestPasswordResetLink();
  const { data: resetStatus, refetch: refetchResetStatus } = useResetLinkStatus();

  // Sync active reset link timer from server
  useEffect(() => {
    if (resetStatus?.hasActiveLink && resetStatus?.remainingSeconds > 0) {
      setCooldownSeconds(resetStatus.remainingSeconds);
    }
  }, [resetStatus]);

  // Interval countdown manager
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          refetchResetStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds, refetchResetStatus]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUpdatePassword = () => {
    setErrorMsg('');
    setResetSuccessMsg('');
    const missingReq = getFirstMissingPasswordRequirement(newPassword);
    if (missingReq) {
      setErrorMsg(missingReq);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!isAddMode && currentPassword && newPassword === currentPassword) {
      setErrorMsg("New password must be different from current password.");
      return;
    }

    updatePasswordMutation.mutate(
      { currentPassword: isAddMode ? '' : currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          toast.success(isAddMode ? "Password added successfully." : "Password changed successfully.");
          router.push(`${basePath}/account`);
        },
        onError: (error: any) => {
          setErrorMsg(error?.response?.data?.message || (isAddMode ? "Failed to add password" : "Failed to update password"));
        }
      }
    );
  };

  const handleForgotPassword = () => {
    if (cooldownSeconds > 0) return;
    setErrorMsg('');
    setResetSuccessMsg('');
    requestResetLinkMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        setResetSuccessMsg(data?.message || "Password reset link sent to your registered email!");
        setCooldownSeconds(900); // 15 minutes = 900 seconds
        refetchResetStatus();
      },
      onError: (error: any) => {
        setErrorMsg(error?.response?.data?.message || "Failed to send password reset email link");
      }
    });
  };

  const isFormValid =
    !updatePasswordMutation.isPending &&
    (isAddMode || Boolean(currentPassword)) &&
    Boolean(newPassword) &&
    Boolean(confirmPassword) &&
    newPassword === confirmPassword &&
    (isAddMode || newPassword !== currentPassword) &&
    isPasswordFullyValid(newPassword);

  return (
    <div className="w-full max-w-[712px] py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3 select-none">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2.5 shrink-0 px-4 py-2 mb-1 md:px-0 md:py-0 md:mb-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back to account settings"
          className="-ml-1.5 flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring md:w-[20px] md:h-[20px] md:min-w-[20px] md:min-h-[20px] md:-ml-1.5 md:rounded-none md:border-0 md:p-0 md:hover:bg-transparent md:text-ds-text-primary md:hover:text-ds-accent md:cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5] md:stroke-[2]" />
        </button>
        <h1 className="justify-center text-ds-text-primary ds-text-body-1 md:ds-text-body-2 m-0">
          Manage password
        </h1>
      </div>

      {/* Form Fields Section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid) handleUpdatePassword();
        }}
        className="self-stretch px-4 flex flex-col justify-start items-start gap-2"
      >
        {/* Current Password - Only in Change mode */}
        {!isAddMode && (
          <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <label className="text-left text-ds-text-secondary ds-text-small-1">
              Enter your current password
            </label>
            <div className="self-stretch inline-flex justify-between items-center gap-2">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errorMsg === "Current password is incorrect") setErrorMsg('');
                }}
                placeholder="Current password"
                autoComplete="current-password"
                className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${
                  !showCurrent && currentPassword ? "tracking-[2px]" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="w-4 h-4 inline-flex justify-center items-center text-ds-text-muted hover:text-ds-text-primary transition-colors cursor-pointer shrink-0"
              >
                {showCurrent ? (
                  <EyeIcon className="w-4 h-4 shrink-0" size={16} />
                ) : (
                  <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
                )}
              </button>
            </div>
            {errorMsg === "Current password is incorrect" && (
              <span className="ds-text-small text-ds-error">
                Current password is incorrect.
              </span>
            )}
          </div>
        )}

        {/* New Password */}
        <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
          <label className="text-left text-ds-text-secondary ds-text-small-1">
            New password
          </label>
          <div className="self-stretch inline-flex justify-between items-center gap-2">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMsg === "New password must be different from current password.") setErrorMsg('');
              }}
              placeholder="New password"
              maxLength={15}
              autoComplete="new-password"
              className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${
                !showNew && newPassword ? "tracking-[2px]" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
              className="w-4 h-4 inline-flex justify-center items-center text-ds-text-muted hover:text-ds-text-primary transition-colors cursor-pointer shrink-0"
            >
              {showNew ? (
                <EyeIcon className="w-4 h-4 shrink-0" size={16} />
              ) : (
                <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
              )}
            </button>
          </div>
          {!isAddMode && currentPassword && newPassword && newPassword === currentPassword && (
            <span className="ds-text-small text-ds-error">
              New password must be different from current password.
            </span>
          )}
        </div>

        {/* Confirm new password */}
        <div className="self-stretch pb-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
          <label className="text-left text-ds-text-secondary ds-text-small-1">
            Confirm new password
          </label>
          <div className="self-stretch inline-flex justify-between items-center gap-2">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg === "Passwords do not match.") setErrorMsg('');
              }}
              placeholder="Confirm password"
              maxLength={15}
              autoComplete="new-password"
              className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${
                !showConfirm && confirmPassword ? "tracking-[2px]" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="w-4 h-4 inline-flex justify-center items-center text-ds-text-muted hover:text-ds-text-primary transition-colors cursor-pointer shrink-0"
            >
              {showConfirm ? (
                <EyeIcon className="w-4 h-4 shrink-0" size={16} />
              ) : (
                <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
              )}
            </button>
          </div>
          {confirmPassword && newPassword && confirmPassword !== newPassword && (
            <span className="ds-text-small text-ds-error">
              Passwords do not match.
            </span>
          )}
        </div>

        {/* Password Requirements helper card */}
        {newPassword ? (
          <div className="w-full pt-1">
            <PasswordRequirementsCard password={newPassword} />
          </div>
        ) : null}

        {/* Error / Feedback area */}
        {((errorMsg &&
            errorMsg !== "Current password is incorrect" &&
            errorMsg !== "Passwords do not match." &&
            errorMsg !== "New password must be different from current password.") || resetSuccessMsg) ? (
          <div className="ds-supporting-area w-full">
            {errorMsg &&
              errorMsg !== "Current password is incorrect" &&
              errorMsg !== "Passwords do not match." &&
              errorMsg !== "New password must be different from current password." && (
                <span className="ds-text-small text-ds-error">{errorMsg}</span>
            )}
            {resetSuccessMsg && (
              <span className="ds-text-small text-ds-success">{resetSuccessMsg}</span>
            )}
          </div>
        ) : null}

        {/* Action Button Row */}
        <div className="self-stretch flex flex-wrap sm:flex-nowrap justify-end items-center gap-3">
          {!isAddMode && (
            cooldownSeconds > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ds-surface-1 border border-ds-warning/40 text-ds-warning ds-text-small font-medium">
                <Clock className="w-4 h-4 animate-pulse text-ds-warning" />
                <span>Reset link active ({formatTime(cooldownSeconds)})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={requestResetLinkMutation.isPending}
                className="w-[150px] h-[36px] px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary ds-text-secondary-1 transition-colors disabled:opacity-50 cursor-pointer ds-focus-ring"
              >
                {requestResetLinkMutation.isPending ? "Sending link..." : "Forgot password"}
              </button>
            )
          )}

          {isFormValid ? (
            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className={`${isAddMode ? 'w-[132px]' : 'w-[80px]'} h-[36px] px-4 py-1.5 bg-ds-accent hover:opacity-90 rounded-full flex justify-center items-center gap-2 cursor-pointer transition-opacity ds-focus-ring`}
            >
              <span className="text-white ds-text-body-1 whitespace-nowrap">
                {updatePasswordMutation.isPending
                  ? (isAddMode ? "Adding..." : "Updating...")
                  : (isAddMode ? "Add password" : "Update")}
              </span>
            </button>
          ) : (
            <div
              data-property-1="Disabled"
              className={`${isAddMode ? 'w-[132px]' : 'w-[80px]'} h-[36px] px-4 py-1.5 bg-ds-surface-1 rounded-full flex justify-center items-center gap-2 cursor-not-allowed select-none border border-ds-border/40`}
            >
              <span className="text-ds-text-muted ds-text-body-1 whitespace-nowrap">
                {isAddMode ? "Add password" : "Update"}
              </span>
            </div>
          )}
        </div>


      </form>
    </div>
  );
}
