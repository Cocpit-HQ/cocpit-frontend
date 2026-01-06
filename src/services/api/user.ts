import api from "@/lib/axios";
import { PublicUserProfileResponse } from "@/types/api";
import { SearchedUser } from "@/types/user";

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  const response = await api.get(`/users/search?q=${query}`);
  return response.data;
};

export const getUserById = async (id: string): Promise<PublicUserProfileResponse> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};