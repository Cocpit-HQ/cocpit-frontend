import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PROFILE_SCORE_QUERY_KEY } from "@/features/profile-score/hooks/useProfileScore";
import { useSession } from "next-auth/react";
import {
    getProfile,
    addExperience,
    updateExperience,
    deleteExperience,
    batchUpdateExperiences,
    addEducation,
    updateEducation,
    deleteEducation,
    addSkills,
    syncSkills,
    deleteSkill,
    uploadAvatar,
    deleteAvatar,
    updateProfile,
    updateIdentity,
    uploadResume,
    deleteResume,
    addProject,
    updateProject,
    deleteProject,
} from "@/services/api/profile";
import {
    UserData,
    UserProfile,
    Skill,
    AddExperiencePayload,
    AddEducationPayload,
    AddSkillsPayload
} from "@/types/user";
import { Education, ExperienceGroup, Project } from "@/types/entities";

// ─── Cache helper (used only for optimistic remove) ───────────────────────────

/** Removes a single experience from its group; removes the group if it becomes empty */
function removeExperienceFromGroups(
    groups: ExperienceGroup[],
    id: string
): ExperienceGroup[] {
    return groups
        .map(g => ({
            ...g,
            experiences: g.experiences.filter(e => e.experience_id !== id),
        }))
        .filter(g => g.experiences.length > 0);
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useMyProfile() {
    return useQuery({
        queryKey: ["my-profile"],
        queryFn: async () => {
            const data = await getProfile();
            return data; // Returns UserProfile
        },
        staleTime: Infinity,
        refetchOnMount: false,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface BatchUpdatePayload {
    operations: any[];
    version: number;
    requestId?: string;
}

export function useExperienceMutations() {
    const queryClient = useQueryClient();

    const add = useMutation({
        mutationFn: (payload: AddExperiencePayload) => addExperience(payload),
        onSuccess: () => {
            // Always refetch so the backend's consecutive groupByCompany logic
            // determines the correct group structure — client can't replicate this.
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        },
    });

    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<AddExperiencePayload> }) =>
            updateExperience(id, payload),
        onSuccess: () => {
            // Refetch so group recalculation is server-authoritative.
            // Updating a role's company_name or dates can change which group it
            // belongs to — manual patching cannot handle that correctly.
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        },
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteExperience(id),
        onMutate: async (id: string) => {
            // Optimistic removal is safe — deleting a role can only shrink or
            // eliminate a group, never create or reorder groups.
            await queryClient.cancelQueries({ queryKey: ["my-profile"] });
            const previous = queryClient.getQueryData<UserProfile>(["my-profile"]);
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    experiences: removeExperienceFromGroups(old.experiences, id),
                };
            });
            return { previous };
        },
        onError: (_err, _vars, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(["my-profile"], context.previous);
            }
        },
        onSettled: () => {
            // Always confirm final state from server after delete
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
    });

    const batchUpdate = useMutation({
        mutationFn: (payload: BatchUpdatePayload) => {
            const requestId = payload.requestId ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
            return batchUpdateExperiences({ ...payload, requestId } as any);
        },
        onSuccess: (data) => {
            // Surgical cache update: replace tempIds and update version
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;

                // 1. Update version
                const next = { ...old, user: { ...old.user, version: data.newVersion } };

                // 2. Map tempIds to real IDs in grouped experiences
                if (data.idMap) {
                    next.experiences = next.experiences.map(group => ({
                        ...group,
                        experiences: group.experiences.map(exp => {
                            const realId = data.idMap[exp.experience_id];
                            if (realId) return { ...exp, experience_id: realId };
                            return exp;
                        })
                    }));
                }

                return next;
            });

            // Still invalidate to ensure grouping and final state are correct
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
            toast.success("Experience updated successfully");
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to update experiences";
            if (err.response?.status === 409 && err.response?.data?.code === "VERSION_CONFLICT") {
                toast.error("Version conflict: someone else updated this profile. Please refresh.", { duration: 5000 });
                // The cached version is now stale — refresh it so the next save attempt
                // uses the current version instead of failing the same way again.
                queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            } else {
                toast.error(msg);
            }
            console.error("Batch update error:", err);
        },
    });

    return { add, update, remove, batchUpdate };
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
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
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
                return {
                    ...old,
                    skills: response.skills
                };
            });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        }
    });

    const sync = useMutation({
        mutationFn: (payload: { skills: string[] }) => syncSkills(payload),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    skills: response.skills
                };
            });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        }
    });

    return { add, remove, sync };
}

export function useAvatarMutations() {
    const queryClient = useQueryClient();
    const { update } = useSession();

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
            void update({ image: response.avatarUrl });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("cocpit:refresh-actor-context"));
            }
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
            void update({ image: null });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("cocpit:refresh-actor-context"));
            }
        }
    });

    return { upload, remove };
}

// ─── Profile Update (core fields + identity) ──────────────────────────────────

export function useProfileMutation() {
    const queryClient = useQueryClient();
    const { update: updateSession } = useSession();

    const update = useMutation({
        mutationFn: async (payload: any) => {
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
                industry: payload.industry,
            });
            await updateIdentity({
                open_to: Array.isArray(payload.open_to) ? payload.open_to[0] : payload.open_to,
                availability: Array.isArray(payload.availability) ? payload.availability[0] : payload.availability,
                work_preference: Array.isArray(payload.work_preference) ? payload.work_preference[0] : payload.work_preference,
                account_type: payload.status,
            });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: ["profile-identity"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
            if (variables?.name) {
                void updateSession({ name: variables.name });
            }
            toast.success("Profile updated successfully");
        },
    });

    return update;
}

// ─── Resume ───────────────────────────────────────────────────────────────────

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
                        url: response.resume.url,
                    },
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            toast.success("Resume uploaded successfully");
        },
    });

    const remove = useMutation({
        mutationFn: () => deleteResume(),
        onSuccess: () => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return { ...old, resume: null };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            toast.success("Resume deleted successfully");
        },
    });

    return { upload, remove };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjectMutations() {
    const queryClient = useQueryClient();

    const add = useMutation({
        mutationFn: (payload: Partial<Project>) => addProject(payload),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    projects: [response.project, ...(old.projects || [])],
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
    });

    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
            updateProject(id, payload),
        onSuccess: (response) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    projects: (old.projects || []).map(p =>
                        p.project_id === response.project.project_id ? response.project : p
                    ),
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteProject(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(["my-profile"], (old: UserProfile | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    projects: (old.projects || []).filter(p => p.project_id !== id),
                };
            });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            queryClient.invalidateQueries({ queryKey: [...PROFILE_SCORE_QUERY_KEY] });
        },
    });

    return { add, update, remove };
}
