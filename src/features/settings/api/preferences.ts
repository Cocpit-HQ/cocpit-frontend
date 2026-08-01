import api from "@/lib/axios";

export const updateAppearance = async (theme: 'system' | 'light' | 'dark') => {
    const res = await api.put(`/settings/appearance`, { theme });
    return res.data;
};
