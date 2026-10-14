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
import { getFirstMissingPasswordRequirement } from '@/lib/validators';

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
  const [hasSubmitted, setHasSubmitted] = useState(false);

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

  const currentPasswordError =
    errorMsg === "Current password is incorrect"
      ? "Current password is incorrect."
      : errorMsg === "Current password is required"
      ? "Current password is required."
      : hasSubmitted && !isAddMode && !currentPassword
      ? "Current password is required."
      : "";

  const newPasswordError =
    !isAddMode && currentPassword && newPassword && newPassword === currentPassword
      ? "New password must be different from current password."
      : newPassword
      ? getFirstMissingPasswordRequirement(newPassword)
      : hasSubmitted
      ? "*Use 8 to 15 characters"
      : "";

  const confirmPasswordError =
    confirmPassword && newPassword && confirmPassword !== newPassword
      ? "Passwords do not match."
      : hasSubmitted && !confirmPassword
      ? "Passwords do not match."
      : "";

  const handleUpdatePassword = () => {
    setHasSubmitted(true);
    setErrorMsg('');
    setResetSuccessMsg('');

    if (!isAddMode && !currentPassword) {
      return;
    }
    const missingReq = getFirstMissingPasswordRequirement(newPassword);
    if (missingReq) {
      return;
    }
    if (!isAddMode && currentPassword && newPassword === currentPassword) {
      return;
    }
    if (!confirmPassword || newPassword !== confirmPassword) {
      return;
    }

    updatePasswordMutation.mutate(
      { currentPassword: isAddMode ? '' : currentPassword, newPassword },
      {
        onSuccess: () => {
          setHasSubmitted(false);
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

  return (
    <div className="w-full max-w-[712px] py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3 select-none">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2 shrink-0 px-4 h-6 mb-4 md:px-0 md:h-auto md:mb-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back to account settings"
          className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
        </button>
        <h1 className="justify-center text-ds-text-primary text-[16px] md:ds-text-body-2 font-medium md:font-normal leading-[24px] h-6 flex items-center m-0">
          Manage password
        </h1>
      </div>

      {/* Form Fields Section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdatePassword();
        }}
        className="self-stretch px-4 flex flex-col justify-start items-start gap-2"
      >
        {/* Current Password - Only in Change mode */}
        {!isAddMode && (
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className={`self-stretch py-2 border-b ${currentPasswordError ? '!border-ds-error' : 'border-ds-border'} flex flex-col justify-center items-start gap-2.5 transition-colors`}>
              <label className="text-left text-ds-text-secondary ds-text-small-1">
                Enter your current password
              </label>
              <div className="self-stretch inline-flex justify-between items-center gap-2">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errorMsg === "Current password is incorrect" || errorMsg === "Current password is required") setErrorMsg('');
                  }}
                  placeholder="Current password"
                  autoComplete="current-password"
                  className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${!showCurrent && currentPassword ? "tracking-[2px]" : ""
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
            </div>
            {currentPasswordError && (
              <span className="ds-text-small text-ds-error pt-1">
                {currentPasswordError}
              </span>
            )}
          </div>
        )}

        {/* New Password */}
        <div className="self-stretch flex flex-col justify-start items-start">
          <div className={`self-stretch py-2 border-b ${newPasswordError ? '!border-ds-error' : 'border-ds-border'} flex flex-col justify-center items-start gap-2.5 transition-colors`}>
            <label className="text-left text-ds-text-secondary ds-text-small-1">
              New password
            </label>
            <div className="self-stretch inline-flex justify-between items-center gap-2">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="New password"
                maxLength={15}
                autoComplete="new-password"
                className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${!showNew && newPassword ? "tracking-[2px]" : ""
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
          </div>
          {newPasswordError && (
            <span className="ds-text-small text-ds-error pt-1">
              {newPasswordError}
            </span>
          )}
        </div>

        {/* Confirm new password */}
        <div className="self-stretch flex flex-col justify-start items-start">
          <div className={`self-stretch pb-2 border-b ${confirmPasswordError ? '!border-ds-error' : 'border-ds-border'} flex flex-col justify-center items-start gap-2.5 transition-colors`}>
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
                className={`w-full bg-transparent text-ds-text-primary ds-text-secondary focus:outline-none placeholder:text-ds-text-muted ${!showConfirm && confirmPassword ? "tracking-[2px]" : ""
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
          </div>
          {confirmPasswordError && (
            <span className="ds-text-small text-ds-error pt-1">
              {confirmPasswordError}
            </span>
          )}
        </div>

        {/* Error / Feedback area */}
        {((errorMsg &&
          errorMsg !== "Current password is incorrect" &&
          errorMsg !== "Current password is required" &&
          errorMsg !== "Passwords do not match." &&
          errorMsg !== "New password must be different from current password.") || resetSuccessMsg) ? (
          <div className="ds-supporting-area w-full">
            {errorMsg &&
              errorMsg !== "Current password is incorrect" &&
              errorMsg !== "Current password is required" &&
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

          <button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className={`${isAddMode ? 'w-[132px]' : 'w-[80px]'} h-[36px] px-4 py-1.5 bg-ds-accent hover:opacity-90 rounded-full flex justify-center items-center gap-2 cursor-pointer transition-opacity ds-focus-ring disabled:opacity-50`}
          >
            <span className="text-white ds-text-body-1 whitespace-nowrap">
              {updatePasswordMutation.isPending
                ? (isAddMode ? "Adding..." : "Updating...")
                : (isAddMode ? "Add password" : "Update")}
            </span>
          </button>
        </div>


      </form>
    </div>
  );
}
