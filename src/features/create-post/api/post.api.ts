/* DEPRECATED
DEPRECATED\n// import api from '@/lib/axios';
import { CreatePostRequest } from '@/services/api/feed';
import { updatePost, UpdatePostRequest, getPostById } from '@/services/api/posts';
import { companyService } from '@/services/organization.service';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

export const postApi = {
  create: async (payload: CreatePostRequest, files: File[], tagUserIds?: string[]) => {
    // 1. If there are no files, make a standard JSON POST request directly
    if (files.length === 0) {
      const response = await api.post<{ postId: string }>("/post", payload);
      if (tagUserIds && tagUserIds.length > 0) {
        try {
          await api.post(`/posts/tags/sync`, {
            postId: response.data.postId,
            tags: tagUserIds,
            companyId: payload.companyId || null
          });
        } catch (e) {
          console.error("Failed to sync tags on create", e);
        }
      }
      const createdPost = await getPostById(response.data.postId);
      return {
        postId: response.data.postId,
        mappedPost: mapBackendPostToFrontend(createdPost)
      };
    }

    // 2. We have files, build a unified FormData object for single multipart request
    console.log("[postApi.create] Submitting unified single-API multipart upload for", files.length, "files...");
    const formData = new FormData();
    files.forEach(file => {
      formData.append("media", file, file.name);
    });

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.post<{ postId: string }>("/post", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (tagUserIds && tagUserIds.length > 0) {
      try {
        await api.post(`/posts/tags/sync`, {
          postId: response.data.postId,
          tags: tagUserIds,
          companyId: payload.companyId || null
        });
      } catch (e) {
        console.error("Failed to sync tags on create", e);
      }
    }

    const createdPost = await getPostById(response.data.postId);
    return {
      postId: response.data.postId,
      mappedPost: mapBackendPostToFrontend(createdPost)
    };
  },

  update: async (postId: string, payload: UpdatePostRequest, files: File[] = []) => {
    if (files.length === 0) {
      return await updatePost(postId, payload);
    }

    console.log("[postApi.update] Submitting unified single-API multipart upload for", files.length, "files...");
    const formData = new FormData();
    files.forEach(file => {
      formData.append("media", file, file.name);
    });

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.put<any>(`/post/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getById: async (postId: string) => {
    const post = await getPostById(postId);
    return mapBackendPostToFrontend(post);
  },

  notifyEmployees: async (companyId: string, postId: string) => {
    return await companyService.notifyEmployees(companyId, postId);
  }
};

*/
export {};
