import { z } from 'zod';
import { registrationSchema } from '@/lib/validators';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const registerUser = async (userData: z.infer<typeof registrationSchema>) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
};
