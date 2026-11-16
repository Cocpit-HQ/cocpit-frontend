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

    // 2. Direct S3 Presigned Upload (Bypasses 100MB body cap for video carousels)
    try {
      console.log(`[postApi.create] Requesting presigned upload URLs for ${files.length} files...`);
      const presignPayload = {
        companyId: payload.companyId || null,
        files: files.map((f, i) => ({
          filename: f.name,
          contentType: f.type || (f.name.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg'),
          size: f.size,
          order_index: i,
        })),
      };

      const presignRes = await api.post<{ success: boolean; items: Array<{ key: string; upload_url: string; public_url: string; media_type: 'image' | 'video'; order_index: number }> }>(
        "/post/media/presign-urls",
        presignPayload,
        { signal: uploadConfig?.signal }
      );

      if (presignRes.data?.success && Array.isArray(presignRes.data.items) && presignRes.data.items.length === files.length) {
        const presignedItems = presignRes.data.items;
        const totalFiles = files.length;
        let completedFiles = 0;

        const uploadPromises = presignedItems.map(async (item, idx) => {
          const file = files[idx];
          const uploadRes = await fetch(item.upload_url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
            signal: uploadConfig?.signal,
          });

          if (!uploadRes.ok) {
            throw new Error(`Direct upload failed for ${file.name} (HTTP ${uploadRes.status})`);
          }

          completedFiles++;
          if (uploadConfig?.onUploadProgress) {
            uploadConfig.onUploadProgress(Math.round((completedFiles / totalFiles) * 90));
          }

          const meta = (payload as any).media_metadata?.[idx];
          return {
            url: item.public_url,
            media_type: item.media_type,
            order_index: idx,
            width: meta?.width || null,
            height: meta?.height || null,
            duration_seconds: meta?.duration_seconds || null,
            thumbnail_url: meta?.thumbnail_url || null,
          };
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        const createPayload = {
          ...payload,
          media: uploadedMedia,
          post_type: payload.post_type || (uploadedMedia.some(m => m.media_type === 'image') ? 'image' : (uploadedMedia.length === 1 && uploadedMedia[0].media_type === 'video' ? 'video' : 'image')),
        };

        const postResponse = await api.post<{ postId: string }>("/post", createPayload, {
          signal: uploadConfig?.signal,
        });

        if (tagUserIds && tagUserIds.length > 0) {
          try {
            await api.post(`/posts/tags/sync`, {
              postId: postResponse.data.postId,
              tags: tagUserIds,
              companyId: payload.companyId || null,
            });
          } catch (e) {
            console.error("Failed to sync tags on create", e);
          }
        }

        const createdPost = await getPostById(postResponse.data.postId);
        return {
          postId: postResponse.data.postId,
          mappedPost: mapBackendPostToFrontend(createdPost),
        };
      }
    } catch (presignErr: any) {
      if (presignErr?.name === 'CanceledError' || presignErr?.code === 'ERR_CANCELED') {
        throw presignErr;
      }
      console.warn("[postApi.create] Direct presigned upload failed or unavailable, falling back to multipart:", presignErr.message);
    }

    // 3. Multipart fallback (if presign fails or in local development)
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
