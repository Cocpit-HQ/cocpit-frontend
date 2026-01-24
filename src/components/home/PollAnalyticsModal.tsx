"use client"

import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { getPollAnalytics } from '@/services/api/posts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface PollAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

interface Voter {
    user_id: string;
    full_name: string;
    avatar_url: string;
    headline: string;
}

interface OptionAnalytics {
    option_id: string;
    option_text: string;
    vote_count: string;
}

interface AnalyticsData {
    poll_id: string;
    total_votes: string;
    options: OptionAnalytics[];
    voters: Voter[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PollAnalyticsModal({ isOpen, onClose, postId }: PollAnalyticsModalProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && postId) {
            setLoading(true);
            getPollAnalytics(postId)
                .then((res) => {
                    setData(res);
                })
                .catch(err => {
                    console.error("Failed to fetch analytics", err);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, postId]);


    const chartData = data?.options.map(opt => ({
        name: opt.option_text,
        value: parseInt(opt.vote_count)
    })).filter(d => d.value > 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Poll Analytics</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !data ? (
                    <div className="py-10 text-center text-muted-foreground">Unable to load analytics.</div>
                ) : (
                    <Tabs defaultValue="chart" className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-1">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="chart">Overview</TabsTrigger>
                                <TabsTrigger value="voters">Voters</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="chart" className="flex-1 min-h-0">
                            <div className="h-[300px] w-full">
                                {chartData && chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No votes yet
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-xl font-bold">{data.total_votes}</p>
                                <p className="text-sm text-muted-foreground">Total Votes</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="voters" className="flex-1 min-h-0 overflow-hidden">
                            <ScrollArea className="h-[400px]">
                                {data.voters.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground py-10">
                                        No voters yet
                                    </div>
                                ) : (
                                    <div className="space-y-4 pr-4">
                                        {data.voters.map(voter => (
                                            <div key={voter.user_id} className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={voter.avatar_url || '/assets/pngegg.png'} />
                                                    <AvatarFallback>{voter.full_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{voter.full_name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{voter.headline}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}
