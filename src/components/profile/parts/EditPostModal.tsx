"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, ChevronLeft, UserPlus, MapPin, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePost, syncPostTags } from "@/services/api/posts";
import { searchUsers, getSuggestedUsers, UserMention } from "@/services/api/users";
import { searchLocations, LocationSuggestion } from "@/services/api/location";
import { toast } from "sonner";
import debounce from "lodash.debounce";
import { Post } from "@/types/entities";
import { cn } from "@/lib/utils";
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper";

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post;
    onSuccess: (updatedPost: Post) => void;
}

type ModalView = 'edit' | 'tag' | 'location';

export function EditPostModal({ isOpen, onClose, post, onSuccess }: EditPostModalProps) {
    const [activeView, setActiveView] = useState<ModalView>('edit');
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    
    // Tagging State
    const [taggedUsers, setTaggedUsers] = useState<UserMention[]>([]);
    const [userSearchResults, setUserSearchResults] = useState<UserMention[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");

    // Location State
    const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
    const [locationResults, setLocationResults] = useState<LocationSuggestion[]>([]);
    const [locationSearchQuery, setLocationSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen && post) {
            setContent(post.content || "");
            setImage(post.imageSrc || (post.images && post.images.length > 0 ? post.images[0] : null));
            setTaggedUsers((post.tags || []).map(t => ({
                id: t.id || t.user_id,
                full_name: t.full_name || t.name,
                account_name: t.account_name || t.username,
                avatar_url: t.avatar_url || t.avatar,
                headline: t.headline || ''
            })));
            setSelectedLocation(post.location ? { id: 0, name: post.location, latitude: '', longitude: '' } : null);
            setActiveView('edit');
            loadInitialUsers();
        }
    }, [isOpen, post]);

    const loadInitialUsers = async () => {
        try {
            const suggested = await getSuggestedUsers();
            setUserSearchResults(suggested);
        } catch (err) {
            console.error("Failed to load suggested users", err);
        }
    };

    const debouncedUserSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                loadInitialUsers();
                return;
            }
            try {
                const results = await searchUsers(query);
                setUserSearchResults(results);
            } catch (err) {
                console.error("User search failed", err);
            }
        }, 300),
        []
    );

    const debouncedLocationSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setLocationResults([]);
                return;
            }
            try {
                const results = await searchLocations(query);
                setLocationResults(results);
            } catch (err) {
                console.error("Location search failed", err);
            }
        }, 300),
        []
    );

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Content cannot be empty");
            return;
        }

        try {
            setLoading(true);
            const postId = post.id || (post as any).post_id;
            
            // 1. Update Post Content & Location
            const res = await updatePost(postId, {
                content,
                location: selectedLocation?.name || null
            });

            // 2. Sync Tags
            await syncPostTags(postId, taggedUsers.map(u => u.id));

            toast.success("Post updated successfully");
            const updatedPost = mapBackendPostToFrontend(res);
            onSuccess({ 
                ...updatedPost, 
                tags: taggedUsers, 
                location: selectedLocation?.name || undefined 
            });
            onClose();
        } catch (err) {
            toast.error("Failed to update post");
        } finally {
            setLoading(false);
        }
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollContainerRef.current?.scrollLeft || 0;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
        const walk = (x - startX.current) * 2;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    const toggleUserTag = (user: UserMention) => {
        setTaggedUsers(prev => {
            const exists = prev.find(u => u.id === user.id);
            if (exists) {
                return prev.filter(u => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    };

    const renderEditView = () => (
        <div className="flex flex-col h-full relative pt-2">
            <button onClick={onClose} className="absolute -top-2 right-0 p-1 hover:bg-slate-100 rounded-full transition-colors z-50">
                <X className="w-5 h-5 text-red-400" />
            </button>
            <DialogHeader className="sr-only">
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Modify your post content, tags, and location.</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10 border border-slate-100">
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback>{post.author?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-base text-slate-800">{post.author}</span>
            </div>

            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] border-none focus-visible:ring-0 text-[12px] leading-[16px] font-normal text-black resize-none p-3 mb-4 placeholder:text-slate-400 font-[family-name:var(--font-poppins)] bg-[#ffffff] rounded-xl"
            />

            {image && (
                <div className="relative w-full rounded-2xl overflow-hidden mb-2">
                    <img src={image} alt="Post content" className="w-full aspect-[4/3] object-cover" />
                    <button 
                        onClick={() => setImage(null)}
                        className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-colors"
                    >
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                </div>
            )}

            {image && post.images && post.images.length > 1 && (
                <div className="flex justify-center gap-1.5 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-100" />
                </div>
            )}

            <div className="flex items-center justify-between py-2 mb-4">
                <button 
                    onClick={() => setActiveView('tag')}
                    className="flex items-center gap-2 text-slate-700 hover:text-[#6366F1] transition-colors group"
                >
                    <Icon icon="la:user-tag" className="w-6 h-6 text-[#6366F1]" />
                    <span className="text-sm font-semibold">Tag people</span>
                    {taggedUsers.length > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{taggedUsers.length}</span>}
                </button>

                <button 
                    onClick={() => setActiveView('location')}
                    className="flex items-center gap-2 text-slate-700 hover:text-[#6366F1] transition-colors group"
                >
                    <Icon icon="hugeicons:location-05" className="w-6 h-6 text-[#6366F1]" />
                    <span className="text-sm font-semibold">Location</span>
                </button>
            </div>

            <div className="flex gap-[10px] justify-center mt-4">
                <button
                    className="w-[142px] h-[40px] rounded-[24px] border border-[#818CF8] text-[#818CF8] font-semibold text-[14px] px-4 py-2 flex items-center justify-center transition-all"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] text-white font-semibold text-[14px] px-4 py-2 shadow-md shadow-indigo-100 flex items-center justify-center transition-all disabled:opacity-50"
                    onClick={handleSave}
                    disabled={loading || !content.trim()}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );

    const renderTagView = () => (
        <div className="flex flex-col h-full relative">
            <button onClick={onClose} className="absolute -top-2 right-0 p-1 hover:bg-slate-100 rounded-full transition-colors z-50">
                <X className="w-5 h-5 text-red-400" />
            </button>
            <DialogHeader className="sr-only">
                <DialogTitle>Tag People</DialogTitle>
                <DialogDescription>Search and select people to tag in your post.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        value={userSearchQuery}
                        onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            debouncedUserSearch(e.target.value);
                        }}
                        className="w-[368px] h-[40px] bg-white border border-[#6B7280] rounded-[24px] px-4 py-2 text-[16px] font-normal font-[family-name:var(--font-poppins)] focus:outline-none placeholder:text-slate-400"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>

                {taggedUsers.length > 0 && (
                    <div className="w-[368px] overflow-hidden">
                        <div 
                            ref={scrollContainerRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap scroll-smooth cursor-grab active:cursor-grabbing"
                        >
                            {taggedUsers.map(user => (
                                <div 
                                    key={user.id} 
                                    className="flex-shrink-0 bg-[#EEF2FF] px-4 h-[40px] rounded-[8px] flex items-center gap-2 text-sm border border-[#EEF2FF] select-none"
                                >
                                    <span className="text-[#6366F1] font-medium font-[family-name:var(--font-poppins)]">{user.full_name.split(' ')[0]}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleUserTag(user);
                                        }} 
                                        className="w-6 h-6 flex items-center justify-center text-[#6366F1] hover:text-indigo-700 transition-colors ml-1"
                                    >
                                        <Icon icon="ph:x-circle" className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
                <div className="flex flex-col gap-1">
                    {userSearchResults.map(user => {
                        const isSelected = taggedUsers.some(u => u.id === user.id);
                        return (
                            <div 
                                key={user.id} 
                                onClick={() => toggleUserTag(user)}
                                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="w-10 h-10 border border-slate-100 flex-shrink-0">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[15px] font-semibold text-slate-900 font-[family-name:var(--font-poppins)] truncate">{user.full_name}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                    <div className={cn(
                                        "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                        isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                    )}>
                                        {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t flex gap-[10px] justify-center mt-auto pt-4">
                <button
                    className="w-[142px] h-[40px] rounded-[24px] border border-[#818CF8] text-[#818CF8] font-semibold text-[14px] flex items-center justify-center transition-all"
                    onClick={() => setActiveView('edit')}
                >
                    Cancel
                </button>
                <button
                    className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] text-white font-semibold text-[14px] flex items-center justify-center transition-all"
                    onClick={() => setActiveView('edit')}
                >
                    Add people
                </button>
            </div>
        </div>
    );

    const renderLocationView = () => {
        // Filter out duplicate locations by name to avoid the repetition seen in the screenshot
        const uniqueResults = locationResults.filter((loc, index, self) =>
            index === self.findIndex((t) => t.name === loc.name)
        );

        return (
            <div className="flex flex-col h-full relative">
                <button onClick={onClose} className="absolute -top-2 right-0 p-1 hover:bg-slate-100 rounded-full transition-colors z-50">
                    <X className="w-5 h-5 text-red-400" />
                </button>
                <DialogHeader className="sr-only">
                    <DialogTitle>Add Location</DialogTitle>
                    <DialogDescription>Search and select a location for your post.</DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveView('edit')} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronLeft className="w-6 h-6 text-slate-600" />
                            </button>
                            <div className="flex items-center gap-2 ml-2">
                                <Icon icon="hugeicons:location-05" className="w-6 h-6 text-[#6366F1]" />
                                <span className="text-[16px] font-bold text-slate-800">Location</span>
                            </div>
                        </div>
                    </div>
 
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            value={locationSearchQuery}
                            onChange={(e) => {
                                setLocationSearchQuery(e.target.value);
                                debouncedLocationSearch(e.target.value);
                            }}
                            className="w-[368px] h-[40px] bg-white border border-[#6B7280] rounded-[24px] px-4 py-2 text-[16px] font-normal font-[family-name:var(--font-poppins)] focus:outline-none placeholder:text-slate-400"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mt-2 scrollbar-hide px-2">
                    <div className="flex flex-col gap-1">
                        {uniqueResults.map(loc => {
                            const isSelected = selectedLocation?.name === loc.name;
                            return (
                                <div 
                                    key={loc.id} 
                                    onClick={() => setSelectedLocation(loc)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Icon icon="hugeicons:location-05" className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
                                        <span className="text-[15px] font-semibold text-slate-900 font-[family-name:var(--font-poppins)] truncate">{loc.name}</span>
                                    </div>
                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                        <div className={cn(
                                            "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                        )}>
                                            {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t flex gap-[10px] justify-center mt-auto pt-4">
                    <button
                        className="w-[142px] h-[40px] rounded-[24px] border border-[#818CF8] text-[#818CF8] font-semibold text-[14px] flex items-center justify-center transition-all"
                        onClick={() => setActiveView('edit')}
                    >
                        Cancel
                    </button>
                    <button
                        className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] text-white font-semibold text-[14px] flex items-center justify-center transition-all"
                        onClick={() => setActiveView('edit')}
                    >
                        Save
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-4 sm:max-w-[400px] h-[624px] overflow-hidden rounded-[24px] border-none shadow-2xl [&>button]:hidden bg-white">
                {activeView === 'edit' && renderEditView()}
                {activeView === 'tag' && renderTagView()}
                {activeView === 'location' && renderLocationView()}
            </DialogContent>
        </Dialog>
    );
}
