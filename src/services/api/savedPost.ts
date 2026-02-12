import api from "@/lib/axios";
import { ToggleSaveResponse, SavedPostsResponse } from "../../types/savedPost";

// Toggle save
export const toggleSavePost = async (
    postId: string
): Promise<ToggleSaveResponse> => {
    const res = await api.post<ToggleSaveResponse>(`/posts/${postId}/save`);
    return res.data;
};

// Get all saved posts
export const getSavedPosts = async (): Promise<SavedPostsResponse> => {
    const res = await api.get<SavedPostsResponse>("/saved-posts");
    return res.data;
};
