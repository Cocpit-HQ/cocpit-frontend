import api from "@/lib/axios";
import { ApiPost } from "@/types/api";

export const getFeeds = async (): Promise<ApiPost[]> => {
  // The user-provided backend code returns the array of posts directly.
  const response = await api.get<ApiPost[]>("/All/feeds");
  return response.data;
};
