"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { restoreAccount } from "@/services/api/user";
import { TickIcon, BlockIcon } from "@/components/icons";

type Status = "loading" | "success" | "used" | "expired" | "invalid";

function RestoreAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("Invalid restoration link. No token found.");
      return;
    }

    restoreAccount(token)
      .then(() => {
        setStatus("success");
        setMessage("Your account has been successfully restored. You can now log in and continue using Cocpit.");
      })
      .catch((err) => {
        const msg: string = err?.response?.data?.message || err?.message || "Something went wrong.";
        if (msg.includes("already been used")) {
          setStatus("used");
        } else if (msg.includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
        setMessage(msg);
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full bg-[var(--ds-bg)] flex items-center justify-center p-5 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-5 select-none">
        {/* FullPageError layout: max-w-[800px], flex flex-col items-center justify-center, gap: 24px */}
        <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-200">
          {/* IconFrame: 64x64px, rounded-full, bg #1A1A20, p-4 (16px) */}
          <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
            <TickIcon
              size={32}
              className="w-8 h-8 text-[var(--ds-success)] shrink-0"
              fill="var(--ds-success)"
            />
          </div>

          {/* TextBlock: w: 760px, gap: 8px, text-center */}
          <div className="w-full max-w-[760px] flex flex-col items-center gap-2">
            {/* Title: 16px semibold (600), line-height: 24px, #FFECE6 */}
            <h1 className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 text-center">
              Account Restored Successfully
            </h1>

            {/* Description: 14px regular (400), line-height: 20px, #B8ADA8, max-w-[360px] */}
            <p className="w-full max-w-[360px] text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5 text-center">
              Your account has been successfully restored. You can now log in and continue using Cocpit.
            </p>
          </div>

          {/* Primary emphasis button: h: 36px, px: 12px, py: 6px, gap: 10px, bg: #EC6229, rounded: 100px */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
              Continue to Login
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Error States (used, expired, invalid)
  const errorTitle =
    status === "used"
      ? "Link Already Used"
      : status === "expired"
      ? "Link Expired"
      : "Invalid Link";

  const errorDescription =
    status === "used"
      ? "This restoration link has already been used. Your account is already active."
      : status === "expired"
      ? "This restoration link has expired. Please visit the login page to request a new one."
      : message || "This link is not valid. Please request a new one.";

  const buttonText = status === "used" ? "Go to Login" : "Go to Login & Resend Email";

  return (
    <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-5 select-none">
      <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
          <BlockIcon
            size={32}
            className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0"
            fill="var(--ds-text-muted)"
          />
        </div>

        <div className="w-full max-w-[760px] flex flex-col items-center gap-2">
          <h1 className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 text-center">
            {errorTitle}
          </h1>

          <p className="w-full max-w-[360px] text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5 text-center">
            {errorDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        >
          <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function RestoreAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[var(--ds-bg)] flex items-center justify-center select-none">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <RestoreAccountContent />
    </Suspense>
  );
}
