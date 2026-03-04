"use client";

import React, { useState, useEffect } from "react";
import { Search, Send, Copy, Check, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/shared/Avatar";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useDebounce } from "@/hooks/use-debounce";
import { useActiveProfile } from "@/context/ActiveProfileContext";

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string;
    profileType: "user" | "company";
    profileName: string;
    profileUrl: string;
}

interface Recipient {
    id: string;
    name: string;
    avatar: string | null;
    type: "user" | "company";
}

export function ShareProfileModal({
    isOpen,
    onClose,
    profileId,
    profileType,
    profileName,
    profileUrl,
}: ShareProfileModalProps) {
    const { activeProfile, isCompany } = useActiveProfile();
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState("");
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if (debouncedSearch.trim()) {
            searchRecipients();
        } else {
            setRecipients([]);
        }
    }, [debouncedSearch]);

    const searchRecipients = async () => {
        setIsSearching(true);
        try {
            // Reusing existing search endpoints if available, or a generic one
            // For now, let's assume /api/users/search or similar
            const res = await api.get(`/users/search?q=${debouncedSearch}`);
            // Map the response to Recipient type
            const mapped = res.data.map((r: any) => ({
                id: r.id,
                name: r.full_name,
                avatar: r.avatar_url,
                type: (r.type || "user").toLowerCase() as "user" | "company"
            }));
            setRecipients(mapped);
        } catch (err) {
            console.error("Search recipients error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleShare = async () => {
        if (!selectedRecipient) return;
        setIsSending(true);
        try {
            await api.post("/profile/share", {
                profileId,
                profileType,
                receiverId: selectedRecipient.id,
                receiverType: selectedRecipient.type,
                message,
                ...(isCompany && activeProfile ? { senderCompanyId: activeProfile.id } : {}),
            });
            toast.success(`Profile shared with ${selectedRecipient.name}`);
            onClose();
            // Reset state
            setSelectedRecipient(null);
            setMessage("");
            setSearch("");
        } catch (err) {
            toast.error("Failed to share profile");
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.origin + profileUrl);
        toast.success("Profile link copied");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share {profileName}'s Profile</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search people or companies..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Recipient List */}
                    <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1 border rounded-lg p-1 bg-muted/30">
                        {isSearching ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">Searching...</div>
                        ) : recipients.length > 0 ? (
                            recipients.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedRecipient(r)}
                                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left ${selectedRecipient?.id === r.id ? 'bg-accent border border-primary/20' : ''}`}
                                >
                                    <Avatar url={r.avatar || undefined} name={r.name} size="sm" />
                                    <span className="text-sm font-medium flex-1 truncate">{r.name}</span>
                                    {selectedRecipient?.id === r.id && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))
                        ) : search.trim() ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No results found</div>
                        ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground">Type to search recipients</div>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Add a message (optional)</label>
                        <Textarea
                            placeholder="Write a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none h-20"
                        />
                    </div>

                    {/* Copy Link Section */}
                    <Button variant="outline" className="w-full gap-2 text-xs" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4" />
                        Copy Profile URL
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={!selectedRecipient || isSending}
                        onClick={handleShare}
                        className="gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {isSending ? "Sending..." : "Send Profile"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
