/**
 * Validator Functions
 * Reusable validation logic for forms and data
 */

import { PATTERNS } from "@/config/site.config";
import { FILE_CONFIG } from "@/config/site.config";

export const validators = {
  email: (email: string): boolean => {
    return PATTERNS.EMAIL.test(email);
  },

  username: (username: string): boolean => {
    return PATTERNS.USERNAME.test(username) && username.length >= 3 && username.length <= 20;
  },

  password: (password: string): boolean => {
    return password.length >= 8 && PATTERNS.PASSWORD.test(password);
  },

  url: (url: string): boolean => {
    return PATTERNS.URL.test(url);
  },

  notEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  passwordMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  },

  extractHashtags: (text: string): string[] => {
    const matches = text.match(PATTERNS.HASHTAG);
    return matches ? matches.map((tag) => tag.substring(1).toLowerCase()) : [];
  },

  extractMentions: (text: string): string[] => {
    const matches = text.match(PATTERNS.MENTION);
    return matches ? matches.map((mention) => mention.substring(1)) : [];
  },

  isImageFile: (file: File): boolean => {
    return FILE_CONFIG.ALLOWED_IMAGE_TYPES.some((type: string) => file.type === type);
  },

  isVideoFile: (file: File): boolean => {
    return FILE_CONFIG.ALLOWED_VIDEO_TYPES.some((type: string) => file.type === type);
  },
} as const;
