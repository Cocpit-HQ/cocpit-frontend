import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(15, { message: "Password must be at most 15 characters long." })
  .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter (a-z)." })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter (A-Z)." })
  .regex(/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/, { message: "Password must contain at least 1 special character (e.g., @, #, $, %, &, *)." });

export const registrationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: passwordSchema,
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
});

/**
/ * Evaluates password requirements sequentially and returns the first missing requirement hint string.
 * Returns null if all 4 conditions are met.
 */
export function getFirstMissingPasswordRequirement(password: string): string | null {
  if (!password || password.length < 8 || password.length > 15) {
    return "*Use 8 to 15 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "*Use at least 1 uppercase letter (A–Z)";
  }
  if (!/[a-z]/.test(password)) {
    return "*Use at least 1 lowercase letter (a–z)";
  }
  if (!/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password)) {
    return "*Use at least 1 special character (e.g., @, #, $, %, &, *)";
  }
  return null;
}

export function isPasswordFullyValid(password: string): boolean {
  return getFirstMissingPasswordRequirement(password) === null;
}