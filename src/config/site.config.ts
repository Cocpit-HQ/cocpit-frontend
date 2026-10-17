import { env } from "@/config/env";

/**
 * Application Routes Configuration
 */

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  
  // Auth routes
  AUTH: {
    LOGIN: "/",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
  },

  // Main app routes
  APP: {
    FEED: "/feed",
    EXPLORE: "/explore",
    MESSAGES: "/messages",
    NOTIFICATIONS: "/notifications",
    PROFILE: (username: string) => `/profile/${username}`,
    SETTINGS: "/settings",
    BOOKMARKS: "/bookmarks",
  },

  // API routes
  API: {
    AUTH: "/api/auth",
    USERS: "/api/users",
    POSTS: "/api/posts",
    MESSAGES: "/api/messages",
    NOTIFICATIONS: "/api/notifications",
    EXPLORE: "/api/explore",
  },
} as const;

/**
 * Regex patterns for validation
 */
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  HASHTAG: /#[a-zA-Z0-9_]+/g,
  MENTION: /@[a-zA-Z0-9_]+/g,
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BASE_URL: env.API_URL,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  FEED_PAGE_SIZE: 10,
  COMMENTS_PAGE_SIZE: 5,
} as const;

/**
 * Cache durations (in milliseconds)
 */
export const CACHE_DURATION = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
} as const;

/**
 * File upload configuration
 */
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/quicktime"],
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  SEARCH_DEBOUNCE: 300,
} as const;

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_MESSAGES: true,
  ENABLE_STORIES: false,
  ENABLE_LIVE: false,
  ENABLE_HASHTAG_SUGGESTIONS: true,
  ENABLE_USER_SUGGESTIONS: true,
} as const;
