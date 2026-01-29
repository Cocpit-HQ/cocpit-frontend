
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserById } from "@/services/api/user";
import { useSocial } from "@/context/SocialContext";
import { User } from "@/types/user";

// Transform function from PublicProfile (moved here)
import { PublicUserProfileResponse } from "@/types/api";

const transformUserData = (data: PublicUserProfileResponse): User => {
    const experiences = data.experiences.map(apiExp => {
        const startDate = new Date(apiExp.start_date);
        const endDate = apiExp.end_date ? new Date(apiExp.end_date) : null;

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
            experience_id: apiExp.experience_id,
            profile_id: '',
            title: apiExp.title,
            company_name: apiExp.company_name,
            start_date: apiExp.start_date,
            end_date: apiExp.end_date,
            employment_type: '',
            location: apiExp.location,
            description: apiExp.description,
            id: apiExp.experience_id,
            company: apiExp.company_name,
            duration,
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
        }
    });

    return {
        id: data.id,
        name: data.full_name,
        headline: data.headline || '',
        avatar: data.avatar_url || '/assets/pngegg.png',
        location: data.location || '',
        about: data.about_text || '',
        skills: Array.isArray(data.skills)
            ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name)
            : [],
        experiences: experiences as any,
        educations: educations as any,
        connectionStatus: 'none',
        mutualConnections: 0,
        identity: {
            openTo: (Array.isArray(data.open_to) ? data.open_to[0] : data.open_to) as any || 'Full-time',
            availability: data.availability as any || 'Casual Networking',
            workPreference: data.work_preference as any || 'Onsite',
        }
    };
};

export function useProfile(userId: string) {
    const { syncFollowStatus } = useSocial();

    return useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            const userData = await getUserById(userId);
            if (userData.is_following !== undefined) {
                syncFollowStatus(userData.id, userData.is_following);
            }
            return transformUserData(userData);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
