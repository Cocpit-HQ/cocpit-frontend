import api from "@/lib/axios";

export const getBlockedUsers = async (): Promise<any[]> => {
    const res = await api.get("/user/blocked");
    return res.data;
};

export const unblockUser = async (id: number | string) => {
    const res = await api.delete(`/user/blocked/${id}`);
    return res.data;
};
