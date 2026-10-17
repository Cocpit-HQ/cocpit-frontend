"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  label?: string;
  onClick?: () => void;
}

export function BackButton({ className, label = "Back", onClick }: BackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition w-fit cursor-pointer",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5" />
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
