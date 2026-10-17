import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatSkeleton() {
    return (
        <div className="flex flex-col space-y-4 p-4 h-full overflow-hidden justify-end">
            {/* Received message */}
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1 w-full max-w-[70%]">
                    <Skeleton className="h-10 w-[200px] rounded-2xl rounded-tl-sm" />
                </div>
            </div>

            {/* Sent message */}
            <div className="flex flex-col items-end gap-1 w-full">
                <Skeleton className="h-12 w-[250px] rounded-2xl rounded-tr-sm" />
            </div>

            {/* Received message (longer) */}
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1 w-full max-w-[70%]">
                    <Skeleton className="h-16 w-[280px] rounded-2xl rounded-tl-sm" />
                </div>
            </div>

            {/* Sent message (short) */}
            <div className="flex flex-col items-end gap-1 w-full">
                <Skeleton className="h-10 w-[150px] rounded-2xl rounded-tr-sm" />
            </div>

            {/* Received message */}
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1 w-full max-w-[70%]">
                    <Skeleton className="h-10 w-[220px] rounded-2xl rounded-tl-sm" />
                </div>
            </div>
        </div>
    );
}
