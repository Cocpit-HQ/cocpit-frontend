"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordFlow } from "@/features/reset-password";
import { LoadingIcon } from "@/components/icons";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return <ResetPasswordFlow initialToken={token} />;
}

export default function ResetPasswordPage() {
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
      <ResetPasswordPageContent />
    </Suspense>
  );
}
