import api from "@/lib/axios";

export const submitFeedback = async (data: { rating: number; comment?: string; app_version: string }) => {
    const res = await api.post(`/settings/support/feedback`, data);
    return res.data;
};

export const createTicket = async (data: FormData) => {
    const res = await api.post(`/settings/support/tickets`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const getFAQs = async () => {
    const res = await api.get(`/settings/support/faqs`);
    return res.data;
};

export const getLegalDocs = async () => {
    const res = await api.get(`/settings/legal`);
    return res.data;
};
