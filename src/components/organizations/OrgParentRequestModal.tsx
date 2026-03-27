"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Building2 } from "lucide-react";
import { companyService, Company } from "@/services/organization.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface OrgParentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentOrgId: string;
    currentOrgSlug: string;
}

export function OrgParentRequestModal({ isOpen, onClose, currentOrgId, currentOrgSlug }: OrgParentRequestModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Company[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Company | null>(null);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;

        const performSearch = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await companyService.searchOrganizations(searchQuery);
                // Filter out self-selection
                const filtered = results.filter(org => (org.org_id || org.company_id) !== currentOrgId);
                setSearchResults(filtered);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, currentOrgId, isOpen]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedParent(null);
            setMessage("");
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!selectedParent) return;
        const parentId = selectedParent.org_id || selectedParent.company_id;
        if (!parentId) return;

        setIsSubmitting(true);
        try {
            await companyService.sendParentRequest(currentOrgId, parentId, message);
            toast.success(`Request sent to ${selectedParent.name}`);
            queryClient.invalidateQueries({ queryKey: ["company", currentOrgSlug] });
            onClose();
        } catch (err: any) {
            const errString = companyService.normalizeError(err).toLowerCase();
            // Specific 409 cycle check based on backend response or generic conflict
            if (err.response?.status === 409 || errString.includes("cycle") || errString.includes("circular")) {
                toast.error("Cannot set this organization as parent, as it would create a circular hierarchy.");
            } else {
                toast.error(companyService.normalizeError(err));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Parent Organization</DialogTitle>
                    <DialogDescription>
                        Search for an organization to join as a sub-organization. They will need to approve your request.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!selectedParent ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No organizations found matching "{searchQuery}"
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((org) => (
                                            <div
                                                key={org.slug}
                                                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                                                onClick={() => setSelectedParent(org)}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={org.logo_url} />
                                                    <AvatarFallback><Building2 className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="font-medium truncate">{org.name}</span>
                                                    <span className="text-xs text-muted-foreground truncate">{org.location || org.industry || org.entity_type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Type to search organizations
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedParent.logo_url} />
                                    <AvatarFallback><Building2 className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="font-medium truncate">{selectedParent.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedParent(null)}>
                                    Change
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message (Optional)</label>
                                <Textarea
                                    placeholder="Add a note to your request..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedParent || isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                            "Send Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
