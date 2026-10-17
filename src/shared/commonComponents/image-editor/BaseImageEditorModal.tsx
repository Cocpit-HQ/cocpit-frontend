import React, { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface BaseImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  descriptionText?: string;
  maxWidthClass?: string; // sm:max-w-[600px] or max-w-[800px]
  cardPaddingClass?: string; // p-4 sm:p-[32px] vs p-[16px]
  children: ReactNode;
  
  // Custom slots
  mobileHeaderSaveButton?: ReactNode;
  desktopFooter?: ReactNode;

  poppinsFamilyClass?: boolean;
  hideCloseButton?: boolean;
  extraContentClass?: string;
  animateClasses?: boolean; // EditAvatarModal uses custom animate states
  portalContainerId?: string;
}

export const BaseImageEditorModal: React.FC<BaseImageEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  descriptionText,
  maxWidthClass = "sm:max-w-[600px]",
  cardPaddingClass = "p-4 sm:p-[32px]",
  children,
  mobileHeaderSaveButton,
  desktopFooter,
  poppinsFamilyClass = false,
  hideCloseButton = false,
  extraContentClass = "",
  animateClasses = false,
  portalContainerId,
}) => {
  const fontClass = poppinsFamilyClass ? "font-[family-name:var(--font-poppins)]" : "font-['Poppins']";
  const isMobile = useIsMobile();
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isOpen && portalContainerId && !isMobile) {
      const el = document.getElementById(portalContainerId);
      setPortalContainer(el);
    } else {
      setPortalContainer(null);
    }
  }, [isOpen, portalContainerId, isMobile]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        isInline={!!portalContainer}
        portalContainer={portalContainer}
        className={cn(
          "p-0 w-full outline-none", 
          hideCloseButton && "[&>button]:hidden",
          animateClasses 
            ? "max-w-none h-[100dvh] sm:h-auto sm:rounded-[24px] data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0"
            : "border-none bg-transparent shadow-none max-w-none h-[100dvh] sm:h-auto",
          maxWidthClass
        )}
      >
        <div 
          className={cn(
            "relative bg-card flex flex-col outline-none overflow-y-auto mx-auto justify-self-center",
            poppinsFamilyClass ? "rounded-none sm:rounded-[24px] shadow-none overflow-x-hidden h-full sm:h-auto w-full" : "rounded-none sm:rounded-[24px] w-full h-full sm:h-auto shadow-sm",
            cardPaddingClass,
            extraContentClass
          )}
        >


          {/* Mobile header */}
          {mobileHeaderSaveButton && (
            <div className="sm:hidden flex items-center justify-between mb-8 sticky top-0 bg-card z-20 pt-2 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors cursor-pointer"
              >
                <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
              </button>
              <DialogTitle className={cn("text-[16px] font-medium text-foreground m-0 p-0", fontClass)}>
                {title}
              </DialogTitle>
              {mobileHeaderSaveButton}
            </div>
          )}

          {/* Desktop title */}
          <div className={cn("hidden sm:block text-center mb-6 px-4", poppinsFamilyClass && "relative")}>
            <DialogTitle className={cn("text-[18px] leading-[26px] text-foreground mb-1", fontClass, poppinsFamilyClass ? "font-semibold" : "font-medium")}>
              {title}
            </DialogTitle>
            {descriptionText && (
              <p className={cn("text-[14px] leading-[20px] font-normal text-muted-foreground", fontClass)}>
                {descriptionText}
              </p>
            )}
          </div>

          {/* Content Body */}
          {children}

          {/* Desktop footer */}
          {desktopFooter && (
            <div className="hidden sm:flex justify-center gap-4 mt-10">
              {desktopFooter}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
