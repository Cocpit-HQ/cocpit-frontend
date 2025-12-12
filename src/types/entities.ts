/**
 * Entity Types - Main data models for the application
 */

/**
 * Generic entity with timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Profile
 */
export interface User extends BaseEntity {
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  followers: number;
  following: number;
  verified: boolean;
}

export interface UserProfile extends User {
  isFollowed?: boolean;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  bio?: string;
  avatar?: string;
}

export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: "light" | "dark" | "auto";
}
