'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Enter name'),
  email: z.string().min(1,'Email required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6'),
});

type SignUpFormInputs = z.infer<typeof schema>;

export default function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: { name:'', email:'', password:'' }
  });

  async function onSubmit(data: SignUpFormInputs) {
    try {
      // TODO: call your signup endpoint
      alert('Signed up (mock): ' + data.email);
      onSuccess?.();
    } catch (err) {
      alert('Sign up failed');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Full name</label>
        <input {...register('name')} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Your name" />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input {...register('email')} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="you@example.com" />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input {...register('password')} type="password" className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Create a password" />
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg font-semibold">
        {isSubmitting ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}
