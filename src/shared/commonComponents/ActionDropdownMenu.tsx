"use client";

import React from "react";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ActionDropdownMenuItem {
  key: string;
  label: string;
  icon?: string | React.ReactNode;
  iconColor?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
  hidden?: boolean;
  disabled?: boolean;
}

export interface ActionDropdownMenuProps {
  trigger?: React.ReactNode;
  items: ActionDropdownMenuItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  menuWidth?: string; // defaults to w-[204px]
  borderRadius?: string; // defaults to "24px 0px 24px 24px"
  children?: React.ReactNode;
}

export default function ActionDropdownMenu({
  trigger,
  items,
  open,
  onOpenChange,
  align = "end",
  sideOffset = 4,
  className,
  menuWidth = "w-[204px]",
  borderRadius = "24px 0px 24px 24px",
  children,
}: ActionDropdownMenuProps) {
  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {trigger && <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>}
      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={cn(
          menuWidth,
          "max-w-[calc(100vw-32px)] p-2 mr-2 sm:mr-4 bg-[var(--ds-surface-2)] border border-[var(--ds-border)] shadow-xl z-[200]",
          className,
        )}
        style={{ borderRadius }}
      >
        {children
          ? children
          : visibleItems.map((item) => {
              const isDestructive = item.variant === "destructive";
              const textColor = isDestructive
                ? "!text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)]"
                : "text-[var(--ds-text-primary)]";
              const defaultIconColor = isDestructive
                ? "var(--ds-error)"
                : "var(--ds-text-primary)";
              const hoverBg = isDestructive
                ? "!bg-transparent hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80 transition-opacity"
                : "hover:bg-[var(--ds-surface-1)] focus:bg-[var(--ds-surface-1)] transition-colors";

              return (
                <DropdownMenuItem
                  key={item.key}
                  disabled={item.disabled}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 min-h-[36px] cursor-pointer rounded-md border-none outline-none",
                    hoverBg,
                    isDestructive && "!text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)]",
                    item.disabled && "opacity-40 pointer-events-none",
                  )}
                >
                  <span
                    className={cn(
                      "font-['DM_Sans'] font-normal text-sm leading-5 select-none truncate",
                      textColor,
                    )}
                  >
                    {item.label}
                  </span>
                  {item.icon &&
                    (typeof item.icon === "string" ? (
                      <Icon
                        icon={item.icon}
                        width={20}
                        height={20}
                        className="shrink-0 ml-2"
                        color={item.iconColor || defaultIconColor}
                      />
                    ) : (
                      item.icon
                    ))}
                </DropdownMenuItem>
              );
            })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
