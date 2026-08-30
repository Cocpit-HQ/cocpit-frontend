import React from "react";

export type OnboardingSelection = "upload" | "manual" | null;

export interface StepBeginProps {
  onNext: () => void;
}

export interface OnboardingLayoutProps {
  children: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
}
