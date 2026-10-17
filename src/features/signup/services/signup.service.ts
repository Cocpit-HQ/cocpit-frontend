import {
  requestOTP,
  verifyOTP,
  register,
} from "@/services/api/auth";
import { resendRecoveryEmail } from "@/services/api/user";
import { RegisterPayload } from "../types/signup.types";

export const signupService = {
  /**
   * Request an OTP for sign up
   */
  requestOtp: async (email: string, isResend: boolean = false) => {
    return await requestOTP(email.toLowerCase().trim(), "signup", isResend);
  },

  /**
   * Verify an OTP code
   */
  verifyOtp: async (email: string, otp: string) => {
    return await verifyOTP(email.toLowerCase().trim(), otp.trim());
  },

  /**
   * Register new user account
   */
  registerUser: async (data: RegisterPayload) => {
    return await register({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      otp: data.otp.trim(),
    });
  },

  /**
   * Resend recovery email if account is pending deletion
   */
  resendRecoveryEmail: async (email: string) => {
    return await resendRecoveryEmail(email.toLowerCase().trim());
  },
};
