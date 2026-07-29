"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft, Grid, LayoutGrid, Plus, Bookmark, Folder } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getSavedPosts, getSavedFolders, deleteSavedFolder, renameSavedFolder } from '@/services/api/savedPost'
import PostCard from '@/components/shared/PostCard'
import { SavedFolder } from '@/types/entities'
import { FolderCard } from './FolderCard'
import { CreateFolderModal } from './CreateFolderModal'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { getPostMenuAccess } from '@/features/feed/utils/postMenuAccess'

export function SavedPosts() {
    const { data: session } = useSession()
    const { userCompanies } = useActiveProfile()
    const getMenuAccess = (post: any) => getPostMenuAccess({
        isCompanyPost: !!post.author_org_id,
        companyId: post.author_org_id,
        createdByUserId: post.author_id,
        currentUserId: session?.user?.id,
        userCompanies,
    })
    const [activeTab, setActiveTab] = useState<'saved' | 'collections'>('saved') // 'saved' = Unsorted, 'collections' = Folders
    const [folders, setFolders] = useState<SavedFolder[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingPosts, setLoadingPosts] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState<SavedFolder | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Pagination State
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const folderIdParam = searchParams.get('folderId')
    const tabParam = searchParams.get('tab')

    // Reset state on context switch (Tab or Folder Change)
    useEffect(() => {
        setPosts([])
        setPage(1)
        setHasMore(false)
        setLoading(true)

        if (folderIdParam) {
            // Specific folder logic
            if (folderIdParam !== 'unsorted' && folderIdParam !== 'all') {
                setActiveTab('collections')
                loadFolderPosts(folderIdParam, 1)
                // Fetch folders if not loaded to get name
                if (folders.length === 0) loadFolders()
            } else {
                // Explicit 'unsorted' -> Saved Tab
                setActiveTab('saved')
                setSelectedFolder(null)
                loadUnsortedPosts(1)
            }
        } else {
            // No folderId. Check tab param.
            if (tabParam === 'collections') {
                setActiveTab('collections')
                setSelectedFolder(null)
                loadFolders()
            } else {
                setActiveTab('saved')
                setSelectedFolder(null)
                loadUnsortedPosts(1)
            }
        }
    }, [folderIdParam, tabParam])
    // Load Folders (for Collections Tab)
    const loadFolders = async () => {
        try {
            const res = await getSavedFolders()
            if (res.success) {
                setFolders(res.folders)
                // If we have a selectedFolder ID but no object, find it
                if (folderIdParam && folderIdParam !== 'unsorted') {
                    const f = res.folders.find((f: SavedFolder) => f.folder_id === folderIdParam)
                    if (f) setSelectedFolder(f)
                }
            }
        } catch (error) {
            console.error("Failed to load folders", error)
        }
    }

    // Load Unsorted Posts (for Saved Tab)
    const loadUnsortedPosts = async (pageNum: number) => {
        setLoadingPosts(true)
        try {
            const res = await getSavedPosts('unsorted', pageNum)
            if (res.success) {
                if (pageNum === 1) {
                    setPosts(res.posts)
                } else {
                    setPosts(prev => [...prev, ...res.posts])
                }
                setHasMore(!!res.hasMore)
                setPage(pageNum)
            }
        } catch (error) {
            console.error("Failed to load unsorted posts", error)
        } finally {
            setLoading(false)
            setLoadingPosts(false)
        }
    }

    // Load Specific Folder Posts
    const loadFolderPosts = async (folderId: string, pageNum: number) => {
        setLoadingPosts(true)
        try {
            const res = await getSavedPosts(folderId, pageNum)
            if (res.success) {
                if (pageNum === 1) {
                    setPosts(res.posts)
                } else {
                    setPosts(prev => [...prev, ...res.posts])
                }
                setHasMore(!!res.hasMore)
                setPage(pageNum)
            }
        } catch (error) {
            console.error("Failed to load folder posts", error)
        } finally {
            setLoading(false)
            setLoadingPosts(false)
        }
    }

    const handleLoadMore = () => {
        const nextPage = page + 1
        if (activeTab === 'saved') {
            loadUnsortedPosts(nextPage)
        } else if (selectedFolder) {
            loadFolderPosts(selectedFolder.folder_id, nextPage)
        } else if (folderIdParam && folderIdParam !== 'unsorted') {
            loadFolderPosts(folderIdParam, nextPage)
        }
    }

    const handleTabChange = (tab: 'saved' | 'collections') => {
        if (tab === 'saved') {
            // Remove query params to go to default Saved view
            router.replace('/settings', { scroll: false })
            // State will update via useEffect
        } else {
            router.replace('/settings?tab=collections', { scroll: false })
            // State will update via useEffect
        }
    }

    const handleFolderClick = (folder: SavedFolder) => {
        router.push(`?folderId=${folder.folder_id}`, { scroll: false })
        setSelectedFolder(folder)
    }

    const handleBackToCollections = () => {
        router.push('?tab=collections', { scroll: false })
        // State updates handled by useEffect
    }

    const handleDeleteFolder = async (folder: SavedFolder) => {
        if (!confirm(`Delete collection "${folder.name}"? Posts will move to Unsorted.`)) return

        try {
            const res = await deleteSavedFolder(folder.folder_id)
            if (res.success) {
                setFolders(prev => prev.filter(f => f.folder_id !== folder.folder_id))
                toast.success("Collection deleted")
            }
        } catch (error) {
            toast.error("Failed to delete collection")
        }
    }

    const handleRenameFolder = async (folder: SavedFolder) => {
        const newName = prompt("Enter new name:", folder.name)
        if (!newName || newName === folder.name) return

        try {
            const res = await renameSavedFolder(folder.folder_id, newName)
            if (res.success) {
                setFolders(prev => prev.map(f => f.folder_id === folder.folder_id ? res.folder : f))
                toast.success("Renamed")
            }
        } catch (error) {
            toast.error("Failed to rename")
        }
    }

    // Render Logic
    // If selectedFolder is set -> Show Folder Detail View (Back button, Title, Grid)
    // Else -> Show Tabs (Saved | Collections)

    if (selectedFolder || (folderIdParam && folderIdParam !== 'unsorted' && folderIdParam !== 'all' && activeTab === 'collections')) {
        // Folder Detail View
        return (
            <div className="w-full">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={handleBackToCollections}
                        className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {selectedFolder?.name || 'Collection'}
                        </h1>
                        <p className="text-xs text-muted-foreground">{posts.length} posts</p>
                    </div>
                </div>

                {posts.length === 0 && !loadingPosts ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-60">
                        <Grid className="w-12 h-12 mb-4" />
                        <p>No posts yet</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map(post => (
                                <PostCard
                                    key={post.post_id || post.id}
                                    post={post}
                                    menuAccess={getMenuAccess(post)}
                                    onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingPosts}
                                    className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {loadingPosts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                                </button>
                            </div>
                        )}
                        {loadingPosts && posts.length === 0 && (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        )}
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-6">Saved</h1>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-white/10">
                <button
                    onClick={() => handleTabChange('saved')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative",
                        activeTab === 'saved' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bookmark className="w-4 h-4" />
                    General
                    {activeTab === 'saved' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('collections')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative",
                        activeTab === 'collections' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Folder className="w-4 h-4" />
                    Collections
                    {activeTab === 'collections' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {/* Content Active Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'saved' ? (
                    <motion.div
                        key="saved-grid"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {posts.length === 0 && !loadingPosts ? (
                            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground opacity-50">
                                <Bookmark className="w-16 h-16 mb-4 stroke-1" />
                                <p>No saved posts</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {posts.map(post => (
                                        <PostCard
                                            key={post.post_id || post.id}
                                            post={post}
                                            menuAccess={getMenuAccess(post)}
                                            onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))} // Local remove on unsave
                                        />
                                    ))}
                                </div>

                                {hasMore && (
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingPosts}
                                            className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {loadingPosts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                                        </button>
                                    </div>
                                )}

                                {loadingPosts && posts.length === 0 && (
                                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                                )}
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="collections-grid"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                            >
                                <Plus className="w-4 h-4" /> New Collection
                            </button>
                        </div>

                        {folders.length === 0 && !loading ? (
                            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl">
                                <p className="text-muted-foreground mb-4">Create your first collection</p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                                >
                                    Create
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map(folder => (
                                    <FolderCard
                                        key={folder.folder_id}
                                        folder={folder}
                                        onClick={() => handleFolderClick(folder)}
                                        onRename={() => handleRenameFolder(folder)}
                                        onDelete={() => handleDeleteFolder(folder)}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onFolderCreated={(folder) => {
                    setFolders([folder, ...folders])
                    toast.success("Collection created")
                }}
            />
        </div>
    )
}
