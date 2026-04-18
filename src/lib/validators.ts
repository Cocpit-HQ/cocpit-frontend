import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
});