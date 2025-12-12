'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({ email: z.string().min(1,'Email required').email('Invalid email') });

type ForgotPasswordFormInputs = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  async function onSubmit(data: ForgotPasswordFormInputs) {
    try {
      // stub - call API to send reset email
      alert('Password reset link sent to ' + data.email);
    } catch (err) {
      alert('Failed to send reset link');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input {...register('email')} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="you@example.com" />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg font-semibold">
        Send reset link
      </button>
    </form>
  );
}
