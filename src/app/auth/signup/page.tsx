// app/auth/signup/page.tsx
'use client';
import React from 'react';
import SignUpForm from '../../../pages/SignUp';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-purple-400">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
        <div className="hidden md:flex items-center justify-center">
          <img src="/assets/signup-hero.svg" alt="signup" className="max-w-full" />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Create an account</h1>
          <p className="text-sm text-gray-600 mb-6">Join your professional community.</p>

          <SignUpForm onSuccess={() => router.push('/onboarding/profile')} />

          <p className="text-center text-sm mt-4">
            Already have an account? <a href="/auth/signin" className="text-purple-600 font-semibold">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
