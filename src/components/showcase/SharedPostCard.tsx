
import React from 'react';
import { useRouter } from 'next/navigation';

interface SharedPostCardProps {
    sharedPost: {
        is_accessible: boolean;
        reason?: 'private' | 'personal_connection' | 'unknown';
        post_id?: string;
        content?: string;
        author?: {
            user_id: string;
            full_name: string;
            avatar_url: string;
            account_name?: string;
        };
        media?: { url: string; media_type: string }[];
        shared_entity_type?: string;
        job_id?: string;
        title?: string;
        company_name?: string;
        location?: string;
        work_mode?: string;
        company_logo?: string;
    };
    onClick?: () => void;
}

export const SharedPostCard: React.FC<SharedPostCardProps> = ({ sharedPost, onClick }) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick();
            return;
        }

        if (sharedPost.is_accessible || sharedPost.reason === 'personal_connection') {
            if (sharedPost.shared_entity_type === 'job' && sharedPost.job_id) {
                router.push(`/jobs/${sharedPost.job_id}`);
            } else if (sharedPost.post_id) {
                router.push(`/post/${sharedPost.post_id}`);
            } else if (sharedPost.author?.user_id) {
                router.push(`/profile/${(sharedPost.author as any).account_name || sharedPost.author.user_id}`);
            }
        }
    };

    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const remainingTime = Math.max(0, duration - currentTime);

    return (
        <div
            className="w-full max-w-sm bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl pointer-events-auto"
            onClick={handleClick}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            {!sharedPost.is_accessible ? (
                /* Unavailable State */
                <div className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                        {sharedPost.reason === 'private' ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-white">Content Unavailable</p>
                        <p className="text-xs text-white/70 mt-1">
                            {sharedPost.reason === 'private' ? "This account is private." : "Connect with this user to follow."}
                        </p>
                    </div>
                    {sharedPost.author && (
                        <div className="pt-2 border-t border-white/10 mt-2">
                            <p className="text-xs text-white/50">Post by <span className="text-white hover:underline">{sharedPost.author.full_name}</span></p>
                        </div>
                    )}
                </div>
            ) : sharedPost.shared_entity_type === 'job' ? (
                /* Job State */
                <div className="p-4 flex gap-4 items-center">
                    <div className="w-14 h-14 shrink-0 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-white/10 shadow-sm">
                        {sharedPost.company_logo ? (
                            <img src={sharedPost.company_logo} alt={sharedPost.company_name} className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-2xl font-bold text-black/50">{sharedPost.company_name?.charAt(0) || "J"}</span>
                        )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-white truncate">{sharedPost.title}</h4>
                        <p className="text-sm text-white/90 truncate font-medium">{sharedPost.company_name}</p>
                        <p className="text-xs text-white/60 truncate mt-0.5">
                            {sharedPost.location}
                            {sharedPost.work_mode ? ` (${sharedPost.work_mode})` : ''}
                        </p>
                    </div>
                </div>
            ) : (
                /* Accessible Post State */
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        {sharedPost.author?.avatar_url && (
                            <img src={sharedPost.author.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{sharedPost.author?.full_name}</p>
                        </div>
                    </div>
                    {sharedPost.content && (
                        <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">
                            {sharedPost.content}
                        </p>
                    )}
                    {sharedPost.media && sharedPost.media.length > 0 && (
                        <div className="rounded-lg overflow-hidden mt-2 aspect-video bg-black/50 relative">
                            {sharedPost.media[0].media_type === 'video' ? (
                                <>
                                    <video
                                        src={sharedPost.media[0].url}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        controls={false}
                                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-white/90 text-[10px] font-medium tracking-wide border border-white/10">
                                        {formatTime(remainingTime)}
                                    </div>
                                </>
                            ) : (
                                <img src={sharedPost.media[0].url} className="w-full h-full object-cover" />
                            )}
                        </div>
                    )}
                    <div className="pt-2 mt-1">
                        <p className="text-xs text-blue-300 font-medium">View Post &rarr;</p>
                    </div>
                </div>
            )}
        </div>
    );
};
