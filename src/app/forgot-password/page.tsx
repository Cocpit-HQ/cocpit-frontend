"use client";

import { Suspense } from "react";
import { ResetPasswordFlow } from "@/features/reset-password";
import { LoadingIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
          <LoadingIcon
            className="w-8 h-8 text-[#B8ADA8] animate-spin-smooth"
            style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
          />
        </div>
      }
    >
      <ResetPasswordFlow />
    </Suspense>
  );
}

