import api from "@/lib/axios";

export const getActivityLogs = async (type: 'likes' | 'comments' | 'tags') => {
    const res = await api.get(`/user/activity?type=${type}`);
    return res.data;
};

export const removeActivity = async (type: 'like' | 'comment' | 'tag', id: number | string) => {
    const res = await api.delete(`/user/activity/${type}/${id}`);
    return res.data;
};
