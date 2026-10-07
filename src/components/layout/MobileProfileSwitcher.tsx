"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import {
  Check,
  Plus,
  Settings,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wrench } from "lucide-react";

interface ProfileSwitcherProps {
  showArrow?: boolean;
  customTrigger?: React.ReactNode;
  align?: "start" | "end" | "center";
}

export function MobileProfileSwitcher({
  showArrow = false,
  customTrigger,
  align = "end",
}: ProfileSwitcherProps) {
  const { activeProfile, switchProfile, switchableCompanies, isCompany } =
    useActiveProfile();
  const { logout, user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { flags } = useFeatureFlags();
  const [showAllOrgs, setShowAllOrgs] = React.useState(false);

  const enableOrgCreation = flags.enableOrgCreation !== false && flags.enableOrganizationsModule !== false;
  const enableSettings = flags.enableSettingsModule !== false && flags.settings_privacy !== false;

  const companies = switchableCompanies.filter(
    (c) => c.entity_type === "COMPANY" || !c.entity_type,
  );
  const institutions = switchableCompanies.filter(
    (c) => c.entity_type === "INSTITUTION",
  );

  if (!activeProfile || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {customTrigger ? (
          customTrigger
        ) : (
          <Button
            variant="ghost"
            className="relative h-6 w-6 rounded-full p-0 overflow-hidden border border-border focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center justify-center shadow-none outline-none"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={activeProfile.avatar_url || user.image || undefined}
                alt={activeProfile.name}
                className="object-cover"
              />
              <AvatarFallback>
                {activeProfile.name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {showArrow && (
              <ChevronDown className="w-4 h-4 text-muted-foreground mr-1" />
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "w-[393px] max-w-full h-auto pt-[8px] pb-[24px] px-[12px] flex flex-col gap-4 profile-switcher-content !bg-[var(--ds-bg)] font-[family-name:var(--font-poppins)]",
          "!w-full !max-w-none rounded-none rounded-t-[8px] pb-[calc(env(safe-area-bottom-inset)+24px)] !border-0 !border-none !border-transparent !shadow-none !outline-none !ring-0 z-[9999]"
        )}
        style={{ backgroundColor: 'var(--ds-bg)', border: 'none', boxShadow: 'none', outline: 'none' }}
        align={align}
      >
        <style dangerouslySetInnerHTML={{__html: `
            [data-radix-popper-content-wrapper]:has(.profile-switcher-content) {
              transform: none !important;
              top: auto !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              position: fixed !important;
            }
        `}} />


        <div className="w-full flex justify-center h-[20px] items-center shrink-0">
          <div className="w-[50px] h-[4px] rounded-full bg-ds-text-muted" />
        </div>

        <div className="space-y-3">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[12px] font-medium text-ds-text-secondary px-2 mb-2 p-0">
              Personal
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => switchProfile("USER", user.id)}
              className={cn(
                "profile-switcher-item flex items-center gap-3 px-[12px] py-[6px] h-[44px] cursor-pointer rounded-[100px] transition-colors focus:bg-transparent hover:bg-ds-surface-1 focus:text-inherit outline-none border border-transparent",
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.image || undefined}
                  alt={user.name || ""}
                  className="object-cover"
                />
                <AvatarFallback>
                  {user.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[14px] leading-[20px] font-normal text-ds-text-primary font-sans">
                {user.name || "My Profile"}
              </span>
              {!isCompany && (
                <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 border-ds-accent box-border shrink-0">
                  <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                </div>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {(institutions.length > 0 || companies.length > 0) && (
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuLabel className="text-[12px] font-medium text-ds-text-secondary px-2 mb-2 p-0">
                Organizations
              </DropdownMenuLabel>
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(showAllOrgs ? [...institutions, ...companies] : [...institutions, ...companies].slice(0, 3)).map((org: any) => (
                  <DropdownMenuItem
                    key={org.org_id || org.company_id}
                    onClick={() =>
                      switchProfile("COMPANY", org.org_id || org.company_id)
                    }
                    className={cn(
                      "profile-switcher-item flex items-center gap-3 px-[12px] py-[6px] h-[44px] cursor-pointer rounded-[100px] transition-colors focus:bg-transparent hover:bg-ds-surface-1 focus:text-inherit outline-none border border-transparent",
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={org.logo_url}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {org.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[14px] leading-[20px] font-normal text-ds-text-primary font-sans truncate">
                      {org.name}
                    </span>
                    {activeProfile.id === (org.org_id || org.company_id) && (
                      <div className="ml-auto flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 border-ds-accent box-border shrink-0">
                        <div className="w-[8px] h-[8px] bg-ds-accent rounded-full shrink-0" />
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}

                {!showAllOrgs && (institutions.length + companies.length) > 3 && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowAllOrgs(true);
                    }}
                    className="profile-switcher-item flex items-center justify-center gap-2 px-[12px] py-[6px] h-[44px] cursor-pointer rounded-[100px] transition-colors focus:bg-transparent hover:bg-ds-surface-1 focus:text-inherit outline-none text-ds-text-primary font-medium"
                  >
                    <span className="text-[14px]">Show {institutions.length + companies.length - 3} more</span>
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuItem>
                )}
              </div>
            </DropdownMenuGroup>
          )}
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
