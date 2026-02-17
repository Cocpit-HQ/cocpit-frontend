import api from "@/lib/axios";
import { ToggleSaveResponse, SavedPostsResponse } from "../../types/savedPost";
import { SavedFolder } from "@/types/entities";

// Toggle save (with optional folder)
export const toggleSavePost = async (
    postId: string,
    folderId?: string | null
): Promise<ToggleSaveResponse> => {
    // If folderId is provided (string or null), we send it in the body. If undefined, legacy toggle.
    const res = await api.post<ToggleSaveResponse>(`/posts/${postId}/save`, { folderId });
    return res.data;
};

// Get all saved posts (optionally filtered by folder)
export const getSavedPosts = async (
    folderId?: string | null,
    page: number = 1,
    limit: number = 20
): Promise<SavedPostsResponse> => {
    const res = await api.get<SavedPostsResponse>("/saved-posts", {
        params: { folderId, page, limit }
    });
    return res.data;
};

// --- Folder Operations ---

export const createSavedFolder = async (name: string): Promise<{ success: boolean; folder: SavedFolder }> => {
    const res = await api.post("/saved-folders", { name });
    return res.data;
};

export const getSavedFolders = async (): Promise<{ success: boolean; folders: SavedFolder[] }> => {
    const res = await api.get("/saved-folders");
    return res.data;
};

export const renameSavedFolder = async (folderId: string, name: string): Promise<{ success: boolean; folder: SavedFolder }> => {
    const res = await api.put(`/saved-folders/${folderId}`, { name });
    return res.data;
};

export const deleteSavedFolder = async (folderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/saved-folders/${folderId}`);
    return res.data;
};

