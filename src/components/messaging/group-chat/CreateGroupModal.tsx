import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGroupChat } from "./groupChat.context";
import { Search, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../../../services/api/user";
import { SearchedUser } from "@/types/user";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const { createGroup } = useGroupChat();
    const [isLoading, setIsLoading] = useState(false);

    // Search users
    const { data: users = [], isLoading: isSearching } = useQuery<SearchedUser[]>({
        queryKey: ['searchUsers', searchQuery],
        queryFn: () => searchUsers(searchQuery),
        enabled: searchQuery.length > 1
    });

    const toggleMember = (userId: string) => {
        const newSelected = new Set(selectedMembers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedMembers(newSelected);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await createGroup({
                name,
                description,
                members: Array.from(selectedMembers)
            });
            onClose();
            setName("");
            setDescription("");
            setSearchQuery("");
            setSelectedMembers(new Set());
        } catch (error) {
            console.error("Failed to create group", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            placeholder="Enter group name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="group-desc">Description (Optional)</Label>
                        <Input
                            id="group-desc"
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Add Members</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users to add..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {selectedMembers.size > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Array.from(selectedMembers).map(userId => (
                                    <div key={userId} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <span>Selected</span>
                                        <button onClick={() => toggleMember(userId)} className="hover:text-destructive">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="h-[200px] overflow-y-auto border rounded-md p-2 mt-2 space-y-1">
                            {searchQuery.length < 2 && selectedMembers.size === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-8">Search for users to add</p>
                            )}

                            {users.map((user: SearchedUser) => {
                                const isSelected = selectedMembers.has(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                                        onClick={() => toggleMember(user.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.avatar_url || ""} />
                                                <AvatarFallback>{(user.full_name || "?").substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.headline || "No headline"}</p>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-auto pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
                        {isLoading ? "Creating..." : `Create Group (${selectedMembers.size})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
