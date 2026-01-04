import api from "@/lib/axios";
import type { UserProfile, AddExperiencePayload, AddExperienceResponse, AddEducationPayload, AddEducationResponse } from "@/types/user";

export const getProfile = async (): Promise<UserProfile> => {
    const response = await api.get("/profile/me");
    return response.data;
};

export const addExperience = async (payload: AddExperiencePayload): Promise<AddExperienceResponse> => {
    const response = await api.post("/profile/experiences", payload);
    return response.data;
}

export const deleteExperience = async (id: string): Promise<void> => {
    await api.delete(`/profile/experiences/${id}`);
}

export const addEducation = async (payload: AddEducationPayload): Promise<AddEducationResponse> => {
    const response = await api.post("/profile/educations", payload);
    return response.data;
}

export const deleteEducation = async (id: string): Promise<void> => {
    await api.delete(`/profile/educations/${id}`);
}
