import { Briefcase, CheckCircle, Users } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ElementType
    colorClass: string
}

function StatCard({ title, value, icon: Icon, colorClass }: StatCardProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 flex items-center justify-between shadow-sm">
            <div>
                <h3 className="text-muted-foreground text-xs md:text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
            </div>
            <div className={`p-2 md:p-3 rounded-full ${colorClass}`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
        </div>
    )
}

import { useEffect, useState } from "react"
import * as api from "@/services/api/jobs"
import { useActiveProfile } from "@/context/ActiveProfileContext"

export function DashboardStats() {
    const { activeProfile } = useActiveProfile()
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplicants: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let data;
                if (activeProfile?.type === 'COMPANY' && activeProfile.id) {
                    data = await api.getCompanyDashboardStats(activeProfile.id)
                } else {
                    data = await api.getDashboardStats()
                }
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [activeProfile?.id, activeProfile?.type])

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-24 rounded-xl bg-muted ${i === 1 ? 'col-span-2 md:col-span-1' : ''}`} />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="col-span-2 md:col-span-1">
                <StatCard
                    title="Total Jobs Posted"
                    value={stats.totalJobs}
                    icon={Briefcase}
                    colorClass="bg-blue-500"
                />
            </div>
            <StatCard
                title="Active Jobs"
                value={stats.activeJobs}
                icon={Briefcase}
                colorClass="bg-green-500"
            />
            <StatCard
                title="Total Applicants"
                value={stats.totalApplicants}
                icon={Users}
                colorClass="bg-pink-500"
            />
        </div>
    )
}
