import api from '@/lib/axios';
import { CreatePostRequest, CreatePostResponse } from '@/services/api/feed';
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

    // Upload originals to R2 and create the post while derivatives process asynchronously.
    console.log("[postApi.create] Uploading", files.length, "files directly to R2...");
    const uploadRes = await uploadMedia(files);
    const mediaUrls = uploadRes;
    const mediaMetadata = uploadRes.map((item) => ({
      width: item.width || undefined,
      height: item.height || undefined,
    })).filter((item) => item.width && item.height);

    const finalPayload = {
      ...payload,
      media_urls: mediaUrls,
      ...(mediaMetadata.length > 0 ? { media_metadata: mediaMetadata } : {})
    };

    const response = await api.post<CreatePostResponse>("/post", finalPayload, {
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

    const canUseCreateResponse = response.data.post
      && !payload.shared_post_id
      && !payload.shared_job_id
      && payload.post_type !== 'article'
      && !payload.achievement_image_id;
    const createdPost = canUseCreateResponse
      ? response.data.post!
      : await getPostById(response.data.postId);
    const mappedPost = mapBackendPostToFrontend(createdPost);
    const localImagePreviews = files.flatMap((file, index) => {
      if (uploadRes[index]?.media_type !== "image" || mappedPost.imageProcessingStatuses?.[index] !== "processing") return [];
      const previewUrl = URL.createObjectURL(file);
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 5 * 60 * 1000);
      return [previewUrl];
    });
    if (localImagePreviews.length) {
      mappedPost.images = localImagePreviews;
      mappedPost.imageSrc = localImagePreviews[0];
      mappedPost.imageProcessingStatuses = localImagePreviews.map(() => "ready");
    }
    return {
      postId: response.data.postId,
      mappedPost
    };
  },

  update: async (postId: string, payload: UpdatePostRequest, files: File[] = []) => {
    const finalPayload: UpdatePostRequest = { ...payload };

    if (files && files.length > 0) {
      console.log("[postApi.update] Uploading", files.length, "files before updating post...");
      const uploadRes = await uploadMedia(files);
      let uploadedIdx = 0;
      if (Array.isArray(finalPayload.media_urls) && finalPayload.media_urls.length > 0) {
        finalPayload.media_urls = finalPayload.media_urls.map((media) => {
          if (typeof media === 'string' && media.startsWith('blob:')) {
            return uploadRes[uploadedIdx++] || media;
          }
          return media;
        });
        while (uploadedIdx < uploadRes.length) {
          finalPayload.media_urls.push(uploadRes[uploadedIdx++]);
        }
      } else {
        finalPayload.media_urls = uploadRes;
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
