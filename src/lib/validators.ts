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