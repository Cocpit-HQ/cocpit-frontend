import {
  requestOTP,
  verifyOTP,
  resetPassword,
  verifyResetToken,
  resetPasswordWithToken,
  validateResetPassword,
} from "@/services/api/auth";

export const resetPasswordService = {
  /**
   * Request an OTP for password reset
   */
  requestOtp: async (email: string) => {
    return await requestOTP(email.toLowerCase().trim(), "password_reset");
  },

  /**
   * Verify an OTP code
   */
  verifyOtp: async (email: string, otp: string) => {
    return await verifyOTP(email.toLowerCase().trim(), otp.trim());
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (
    email: string,
    newPassword: string,
    otp: string,
    logoutOtherDevices?: boolean
  ) => {
    return await resetPassword(
      email.toLowerCase().trim(),
      newPassword,
      otp.trim(),
      logoutOtherDevices
    );
  },

  /**
   * Verify token for direct link reset
   */
  verifyToken: async (token: string) => {
    return await verifyResetToken(token);
  },

  /**
   * Reset password with token from direct link
   */
  resetPasswordWithToken: async (
    token: string,
    newPassword: string,
    logoutOtherDevices?: boolean
  ) => {
    return await resetPasswordWithToken(token, newPassword, logoutOtherDevices);
  },

  /**
   * Live validation for old password comparison on blur
   */
  validatePassword: async (payload: { email?: string; token?: string; password: string }) => {
    return await validateResetPassword(payload);
  },
};
