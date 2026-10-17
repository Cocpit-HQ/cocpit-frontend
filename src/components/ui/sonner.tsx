"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-ds-surface-2 group-[.toaster]:text-ds-text-primary group-[.toaster]:border-ds-border group-[.toaster]:shadow-lg font-['DM_Sans']",
          description: "group-[.toast]:text-ds-text-secondary",
          actionButton: "group-[.toast]:bg-ds-accent group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-ds-surface-1 group-[.toast]:text-ds-text-secondary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
