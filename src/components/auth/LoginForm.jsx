'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().min(1, 'Email required').email('Invalid email'),
  password: z.string().min(6, 'Password required (min 6)'),
});

export default function LoginForm({ onSuccess }) {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  async function onSubmit(data) {
    // placeholder auth behavior: implement your API call here
    try {
      // Example: const res = await axios.post('/api/auth/login', data)
      // if (res.ok) onSuccess?.()
      alert('Signed in (mock): ' + data.email);
      onSuccess?.();
    } catch (err) {
      alert('Sign in failed');
    }
  }

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input {...register('email')} className="pl-10 pr-3 py-2 w-full border rounded-lg" placeholder="you@example.com" />
        </div>
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Password</label>
        </div>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            {...register('password')}
            type={show ? 'text' : 'password'}
            className="pl-10 pr-10 py-2 w-full border rounded-lg"
            placeholder="Password"
          />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-2">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between mb-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" /> Remember me
        </label>
        <a href="/auth/forgot-password" className="text-sm text-purple-600">Forgot?</a>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg font-semibold">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
