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

interface ProfileSwitcherProps {
  showArrow?: boolean;
  customTrigger?: React.ReactNode;
  align?: "start" | "end" | "center";
}

export function ProfileSwitcher({
  showArrow = false,
  customTrigger,
  align = "end",
}: ProfileSwitcherProps) {
  const { activeProfile, switchProfile, switchableCompanies, isCompany } =
    useActiveProfile();
  const { logout, user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
                src={activeProfile.avatar_url || user.image || ""}
                alt={activeProfile.name}
                className="object-cover"
              />
              <AvatarFallback>
                {activeProfile.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {showArrow && (
              <ChevronDown className="w-4 h-4 text-muted-foreground mr-1" />
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[320px] h-auto pt-2 pb-2 px-2 flex flex-col gap-2 rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-0 profile-popover-custom border shadow-none font-[family-name:var(--font-poppins)]"
        align={align}
        forceMount
      >
        <div className="flex items-center justify-between">
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border border-profile-active-border">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name || ""}
                  className="object-cover"
                />
                <AvatarFallback>
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold text-profile-text leading-tight">
                  {user.name}
                </span>
                <span className="text-[12px] text-[#6B7280]">
                  @
                  {(user as any).account_name ||
                    user.name?.toLowerCase().replace(/\s+/g, "") ||
                    "username"}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="flex items-center gap-1 p-1 bg-profile-hover rounded-full h-[36px] w-[72px]">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full transition-all",
                theme === "light"
                  ? "bg-white text-[#6366F1] shadow-sm"
                  : "text-[#6B7280] hover:text-[#6366F1]",
              )}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full transition-all",
                theme === "dark"
                  ? "bg-white text-[#6366F1] shadow-sm"
                  : "text-[#6B7280] hover:text-[#6366F1]",
              )}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[12px] font-medium text-[#71717A] px-2 mb-2 p-0">
              Personal
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => switchProfile("USER", user.id)}
              className={cn(
                "profile-switcher-item flex items-center gap-3 p-2 h-[52px] cursor-pointer rounded-[12px] transition-colors focus:bg-profile-hover hover:bg-profile-hover focus:text-inherit outline-none border border-transparent",
                !isCompany &&
                  "bg-profile-active-bg border-profile-active-border",
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name || ""}
                  className="object-cover"
                />
                <AvatarFallback>
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[15px] leading-[22px] font-normal text-profile-text font-[family-name:var(--font-poppins)]">
                {user.name || "My Profile"}
              </span>
              {!isCompany && (
                <Check className="ml-auto h-4 w-4 text-[#6366F1]" />
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {(institutions.length > 0 || companies.length > 0) && (
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuLabel className="text-[12px] font-medium text-[#71717A] px-2 mb-2 p-0">
                Organizations
              </DropdownMenuLabel>
              <div className="space-y-1">
                {institutions.map((inst: any) => (
                  <DropdownMenuItem
                    key={inst.org_id || inst.company_id}
                    onClick={() =>
                      switchProfile("COMPANY", inst.org_id || inst.company_id)
                    }
                    className={cn(
                      "profile-switcher-item flex items-center gap-3 p-2 h-[52px] cursor-pointer rounded-[12px] transition-colors focus:bg-profile-hover hover:bg-profile-hover focus:text-inherit outline-none border border-transparent",
                      activeProfile.id === (inst.org_id || inst.company_id) &&
                        "bg-profile-active-bg border-profile-active-border",
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={inst.logo_url}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {inst.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[15px] leading-[22px] font-normal text-profile-text font-[family-name:var(--font-poppins)] truncate">
                      {inst.name}
                    </span>
                    {activeProfile.id === (inst.org_id || inst.company_id) && (
                      <Check className="ml-auto h-4 w-4 text-[#6366F1]" />
                    )}
                  </DropdownMenuItem>
                ))}
                {companies.map((company: any) => (
                  <DropdownMenuItem
                    key={company.org_id || company.company_id}
                    onClick={() =>
                      switchProfile(
                        "COMPANY",
                        company.org_id || company.company_id,
                      )
                    }
                    className={cn(
                      "profile-switcher-item flex items-center gap-3 p-2 h-[52px] cursor-pointer rounded-[12px] transition-colors focus:bg-profile-hover hover:bg-profile-hover focus:text-inherit outline-none border border-transparent",
                      activeProfile.id ===
                        (company.org_id || company.company_id) &&
                        "bg-profile-active-bg border-profile-active-border",
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={company.logo_url}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {company.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[15px] leading-[22px] font-normal text-profile-text font-[family-name:var(--font-poppins)] truncate">
                      {company.name}
                    </span>
                    {activeProfile.id ===
                      (company.org_id || company.company_id) && (
                      <Check className="ml-auto h-4 w-4 text-[#6366F1]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuGroup>
          )}
        </div>

        <div className="pt-2 border-t border-profile-active-border space-y-1">
          <DropdownMenuItem
            onClick={() => router.push("/company-onboarding")}
            className="profile-switcher-item flex items-center gap-3 p-2 h-[44px] cursor-pointer rounded-[12px] transition-colors focus:bg-profile-hover hover:bg-profile-hover focus:text-inherit outline-none"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[15px] leading-[22px] font-normal">
              Create Organization
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (activeProfile?.type === "COMPANY" && activeProfile.slug) {
                router.push(`/organization/${activeProfile.slug}/settings`);
              } else {
                router.push("/settings");
              }
            }}
            className="profile-switcher-item flex items-center gap-3 p-2 h-[44px] cursor-pointer rounded-[12px] transition-colors focus:bg-profile-hover hover:bg-profile-hover focus:text-inherit outline-none"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[15px] leading-[22px] font-normal">
              Settings
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            className="profile-switcher-item flex items-center gap-3 p-2 h-[44px] cursor-pointer rounded-[12px] text-[#FF6B6B] focus:bg-[#FFF0F0] hover:bg-[#FFF0F0] dark:focus:bg-red-500/10 dark:hover:bg-red-500/10 focus:text-[#FF6B6B] hover:text-[#FF6B6B] transition-colors outline-none"
          >
            <LogOut className="w-5 h-5 text-current" />
            <span className="text-[15px] leading-[22px] font-normal">
              Log out
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
