// app/auth/signin/page.tsx
'use client';
import React from 'react';
import LoginForm from '../../../components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-purple-400">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
        <div className="hidden md:flex items-center justify-center">
          <img src="/assets/login-hero.svg" alt="login" className="max-w-full" />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-gray-600 mb-6">Sign in to continue to your professional network.</p>

          {/* <LoginForm onSuccess={() => router.push('/onboarding/profile')} /> */}

          <p className="text-center text-sm mt-4">
            Don’t have an account? <a href="/auth/signup" className="text-purple-600 font-semibold">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
