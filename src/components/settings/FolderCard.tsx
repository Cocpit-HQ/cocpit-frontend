import React from 'react'
import { Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { SavedFolder } from '@/types/entities'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FolderCardProps {
    folder: SavedFolder | 'all'
    onClick: () => void
    onRename?: (folder: SavedFolder) => void
    onDelete?: (folder: SavedFolder) => void
}

export function FolderCard({ folder, onClick, onRename, onDelete }: FolderCardProps) {
    const isAllPosts = folder === 'all'

    return (
        <div
            onClick={onClick}
            className="group relative aspect-square bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
            {/* Folder Preview / Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 group-hover:bg-muted/40 transition-colors">
                {isAllPosts ? (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-inner">
                        <span className="text-3xl text-white/80">📑</span>
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Folder className="w-8 h-8 text-primary" />
                    </div>
                )}
            </div>

            {/* Folder Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 className="text-white font-semibold truncate">
                    {isAllPosts ? "All Saved Posts" : folder.name}
                </h3>
                <p className="text-white/70 text-xs">
                    {isAllPosts ? "Default Collection" : `${folder.post_count} posts`}
                </p>
            </div>

            {/* Actions Menu (Custom Folders Only) */}
            {!isAllPosts && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onRename?.(folder)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete?.(folder)} className="text-red-500 focus:text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}
