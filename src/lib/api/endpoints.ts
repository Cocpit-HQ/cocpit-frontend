/**
 * API Endpoints
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Users
  USERS: {
    GET_PROFILE: (username: string) => `/users/${username}`,
    UPDATE_PROFILE: "/users/profile",
    GET_USER_BY_ID: (id: string) => `/users/id/${id}`,
    SEARCH: "/users/search",
    GET_SUGGESTIONS: "/users/suggestions",
    GET_FOLLOWERS: (username: string) => `/users/${username}/followers`,
    GET_FOLLOWING: (username: string) => `/users/${username}/following`,
    FOLLOW: (userId: string) => `/users/${userId}/follow`,
    UNFOLLOW: (userId: string) => `/users/${userId}/unfollow`,
    BLOCK: (userId: string) => `/users/${userId}/block`,
    UNBLOCK: (userId: string) => `/users/${userId}/unblock`,
  },

  // Posts
  POSTS: {
    CREATE: "/posts",
    GET_FEED: "/posts/feed",
    GET_BY_ID: (id: string) => `/posts/${id}`,
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    GET_BY_USER: (username: string) => `/posts/user/${username}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    UNLIKE: (id: string) => `/posts/${id}/unlike`,
    COMMENT: (id: string) => `/posts/${id}/comments`,
    DELETE_COMMENT: (postId: string, commentId: string) =>
      `/posts/${postId}/comments/${commentId}`,
    SHARE: (id: string) => `/posts/${id}/share`,
    BOOKMARK: (id: string) => `/posts/${id}/bookmark`,
    UNBOOKMARK: (id: string) => `/posts/${id}/unbookmark`,
  },

  // Messages
  MESSAGES: {
    GET_CONVERSATIONS: "/messages/conversations",
    GET_CONVERSATION: (id: string) => `/messages/conversations/${id}`,
    SEND_MESSAGE: "/messages",
    UPDATE_MESSAGE: (id: string) => `/messages/${id}`,
    DELETE_MESSAGE: (id: string) => `/messages/${id}`,
    MARK_AS_READ: (conversationId: string) =>
      `/messages/conversations/${conversationId}/read`,
    SEARCH_CONVERSATIONS: "/messages/conversations/search",
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: "/notifications",
    GET_UNREAD: "/notifications/unread",
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: "/notifications/read-all",
    DELETE: (id: string) => `/notifications/${id}`,
    UPDATE_PREFERENCES: "/notifications/preferences",
    GET_PREFERENCES: "/notifications/preferences",
  },

  // Explore
  EXPLORE: {
    GET_TRENDING: "/explore/trending",
    GET_RECOMMENDED_USERS: "/explore/users",
    GET_RECOMMENDED_POSTS: "/explore/posts",
    SEARCH: "/explore/search",
  },

  // Upload
  UPLOAD: {
    IMAGE: "/upload/image",
    VIDEO: "/upload/video",
  },
} as const;
