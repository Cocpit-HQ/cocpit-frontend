import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { searchUsersForMessaging } from "@/services/api/messaging";
import { Check, Loader2, Search, X, Users, Trash2, User, Plus } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGroupChat } from "./groupChat.context";
import { useRouter } from "next/navigation";
import { FeatureDisabledTooltip } from "@/components/feature-flags";
import { useActiveProfile } from "@/context/ActiveProfileContext";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalView = 'newMessage' | 'createGroup';

export default function CreateGroupModal({
    isOpen,
    onClose,
}: CreateGroupModalProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { createGroup } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const isOrgContext = activeProfile?.type === "COMPANY";

    // Navigation & View State
    const [currentView, setCurrentView] = useState<ModalView>('newMessage');
    const [isGroupMode, setIsGroupMode] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCursor, setSearchCursor] = useState<string | null>(null);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Group Creation State
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedUsersData, setSelectedUsersData] = useState<any[]>([]);
    const [groupName, setGroupName] = useState("");
    const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
    const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update selectedUsersData when selections change
    useEffect(() => {
        const currentResultsSelected = searchResults.filter((u) =>
            selectedUserIds.includes(u.user_id || u.id),
        );
        setSelectedUsersData((prev) => {
            const filtered = prev.filter((u) =>
                selectedUserIds.includes(u.user_id || u.id),
            );
            const newOnes = currentResultsSelected.filter(
                (u) =>
                    !filtered.some((f) => (f.user_id || f.id) === (u.user_id || u.id)),
            );
            return [...filtered, ...newOnes];
        });
    }, [selectedUserIds, searchResults]);

    const runSearch = useCallback(
        async (query: string, cursor?: string, append = false) => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const result = await searchUsersForMessaging(
                    query || undefined,
                    cursor,
                    20,
                );
                setSearchResults((prev) => {
                    const combined = append ? [...prev, ...result.data] : result.data;
                    const unique = Array.from(
                        new Map(combined.map((u) => [u.user_id || u.id, u])).values(),
                    );
                    return unique;
                });
                setSearchCursor(result.nextCursor);
                setHasMoreUsers(result.hasMore);
            } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || "Failed to search users";
                setSearchError(msg);
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setIsSearching(false);
            }
        },
        [toast],
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!isOpen) return;
        debounceRef.current = setTimeout(() => {
            setSearchResults([]);
            setSearchCursor(null);
            setHasMoreUsers(false);
            runSearch(searchTerm);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm, isOpen, runSearch]);

    const handleLoadMore = useCallback(() => {
        if (!hasMoreUsers || isSearching) return;
        runSearch(searchTerm, searchCursor ?? undefined, true);
    }, [hasMoreUsers, isSearching, searchTerm, searchCursor, runSearch]);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const el = e.currentTarget;
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (nearBottom) handleLoadMore();
        },
        [handleLoadMore],
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const handleUserClick = (user: any) => {
        const userId = user.user_id || user.id;
        if (isGroupMode) {
            toggleUserSelection(userId);
        } else {
            // VIEW 1 Behavior: Open chat directly
            router.push(`/messaging?userId=${userId}`);
            onClose();
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGroupAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim()) return;
        setIsCreating(true);
        try {
            await createGroup({
                name: groupName,
                description: "",
                members: selectedUserIds,
                avatar: groupAvatar
            });
            // Reset state and close
            handleClose();
        } catch (error: any) {
            console.error("Failed to create group", error);
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "Failed to create group", 
                variant: "destructive" 
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setCurrentView('newMessage');
        setIsGroupMode(false);
        setSearchTerm("");
        setSelectedUserIds([]);
        setSelectedUsersData([]);
        setGroupName("");
        setGroupAvatar(null);
        setGroupAvatarPreview(null);
        onClose();
    };

    const renderUserList = () => (
        <div
            ref={listRef}
            onScroll={handleScroll}
            className="w-[368px] h-[350px] flex flex-col items-start p-0 gap-[8px] flex-none self-stretch mt-[16px] overflow-y-auto scrollbar-hide"
        >
            {isSearching && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                    <p className="text-xs text-[#6B7280] font-['Poppins']">Searching users...</p>
                </div>
            ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                    <p className="text-sm text-[#6B7280] font-['Poppins']">
                        {searchTerm.length === 0 ? "Type to search for users" : "No users found"}
                    </p>
                </div>
            ) : (
                searchResults.map((user: any) => {
                    const userId = user.user_id || user.id;
                    const isSelected = selectedUserIds.includes(userId);
                    return (
                        <div
                            key={userId}
                            onClick={() => handleUserClick(user)}
                            className="w-[368px] h-[48px] flex flex-row justify-between items-center p-0 gap-[16px] flex-none order-0 self-stretch grow-0 mb-[8px] cursor-pointer hover:bg-[#F9FAFB] rounded-lg transition-colors group"
                        >
                            <div className="flex flex-row items-center gap-[16px]">
                                <div className="relative w-[32px] h-[32px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden flex-none font-['Poppins'] select-none">
                                    <span>{(user.full_name || user.account_name || "U").charAt(0).toUpperCase()}</span>
                                    {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.full_name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : null}
                                </div>
                                <span className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-black">
                                    {user.full_name || user.account_name || "cocpit user"}
                                </span>
                            </div>

                            {isGroupMode && (
                                <div className="relative w-[24px] h-[24px] flex-none mr-[8px]">
                                    <div
                                        className={cn(
                                            "w-full h-full rounded-[4px] border flex items-center justify-center transition-all",
                                            isSelected ? "bg-[#6366F1] border-[#6366F1]" : "border-[#6B7280] bg-white"
                                        )}
                                    >
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
            {isSearching && searchResults.length > 0 && (
                <div className="flex justify-center py-2 w-full">
                    <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                </div>
            )}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="
                    shadow-none border-none outline-none
                    p-0 !gap-0 [&>button]:hidden
                    fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full h-[85dvh] rounded-t-[24px] rounded-b-none
                    data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300
                    sm:left-[50%] sm:top-[50%] sm:right-auto sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[400px] sm:h-[620px] sm:rounded-[24px] sm:max-w-[400px]
                    data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:sm:slide-in-from-bottom-0
                    overflow-hidden bg-white
                "
            >
                <div className="w-full h-full flex flex-col items-center pt-[10px] px-[16px] pb-[16px] rounded-t-[24px] rounded-b-none sm:rounded-[24px] overflow-hidden bg-white">
                    
                    {/* CLOSE ICON ROW */}
                    <div className="flex flex-col items-end flex-none self-stretch">
                        <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors">
                            <X className="w-5 h-5 text-[#F87171]" />
                        </button>
                    </div>

                    <div className="w-full max-w-[368px] py-[8px] flex flex-col items-center rounded-[24px] bg-white">
                        
                        {/* HEADER TITLE */}
                        <DialogTitle className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black mt-[8px]">
                            {currentView === 'newMessage' ? 'New message' : 'Create group'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {currentView === 'newMessage' ? 'Start a new conversation or create a group chat.' : 'Enter group details and select members.'}
                        </DialogDescription>

                        {currentView === 'newMessage' ? (
                            <>
                                {/* SEARCH BOX */}
                                <div className="w-[368px] h-[40px] px-[16px] py-[8px] flex flex-row justify-between items-center gap-[10px] border border-[#6B7280] rounded-[24px] mt-[16px] box-border">
                                    <input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-[14px] font-['Poppins'] placeholder:text-[#6B7280] text-black"
                                    />
                                    <Search className="w-4 h-4 text-[#6B7280]" />
                                </div>

                                {/* GROUP CHAT TOGGLE (Hidden for Org context) */}
                                {!isOrgContext && (
                                    <FeatureDisabledTooltip featureKey="enableGroupChats">
                                        <button
                                            onClick={() => setIsGroupMode(!isGroupMode)}
                                            className={cn(
                                                "w-[368px] h-[40px] px-[16px] py-[8px] flex flex-row justify-between items-center rounded-[24px] border transition-all mt-[8px]",
                                                isGroupMode ? "bg-[#EEF2FF] border-[#6366F1] text-[#6366F1]" : "bg-white border-[#818CF8] text-[#818CF8]"
                                            )}
                                        >
                                            <span className="font-['Poppins'] font-normal text-[14px]">Group chat</span>
                                            <Users className="w-5 h-5" />
                                        </button>
                                    </FeatureDisabledTooltip>
                                )}

                                {/* USER LIST */}
                                {renderUserList()}

                                {/* CREATE GROUP BUTTON (Only in Group Mode) */}
                                {isGroupMode && (
                                    <button
                                        disabled={selectedUserIds.length === 0}
                                        onClick={() => setCurrentView('createGroup')}
                                        className={cn(
                                            "w-[368px] h-[40px] border border-white rounded-[24px] flex items-center justify-center font-['Poppins'] font-normal text-[14px] text-white mt-[16px] transition-all",
                                            selectedUserIds.length > 0 ? "bg-[#6366F1] cursor-pointer" : "bg-[#C7D2FE] cursor-not-allowed"
                                        )}
                                    >
                                        Create group
                                    </button>
                                )}
                            </>
                        ) : (
                            /* VIEW 3: CREATE GROUP FORM */
                            <div className="w-full mt-[16px] flex flex-col items-center">
                                {/* AVATAR UPLOAD */}
                                <div className="relative flex flex-col items-center gap-[8px]">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-[80px] h-[80px] rounded-full bg-[#E5E7EB] flex items-center justify-center cursor-pointer overflow-hidden border border-gray-200"
                                    >
                                        {groupAvatarPreview ? (
                                            <img src={groupAvatarPreview} alt="Group Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleAvatarChange}
                                    />
                                    <span className="font-['Poppins'] font-normal text-[12px] text-[#6B7280]">Add photo</span>
                                </div>

                                {/* GROUP NAME INPUT */}
                                <div className="w-full mt-[24px] space-y-[8px]">
                                    <label className="font-['Poppins'] font-medium text-[14px] text-black">Group name</label>
                                    <input
                                        placeholder="Group name"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full h-[40px] px-[16px] py-[8px] border border-[#E5E7EB] rounded-[8px] font-['Poppins'] text-[14px] outline-none"
                                    />
                                </div>

                                {/* MEMBERS LIST SECTION */}
                                <div className="w-full mt-[24px] flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <span className="font-['Poppins'] font-medium text-[14px] text-black">Members list</span>
                                        <button 
                                            onClick={() => setCurrentView('newMessage')}
                                            className="flex items-center gap-1 font-['Poppins'] font-normal text-[14px] text-[#6366F1]"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add members
                                        </button>
                                    </div>

                                    <div className="w-full max-h-[200px] overflow-y-auto mt-[16px] space-y-[8px]">
                                        {selectedUsersData.map((user) => (
                                            <div key={user.user_id || user.id} className="flex justify-between items-center h-[48px] w-full">
                                                <div className="flex items-center gap-[16px]">
                                                    <div className="relative w-[32px] h-[32px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden flex-none font-['Poppins'] select-none">
                                                        <span>{(user.full_name || "U").charAt(0).toUpperCase()}</span>
                                                        {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                                                            <img
                                                                src={user.avatar_url}
                                                                alt={user.full_name}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <span className="font-['Poppins'] font-normal text-[14px] text-black">
                                                        {user.full_name || user.account_name || "User"}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => toggleUserSelection(user.user_id || user.id)}
                                                    className="flex items-center gap-[4px] text-[#EF4444]"
                                                >
                                                    <span className="font-['Poppins'] font-normal text-[12px]">Remove</span>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="w-[300px] h-[40px] flex flex-row items-start p-0 gap-[16px] mt-[24px] mx-auto">
                                    <button
                                        onClick={handleClose}
                                        className="w-[142px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] flex justify-center items-center text-[#818CF8] font-['Poppins'] font-normal text-[14px] transition-colors hover:bg-[#F3F4FF]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!groupName.trim() || isCreating}
                                        className={cn(
                                            "w-[142px] h-[40px] border border-white rounded-[24px] flex justify-center items-center text-white font-['Poppins'] font-normal text-[14px] transition-all",
                                            groupName.trim() && !isCreating ? "bg-[#6366F1] cursor-pointer" : "bg-[#C7D2FE] cursor-not-allowed"
                                        )}
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
