// app/auth/forgot-password/page.tsx
'use client';
import React from 'react';
import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-purple-400">
      <div className="max-w-2xl w-full p-8">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your email and we’ll send a reset link.</p>

          <ForgotPasswordForm />

          <p className="text-center text-sm mt-4">
            Back to <a href="/auth/signin" className="text-purple-600 font-semibold">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
