import { createPost, CreatePostRequest } from '@/services/api/feed';
import { updatePost, UpdatePostRequest, getPostById } from '@/services/api/posts';
import { uploadMedia } from '@/services/api/media';
import { companyService } from '@/services/organization.service';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

export const postApi = {
  create: async (payload: CreatePostRequest, files: File[]) => {
    let mediaUrls: string[] = [];
    if (files.length > 0) {
      const uploaded = await uploadMedia(files);
      mediaUrls = uploaded.map(m => m.url);
    }
    
    const finalPayload = { ...payload, media_urls: mediaUrls };
    const response = await createPost(finalPayload);
    const createdPost = await getPostById(response.postId);
    
    return {
      postId: response.postId,
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
