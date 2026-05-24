import api from '@/lib/axios';
import { CreatePostRequest } from '@/services/api/feed';
import { updatePost, UpdatePostRequest, getPostById } from '@/services/api/posts';
import { companyService } from '@/services/organization.service';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

export const postApi = {
  create: async (payload: CreatePostRequest, files: File[]) => {
    // 1. If there are no files, make a standard JSON POST request directly
    if (files.length === 0) {
      const response = await api.post<{ postId: string }>("/post", payload);
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
      formData.append("media", file);
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

    const createdPost = await getPostById(response.data.postId);
    return {
      postId: response.data.postId,
      mappedPost: mapBackendPostToFrontend(createdPost)
    };
  },

  update: async (postId: string, payload: UpdatePostRequest) => {
    return await updatePost(postId, payload);
  },

  getById: async (postId: string) => {
    const post = await getPostById(postId);
    return mapBackendPostToFrontend(post);
  },

  notifyEmployees: async (companyId: string, postId: string) => {
    return await companyService.notifyEmployees(companyId, postId);
  }
};
