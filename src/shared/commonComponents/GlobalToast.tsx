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
          animation: cardFadeIn 300ms cubic-bezier(0.22, 1, 0.36, 1);
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
          display: block;
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
        
        /* 3. Responsive Positioning (SCRUM-14 / SCRUM-859) */
        @media (max-width: 639px) {
          html body [data-sonner-toaster][data-y-position="bottom"] {
            bottom: calc(env(safe-area-inset-bottom, 16px) + 72px) !important;
            right: 16px !important;
          }
        }

        @media (min-width: 640px) {
          /* Right 79px and Bottom 41px in right bottom corner */
          html body [data-sonner-toaster][data-x-position="right"] {
            right: 79px !important;
          }
          html body [data-sonner-toaster][data-y-position="bottom"] {
            bottom: 41px !important;
          }
        }

        /* 4. Frame 2609474 & Text layers exact Figma match using newGlobal.css tokens */
        html body [data-sonner-toast] {
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          padding: var(--space-2, 8px) var(--space-3, 12px) !important;
          gap: var(--space-4, 16px) !important;
          width: 335px !important;
          max-width: 335px !important;
          min-height: 29px !important;
          height: auto !important;
          bottom: 0 !important;
          top: auto !important;
          background: var(--ds-bg) !important;
          border: 1px solid var(--ds-border) !important;
          border-radius: var(--radius-card-new, 8px) !important;
          box-shadow: none !important;
        }

        @media (max-width: 639px) {
          html body [data-sonner-toast] {
            max-width: calc(100vw - 32px) !important;
          }
        }

        html body [data-sonner-toast] [data-content] {
          width: 100% !important;
          max-width: 309px !important;
          align-self: stretch !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: flex-start !important;
          text-align: left !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }

        html body [data-sonner-toast] [data-title] {
          width: 100% !important;
          max-width: 309px !important;
          align-self: stretch !important;
          font-family: var(--font-dm-sans), 'DM Sans', sans-serif !important;
          font-style: normal !important;
          font-weight: var(--text-secondary-1-weight, 500) !important;
          font-size: var(--text-secondary-1-size, 14px) !important;
          line-height: var(--text-secondary-1-line-height, 20px) !important;
          color: var(--ds-text-primary) !important;
          text-align: left !important;
          flex: none !important;
          order: 0 !important;
          flex-grow: 0 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }

        html body [data-sonner-toast] [data-description] {
          width: 100% !important;
          max-width: 309px !important;
          align-self: stretch !important;
          font-family: var(--font-dm-sans), 'DM Sans', sans-serif !important;
          font-style: normal !important;
          font-weight: var(--text-small-weight, 400) !important;
          font-size: var(--text-small-size, 12px) !important;
          line-height: var(--text-small-line-height, 16px) !important;
          color: var(--ds-text-secondary) !important;
          text-align: left !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
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
              "animate-toast-card bg-ds-bg border border-ds-border rounded-[var(--radius-card-new,8px)] w-[335px] max-w-[335px] min-h-[29px] h-auto py-2 px-3 gap-4 flex flex-col justify-center items-center text-left pointer-events-auto box-border",
            content: "w-full max-w-[309px] self-stretch flex flex-col justify-center items-start text-left gap-1 whitespace-normal break-words [overflow-wrap:anywhere]",
            title: "w-full max-w-[309px] self-stretch text-left animate-text-swipe text-ds-text-primary ds-text-secondary-1 whitespace-normal break-words [overflow-wrap:anywhere]",
            description: "w-full max-w-[309px] self-stretch text-left animate-text-swipe text-ds-text-secondary ds-text-small whitespace-normal break-words [overflow-wrap:anywhere]",
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
