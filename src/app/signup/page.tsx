"use client";

import { Suspense } from "react";
import { SignUpFlow } from "@/features/signup";
import { LoadingIcon } from "@/components/icons";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ds-bg flex items-center justify-center">
          <LoadingIcon
            className="w-8 h-8 text-ds-text-secondary animate-spin-smooth"
            style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
          />
        </div>
      }
    >
      <SignUpFlow />
    </Suspense>
  );
}

