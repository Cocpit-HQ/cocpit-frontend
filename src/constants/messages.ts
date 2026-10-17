/**
 * Application Error Messages
 */
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "Email is already registered",
  USERNAME_ALREADY_EXISTS: "Username is already taken",
  INVALID_EMAIL: "Invalid email address",
  INVALID_PASSWORD: "Password does not meet requirements",
  PASSWORD_MISMATCH: "Passwords do not match",
  
  // Network
  NETWORK_ERROR: "Network error. Please check your connection",
  TIMEOUT_ERROR: "Request timeout. Please try again",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "You are not authorized to perform this action",
  FORBIDDEN: "Access denied",
  
  // File upload
  FILE_TOO_LARGE: "File is too large",
  INVALID_FILE_TYPE: "Invalid file type",
  UPLOAD_FAILED: "File upload failed",
  
  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later",
  PLEASE_TRY_AGAIN: "Please try again",
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Successfully logged in",
  SIGNUP_SUCCESS: "Account created successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  POST_CREATED: "Post created successfully",
  POST_UPDATED: "Post updated successfully",
  POST_DELETED: "Post deleted successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  SETTINGS_SAVED: "Settings saved successfully",
  MESSAGE_SENT: "Message sent successfully",
} as const;

/**
 * Validation Messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_FORMAT: "Invalid format",
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_WEAK: "Password must contain uppercase, lowercase, number and special character",
  USERNAME_INVALID: "Username must be 3-20 characters (alphanumeric, dash, underscore only)",
} as const;

/**
 * HTTP Status Messages
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  200: "Success",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
} as const;
