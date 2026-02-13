import api from "@/lib/axios";
import { Job, JobFilters, JobFormData } from "@/types/jobs";

// --- Adapter Layer ---

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
}

function formatSalary(min?: number | string, max?: number | string): string {
    if (!min && !max) return "";
    const format = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);

    const minNum = Number(min);
    const maxNum = Number(max);

    if (!isNaN(minNum) && !isNaN(maxNum)) {
        if (minNum === maxNum) return format(minNum);
        return `${format(minNum)} - ${format(maxNum)}`;
    }
    if (!isNaN(minNum)) return `${format(minNum)}+`;
    if (!isNaN(maxNum)) return `Up to ${format(maxNum)}`;
    return "";
}

function transformJob(backendJob: any): Job {
    return {
        id: backendJob.job_id, // UUID string
        recruiterId: backendJob.recruiter_id,
        title: backendJob.title,
        company: backendJob.company_name || backendJob.recruiter_name || "Unknown Company",
        location: backendJob.location,
        type: backendJob.job_type,
        postedTime: backendJob.created_at ? formatTimeAgo(backendJob.created_at) : "Recently",
        applicants: backendJob.applicants || backendJob.applicants_count || 0,
        salary: formatSalary(backendJob.salary_min, backendJob.salary_max),
        logo: `gradient-${(parseInt(backendJob.job_id.slice(0, 8), 16) % 6) + 1}`,
        companyLogo: backendJob.company_logo,
        companySlug: backendJob.company_slug,
        companyId: backendJob.company_id,
        isOffer: backendJob.is_offer,
        isSaved: backendJob.isSaved,
        createdAt: backendJob.created_at,
        savedAt: backendJob.saved_at,
        appliedAt: backendJob.applied_at || backendJob.appliedAt, // Handle inconsistent naming if any

        // Detailed fields
        description: backendJob.description,
        skills: [],
        experience: backendJob.experience_level,
        workMode: backendJob.work_mode,
        companyType: backendJob.company_type,
        industry: backendJob.industry,
        easyApply: backendJob.easy_apply,
        activelyHiring: backendJob.actively_hiring,
        aboutCompany: backendJob.about_company,
        hasApplied: backendJob.hasApplied,
        applicationStatus: backendJob.applicationStatus,

        // Mapping Status from applications
        status: backendJob.applicationStatus
            ? backendJob.applicationStatus.toLowerCase().replace(" ", "-")
            : backendJob.current_status?.toLowerCase().replace(" ", "-"),

        // Mocking missing fields gracefully or using provided
        matchScore: backendJob.match_score,
        recruiterInsight: backendJob.recruiter_insight,
        applicationTimeline: (() => {
            const status = backendJob.applicationStatus || backendJob.current_status;
            if (!status) return [];

            const currentLower = status.toLowerCase();
            const steps = ['Application Sent', 'Application Viewed'];

            // Only add Shortlisted if the user reached that stage or beyond, OR if not rejected
            // If rejected, we assume direct rejection unless we have history (which we assume we don't for now)
            // So if 'Rejected', we skip Shortlisted.
            if (currentLower !== 'rejected') {
                steps.push('Shortlisted');
            }

            // Add dynamic steps
            if (backendJob.screeningRequired) {
                // Step 4: Task Status
                if (backendJob.screeningSubmittedAt) {
                    steps.push('Task Submitted');
                } else if (currentLower !== 'rejected') {
                    // Only show pending task if not rejected
                    steps.push('Task Assignment');
                }

                // Step 5: Final Status
                const appStatus = backendJob.applicationStatus || backendJob.current_status;
                if (appStatus === 'Approved') {
                    steps.push('Approved');
                } else if (appStatus === 'Rejected') {
                    steps.push('Rejected');
                }
            } else {
                const appStatus = backendJob.applicationStatus || backendJob.current_status;
                if (appStatus === 'Approved') steps.push('Approved');
                if (appStatus === 'Rejected') steps.push('Rejected');
            }

            // Map status to step index
            let completedIndex = -1;

            if (currentLower === 'applied') completedIndex = 0; // Sent
            else if (currentLower === 'under review' || currentLower === 'viewed') completedIndex = 1; // Viewed

            else if (currentLower.includes('shortlisted')) completedIndex = 2; // Shortlisted

            else if (currentLower.includes('pending task') || currentLower.includes('submission')) {
                if (backendJob.screeningSubmittedAt) completedIndex = 3;
                else completedIndex = 2;
            }
            else if (currentLower === 'approved') {
                // Sent, Viewed, Shortlisted, (Task?), Approved
                // If screening required: Sent (0), Viewed(1), Shortlisted(2), Task(3), Approved(4)
                // If no screening: Sent(0), Viewed(1), Shortlisted(2), Approved(3)
                completedIndex = backendJob.screeningRequired ? 4 : 3;
            }
            else if (currentLower === 'rejected') {
                // Sent(0), Viewed(1), Rejected(2)  <-- Shortlisted skipped
                completedIndex = 2;
            }

            return steps.map((s, idx) => ({
                status: s,
                completed: idx <= completedIndex,
                date: idx === 0 ? formatTimeAgo(backendJob.appliedAt || new Date().toISOString()) : undefined
            }));
        })(),

        applicationId: backendJob.applicationId,
        applicationScreening: backendJob.screeningRequired ? {
            required: true,
            type: backendJob.screeningType,
            question: backendJob.screeningQuestion,
            submittedAt: backendJob.screeningSubmittedAt
        } : undefined
    };
}

// --- API Methods ---

export type JobSearchParams = Partial<JobFilters> & {
    search?: string;
    limit?: number;
    cursor?: string;
};

export const getAllJobs = async (filters?: JobSearchParams): Promise<Job[]> => {
    const params = new URLSearchParams();

    if (filters) {
        if (filters.search) params.append("title", filters.search);
        if (filters.locations?.length) params.append("location", filters.locations[0]);
        if (filters.jobType?.length) params.append("jobType", filters.jobType[0]);
        if (filters.workMode?.length) params.append("workMode", filters.workMode[0]);
        if (filters.companyType?.length) params.append("companyType", filters.companyType[0]);
        if (filters.industry?.length) params.append("industry", filters.industry[0]);
        if (filters.experience && filters.experience !== "All Levels") params.append("experienceLevel", filters.experience);
        if (filters.easyApply) params.append("easyApply", "true");
        if (filters.activelyHiring) params.append("activelyHiring", "true");

        if (filters.datePosted && filters.datePosted !== "Any Time") {
            params.append("datePosted", filters.datePosted);
        }

        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.cursor) params.append("cursor", filters.cursor);
    }

    const response = await api.get(`/jobs?${params.toString()}`);

    const transformedJobs = response.data.map(transformJob);
    return transformedJobs;
};

export const getJobOffers = async (filters?: JobSearchParams): Promise<Job[]> => {
    const params = new URLSearchParams();

    if (filters) {
        if (filters.search) params.append("title", filters.search);
        if (filters.locations?.length) params.append("location", filters.locations[0]);
        if (filters.jobType?.length) params.append("jobType", filters.jobType[0]);
        if (filters.workMode?.length) params.append("workMode", filters.workMode[0]);
        if (filters.companyType?.length) params.append("companyType", filters.companyType[0]);
        if (filters.industry?.length) params.append("industry", filters.industry[0]);
        if (filters.experience && filters.experience !== "All Levels") params.append("experienceLevel", filters.experience);
        if (filters.easyApply) params.append("easyApply", "true");
        if (filters.activelyHiring) params.append("activelyHiring", "true");

        if (filters.datePosted && filters.datePosted !== "Any Time") {
            params.append("datePosted", filters.datePosted);
        }

        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.cursor) params.append("cursor", filters.cursor);
    }

    const response = await api.get(`/jobs/offers?${params.toString()}`);
    return response.data.map(transformJob);
};

export const getJobById = async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return transformJob(response.data);
};

export const getMySavedJobs = async (filters?: JobSearchParams): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (filters) {
        // Reuse similar logic or build a helper if strict strict typing needed, 
        // but for now just pass pagination & basic filters if supported
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.cursor) params.append("cursor", filters.cursor);

        // Pass other filters if backend supports them (it does now)
        if (filters.search) params.append("search", filters.search); // Note: backend might expect 'title' or 'location' separately
        // For brevity, let's assume specific My Jobs filters might be wired up later or reuse logic.
        // But critically we need pagination.
    }
    const response = await api.get(`/jobs/saved/me?${params.toString()}`);
    return response.data.map(transformJob);
};

export const getMyApplications = async (status: string, filters?: JobSearchParams): Promise<Job[]> => {
    const params = new URLSearchParams();
    params.append("status", status);

    if (filters) {
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.cursor) params.append("cursor", filters.cursor);
    }

    const response = await api.get(`/jobs/applications/me?${params.toString()}`);
    return response.data.map(transformJob);
};

export const createJob = async (data: JobFormData): Promise<void> => {
    const payload = {
        title: data.jobTitle,
        company_name: data.companyName,
        location: data.location,
        description: data.jobDescription,
        experience_level: data.experience,
        job_type: data.jobType,
        work_mode: data.workMode,
        company_type: data.companyType,
        industry: data.industry,
        about_company: data.aboutCompany,
        actively_hiring: data.activelyHiring,
        easy_apply: data.easyApply,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        company_id: data.companyId,

        skills: data.skills.split(",").map(s => s.trim()).filter(Boolean)
    };

    await api.post("/jobs", payload);
};

export const applyToJob = async (jobId: string, formData: FormData): Promise<void> => {
    await api.post(`/jobs/${jobId}/apply`, formData);
};

export const saveJob = async (jobId: string): Promise<void> => {
    await api.post(`/jobs/${jobId}/save`);
};

export const unsaveJob = async (jobId: string): Promise<void> => {
    await api.delete(`/jobs/${jobId}/save`);
};

export const getDashboardStats = async () => {
    const response = await api.get('/jobs/stats');
    return response.data;
};

export const getJobApplicants = async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/applicants`);
    return response.data;
};

export const getMyCreatedJobs = async (filters?: JobSearchParams): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.cursor) params.append("cursor", filters.cursor);
        if (filters.search) params.append("title", filters.search);
        // Add other filters if recruiter dashboard supports them
    }
    const response = await api.get(`/jobs/my?${params.toString()}`);
    return response.data.map(transformJob);
};


export const updateJob = async (jobId: string, data: JobFormData): Promise<void> => {
    const payload = {
        title: data.jobTitle,
        company_name: data.companyName,
        location: data.location,
        description: data.jobDescription,
        experience_level: data.experience,
        job_type: data.jobType,
        work_mode: data.workMode,
        company_type: data.companyType,
        industry: data.industry,
        about_company: data.aboutCompany,
        actively_hiring: data.activelyHiring,
        easy_apply: data.easyApply,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,

        skills: data.skills.split(",").map(s => s.trim()).filter(Boolean)
    };
    await api.put(`/jobs/${jobId}`, payload);
};

export const deleteJob = async (jobId: string): Promise<void> => {
    await api.delete(`/jobs/${jobId}`);
};

export const getRecruiterStats = async (recruiterId: string) => {
    const response = await api.get(`/jobs/recruiter/${recruiterId}/stats`);
    return response.data;
};

export const updateApplicationStatus = async (applicationId: string, status: string, screening?: { required: boolean, type: "voice" | "video", question: string } | null) => {
    const payload = { status, screening };
    const response = await api.put(`/jobs/applications/${applicationId}/status`, payload);
    return response.data;
};

export const submitTask = async (applicationId: string, formData: FormData) => {
    const response = await api.post(`/jobs/applications/${applicationId}/submit-task`, formData);
    return response.data;
};

