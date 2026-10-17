"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface PasswordRequirementsCardProps {
  password: string;
  className?: string;
}

export function PasswordRequirementsCard({ password, className = "" }: PasswordRequirementsCardProps) {
  const isLengthValid = password.length >= 8 && password.length <= 15;
  const isUppercaseValid = /[A-Z]/.test(password);
  const isLowercaseValid = /[a-z]/.test(password);
  const isSpecialValid = /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password);

  const requirements = [
    { label: "8 to 15 characters", met: isLengthValid },
    { label: "At least 1 uppercase letter (A–Z)", met: isUppercaseValid },
    { label: "At least 1 lowercase letter (a–z)", met: isLowercaseValid },
    { label: "At least 1 special character (e.g., @, #, $, %, &, *)", met: isSpecialValid },
  ];

  const firstMissing = requirements.find(req => !req.met);

  // All conditions met but at max length — show limit indicator
  if (!firstMissing && password.length >= 15) {
    return (
      <span className={`text-[12px] text-[#FF6B6B] font-[family-name:var(--font-poppins)] ${className}`}>
        *Maximum 15 characters reached
      </span>
    );
  }

  if (!firstMissing) return null;

  return (
    <div className={`flex items-center gap-2 text-[12px] text-[#9CA3AF] font-[family-name:var(--font-poppins)] ${className}`}>
      <Icon icon="carbon:dot-mark" className="w-4 h-4 flex-shrink-0 text-[#9CA3AF]" />
      <span>{firstMissing.label}</span>
    </div>
  );
}
