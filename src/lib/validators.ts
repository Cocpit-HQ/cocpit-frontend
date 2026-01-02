import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  accountType: z.string().min(1, { message: "Please select a role." }),
});