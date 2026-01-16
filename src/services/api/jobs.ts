import api from "@/lib/axios";
import { Job } from "@/types/jobs";

export const getAllJobs = async (filters?: any): Promise<Job[]> => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    const response = await api.get(`/jobs${query}`);
    return response.data;
};

export const getJobById = async (id: number | string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
};

export const applyToJob = async (id: number | string) => {
    const response = await api.post(`/jobs/${id}/apply`);
    return response.data;
};
