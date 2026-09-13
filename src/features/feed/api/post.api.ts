import api from '@/lib/axios';
import { CreatePostRequest } from '@/services/api/feed';
import { updatePost, UpdatePostRequest, getPostById } from '@/services/api/posts';
import { uploadMedia } from '@/services/api/upload';
import { companyService } from '@/services/organization.service';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

export const postApi = {
  create: async (
    payload: CreatePostRequest, 
    files: File[], 
    tagUserIds?: string[],
    uploadConfig?: {
      onUploadProgress?: (percent: number) => void;
      signal?: AbortSignal;
    }
  ) => {
    // 1. If there are no files, make a standard JSON POST request directly
    if (files.length === 0) {
      const response = await api.post<{ postId: string }>("/post", payload, {
        signal: uploadConfig?.signal
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
      },
      signal: uploadConfig?.signal,
      onUploadProgress: uploadConfig?.onUploadProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          uploadConfig.onUploadProgress!(percentCompleted);
        }
      } : undefined
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
    let finalPayload: UpdatePostRequest = { ...payload };

    if (files && files.length > 0) {
      console.log("[postApi.update] Uploading", files.length, "files before updating post...");
      const uploadRes = await uploadMedia(files);
      const newUrls: string[] = (uploadRes || []).map((item: any) =>
        typeof item === 'object' && item !== null ? item.url : item
      );

      let uploadedIdx = 0;
      if (Array.isArray(finalPayload.media_urls) && finalPayload.media_urls.length > 0) {
        finalPayload.media_urls = finalPayload.media_urls.map((url) => {
          if (typeof url === 'string' && url.startsWith('blob:')) {
            return newUrls[uploadedIdx++] || url;
          }
          return url;
        });
        while (uploadedIdx < newUrls.length) {
          finalPayload.media_urls.push(newUrls[uploadedIdx++]);
        }
      } else {
        finalPayload.media_urls = newUrls;
      }
    }

    return await updatePost(postId, finalPayload);
  },

  getById: async (postId: string) => {
    const post = await getPostById(postId);
    return mapBackendPostToFrontend(post);
  },

  notifyEmployees: async (companyId: string, postId: string) => {
    return await companyService.notifyEmployees(companyId, postId);
  }
};
