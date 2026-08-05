import api from "@/lib/axios";

const getActorHeaders = (companyId?: string) => {
  if (companyId) {
    return {
      "x-actor-type": "ORGANIZATION",
      "x-actor-id": companyId
    };
  }
  return {};
};

export const getActivityLogs = async (type: 'likes' | 'comments' | 'tags', companyId?: string): Promise<any[]> => {
    const res = await api.get(`/user/activity?type=${type}`, {
      headers: companyId ? getActorHeaders(companyId) : undefined
    });
    return res.data;
};

export const removeActivity = async (type: 'like' | 'comment' | 'tag', id: number | string, companyId?: string) => {
    const res = await api.delete(`/user/activity/${type}/${id}`, {
      headers: companyId ? getActorHeaders(companyId) : undefined
    });
    return res.data;
};
