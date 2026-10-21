"use client";

import React from "react";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyOnboardingStore } from "@/features/company-onboarding/store/company-onboarding.store";
import { BusinessBuildingIcon, UserIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SwitchableOrg {
  org_id?: string;
  company_id?: string;
  name?: string;
  logo_url?: string;
  entity_type?: string;
  slug?: string;
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
  const router = useRouter();
  const { activeProfile, switchProfile, switchableCompanies, isCompany } =
    useActiveProfile();
  const { user } = useAuth();
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

  const allOrgs = React.useMemo(() => {
    const list = [...institutions, ...companies];
    if (!isCompany || !activeProfile?.id) return list;
    const activeIdx = list.findIndex(
      (org) =>
        (org.org_id || org.company_id) === activeProfile.id ||
        (org.slug && activeProfile.slug === org.slug),
    );
    if (activeIdx <= 0) return list;
    const activeOrg = list[activeIdx];
    const rest = list.filter((_, idx) => idx !== activeIdx);
    return [activeOrg, ...rest];
  }, [institutions, companies, isCompany, activeProfile?.id, activeProfile?.slug]);

  if (!activeProfile || !user) return null;

  const handleSwitch = (type: "USER" | "COMPANY", id: string) => {
    setOpen(false);
    switchProfile(type, id);
  };

  const handleCreateOrganization = () => {
    setOpen(false);
    useCompanyOnboardingStore.getState().resetStore();
    router.push("/company-onboarding");
  };

  const hasOrganizations = allOrgs.length > 0;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      {customTrigger && (
        <Drawer.Trigger asChild>{customTrigger}</Drawer.Trigger>
      )}

      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[99]"
          onClick={() => setOpen(false)}
        />
        <Drawer.Content
          className="bg-[var(--ds-bg,#030303)] flex flex-col rounded-t-[8px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans',sans-serif] border-t border-[var(--ds-border,#2C2C33)] px-[12px] pt-[8px] pb-[24px] gap-[16px] shadow-2xl"
          style={{
            paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 20px))",
          }}
        >
          <Drawer.Title className="sr-only">Switch Profile</Drawer.Title>
          <Drawer.Description className="sr-only">
            Select a personal or organization account to switch active profile
          </Drawer.Description>

          {/* Drag Handle Frame (pepicons-pop:line-x) */}
          <div className="w-full h-[20px] flex items-center justify-center shrink-0">
            <div className="w-[50px] h-[2px] rounded-full bg-[#726B67]" />
          </div>

          {/* Personal Section */}
          <div className="flex flex-col gap-[12px] w-full shrink-0">
            {/* Section Header */}
            <div className="flex flex-row justify-between items-center px-[12px] h-[16px] w-full">
              <span className="font-['DM_Sans'] text-[12px] leading-[16px] font-normal text-ds-text-secondary">
                Personal
              </span>
            </div>

            {/* Personal Row */}
            <div className="flex flex-col gap-[8px] w-full">
              <button
                type="button"
                onClick={() => handleSwitch("USER", user.id)}
                className={cn(
                  "w-full h-[32px] px-[12px] py-[6px] rounded-full flex flex-row items-center justify-between cursor-pointer transition-colors text-left outline-none border border-transparent",
                  "hover:bg-ds-surface-1/60 active:bg-ds-surface-1 focus-visible:ring-1 focus-visible:ring-ds-accent",
                )}
              >
                <div className="flex flex-row items-center gap-[8px] min-w-0 flex-1">
                  <div className="w-[20px] h-[20px] rounded-full shrink-0 overflow-hidden bg-ds-surface-1 border border-ds-border flex items-center justify-center">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "Personal"}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-[12px] h-[12px] text-ds-text-secondary" />
                    )}
                  </div>
                  <span className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-ds-text-primary truncate">
                    {user.name || "My Profile"}
                  </span>
                </div>
                {!isCompany && (
                  <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-[1.5px] border-ds-accent box-border shrink-0">
                    <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Organization Section */}
          <div className="flex flex-col gap-[12px] w-full shrink-0">
            {/* Section Header */}
            <div className="flex flex-row justify-between items-center px-[12px] h-[16px] w-full">
              <span className="font-['DM_Sans'] text-[12px] leading-[16px] font-normal text-ds-text-secondary">
                Organization
              </span>
              {hasOrganizations && (
                <button
                  type="button"
                  onClick={handleCreateOrganization}
                  aria-label="Create organization"
                  className="w-[20px] h-[20px] flex items-center justify-center text-ds-text-primary hover:opacity-80 active:opacity-60 transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-ds-accent rounded cursor-pointer"
                >
                  {/* Use design system PlusIcon with primary color */}
                  <PlusIcon size={16} className="w-[16px] h-[16px] text-ds-text-primary" />
                </button>
              )}
            </div>

            {/* Organizations Content */}
            {!hasOrganizations ? (
              /* Case 1: No companies on user account -> "+ Create organization" button */
              <div className="flex flex-col gap-[8px] w-full">
                <button
                  type="button"
                  onClick={handleCreateOrganization}
                  className={cn(
                    "w-full h-[32px] px-[12px] py-[6px] rounded-full flex flex-row items-center gap-[8px] cursor-pointer transition-colors text-left outline-none border border-transparent group",
                    "hover:bg-ds-surface-1/60 active:bg-ds-surface-1 focus-visible:ring-1 focus-visible:ring-ds-accent",
                  )}
                >
                  {/* Use design system PlusIcon with primary color */}
                  <PlusIcon size={20} className="w-[20px] h-[20px] shrink-0 text-ds-text-primary" />
                  <span className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-ds-text-secondary group-hover:text-ds-text-primary transition-colors">
                    Create organization
                  </span>
                </button>
              </div>
            ) : (
              /* Case 2: User has companies -> List of organizations */
              <div className="flex flex-col gap-[8px] w-full max-h-[240px] overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {allOrgs.map((org: SwitchableOrg) => {
                  const orgId = org.org_id || org.company_id;
                  const isOrgActive =
                    isCompany &&
                    (activeProfile.id === orgId ||
                      (org.slug && activeProfile.slug === org.slug));
                  const hasLogo = Boolean(
                    org.logo_url && org.logo_url !== "/assets/pngegg.png",
                  );

                  return (
                    <button
                      key={orgId || org.name}
                      type="button"
                      onClick={() => orgId && handleSwitch("COMPANY", orgId)}
                      className={cn(
                        "w-full h-[32px] px-[12px] py-[6px] rounded-full flex flex-row items-center justify-between cursor-pointer transition-colors text-left outline-none border border-transparent",
                        "hover:bg-ds-surface-1/60 active:bg-ds-surface-1 focus-visible:ring-1 focus-visible:ring-ds-accent",
                      )}
                    >
                      <div className="flex flex-row items-center gap-[8px] min-w-0 flex-1">
                        <div className="w-[20px] h-[20px] rounded-[4px] shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center overflow-hidden">
                          {hasLogo ? (
                            <img
                              src={org.logo_url}
                              alt={org.name || "Organization"}
                              className="w-full h-full object-cover rounded-[4px]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const fallback = (e.target as HTMLImageElement)
                                  .nextElementSibling;
                                if (fallback)
                                  (fallback as HTMLElement).style.display =
                                    "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full items-center justify-center text-ds-text-primary"
                            style={{ display: hasLogo ? "none" : "flex" }}
                          >
                            <BusinessBuildingIcon className="w-[12px] h-[12px] text-ds-text-primary" />
                          </div>
                        </div>
                        <span className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-ds-text-primary truncate">
                          {org.name}
                        </span>
                      </div>
                      {isOrgActive && (
                        <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-[1.5px] border-ds-accent box-border shrink-0">
                          <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
