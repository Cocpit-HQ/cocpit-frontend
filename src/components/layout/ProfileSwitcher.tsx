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
import { Check, Plus, Settings, LogOut, User, Building2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface ProfileSwitcherProps {
    showArrow?: boolean;
    customTrigger?: React.ReactNode;
    align?: "start" | "end" | "center";
}

export function ProfileSwitcher({ showArrow = false, customTrigger, align = "end" }: ProfileSwitcherProps) {
    const { activeProfile, switchProfile, userCompanies, isCompany } = useActiveProfile();
    const { logout, user } = useAuth();
    const router = useRouter();

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
                    <Button variant="ghost" className="relative h-9 w-auto rounded-full p-0 overflow-hidden border border-border flex items-center gap-1 pr-1">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={activeProfile.avatar_url || user.image || ""} alt={activeProfile.name} className="object-cover" />
                            <AvatarFallback>{activeProfile.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {showArrow && <ChevronDown className="w-4 h-4 text-muted-foreground mr-1" />}
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align={align} forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-xs text-muted-foreground">Acting as</p>
                        <p className="text-sm font-medium leading-none">{activeProfile.name}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Personal Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => switchProfile("USER", user.id)} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{user.name || "My Profile"}</span>
                        {!isCompany && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Company Accounts</DropdownMenuLabel>
                    {userCompanies.length > 0 ? (
                        userCompanies.map((company) => (
                            <DropdownMenuItem
                                key={company.company_id}
                                onClick={() => switchProfile("COMPANY", company.company_id)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center flex-1 min-w-0">
                                    <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{company.name}</span>
                                </div>
                                {activeProfile.id === company.company_id && <Check className="ml-auto h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground italic">No companies</div>
                    )}
                    <DropdownMenuItem onClick={() => router.push("/create-company")} className="cursor-pointer text-primary focus:text-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create Company</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
