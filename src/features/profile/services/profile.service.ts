// Core profile API functions
export {
  getProfile,
  updateProfile,
  getUserPosts,
  addExperience,
  updateExperience,
  patchExperience,
  deleteExperience,
  batchUpdateExperiences,
  addEducation,
  updateEducation,
  deleteEducation,
  addSkills,
  searchSkills,
  getProfileSkills,
  deleteSkill,
  uploadAvatar,
  deleteAvatar,
  uploadCoverPhoto,
  deleteCoverPhoto,
  getIdentity,
  updateIdentity,
  uploadResume,
  getResume,
  deleteResume,
} from "@/services/api/profile";

export type {
  GetUserPostsParams,
  GetUserPostsResponse,
  ProfilePost,
  ProfilePostMedia,
  ProfilePostPoll,
  ProfilePostPollOption,
  BatchExperienceOperation,
  BatchExperiencePayload,
  BatchExperienceResponse,
} from "@/services/api/profile";

// Public profile API functions
export { getPublicProfilePosts } from "@/services/api/public-profile";
export type { PublicPost, PublicPostsResponse } from "@/services/api/public-profile";

// Shared services imported/used by the profile feature
export {
  getProfileStats,
  getFollowing,
  getMyConnections,
  getFollowers,
  sendConnectionRequest,
  cancelConnectionRequest,
  handleConnectionRequest,
  removeConnection,
  getRelationshipStatus,
  followUser,
  unfollowUser,
  removeFollower,
} from "@/services/api/social";

export { deletePost, toggleLike, createRepost, updatePost } from "@/services/api/posts";
export { toggleSavePost, getSavedPosts } from "@/services/api/savedPost";
export { recordProfileView, getProfileViewCount } from "@/services/api/dashboard";
export { getUserById } from "@/services/api/user";
