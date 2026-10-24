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
    const queryParam = companyId ? `&companyId=${encodeURIComponent(companyId)}` : '';
    const res = await api.get(`/user/activity?type=${type}${queryParam}`, {
      headers: companyId ? getActorHeaders(companyId) : undefined
    });
    return res.data;
};

export const removeActivity = async (type: 'like' | 'comment' | 'tag', id: number | string, companyId?: string, postId?: string) => {
    const queryParam = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    if (type === 'tag' && postId) {
      const res = await api.delete(`/post/${postId}/mentions${queryParam}`, {
        headers: companyId ? getActorHeaders(companyId) : undefined,
        data: companyId ? { companyId } : undefined
      });
      return res.data;
    }
    const res = await api.delete(`/user/activity/${type}/${id}${queryParam}`, {
      headers: companyId ? getActorHeaders(companyId) : undefined,
      data: companyId ? { companyId } : undefined
    });
    return res.data;
};
