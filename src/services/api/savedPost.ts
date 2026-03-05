import api from "@/lib/axios";
import { ToggleSaveResponse, SavedPostsResponse } from "../../types/savedPost";
import { SavedFolder } from "@/types/entities";

// Toggle save (with optional folder)
export const toggleSavePost = async (
    postId: string,
    folderId?: string | null,
    companyId?: string
): Promise<ToggleSaveResponse> => {
    const res = await api.post<ToggleSaveResponse>(`/posts/${postId}/save`, { folderId, companyId });
    return res.data;
};

// Get all saved posts (optionally filtered by folder)
export const getSavedPosts = async (
    folderId?: string | null,
    page: number = 1,
    limit: number = 20,
    companyId?: string
): Promise<SavedPostsResponse> => {
    const res = await api.get<SavedPostsResponse>("/saved-posts", {
        params: { folderId, page, limit, companyId }
    });
    return res.data;
};

// --- Folder Operations ---

export const createSavedFolder = async (name: string, companyId?: string): Promise<{ success: boolean; folder: SavedFolder }> => {
    const res = await api.post("/saved-folders", { name, companyId });
    return res.data;
};

export const getSavedFolders = async (companyId?: string): Promise<{ success: boolean; folders: SavedFolder[] }> => {
    const res = await api.get("/saved-folders", { params: { companyId } });
    return res.data;
};

export const renameSavedFolder = async (folderId: string, name: string, companyId?: string): Promise<{ success: boolean; folder: SavedFolder }> => {
    const res = await api.put(`/saved-folders/${folderId}`, { name, companyId });
    return res.data;
};

export const deleteSavedFolder = async (folderId: string, companyId?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/saved-folders/${folderId}`, { params: { companyId } });
    return res.data;
};

