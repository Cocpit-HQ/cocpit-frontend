import { useQuery } from "@tanstack/react-query";
import { getUserById, getPublicProfilePosts } from "../services/publicProfile.service";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { User } from "@/types/user";
import { PublicUserProfileResponse } from "@/types/api";
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper";

const transformUserData = (data: PublicUserProfileResponse): User => {
    // API returns flat Experience[] records
    const experiences = (data.experiences as any[]) || [];

    const flatExperiences = experiences.map((exp: any) => {
        const startDate = exp.start_date ? new Date(exp.start_date) : null;
        const endDate = exp.end_date ? new Date(exp.end_date) : null;

        const startMonth = startDate && !isNaN(startDate.getTime()) ? startDate.toLocaleString('default', { month: 'short' }) : '';
        const startYear = startDate && !isNaN(startDate.getTime()) ? startDate.getFullYear() : '';
        const endMonth = endDate && !isNaN(endDate.getTime()) ? endDate.toLocaleString('default', { month: 'short' }) : '';
        const endYear = endDate && !isNaN(endDate.getTime()) ? endDate.getFullYear() : 'Present';

        let duration = `${startMonth} ${startYear} - `;
        if (endYear === 'Present') {
            duration += 'Present';
        } else {
            duration += `${endMonth} ${endYear}`;
        }

        return {
            experience_id: exp.experience_id,
            profile_id: exp.profile_id || '',
            title: exp.title,
            company_name: exp.company_name,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            employment_type: exp.work_type || '',
            work_type: exp.work_type || null,
            work_mode: exp.work_mode || null,
            location: exp.location,
            description: exp.description,
            id: exp.experience_id,
            company: exp.company_name,
            duration,
            logo_url: exp.logo_url || null,
            company_logo: exp.company_logo || exp.logo_url || null,
            org_id: exp.org_id || null,
            skills: exp.skills || [],
        };
    });

    const educations = data.educations.map(apiEdu => {
        const startDate = new Date(apiEdu.start_date);
        const endDate = apiEdu.end_date ? new Date(apiEdu.end_date) : null;
        const startYear = startDate.getFullYear();
        const endYear = endDate ? endDate.getFullYear() : 'Present';

        return {
            education_id: apiEdu.education_id,
            profile_id: '',
            school_name: apiEdu.school_name,
            degree: apiEdu.degree,
            field_of_study: apiEdu.field_of_study,
            start_date: apiEdu.start_date,
            end_date: apiEdu.end_date,
            description: apiEdu.description,
            id: apiEdu.education_id,
            school: apiEdu.school_name,
            fieldOfStudy: apiEdu.field_of_study,
            duration: `${startYear} - ${endYear}`,
            school_logo: apiEdu.school_logo || null,
            school_org_id: apiEdu.school_org_id || null,
        }
    });

    const { user } = data;

    return {
        id: user.id,
        account_name: user.account_name,
        name: user.name,
        headline: user.headline || '',
        avatar: user.avatar || (user as any).avatar_url || null,
        cover_image: user.cover_image || null,
        location: user.location || '',
        website: (user as any).website || '',
        about: user.about || '',
        email: user.email || null,
        mobile_number: user.mobile_number || null,
        show_email: (user as any).show_email ?? (user as any).showEmail,
        show_phone: (user as any).show_phone ?? (user as any).showPhone,
        created_at: user.created_at,
        is_identity_verified: Boolean(user.is_identity_verified || (user as any).is_verified || (user as any).isVerified),
        skills: Array.isArray(data.skills)
            ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name)
            : [],
        experiences: flatExperiences as any,
        educations: educations as any,
        projects: (data as any).projects || [],
        connectionStatus: (user.connection_request_status === 'connected' ? 'connected' : (user.connection_request_status === 'pending' ? 'pending' : 'none')),
        mutualConnections: 0,
        followers_count: user.followers_count || 0,
        following_count: user.following_count || 0,
        connections_count: user.connections_count || 0,
        identity: {
            openTo: (Array.isArray(user.open_to) ? user.open_to[0] : user.open_to) || undefined,
            availability: (user.availability as any) || undefined,
            workPreference: (user.work_preference as any) || undefined,
        },
        is_following: user.is_following,
        is_followed_by: user.is_followed_by,
        connection_request_status: user.connection_request_status,
        connection_request_id: user.connection_request_id,
        connection_request_sender: user.connection_request_sender,
        company_roles: (data as any).organization_roles || data.company_roles || [],
        resume: data.resume || null,
        is_blocked_by_me: user.is_blocked_by_me || false,
        profile_score: data.profile_score,
    };
};

export function useProfile(userId: string, sourcePostId?: string) {
    const { syncFollowStatus } = useSocial();
    const { isCompany } = useActiveProfile();

    return useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            const userData = await getUserById(userId, sourcePostId);
            // When in company mode, SocialContext is already seeded from the org's following list.
            // Syncing from the API response here would cause a race condition, so we skip it.
            if (!isCompany && userData.user.is_following !== undefined) {
                syncFollowStatus(userData.user.id, userData.user.is_following);
            }
            return transformUserData(userData);
        },
        enabled: !!userId,
        retry: false,
        staleTime: 1000 * 30, // 30 seconds
    });
}

export function useProfilePosts(userId: string, filterOrOptions?: string | { filter?: string; limit?: number; category?: string }) {
    const options =
        typeof filterOrOptions === "string"
            ? { filter: filterOrOptions, limit: 50 }
            : { limit: 50, ...filterOrOptions };

    return useQuery({
        queryKey: ["profile-posts", userId, options.filter, options.category, options.limit],
        queryFn: async () => {
            const data = await getPublicProfilePosts(userId, options.category || 'All', options);
            return data.posts.map(mapPublicPostToPost);
        },
        enabled: !!userId,
        retry: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useProfilePostsPreview(userId: string) {
    return useQuery({
        queryKey: ["profile-posts-preview", userId],
        queryFn: async () => {
            const data = await getPublicProfilePosts(userId, 'All', { limit: 10 });
            return data.posts.map(mapPublicPostToPost);
        },
        enabled: !!userId,
        retry: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
