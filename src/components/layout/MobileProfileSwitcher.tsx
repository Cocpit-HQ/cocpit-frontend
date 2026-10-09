"use client";

import React from "react";
import { Drawer } from "vaul";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SwitchableOrg {
  org_id?: string;
  company_id?: string;
  name?: string;
  logo_url?: string;
  entity_type?: string;
}

interface ProfileSwitcherProps {
  customTrigger?: React.ReactNode;
  align?: "start" | "end" | "center";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileProfileSwitcher({
  customTrigger,
  isOpen,
  onOpenChange,
}: ProfileSwitcherProps) {
  const { activeProfile, switchProfile, switchableCompanies, isCompany } =
    useActiveProfile();
  const { user } = useAuth();
  const [showAllOrgs, setShowAllOrgs] = React.useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : uncontrolledOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setUncontrolledOpen(val);
    }
  };

  const companies = switchableCompanies.filter(
    (c) => c.entity_type === "COMPANY" || !c.entity_type,
  );
  const institutions = switchableCompanies.filter(
    (c) => c.entity_type === "INSTITUTION",
  );

  if (!activeProfile || !user) return null;

  const handleSwitch = (type: "USER" | "COMPANY", id: string) => {
    setOpen(false);
    switchProfile(type, id);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      {customTrigger && (
        <Drawer.Trigger asChild>{customTrigger}</Drawer.Trigger>
      )}

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[99]" onClick={() => setOpen(false)} />
        <Drawer.Content
          className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans',sans-serif] border-t border-[var(--ds-border)] px-4 pt-3 max-h-[85vh] shadow-2xl"
          style={{
            paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
          }}
        >
          <Drawer.Title className="sr-only">Switch Profile</Drawer.Title>
          <Drawer.Description className="sr-only">
            Select a personal or organization account to switch active profile
          </Drawer.Description>

          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border,#3F3F46)] mb-4 cursor-grab" />

          <div className="space-y-4">
            {/* Personal Section */}
            <div className="space-y-1">
              <div className="text-[12px] font-medium text-ds-text-secondary px-2 mb-1.5">
                Personal
              </div>
              <button
                type="button"
                onClick={() => handleSwitch("USER", user.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 h-[48px] cursor-pointer rounded-full transition-colors text-left",
                  !isCompany ? "bg-ds-surface-1" : "hover:bg-ds-surface-1/60 active:bg-ds-surface-1",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-ds-accent border border-transparent",
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || ""}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {user.name?.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[14px] leading-[20px] font-medium text-ds-text-primary font-sans truncate flex-1">
                  {user.name || "My Profile"}
                </span>
                {!isCompany && (
                  <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 border-ds-accent box-border shrink-0">
                    <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                  </div>
                )}
              </button>
            </div>

            {/* Organizations Section */}
            {(institutions.length > 0 || companies.length > 0) && (
              <div className="space-y-1">
                <div className="text-[12px] font-medium text-ds-text-secondary px-2 mb-1.5">
                  Organizations
                </div>
                <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {(showAllOrgs
                    ? [...institutions, ...companies]
                    : [...institutions, ...companies].slice(0, 3)
                  ).map((org: SwitchableOrg) => {
                    const orgId = org.org_id || org.company_id;
                    const isActive = activeProfile.id === orgId;

                    return (
                      <button
                        key={orgId}
                        type="button"
                        onClick={() => orgId && handleSwitch("COMPANY", orgId)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 h-[48px] cursor-pointer rounded-full transition-colors text-left",
                          isActive
                            ? "bg-ds-surface-1"
                            : "hover:bg-ds-surface-1/60 active:bg-ds-surface-1",
                          "focus:outline-none focus-visible:ring-1 focus-visible:ring-ds-accent border border-transparent",
                        )}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={org.logo_url}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {org.name?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[14px] leading-[20px] font-normal text-ds-text-primary font-sans truncate flex-1">
                          {org.name}
                        </span>
                        {isActive && (
                          <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 border-ds-accent box-border shrink-0">
                            <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {!showAllOrgs &&
                    institutions.length + companies.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAllOrgs(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 h-[44px] cursor-pointer rounded-full transition-colors hover:bg-ds-surface-1 active:bg-ds-surface-1 outline-none text-ds-text-secondary hover:text-ds-text-primary font-medium text-[14px]"
                      >
                        <span>
                          Show {institutions.length + companies.length - 3} more
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
