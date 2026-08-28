export type SignUpStep = "EMAIL" | "OTP" | "PASSWORD";

export interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  specialChar: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  otp: string;
}

export interface PendingDeletionInfo {
  deletionDate: string;
  email: string;
}
