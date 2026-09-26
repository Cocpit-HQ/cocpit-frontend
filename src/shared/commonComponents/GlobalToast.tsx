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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Overwrite Sonner's default vertical drop so the card doesn't come from the bottom */
        html body [data-sonner-toast][data-mounted="false"],
        html body [data-sonner-toast][data-removed="true"] {
          --y: translateY(calc(var(--lift, -1) * var(--offset, 0px))) !important;
        }

        /* 1. Card simply fades in smoothly without moving */
        html body .animate-toast-card[data-mounted="true"] {
          animation: cardFadeIn 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
        }
        html body .animate-toast-card[data-removed="true"] {
          animation: cardFadeOut 200ms ease-in forwards !important;
        }

        @keyframes cardFadeIn {
          0% { opacity: 0; transform: var(--y) scale(0.96); }
          100% { opacity: 1; transform: var(--y) scale(1); }
        }

        @keyframes cardFadeOut {
          0% { opacity: 1; transform: var(--y) scale(1); }
          100% { opacity: 0; transform: var(--y) scale(0.96); }
        }

        /* 2. Text swipes and expands from left to right */
        .animate-text-swipe {
          display: inline-block;
          animation: textSwipeIn 800ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both !important;
        }

        @keyframes textSwipeIn {
          0% {
            opacity: 0;
            transform: translateX(-15px);
            clip-path: inset(0 100% 0 0);
          }
          100% {
            opacity: 1;
            transform: translateX(0px);
            clip-path: inset(0 0 0 0);
          }
        }
      `}} />
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
              "animate-toast-card bg-ds-bg border border-ds-border rounded-[8px] w-fit max-w-[calc(100vw-32px)] sm:max-w-[335px] min-h-[38px] h-fit py-[8px] px-[12px] gap-0 shadow-lg flex items-center justify-start pointer-events-auto",
            title: "animate-text-swipe text-ds-text-primary text-sm font-medium",
            description: "animate-text-swipe text-ds-text-secondary text-xs font-normal",
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
    </>
  );
};

// Export the customized toaster component and a helper function for standard usage.
// Developers should ONLY import `showToast` or `GlobalToast` from this file.
export { GlobalToast, toast as showToast, toast };
