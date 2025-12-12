/**
 * API Status Codes and Types
 */

export const API_STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Post Visibility Options
 */
export const POST_VISIBILITY = {
  PUBLIC: "public",
  FRIENDS: "friends",
  PRIVATE: "private",
} as const;

/**
 * User Relationship Status
 */
export const USER_RELATIONSHIP = {
  FOLLOWING: "following",
  FOLLOWER: "follower",
  FRIEND: "friend",
  BLOCKED: "blocked",
  NONE: "none",
} as const;

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  LIKE: "like",
  COMMENT: "comment",
  SHARE: "share",
  FOLLOW: "follow",
  MENTION: "mention",
  MESSAGE: "message",
  SYSTEM: "system",
} as const;

/**
 * User Status
 */
export const USER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  AWAY: "away",
  DND: "dnd", // Do Not Disturb
} as const;

/**
 * Message Types
 */
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  LINK: "link",
} as const;

/**
 * Sort Options
 */
export const SORT_OPTIONS = {
  NEWEST: "newest",
  OLDEST: "oldest",
  TRENDING: "trending",
  POPULAR: "popular",
  RELEVANT: "relevant",
} as const;

/**
 * Time Ranges
 */
export const TIME_RANGES = {
  TODAY: "today",
  THIS_WEEK: "week",
  THIS_MONTH: "month",
  THIS_YEAR: "year",
  ALL_TIME: "all",
} as const;
