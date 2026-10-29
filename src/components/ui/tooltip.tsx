"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipTouchContextValue {
  enableTouch: boolean;
  isOpen: boolean;
  triggerTouch: (e: React.SyntheticEvent) => void;
}

const TooltipTouchContext = React.createContext<TooltipTouchContextValue | null>(null);

export interface TooltipProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  enableTouch?: boolean;
  touchDuration?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  enableTouch = false,
  touchDuration = 2500,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen || false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);

      if (!nextOpen && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [isControlled, onOpenChange]
  );

  const triggerTouch = React.useCallback(
    (e: React.SyntheticEvent) => {
      if (!enableTouch) return;

      // Prevent parent card clicks and default navigation
      e.preventDefault();
      e.stopPropagation();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      handleOpenChange(true);

      timeoutRef.current = setTimeout(() => {
        handleOpenChange(false);
      }, touchDuration);
    },
    [enableTouch, handleOpenChange, touchDuration]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // When enableTouch is true and tooltip is open, close on outside touch / scroll
  React.useEffect(() => {
    if (!enableTouch || !isOpen) return;

    const handleOutsideInteraction = () => {
      handleOpenChange(false);
    };

    window.addEventListener("scroll", handleOutsideInteraction, { capture: true, passive: true });
    document.addEventListener("touchstart", handleOutsideInteraction, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleOutsideInteraction, { capture: true });
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [enableTouch, isOpen, handleOpenChange]);

  const contextValue = React.useMemo(
    () => ({
      enableTouch,
      isOpen,
      triggerTouch,
    }),
    [enableTouch, isOpen, triggerTouch]
  );

  if (!enableTouch) {
    return (
      <TooltipTouchContext.Provider value={null}>
        <TooltipPrimitive.Root
          open={controlledOpen}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          {...props}
        >
          {children}
        </TooltipPrimitive.Root>
      </TooltipTouchContext.Provider>
    );
  }

  return (
    <TooltipTouchContext.Provider value={contextValue}>
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipTouchContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, onPointerDown, onPointerUp, onTouchEnd, ...props }, ref) => {
  const context = React.useContext(TooltipTouchContext);

  if (!context?.enableTouch) {
    return (
      <TooltipPrimitive.Trigger
        ref={ref}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onTouchEnd={onTouchEnd}
        {...props}
      />
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") {
      context.triggerTouch(e);
    }
    onPointerDown?.(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    context.triggerTouch(e);
    onTouchEnd?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.triggerTouch(e);
    onClick?.(e);
  };

  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      onPointerDown={handlePointerDown}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      {...props}
    />
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "overflow-hidden rounded-[0.5rem] border border-[#2C2C33] bg-black px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
        "!z-[9999]"
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
