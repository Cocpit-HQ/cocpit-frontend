"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import React from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * GlobalToast is the single source of truth for Toast UI.
 * Strictly adheres to AGENTS.md design specifications:
 * - Content-driven height
 * - Design tokens for colors (bg-ds-bg, border-ds-border)
 * - Fixed 335px width
 * - Stacking enabled
 */
const GlobalToast = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-['DM_Sans']"
      position="bottom-right"
      duration={3500}
      icons={{
        success: <div className="hidden" />,
        error: <div className="hidden" />,
        warning: <div className="hidden" />,
        info: <div className="hidden" />,
        loading: <div className="hidden" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-ds-bg border border-ds-border rounded-[8px] w-fit max-w-[calc(100vw-32px)] sm:max-w-[335px] min-h-[38px] h-fit py-[8px] px-[12px] gap-0 shadow-lg flex items-center justify-start pointer-events-auto",
          title: "text-ds-text-primary text-sm font-medium",
          description: "text-ds-text-secondary text-xs font-normal",
          actionButton: "bg-ds-accent text-white ds-btn",
          cancelButton: "bg-ds-surface-1 text-ds-text-secondary ds-btn",
          error: "bg-ds-bg border-ds-error text-ds-error",
          success: "bg-ds-bg border-ds-border text-ds-text-primary",
          warning: "bg-ds-bg border-ds-warning text-ds-warning",
          info: "bg-ds-bg border-ds-border text-ds-text-primary",
          icon: "!hidden hidden",
        },
      }}
      {...props}
    />
  );
};

// Export the customized toaster component and a helper function for standard usage.
// Developers should ONLY import `showToast` or `GlobalToast` from this file.
export { GlobalToast, toast as showToast, toast };
