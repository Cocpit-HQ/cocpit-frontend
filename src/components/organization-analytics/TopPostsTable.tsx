'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Image, FileText, Video, BookOpen } from 'lucide-react'
import { TopPost } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

interface TopPostsTableProps {
    data: TopPost[]
}

const typeIcons: Record<string, React.ElementType> = {
    image: Image,
    text: FileText,
    video: Video,
    article: BookOpen,
}

const typeColors: Record<string, string> = {
    image: 'text-blue-400 bg-blue-500/10',
    text: 'text-gray-400 bg-gray-500/10',
    video: 'text-rose-400 bg-rose-500/10',
    article: 'text-amber-400 bg-amber-500/10',
}

export function TopPostsTable({ data }: TopPostsTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                    <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">Top Performing Posts</h3>
                    <p className="text-xs text-muted-foreground">Ranked by engagement</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Post</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Type</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Impressions</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Engagements</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((post, index) => {
                            const TypeIcon = typeIcons[post.type] || FileText
                            const colorClass = typeColors[post.type] || typeColors.text
                            return (
                                <tr
                                    key={post.title}
                                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-3.5 text-sm text-muted-foreground font-medium">{index + 1}</td>
                                    <td className="py-3.5 text-sm font-medium text-foreground max-w-[280px] truncate">{post.title}</td>
                                    <td className="py-3.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${colorClass}`}>
                                            <TypeIcon className="w-3.5 h-3.5" />
                                        </span>
                                    </td>
                                    <td className="py-3.5 text-sm text-muted-foreground text-right">{post.impressions.toLocaleString()}</td>
                                    <td className="py-3.5 text-sm font-semibold text-foreground text-right">{post.engagements.toLocaleString()}</td>
                                    <td className="py-3.5 text-right">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400">
                                            {post.engagementRate}%
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
