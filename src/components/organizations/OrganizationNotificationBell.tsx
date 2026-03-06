"use client";

import React from "react";
import { Bell, BellOff, Calendar, Briefcase, FileText, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { toast } from "sonner";
import type { CompanyNotificationPreferences } from "@/types/social";

interface OrganizationNotificationBellProps {
    companyId: string;
    isFollowing: boolean;
}

const CATEGORIES = [
    { key: "events_enabled" as const, label: "Events", icon: Calendar, description: "New events & meetups" },
    { key: "jobs_enabled" as const, label: "Jobs", icon: Briefcase, description: "New job postings" },
    { key: "posts_enabled" as const, label: "Posts", icon: FileText, description: "New posts & updates" },
];

export function OrganizationNotificationBell({ companyId, isFollowing }: OrganizationNotificationBellProps) {
    const queryClient = useQueryClient();

    const { data: prefs, isLoading } = useQuery<CompanyNotificationPreferences>({
        queryKey: ["company_notification_prefs", companyId],
        queryFn: () => companyService.getNotificationPreferences(companyId),
        enabled: !!companyId && isFollowing,
    });

    const updateMutation = useMutation({
        mutationFn: (update: Partial<CompanyNotificationPreferences>) =>
            companyService.updateNotificationPreferences(companyId, update),
        onSuccess: (data) => {
            queryClient.setQueryData(["company_notification_prefs", companyId], data);
        },
        onError: () => {
            toast.error("Failed to update notification preferences");
        },
    });

    const handleToggle = (key: keyof CompanyNotificationPreferences, value: boolean) => {
        updateMutation.mutate({ [key]: value });
    };

    const handleToggleAll = (enabled: boolean) => {
        updateMutation.mutate({
            events_enabled: enabled,
            jobs_enabled: enabled,
            posts_enabled: enabled,
        });
    };

    // Don't render if user is not following
    if (!isFollowing) return null;

    const getPref = (key: keyof CompanyNotificationPreferences) => prefs?.[key] ?? true;

    const allEnabled = getPref("events_enabled") && getPref("jobs_enabled") && getPref("posts_enabled");
    const anyEnabled = getPref("events_enabled") || getPref("jobs_enabled") || getPref("posts_enabled");

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="relative px-2.5"
                    title="Notification preferences"
                >
                    {anyEnabled ? (
                        <Bell className="h-4 w-4" />
                    ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    {anyEnabled && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleAll(!allEnabled)}
                            disabled={updateMutation.isPending}
                        >
                            {allEnabled ? "Turn off all" : "Turn on all"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Choose what notifications to receive
                    </p>
                </div>

                {/* Category Toggles */}
                <div className="p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        CATEGORIES.map(({ key, label, icon: Icon, description }) => (
                            <div
                                key={key}
                                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                                        <Icon className="h-4 w-4 text-foreground/70" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground leading-none">
                                            {label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={prefs?.[key] ?? true}
                                    onCheckedChange={(checked) => handleToggle(key, checked)}
                                    disabled={updateMutation.isPending}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
