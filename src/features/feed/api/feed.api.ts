import api from "@/lib/axios";
import { 
  toggleLike, 
  voteInPoll, 
  removeVote, 
  addComment, 
  deleteComment, 
  getComments, 
  updatePost,
  deletePost 
} from '@/services/api/posts';
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper";

export const feedApi = {
  // Post Interactions
  toggleLike,
  voteInPoll,
  removeVote,
  updatePost,
  deletePost,

  // Comments
  getComments,
  addComment,
  deleteComment,

  // Organization Specific
  notifyEmployees: async (companyId: string, postId: string) => {
    const response = await api.post(`/organizations/${companyId}/posts/${postId}/notify`);
    return response.data;
  }
};
