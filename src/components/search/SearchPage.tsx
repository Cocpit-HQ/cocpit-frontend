"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchUsers } from '@/services/api/user';
import { searchHashtags, HashtagSuggestion } from '@/services/api/hashtags';
import { SearchedUser } from '@/types/user';
import { ArrowLeft, Search, Hash, User as UserIcon, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || "";

    const [localQuery, setLocalQuery] = useState(query);
    const [users, setUsers] = useState<SearchedUser[]>([]);
    const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    // Sync local query with URL
    useEffect(() => {
        setLocalQuery(query);
    }, [query]);

    // Live Search: Trigger search 300ms after user stops typing
    const debouncedLocalQuery = useDebounce(localQuery, 300);

    useEffect(() => {
        if (debouncedLocalQuery.trim() && debouncedLocalQuery !== query) {
            router.push(`/search?q=${encodeURIComponent(debouncedLocalQuery.trim())}`, { scroll: false });
        }
    }, [debouncedLocalQuery, query, router]);

    useEffect(() => {
        if (!query) return;

        const fetchAll = async () => {
            setLoading(true);
            
            // Clean query for user search (strip # as names don't have them)
            const cleanUserQuery = query.startsWith('#') ? query.slice(1) : query;

            try {
                // Fetch independently so one failure doesn't block the other
                // Only search users if the query isn't empty after stripping #
                const [userResults, hashtagResults] = await Promise.allSettled([
                    cleanUserQuery.trim().length > 0 
                        ? searchUsers(cleanUserQuery) 
                        : Promise.resolve([] as SearchedUser[]),
                    searchHashtags(query)
                ]);

                if (userResults.status === 'fulfilled') {
                    // Deduplicate by id before setting state
                    const uniqueResults = Array.from(
                        new Map((userResults.value as SearchedUser[]).map(user => [user.id, user])).values()
                    );
                    setUsers(uniqueResults);
                } else {
                    console.error("User search failed:", userResults.reason);
                    setUsers([]);
                }
                
                if (hashtagResults.status === 'fulfilled') {
                    setHashtags(hashtagResults.value.tags);
                } else {
                    console.error("Hashtag search failed:", hashtagResults.reason);
                }
            } catch (err) {
                console.error("Critical search error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [query]);

    const handleSearch = () => {
        if (localQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-0 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Results Feed */}
                    <div className="lg:col-span-8 min-h-screen border-x border-border/50 bg-background">
                        {/* Sticky Header with Search Bar */}
                        <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => router.push('/feed')}
                                className="rounded-full flex-shrink-0 hover:bg-muted"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            
                            <div className="flex-1 relative group">
                                <button 
                                    onClick={handleSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 group"
                                >
                                    <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary hover:text-primary transition-colors cursor-pointer" />
                                </button>
                                <input 
                                    type="text"
                                    value={localQuery}
                                    onChange={(e) => setLocalQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search professionals, hashtags..."
                                    className="w-full bg-muted/40 border border-border/50 focus:border-primary/50 focus:bg-background rounded-full pl-10 pr-4 py-2 text-sm outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Search Info Sub-header */}
                        <div className="px-6 py-4 border-b border-border/30 bg-muted/5 flex items-baseline justify-between transition-all duration-300">
                            <div>
                                <h1 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Search className="w-3 h-3 text-primary animate-pulse" />
                                    Results for &quot;{query}&quot;
                                </h1>
                            </div>
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-full">
                                Discovery Engine
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-8 pb-32">
                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/20">
                                            <div className="w-12 h-12 rounded-full bg-muted/40" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-muted/40 rounded w-1/4" />
                                                <div className="h-3 bg-muted/40 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Hashtags Section */}
                                    {hashtags.length > 0 && (
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <Hash className="w-4 h-4 text-primary" />
                                                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Hashtags</h2>
                                            </div>
                                            <div className="grid gap-2">
                                                {hashtags.map((h) => (
                                                    <Link 
                                                        key={h.tag}
                                                        href={`/hashtag/${h.tag.toLowerCase()}`}
                                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Hash className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground">#{h.tag}</p>
                                                            <p className="text-xs text-muted-foreground">{h.usage_count.toLocaleString()} posts</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* People & Orgs Section */}
                                    {users.length > 0 && (
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <UserIcon className="w-4 h-4 text-primary" />
                                                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">People & Organizations</h2>
                                            </div>
                                            <div className="grid gap-2">
                                                {users.map((user) => (
                                                    <Link 
                                                        key={user.id}
                                                        href={user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`}
                                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group"
                                                    >
                                                        <img 
                                                            src={user.avatar_url || (user.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} 
                                                            alt={user.full_name} 
                                                            className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform shadow-sm"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-foreground truncate">{user.full_name}</p>
                                                                {user.type === 'COMPANY' && (
                                                                    <Building2 className="w-3 h-3 text-primary" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {user.headline || (user.type === 'COMPANY' ? user.industry : 'Professional')}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {hashtags.length === 0 && users.length === 0 && (
                                        <div className="py-32 text-center space-y-4">
                                            <div className="w-20 h-20 mx-auto rounded-3xl bg-muted/30 flex items-center justify-center">
                                                <Search className="w-10 h-10 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold">No results found</h3>
                                                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                                                    We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different term.
                                                </p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => router.push('/feed')}
                                                className="rounded-full px-8"
                                            >
                                                Back to Feed
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sideboards (optional) */}
                    <aside className="hidden lg:block lg:col-span-4 space-y-6 pt-6 sticky top-0 self-start">
                        <div className="p-6 bg-muted/20 rounded-3xl border border-border/50">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <Search className="w-4 h-4 text-primary" />
                                Search Tips
                            </h3>
                            <ul className="text-xs space-y-3 text-muted-foreground list-disc pl-4 leading-relaxed">
                                <li>Use <span className="text-primary font-mono text-[10px] font-bold">#tag</span> to find specific conversations and trends.</li>
                                <li>Search for <span className="text-primary font-bold">full names</span> to find professionals you know.</li>
                                <li>Search for <span className="text-primary font-bold">company names</span> to see industry updates.</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
