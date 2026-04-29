
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
    deleteAvatar,
    updateProfile,
    updateIdentity,
    uploadResume,
    deleteResume
} from "@/services/api/profile";
import { toast } from "sonner";
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
            // Flatten the grouped experiences array from backend if it's grouped
            const flatExperiences = (data.experiences as any[]).flatMap(
                (group) => (group && group.experiences && Array.isArray(group.experiences)) ? group.experiences : [group]
            );
            return { ...data, experiences: flatExperiences };
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
                // response.skills is now the FULL list of skills for the profile.
                return {
                    ...old,
                    skills: response.skills
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
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
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
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

export function useProfileMutation() {
    const queryClient = useQueryClient();

    const update = useMutation({
        mutationFn: async (payload: any) => {
            // Update core profile
            await updateProfile({
                full_name: payload.name,
                headline: payload.headline,
                location: payload.location,
                about_text: payload.about,
                account_name: payload.account_name,
                job_title: payload.job_title || "",
                company_name: payload.company_name || "",
                school: payload.school || "",
                degree: payload.degree || "",
                website: payload.website || "",
                visible_role_ids: payload.visible_role_ids,
            });

            // Update identity
            // Backend only accepts single enum values — send first item of each array if they are arrays
            await updateIdentity({
                open_to: Array.isArray(payload.open_to) ? payload.open_to[0] : payload.open_to,
                availability: Array.isArray(payload.availability) ? payload.availability[0] : payload.availability,
                work_preference: Array.isArray(payload.work_preference) ? payload.work_preference[0] : payload.work_preference,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: ["profile-identity"] });
            toast.success("Profile updated successfully");
        }
    });

    return update;
}

export function useResumeMutations() {
    const queryClient = useQueryClient();

    const upload = useMutation({
        mutationFn: (formData: FormData) => uploadResume(formData),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    resume: {
                        originalName: response.resume.originalName,
                        url: response.resume.url
                    }
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            toast.success("Resume uploaded successfully");
        }
    });

    const remove = useMutation({
        mutationFn: () => deleteResume(),
        onSuccess: () => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    resume: null
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            toast.success("Resume deleted successfully");
        }
    });

    return { upload, remove };
}
