"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, ChevronLeft, UserPlus, MapPin, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import useEmblaCarousel from "embla-carousel-react";
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
import { CocpitSelectedUserChips } from "@/shared/commonComponents/CocpitSelectedUserChips";

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
    const [localImages, setLocalImages] = useState<string[]>([]);

    // Carousel State
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
    const [currentIndex, setCurrentIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCurrentIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    // Re-initialize carousel when slides change
    useEffect(() => {
        if (emblaApi) emblaApi.reInit();
    }, [localImages.length, emblaApi]);

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
            setLocalImages(post.images || (post.imageSrc ? [post.imageSrc] : []));
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
        if (!content.trim() && localImages.length === 0) {
            toast.error("Post must have content or images");
            return;
        }

        try {
            setLoading(true);
            const postId = post.id || (post as any).post_id;

            // 1. Update Post Content & Location & Media
            const res = await updatePost(postId, {
                content,
                location: selectedLocation?.name || null,
                media_urls: localImages
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

    const handleRemoveTaggedUser = (userId: string) => {
        const user = taggedUsers.find(taggedUser => String(taggedUser.id) === userId);
        if (user) {
            toggleUserTag(user);
        }
    };

    const renderEditView = () => (
        <div className="flex flex-col flex-1 relative pt-2 min-h-0">

            <DialogHeader className="sr-only">
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Modify your post content, tags, and location.</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback>{post.author?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-base text-foreground">{post.author}</span>
            </div>

            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] border-none focus-visible:ring-0 text-[12px] leading-[16px] font-normal text-foreground resize-none p-3 mb-4 placeholder:text-muted-foreground font-[family-name:var(--font-poppins)] bg-card rounded-xl"
            />

            {localImages.length > 0 && (
                <div className="relative w-full rounded-2xl overflow-hidden mb-4 group">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {localImages.map((img, idx) => (
                                <div key={idx} className="relative flex-[0_0_100%] min-w-0">
                                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                                        <img src={img} alt={`Post content ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setLocalImages(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute bottom-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-secondary transition-colors z-10"
                                        >
                                            <Trash2 className="w-5 h-5 text-[#FF6B6B]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    {localImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 transition-opacity duration-300">
                            {localImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        emblaApi?.scrollTo(index);
                                    }}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        currentIndex === index
                                            ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                            : "bg-white/40 hover:bg-white/60"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between py-2 mb-4">
                <button
                    onClick={() => setActiveView('tag')}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group"
                >
                    <Icon icon="la:user-tag" className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">Tag people</span>
                    {taggedUsers.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{taggedUsers.length}</span>}
                </button>

                <button
                    onClick={() => setActiveView('location')}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group"
                >
                    <Icon icon="hugeicons:location-05" className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">Location</span>
                </button>
            </div>

            <div className="flex gap-[10px] justify-center mt-4">
                <button
                    className="w-[142px] h-[40px] rounded-[24px] text-[#818CF8] font-semibold text-[14px] px-4 py-2 flex items-center justify-center transition-all hover:bg-slate-50"
                    onClick={onClose}
                >
                    Cancel
                </button>
                {(() => {
                    const originalImages = post.images || (post.imageSrc ? [post.imageSrc] : []);
                    const imagesChanged = JSON.stringify(localImages) !== JSON.stringify(originalImages);
                    const contentChanged = content !== (post.content || "");
                    const locationChanged = (selectedLocation?.name || null) !== (post.location || null);
                    const tagsChanged = taggedUsers.length !== (post.tags?.length || 0) ||
                        taggedUsers.some((u, i) => u.id !== (post.tags?.[i]?.id || post.tags?.[i]?.user_id));

                    const hasChanges = contentChanged || imagesChanged || locationChanged || tagsChanged;
                    const isValid = content.trim() !== "" || localImages.length > 0 || taggedUsers.length > 0 || !!selectedLocation;

                    return (
                        <button
                            className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] text-white font-semibold text-[14px] px-4 py-2 shadow-md shadow-indigo-100 flex items-center justify-center transition-all disabled:opacity-50"
                            onClick={handleSave}
                            disabled={loading || !hasChanges || !isValid}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    );
                })()}
            </div>
        </div>
    );

    const renderTagView = () => (
        <div className="flex flex-col flex-1 relative min-h-0">

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
                        className="w-[368px] h-[40px] bg-card border border-border rounded-[24px] px-4 py-2 text-[16px] font-normal font-[family-name:var(--font-poppins)] focus:outline-none placeholder:text-muted-foreground"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>

                {taggedUsers.length > 0 && (
                    <div className="w-[368px] overflow-hidden">
                        <CocpitSelectedUserChips
                            users={taggedUsers}
                            onRemove={handleRemoveTaggedUser}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-2 mt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)] truncate">{user.full_name}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                    <div className={cn(
                                        "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                        isSelected ? "bg-primary border-primary" : "bg-card border-border"
                                    )}>
                                        {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t flex gap-[10px] justify-center pt-4">
                <button
                    className="w-[142px] h-[40px] rounded-[24px] text-[#818CF8] font-semibold text-[14px] flex items-center justify-center transition-all hover:bg-slate-50"
                    onClick={() => setActiveView('edit')}
                >
                    Cancel
                </button>
                <button
                    className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] text-white font-semibold text-[14px] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setActiveView('edit')}
                    disabled={taggedUsers.length === 0}
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
            <div className="flex flex-col flex-1 relative min-h-0">

                <DialogHeader className="sr-only">
                    <DialogTitle>Add Location</DialogTitle>
                    <DialogDescription>Search and select a location for your post.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveView('edit')} className="p-1 hover:bg-secondary rounded-full transition-colors">
                                <ChevronLeft className="w-6 h-6 text-foreground" />
                            </button>
                            <div className="flex items-center gap-2 ml-2">
                                <Icon icon="hugeicons:location-05" className="w-6 h-6 text-primary" />
                                <span className="text-[16px] font-bold text-foreground">Location</span>
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
                            className="w-[368px] h-[40px] bg-card border border-border rounded-[24px] px-4 py-2 text-[16px] font-normal font-[family-name:var(--font-poppins)] focus:outline-none placeholder:text-muted-foreground"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 mt-2 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                        <Icon icon="hugeicons:location-05" className="w-5 h-5 text-primary flex-shrink-0" />
                                        <span className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)] truncate">{loc.name}</span>
                                    </div>
                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                        <div className={cn(
                                            "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary border-primary" : "bg-card border-border"
                                        )}>
                                            {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t flex gap-[10px] justify-center pt-4">
                    <button
                        className="w-[142px] h-[40px] rounded-[24px] text-[#818CF8] font-semibold text-[14px] flex items-center justify-center transition-all hover:bg-slate-50"
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
            <DialogContent className="p-4 sm:max-w-[400px] h-[624px] overflow-hidden rounded-[24px] shadow-none bg-card flex flex-col gap-0">
                {activeView === 'edit' && renderEditView()}
                {activeView === 'tag' && renderTagView()}
                {activeView === 'location' && renderLocationView()}
            </DialogContent>
        </Dialog>
    );
}
