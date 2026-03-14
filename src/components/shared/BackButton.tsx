"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  label?: string;
}

export function BackButton({ className, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition w-fit",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5" />
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
