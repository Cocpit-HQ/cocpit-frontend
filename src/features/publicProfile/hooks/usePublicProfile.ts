import { useQuery } from "@tanstack/react-query";
import { getUserById, getPublicProfilePosts } from "../services/publicProfile.service";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { User } from "@/types/user";
import { PublicUserProfileResponse } from "@/types/api";
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper";

const transformUserData = (data: PublicUserProfileResponse): User => {
    // API returns ExperienceGroup[] (grouped by company with nested experiences[]).
    // We store the groups directly for ProfileExperience, and also keep a flat list for other components.
    const experienceGroups = (data.experiences as any[]) || [];

    // Flatten all nested experiences across groups
    const flatExperiences = experienceGroups.flatMap((group: any) => {
        const groupLogo = group.logo_url || null;
        return (group.experiences || []).map((exp: any) => {
            const startDate = new Date(exp.start_date);
            const endDate = exp.end_date ? new Date(exp.end_date) : null;

            const startMonth = startDate.toLocaleString('default', { month: 'short' });
            const startYear = startDate.getFullYear();
            const endMonth = endDate ? endDate.toLocaleString('default', { month: 'short' }) : '';
            const endYear = endDate ? endDate.getFullYear() : 'Present';

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
                logo_url: exp.logo_url || groupLogo || null,
                company_logo: exp.company_logo || null,
                org_id: exp.org_id || null,
            };
        });
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
            openTo: (Array.isArray(user.open_to) ? user.open_to[0] : user.open_to) as any || 'Full-time',
            availability: user.availability as any || 'Casual Networking',
            workPreference: user.work_preference as any || 'Onsite',
        },
        is_following: user.is_following,
        is_followed_by: user.is_followed_by,
        connection_request_status: user.connection_request_status,
        connection_request_id: user.connection_request_id,
        connection_request_sender: user.connection_request_sender,
        company_roles: (data as any).organization_roles || data.company_roles || [],
        resume: data.resume || null,
    };
};

export function useProfile(userId: string) {
    const { syncFollowStatus } = useSocial();
    const { isCompany } = useActiveProfile();

    return useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            const userData = await getUserById(userId);
            // When in company mode, SocialContext is already seeded from the org's following list.
            // Syncing from the API response here would cause a race condition, so we skip it.
            if (!isCompany && userData.user.is_following !== undefined) {
                syncFollowStatus(userData.user.id, userData.user.is_following);
            }
            return transformUserData(userData);
        },
        enabled: !!userId,
        staleTime: Infinity,
        refetchOnMount: false,
    });
}

export function useProfilePosts(userId: string) {
    return useQuery({
        queryKey: ["profile-posts", userId],
        queryFn: async () => {
            const data = await getPublicProfilePosts(userId, 'All');
            return data.posts.map(mapPublicPostToPost);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// Global Profile's 3-post preview strip: server-ordered to prefer image/caption
// posts over polls/reposts (falling back to them only if fewer than 3 plain
// posts exist), across the user's full post history — not just whatever the
// general list's first page happens to contain. Deliberately a separate query
// from useProfilePosts above, which still needs the full recency-ordered list
// (e.g. for the Skills section's post-evidence lookup).
export function useProfilePostsPreview(userId: string) {
    return useQuery({
        queryKey: ["profile-posts-preview", userId],
        queryFn: async () => {
            const data = await getPublicProfilePosts(userId, 'All', { preview: true });
            return data.posts.map(mapPublicPostToPost);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
