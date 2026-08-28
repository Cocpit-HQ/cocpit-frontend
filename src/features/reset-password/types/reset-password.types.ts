export type ResetPasswordStep = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export interface ResetPasswordState {
  step: ResetPasswordStep;
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  isCheckingOtp: boolean;
  errorMessage: string | null;
  otpError: boolean;
  resendCooldown: number;
  token?: string | null;
  isTokenFlow: boolean;
}

export interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  specialChar: boolean;
}
