
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getProfile,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    addSkills,
    deleteSkill,
    uploadAvatar,
    deleteAvatar
} from "@/services/api/profile";
import {
    UserData,
    UserProfile,
    Skill,
    AddExperiencePayload,
    AddEducationPayload,
    AddSkillsPayload
} from "@/types/user";
import { Experience, Education } from "@/types/entities";

// --- Query --
export function useMyProfile() {
    return useQuery({
        queryKey: ["my-profile"],
        queryFn: async () => {
            const data = await getProfile();
            return data; // Returns UserProfile
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// --- Mutations ---

export function useExperienceMutations() {
    const queryClient = useQueryClient();

    const add = useMutation({
        mutationFn: (payload: AddExperiencePayload) => addExperience(payload),
        onSuccess: (newItem) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    experiences: [...old.experiences, newItem.experience]
                };
            });
        }
    });

    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<AddExperiencePayload> }) =>
            updateExperience(id, payload),
        onSuccess: (updatedItem) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    experiences: old.experiences.map(exp =>
                        exp.experience_id === updatedItem.experience.experience_id ? updatedItem.experience : exp
                    )
                };
            });
        }
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteExperience(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    experiences: old.experiences.filter(exp => exp.experience_id !== id)
                };
            });
        }
    });

    return { add, update, remove };
}

export function useEducationMutations() {
    const queryClient = useQueryClient();

    const add = useMutation({
        mutationFn: (payload: AddEducationPayload) => addEducation(payload),
        onSuccess: (newItem) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    educations: [...old.educations, newItem.education]
                };
            });
        }
    });

    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<AddEducationPayload> }) =>
            updateEducation(id, payload),
        onSuccess: (updatedItem) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    educations: old.educations.map(edu =>
                        edu.education_id === updatedItem.education.education_id ? updatedItem.education : edu
                    )
                };
            });
        }
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteEducation(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    educations: old.educations.filter(edu => edu.education_id !== id)
                };
            });
        }
    });

    return { add, update, remove };
}

export function useSkillMutations() {
    const queryClient = useQueryClient();

    const add = useMutation({
        mutationFn: (payload: AddSkillsPayload) => addSkills(payload),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                // response.skills is the list of ADDED skills. Merge them.
                return {
                    ...old,
                    skills: [...old.skills, ...response.skills]
                };
            });
        }
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteSkill(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    skills: old.skills.filter(s => s.skill_id !== id)
                };
            });
        }
    });

    return { add, remove };
}

export function useAvatarMutations() {
    const queryClient = useQueryClient();

    const upload = useMutation({
        mutationFn: (formData: FormData) => uploadAvatar(formData),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    user: { ...old.user, avatar: response.avatarUrl }
                };
            });
        }
    });

    const remove = useMutation({
        mutationFn: () => deleteAvatar(),
        onSuccess: () => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    user: { ...old.user, avatar: null }
                };
            });
        }
    });

    return { upload, remove };
}
