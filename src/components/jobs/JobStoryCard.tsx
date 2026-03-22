import React, { useMemo } from 'react';
import { Briefcase, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface JobStoryCardProps {
    metadata: {
        job_id: string;
        title: string;
        company_name: string;
        location: string;
        salary_min?: number;
        salary_max?: number;
        salary?: string;
        applicants?: number;
        avatar?: string;
        logo?: string;
        company_logo?: string;
        job_type?: string;
        posted_time?: string;
        actively_hiring?: boolean;
        is_saved?: boolean;
    };
    onAction?: () => void;
}

export const JobStoryCard: React.FC<JobStoryCardProps> = ({ metadata, onAction }) => {
    const router = useRouter();

    const handleViewJob = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/jobs/${metadata.job_id}`);
    };

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
        if (min) return `From $${(min / 1000).toFixed(0)}k`;
        if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
        return null;
    };

    const storyJob = useMemo(() => ({
        title: metadata.title,
        company: metadata.company_name,
        location: metadata.location,
        type: metadata.job_type,
        postedTime: metadata.posted_time,
        salary: metadata.salary || formatSalary(metadata.salary_min, metadata.salary_max),
        applicants: metadata.applicants,
        activelyHiring: metadata.actively_hiring,
        isSaved: metadata.is_saved,
        companyLogo: metadata.company_logo || metadata.logo || metadata.avatar || "",
    }), [metadata]);

    return (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 via-slate-900/68 to-slate-950/80 backdrop-blur-xl shadow-xl p-4 pointer-events-auto flex flex-col">
            <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-full bg-gradient-to-r from-blue-500/80 via-sky-400/70 to-indigo-500/80 p-[2px] shadow-[0_0_24px_rgba(59,130,246,0.22)]">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-white/10 shadow-inner relative bg-slate-950/90 p-1">
                        {storyJob.companyLogo && !storyJob.companyLogo.startsWith('gradient-') ? (
                            <img
                                src={storyJob.companyLogo}
                                alt={storyJob.company}
                                className="w-full h-full rounded-full object-cover scale-[1.04]"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = "flex";
                                }}
                            />
                        ) : null}

                        <div
                            className={`w-full h-full rounded-full items-center justify-center text-white font-bold text-xl ${
                                storyJob.companyLogo?.startsWith('gradient-')
                                    ? `bg-gradient-to-br ${storyJob.companyLogo.replace('gradient-', 'from-blue-500 to-indigo-600')}`
                                    : 'bg-blue-600/20 text-blue-400'
                            }`}
                            style={{ display: (storyJob.companyLogo && !storyJob.companyLogo.startsWith('gradient-')) ? "none" : "flex" }}
                        >
                            {storyJob.company ? storyJob.company.charAt(0).toUpperCase() : <Briefcase className="w-8 h-8" />}
                        </div>
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-[1.28rem] font-bold text-white leading-tight tracking-[-0.01em] truncate max-w-full">
                            {storyJob.title}
                        </h3>
                        {storyJob.activelyHiring ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/12 text-green-300 border border-green-500/20">
                                Hiring
                            </span>
                        ) : null}
                    </div>

                    <div className="text-[0.95rem] text-white/78 mb-2 flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{storyJob.company}</span>
                        {storyJob.location ? <span className="text-white/35">•</span> : null}
                        <span className="text-white/55 truncate">{storyJob.location}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[0.82rem] text-white/48">
                        {storyJob.type ? (
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>{storyJob.type}</span>
                            </div>
                        ) : null}
                        {storyJob.salary ? (
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>{storyJob.salary}</span>
                            </div>
                        ) : null}
                        {storyJob.postedTime ? (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{storyJob.postedTime}</span>
                            </div>
                        ) : null}
                    </div>

                    {typeof storyJob.applicants === "number" ? (
                        <div className="mt-3 text-[0.82rem] text-white/38 min-h-[18px]">
                            {storyJob.applicants} applicants applied
                        </div>
                    ) : (
                        <div className="mt-3 text-[0.82rem] min-h-[18px] opacity-0">
                            0 applicants applied
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-5">
                <Button
                    onClick={handleViewJob}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl py-7 text-[1.02rem] group transition-all"
                >
                    View Job
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
            </div>
        </div>
    );
};
